import { internalFakeSoundKey, sortIndexSymbol, timeStampSymbol } from '@/constants/commonConst'
import { SoundAsset } from '@/constants/constant'
import Config from '@/store/config'
import delay from '@/utils/delay'
import { isSameMediaItem, mergeProps, sortByTimestampAndIndex } from '@/utils/mediaItem'
import { GlobalState } from '@/utils/stateMapper'
import * as FileSystem from 'expo-file-system'
import { produce } from 'immer'
import shuffle from 'lodash.shuffle'
import RNFS from 'react-native-fs'
import ReactNativeTrackPlayer, {
	Event,
	State,
	Track,
	usePlaybackState,
	useProgress,
} from 'react-native-track-player'

import { MusicRepeatMode } from '@/helpers/types'
import PersistStatus from '@/store/PersistStatus'
import {
	getMusicIndex,
	getPlayList,
	getPlayListMusicAt,
	isInPlayList,
	isPlayListEmpty,
	setPlayList,
	usePlayList,
} from '@/store/playList'
import { createMediaIndexMap } from '@/utils/mediaIndexMap'
import { musicIsPaused } from '@/utils/trackUtils'
import { Alert, AppState, Image } from 'react-native'

import { myGetLyric } from '@/helpers/userApi/getMusicSource'

import { fakeAudioMp3Uri } from '@/constants/images'
import { nowLanguage } from '@/utils/i18n'
import { showToast } from '@/utils/utils'
import { logError, logInfo } from './logger'

/** 当前播放 */
const currentMusicStore = new GlobalState<IMusic.IMusicItem | null>(null)
/** 歌单*/
export const playListsStore = new GlobalState<IMusic.PlayList[] | []>(null)
/** 播放模式 */
export const repeatModeStore = new GlobalState<MusicRepeatMode>(MusicRepeatMode.QUEUE)

/** 音质 */
export const qualityStore = new GlobalState<IMusic.IQualityKey>('128k')
/** 音源 */
export const musicApiStore = new GlobalState<IMusic.MusicApi[] | []>(null)
/** 当前音源 */
export const musicApiSelectedStore = new GlobalState<IMusic.MusicApi>(null)
/** 音源状态*/
export const nowApiState = new GlobalState<string>('正常')
/** 是否自动缓存本地 */
export const autoCacheLocalStore = new GlobalState<boolean>(true)
/** 是否显示已缓存图标 */
export const isCachedIconVisibleStore = new GlobalState<boolean>(true)
/** 首页加载歌曲数量 */
export const songsNumsToLoadStore = new GlobalState<number>(100)
/** 已导入的本地音乐 */
export const importedLocalMusicStore = new GlobalState<IMusic.IMusicItem[] | []>(null)

export function useCurrentQuality() {
	const currentQuality = qualityStore.useValue()
	const setCurrentQuality = (newQuality: IMusic.IQualityKey) => {
		setQuality(newQuality)
	}
	return [currentQuality, setCurrentQuality] as const
}
// const setNowLyric = useLibraryStore.getState().setNowLyric
export const nowLyricState = new GlobalState<string>(null)

let currentIndex = -1
// 定义缓存目录
const cacheDir = FileSystem.documentDirectory + 'musicCache/'
// TODO: 下个版本最大限制调大一些
// const maxMusicQueueLength = 1500; // 当前播放最大限制

let hasSetupListener = false

// TODO: 删除
function migrate() {
	PersistStatus.set('music.rate', 1)
	//TODO 循环方式
	PersistStatus.set('music.repeatMode', MusicRepeatMode.QUEUE)
	// PersistStatus.set('music.playList', []);
	PersistStatus.set('music.progress', 0)
	//PersistStatus.set('music.musicItem', track);
	Config.set('status.music', undefined)
}

async function setupTrackPlayer() {
	migrate()
	const rate = PersistStatus.get('music.rate')
	const musicQueue = PersistStatus.get('music.play-list')
	const repeatMode = PersistStatus.get('music.repeatMode')
	const progress = PersistStatus.get('music.progress')
	const track = PersistStatus.get('music.musicItem')
	const quality = PersistStatus.get('music.quality') || '128k'
	const playLists = PersistStatus.get('music.playLists')
	const musicApiLists = PersistStatus.get('music.musicApi')
	const selectedMusicApi = PersistStatus.get('music.selectedMusicApi')
	const importedLocalMusic = PersistStatus.get('music.importedLocalMusic')
	const autoCacheLocal = PersistStatus.get('music.autoCacheLocal') ?? true
	const language = PersistStatus.get('app.language') ?? 'zh'
	const isCachedIconVisible = PersistStatus.get('music.isCachedIconVisible') ?? true
	const songsNumsToLoad = PersistStatus.get('music.songsNumsToLoad') ?? 100
	// 状态恢复
	if (rate) {
		await ReactNativeTrackPlayer.setRate(+rate)
	}
	if (repeatMode) {
		repeatModeStore.setValue(repeatMode as MusicRepeatMode)
	}

	if (quality) {
		setQuality(quality as IMusic.IQualityKey)
	}
	if (playLists) {
		playListsStore.setValue(playLists)
	}
	if (musicApiLists) {
		musicApiStore.setValue(musicApiLists)
	}
	if (selectedMusicApi) {
		musicApiSelectedStore.setValue(selectedMusicApi)
		await reloadNowSelectedMusicApi()
	}
	if (importedLocalMusic) {
		importedLocalMusicStore.setValue(importedLocalMusic)
	}
	if (musicQueue && Array.isArray(musicQueue)) {
		addAll(musicQueue, undefined, repeatMode === MusicRepeatMode.SHUFFLE)
	}
	if (autoCacheLocal == true || autoCacheLocal == false) {
		autoCacheLocalStore.setValue(autoCacheLocal)
	}
	if (isCachedIconVisible == true || isCachedIconVisible == false) {
		isCachedIconVisibleStore.setValue(isCachedIconVisible)
	}
	if (language) {
		nowLanguage.setValue(language)
	}
	if (songsNumsToLoad) {
		songsNumsToLoadStore.setValue(songsNumsToLoad)
	}
	if (!hasSetupListener) {
		ReactNativeTrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (evt) => {
			if (evt.index === 1 && evt.lastIndex === 0 && evt.track?.$ === internalFakeSoundKey) {
				logInfo('队列末尾，播放下一首')
				if (repeatModeStore.getValue() === MusicRepeatMode.SINGLE) {
					await play(null, true)
				} else {
					// 当前生效的歌曲是下一曲的标记
					await skipToNext()
				}
			}
		})

		ReactNativeTrackPlayer.addEventListener(Event.PlaybackError, async (e) => {
			// WARNING: 不稳定，报错的时候有可能track已经变到下一首歌去了
			const currentTrack = await ReactNativeTrackPlayer.getActiveTrack()
			if (currentTrack?.isInit) {
				// HACK: 避免初始失败的情况

				await ReactNativeTrackPlayer.updateMetadataForTrack(0, {
					...currentTrack,
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					isInit: undefined,
				})
				return
			}

			if ((await ReactNativeTrackPlayer.getActiveTrackIndex()) === 0 && e.message) {
				logInfo('播放出错', {
					message: e.message,
					code: e.code,
				})

				await failToPlay()
			}
		})

		hasSetupListener = true
		logInfo('播放器初始化完成')
	}
}

/**
 * 获取自动播放的下一个track，保持nextTrack 不变,生成nextTrack的with fake url 形式  假音频
 * 获取下一个 track 并设置其属性为假音频。这在测试或处理特殊情况时非常有用
 */
const getFakeNextTrack = () => {
	let track: Track | undefined

	const repeatMode = repeatModeStore.getValue()

	if (repeatMode === MusicRepeatMode.SINGLE) {
		// 单曲循环
		track = getPlayListMusicAt(currentIndex) as Track
	} else {
		// 下一曲
		track = getPlayListMusicAt(currentIndex + 1) as Track
	}

	try {
		const soundAssetSource = Image.resolveAssetSource(SoundAsset.fakeAudio).uri
		if (track) {
			const a = produce(track, (_) => {
				_.url = soundAssetSource
				_.$ = internalFakeSoundKey
				if (!_.artwork?.trim()?.length) {
					_.artwork = undefined
				}
			})
			return a
		} else {
			// 只有列表长度为0时才会出现的特殊情况
			return { url: soundAssetSource, $: internalFakeSoundKey } as Track
		}
	} catch (error) {
		logError('An error occurred while processing the track:', error)
	}
}

/** 播放失败时的情况 */
async function failToPlay() {
	// 自动跳转下一曲, 500s后自动跳转
	await ReactNativeTrackPlayer.reset()
	await delay(500)
	await skipToNext()
}

// 播放模式相关
const _toggleRepeatMapping = {
	[MusicRepeatMode.SHUFFLE]: MusicRepeatMode.SINGLE,
	[MusicRepeatMode.SINGLE]: MusicRepeatMode.QUEUE,
	[MusicRepeatMode.QUEUE]: MusicRepeatMode.SHUFFLE,
}
/** 切换下一个模式 */
const toggleRepeatMode = () => {
	setRepeatMode(_toggleRepeatMapping[repeatModeStore.getValue()])
}

/**
 * 添加到播放列表
 * @param musicItems 目标歌曲
 * @param beforeIndex 在第x首歌曲前添加
 * @param shouldShuffle 随机排序
 */
const addAll = (
	musicItems: Array<IMusic.IMusicItem> = [],
	beforeIndex?: number,
	shouldShuffle?: boolean,
) => {
	const now = Date.now()
	let newPlayList: IMusic.IMusicItem[] = []
	const currentPlayList = getPlayList()
	const _musicItems = musicItems.map((item, index) =>
		produce(item, (draft) => {
			draft[timeStampSymbol] = now
			draft[sortIndexSymbol] = index
		}),
	) /*draft[timeStampSymbol] = now：为 draft 对象添加或更新 timeStampSymbol 属性，值为 now。draft[sortIndexSymbol] = index：为 draft 对象添加或更新 sortIndexSymbol 属性，值为当前索引 index。*/
	if (beforeIndex === undefined || beforeIndex < 0) {
		// 1.1. 添加到歌单末尾，并过滤掉已有的歌曲
		newPlayList = currentPlayList.concat(_musicItems.filter((item) => !isInPlayList(item)))
	} else {
		// 1.2. beforeIndex新的播放列表，插入beforeIndex
		const indexMap = createMediaIndexMap(_musicItems)
		const beforeDraft = currentPlayList.slice(0, beforeIndex).filter((item) => !indexMap.has(item))
		const afterDraft = currentPlayList.slice(beforeIndex).filter((item) => !indexMap.has(item))

		newPlayList = [...beforeDraft, ..._musicItems, ...afterDraft]
	}

	// 2. 如果需要随机
	if (shouldShuffle) {
		newPlayList = shuffle(newPlayList)
	}
	// 3. 设置播放列表
	setPlayList(newPlayList)
	const currentMusicItem = currentMusicStore.getValue()

	// 4. 重置下标
	if (currentMusicItem) {
		currentIndex = getMusicIndex(currentMusicItem)
	}

	// TODO: 更新播放队列信息
	// 5. 存储更新的播放列表信息
}

/** 追加到队尾 */
const add = (musicItem: IMusic.IMusicItem | IMusic.IMusicItem[], beforeIndex?: number) => {
	addAll(Array.isArray(musicItem) ? musicItem : [musicItem], beforeIndex)
}

/**
 * 下一首播放
 * @param musicItem
 */
const addAsNextTrack = (musicItem: IMusic.IMusicItem | IMusic.IMusicItem[]) => {
	const shouldPlay = isPlayListEmpty()
	add(musicItem, currentIndex + 1)
	if (shouldPlay) {
		play(Array.isArray(musicItem) ? musicItem[0] : musicItem)
	}
}
/**
 * 是当前正在播放的音频
 *
 */
const isCurrentMusic = (musicItem: IMusic.IMusicItem | null | undefined) => {
	return isSameMediaItem(musicItem, currentMusicStore.getValue()) ?? false
}
/**
 * 从播放列表移除IMusicItem
 *
 */
const remove = async (musicItem: IMusic.IMusicItem) => {
	const playList = getPlayList()
	let newPlayList: IMusic.IMusicItem[] = []
	let currentMusic: IMusic.IMusicItem | null = currentMusicStore.getValue()
	const targetIndex = getMusicIndex(musicItem)
	let shouldPlayCurrent: boolean | null = null
	if (targetIndex === -1) {
		// 1. 这种情况应该是出错了
		return
	}
	// 2. 移除的是当前项
	if (currentIndex === targetIndex) {
		// 2.1 停止播放，移除当前项
		newPlayList = produce(playList, (draft) => {
			draft.splice(targetIndex, 1)
		})
		// 2.2 设置新的播放列表，并更新当前音乐
		if (newPlayList.length === 0) {
			currentMusic = null
			shouldPlayCurrent = false
		} else {
			currentMusic = newPlayList[currentIndex % newPlayList.length]
			try {
				const state = (await ReactNativeTrackPlayer.getPlaybackState()).state
				if (musicIsPaused(state)) {
					shouldPlayCurrent = false
				} else {
					shouldPlayCurrent = true
				}
			} catch {
				shouldPlayCurrent = false
			}
		}
	} else {
		// 3. 删除
		newPlayList = produce(playList, (draft) => {
			draft.splice(targetIndex, 1)
		})
	}

	setPlayList(newPlayList)
	setCurrentMusic(currentMusic)
	if (shouldPlayCurrent === true) {
		await play(currentMusic, true)
	} else if (shouldPlayCurrent === false) {
		await ReactNativeTrackPlayer.reset()
	}
}

/**
 * 设置播放模式
 * @param mode 播放模式
 */
const setRepeatMode = (mode: MusicRepeatMode) => {
	const playList = getPlayList()
	let newPlayList
	const prevMode = repeatModeStore.getValue()

	if (
		(prevMode === MusicRepeatMode.SHUFFLE && mode !== MusicRepeatMode.SHUFFLE) ||
		(mode === MusicRepeatMode.SHUFFLE && prevMode !== MusicRepeatMode.SHUFFLE)
	) {
		if (mode === MusicRepeatMode.SHUFFLE) {
			newPlayList = shuffle(playList)
		} else {
			newPlayList = sortByTimestampAndIndex(playList, true)
		}
		setPlayList(newPlayList)
	}

	const currentMusicItem = currentMusicStore.getValue()
	currentIndex = getMusicIndex(currentMusicItem)
	repeatModeStore.setValue(mode)
	// 更新下一首歌的信息
	ReactNativeTrackPlayer.updateMetadataForTrack(1, getFakeNextTrack())
	// 记录
	PersistStatus.set('music.repeatMode', mode)
}

/** 清空播放列表 */
const clear = async () => {
	setPlayList([])
	setCurrentMusic(null)

	await ReactNativeTrackPlayer.reset()
	PersistStatus.set('music.musicItem', undefined)
	PersistStatus.set('music.progress', 0)
}
/** 清空待播列表 */
const clearToBePlayed = async () => {
	// 获取当前正在播放的音乐
	const currentMusic = currentMusicStore.getValue()

	if (currentMusic) {
		// 设置播放列表仅包含当前正在播放的音乐
		setPlayList([currentMusic])
		setCurrentMusic(currentMusic)

		// 重置播放器并重新设置当前音轨
		// await setTrackSource(currentMusic as Track, true);
	} else {
		// 如果没有当前播放的音乐，清空播放列表
		setPlayList([])
		setCurrentMusic(null)
		await ReactNativeTrackPlayer.reset()
	}
}

/** 暂停 */
const pause = async () => {
	await ReactNativeTrackPlayer.pause()
}

/** 设置音源 */
const setTrackSource = async (track: Track, autoPlay = true) => {
	if (!track.artwork?.trim()?.length) {
		track.artwork = undefined
	}

	//播放器队列加入track 和一个假音频，假音频的信息为实际下一首音乐的信息
	await ReactNativeTrackPlayer.setQueue([track, getFakeNextTrack()])

	PersistStatus.set('music.musicItem', track as IMusic.IMusicItem)

	PersistStatus.set('music.progress', 0)

	if (autoPlay) {
		await ReactNativeTrackPlayer.play()
	}
}
/**
 * 设置currentMusicStore，更新currentIndex
 *
 */
const setCurrentMusic = (musicItem?: IMusic.IMusicItem | null) => {
	if (!musicItem) {
		currentIndex = -1
		currentMusicStore.setValue(null)
		PersistStatus.set('music.musicItem', undefined)
		PersistStatus.set('music.progress', 0)
		return
	}
	currentIndex = getMusicIndex(musicItem)
	currentMusicStore.setValue(musicItem)
}

const setQuality = (quality: IMusic.IQualityKey) => {
	qualityStore.setValue(quality)
	PersistStatus.set('music.quality', quality)
}
//添加歌曲到指定歌单
const addSongToStoredPlayList = (playlist: IMusic.PlayList, track: IMusic.IMusicItem) => {
	try {
		const nowPlayLists = playListsStore.getValue() || []
		const updatedPlayLists = nowPlayLists.map((existingPlaylist) => {
			if (existingPlaylist.id === playlist.id) {
				// 检查歌曲是否已经存在于播放列表中
				// console.log('track', JSON.stringify(track))
				// console.log('existingPlaylist.songs', JSON.stringify(existingPlaylist.songs))
				const songExists = existingPlaylist.songs.some((song) => song.id == track.id)
				// console.log('songExists', songExists)

				if (!songExists) {
					// 只有当歌曲不存在时才添加
					return {
						...existingPlaylist,
						songs: [...existingPlaylist.songs, track],
					}
				} else {
					logInfo('歌曲已存在')
				}
			}
			return existingPlaylist
		})

		playListsStore.setValue(updatedPlayLists)
		PersistStatus.set('music.playLists', updatedPlayLists)
		logInfo('歌曲成功添加到歌单')
	} catch (error) {
		logError('添加歌曲到歌单时出错:', error)
		// 可以在这里添加一些错误处理逻辑，比如显示一个错误提示给用户
	}
}
//从歌单删除指定歌曲
//添加歌曲到指定歌单
const deleteSongFromStoredPlayList = (playlist: IMusic.PlayList, trackId: string) => {
	try {
		const nowPlayLists = playListsStore.getValue() || []
		const updatedPlayLists = nowPlayLists.map((existingPlaylist) => {
			if (existingPlaylist.id === playlist.id) {
				// 检查歌曲是否已经存在于播放列表中
				const songExists = existingPlaylist.songs.some((song) => song.id == trackId)

				if (songExists) {
					// 只有当歌曲存在时才删除
					return {
						...existingPlaylist,
						songs: existingPlaylist.songs.filter((song) => song.id !== trackId),
					}
				} else {
					logInfo('歌曲不存在')
				}
			}
			return existingPlaylist
		})

		playListsStore.setValue(updatedPlayLists)
		PersistStatus.set('music.playLists', updatedPlayLists)
		logInfo('歌曲成功删除')
	} catch (error) {
		logError('删除歌曲到歌单时出错:', error)
		// 可以在这里添加一些错误处理逻辑，比如显示一个错误提示给用户
	}
}
const addPlayLists = (playlist: IMusic.PlayList) => {
	try {
		const nowPlayLists = playListsStore.getValue() || []

		// 检查播放列表是否已存在
		const playlistExists = nowPlayLists.some(
			(existingPlaylist) => existingPlaylist.id == playlist.id,
		)

		if (playlistExists) {
			// logInfo(`Playlist already exists, not adding duplicate. Current playlists: ${JSON.stringify(nowPlayLists, null, 2)}`);
			return // 如果播放列表已存在，直接返回，不进行任何操作
		}

		// 如果播放列表不存在，则添加它
		const updatedPlayLists = [...nowPlayLists, playlist]
		playListsStore.setValue(updatedPlayLists)
		PersistStatus.set('music.playLists', updatedPlayLists)
		logInfo('Playlist added successfully')
	} catch (error) {
		logError('Error adding playlist:', error)
		// 可以在这里添加一些错误处理逻辑，比如显示一个错误提示给用户
	}
}
const deletePlayLists = (playlistId: string) => {
	try {
		if (playlistId == 'favorites') {
			return '不能删除收藏歌单'
		}
		const nowPlayLists = playListsStore.getValue() || []

		// 检查播放列表是否已存在
		const playlistFiltered = nowPlayLists.filter(
			(existingPlaylist) => existingPlaylist.id !== playlistId,
		)

		// 如果播放列表不存在，则添加它
		const updatedPlayLists = [...playlistFiltered]
		playListsStore.setValue(updatedPlayLists)
		PersistStatus.set('music.playLists', updatedPlayLists)
		logInfo('Playlist deleted successfully')
		return 'success'
	} catch (error) {
		logError('Error deleted playlist:', error)
	}
}
const getPlayListById = (playlistId: string) => {
	try {
		// logInfo(playlistId + 'playlistId')
		const nowPlayLists = playListsStore.getValue() || []
		const playlistFiltered = nowPlayLists.filter(
			(existingPlaylist) => existingPlaylist.id === playlistId,
		)
		return playlistFiltered
	} catch (error) {
		logError('Error find playlist:', error)
	}
}
const addMusicApi = (musicApi: IMusic.MusicApi) => {
	try {
		const nowMusicApiList = musicApiStore.getValue() || []

		// 检查是否已存在
		const existingApiIndex = nowMusicApiList.findIndex(
			(existingApi) => existingApi.id === musicApi.id,
		)

		if (existingApiIndex !== -1) {
			Alert.alert('是否覆盖', `已经存在该音源，是否覆盖？`, [
				{
					text: '确定',
					onPress: () => {
						const updatedMusicApiList = [...nowMusicApiList]
						// 保留原有的 isSelected 状态
						updatedMusicApiList[existingApiIndex] = {
							...musicApi,
							isSelected: updatedMusicApiList[existingApiIndex].isSelected,
						}
						musicApiStore.setValue(updatedMusicApiList)
						PersistStatus.set('music.musicApi', updatedMusicApiList)
						logInfo('Music API updated successfully')
						Alert.alert('成功', '音源更新成功', [
							{ text: '确定', onPress: () => logInfo('Update alert closed') },
						])
					},
				},
				{ text: '取消', onPress: () => {}, style: 'cancel' },
			])
		} else {
			// 如果是新添加的音源，默认设置 isSelected 为 false 。如果音源为空，则自动选择
			const newMusicApi = musicApi
			console.log('nowMusicApiList', nowMusicApiList)
			const updatedMusicApiList = [...nowMusicApiList, newMusicApi]
			if (!nowMusicApiList.length) {
				logInfo('音源为空，自动选择')
				musicApiStore.setValue(updatedMusicApiList)
				PersistStatus.set('music.musicApi', updatedMusicApiList)
				setMusicApiAsSelectedById(newMusicApi.id)
			} else {
				musicApiStore.setValue(updatedMusicApiList)
				PersistStatus.set('music.musicApi', updatedMusicApiList)
			}
			logInfo('音源导入成功')
			Alert.alert('成功', '音源导入成功', [
				{ text: '确定', onPress: () => logInfo('Add alert closed') },
			])
		}
	} catch (error) {
		logError('Error adding/updating music API:', error)
		Alert.alert('失败', '音源导入/更新失败', [
			{ text: '确定', onPress: () => logInfo('Error alert closed') },
		])
	}
}
const reloadNowSelectedMusicApi = async () => {
	try {
		// 获取当前存储的所有音源脚本
		const musicApis = musicApiStore.getValue() || []

		// 找到被选中的音源脚本
		const selectedApi = musicApiSelectedStore.getValue()

		if (selectedApi === null) {
			logInfo('No music API is currently selected.')
			return null
		}
		// 重新加载选中的脚本
		const reloadedApi = reloadMusicApi(selectedApi)

		// 更新 musicApiStore 中的脚本
		musicApiSelectedStore.setValue(reloadedApi)

		// 更新 store 和持久化存储
		PersistStatus.set('music.selectedMusicApi', reloadedApi)

		logInfo(`Selected music API "${reloadedApi.name}" reloaded successfully`)

		return reloadedApi
	} catch (error) {
		logError('Error reloading selected music API:', error)
		throw error
	}
}
const reloadMusicApi = (musicApi: IMusic.MusicApi, isTest: boolean = false): IMusic.MusicApi => {
	if (!musicApi.isSelected && !isTest) {
		return musicApi // 如果没有被选中，直接返回原始对象
	}

	try {
		// 创建一个新的上下文来执行脚本
		const context: any = {
			module: { exports: {} },
			exports: {},
			require: () => {}, // 如果脚本中有 require 调用，你需要在这里实现
		}

		// 执行脚本
		const scriptFunction = new Function('module', 'exports', 'require', musicApi.script)
		scriptFunction.call(context, context.module, context.exports, context.require)

		// 更新 MusicApi 对象
		return {
			...musicApi,
			getMusicUrl: context.module.exports.getMusicUrl || musicApi.getMusicUrl,
		}
	} catch (error) {
		logError(`Error reloading script for API "${musicApi.name}":`, error)
		return musicApi // 返回原始对象，以防出错
	}
}
const setMusicApiAsSelectedById = async (musicApiId: string) => {
	try {
		// 获取当前存储的所有音源脚本
		let musicApis: IMusic.MusicApi[] = musicApiStore.getValue() || []

		// 检查指定的音源是否存在
		const targetApiIndex = musicApis.findIndex((api) => api.id === musicApiId)

		if (targetApiIndex === -1) {
			logError(`Music API with id ${musicApiId} not found`)
			Alert.alert('错误', '未找到指定的音源')
			return
		}

		// 更新选中状态
		musicApis = musicApis.map((api) => ({
			...api,
			isSelected: api.id === musicApiId,
		}))

		// 获取新选中的音源
		const selectedApi = musicApis[targetApiIndex]

		// 重新加载选中的音源脚本
		const reloadedApi = reloadMusicApi(selectedApi)

		// 更新重新加载后的音源
		musicApiSelectedStore.setValue(reloadedApi)
		// 更新 store 和持久化存储
		PersistStatus.set('music.selectedMusicApi', reloadedApi)

		logInfo(`Music API "${reloadedApi.name}" set as selected and reloaded successfully`)
		Alert.alert('成功', `音源 "${reloadedApi.name}" 已设置为当前选中并重新加载`)
	} catch (error) {
		logError('Error setting music API as selected:', error)
		Alert.alert('错误', '设置选中音源时发生错误')
	}
}

const deleteMusicApiById = (musicApiId: string) => {
	const selectedMusicApi = musicApiSelectedStore.getValue()
	const musicApis = musicApiStore.getValue() || []
	if (selectedMusicApi.id == musicApiId) {
		musicApiSelectedStore.setValue(null)
	}
	const musicApisFiltered = musicApis.filter((musicApi) => musicApi.id !== musicApiId)
	musicApiStore.setValue(musicApisFiltered)
	PersistStatus.set('music.musicApi', musicApisFiltered)
	logInfo('Music API deleted successfully')
	Alert.alert('成功', '音源删除成功', [
		{ text: '确定', onPress: () => logInfo('Add alert closed') },
	])
}
/**
 * 播放
 *
 * 当musicItem 为空时，代表暂停/播放
 *
 * @param musicItem
 * @param forcePlay
 * @returns
 */
const play = async (musicItem?: IMusic.IMusicItem | null, forcePlay?: boolean) => {
	try {
		if (!musicItem) {
			musicItem = currentMusicStore.getValue()
		}
		if (!musicItem) {
			throw new Error(PlayFailReason.PLAY_LIST_IS_EMPTY)
		}
		// 2. 如果是当前正在播放的音频
		if (isCurrentMusic(musicItem)) {
			const currentTrack = await ReactNativeTrackPlayer.getTrack(0)
			// 2.1 如果当前有源

			if (currentTrack?.url && isSameMediaItem(musicItem, currentTrack as IMusic.IMusicItem)) {
				const currentActiveIndex = await ReactNativeTrackPlayer.getActiveTrackIndex()
				if (currentActiveIndex !== 0) {
					await ReactNativeTrackPlayer.skip(0)
				}
				if (forcePlay) {
					// 2.1.1 强制重新开始
					await ReactNativeTrackPlayer.seekTo(0)
				}
				const currentState = (await ReactNativeTrackPlayer.getPlaybackState()).state
				if (currentState === State.Stopped) {
					await setTrackSource(currentTrack)
				}
				if (currentState !== State.Playing) {
					// 2.1.2 恢复播放
					await ReactNativeTrackPlayer.play()
				}
				// 这种情况下，播放队列和当前歌曲都不需要变化
				return
			}
			// 2.2 其他情况：重新获取源
		}

		// 3. 如果没有在播放列表中，添加到队尾；同时更新列表状态
		const inPlayList = isInPlayList(musicItem)
		if (!inPlayList) {
			add(musicItem)
		}

		// 4. 更新列表状态和当前音乐
		setCurrentMusic(musicItem)
		//reset的时机？
		//await ReactNativeTrackPlayer.reset();

		// 5. 获取音源
		let track: IMusic.IMusicItem

		// 5.1 通过插件获取音源
		// const plugin = PluginManager.getByName(musicItem.platform);
		// 5.2 获取音质排序
		// const qualityOrder = ['128k', 'low']
		// const qualityOrder = getQualityOrder(
		//     Config.get('setting.basic.defaultPlayQuality') ?? 'standard',
		//     Config.get('setting.basic.playQualityOrder') ?? 'asc',
		// );
		// 5.3 插件返回的音源为source
		let source: IPlugin.IMediaSourceResult | null = null
		if (musicItem.url.startsWith('file://')) {
			const isFileExit = await RNFS.exists(musicItem.url)
			if (!isFileExit) {
				logError('本地文件不存在:', musicItem.url)
				showToast('错误', '本地文件不存在，请删除并重新缓存或导入。', 'error')
				return
			}
		}
		const cached = await isCached(musicItem)
		if (cached) {
			const localPath = getLocalFilePath(musicItem)
			source = {
				url: localPath,
			}
			logInfo('使用缓存的音频路径播放:', localPath)
		}
		if (!isCurrentMusic(musicItem)) {
			return
		}
		if (!source) {
			if ((!source && musicItem.url == 'Unknown') || musicItem.url.includes('fake')) {
				logInfo('没有url')
				let resp_url = null
				const nowMusicApi = musicApiSelectedStore.getValue()
				// logInfo(nowMusicApi)

				if (nowMusicApi == null) {
					showToast('错误', '获取音乐失败，请先导入音源。', 'error')
					// Alert.alert('错误', '获取音乐失败，请先导入音源。', [
					//     { text: '确定', onPress: () => logInfo('Alert closed') },
					// ])
					return
				} else {
					try {
						const timeoutPromise = new Promise((_, reject) => {
							setTimeout(() => reject(new Error('请求超时')), 5000)
						})
						// 定义音质降级顺序
						const qualityOrder: IMusic.IQualityKey[] = ['flac', '320k', '128k']
						let currentQualityIndex = qualityOrder.indexOf(qualityStore.getValue())

						// 尝试不同音质，直到获取到可用的URL或尝试完所有音质
						while (currentQualityIndex < qualityOrder.length && !resp_url) {
							const currentQuality = qualityOrder[currentQualityIndex]
							try {
								resp_url = await Promise.race([
									nowMusicApi.getMusicUrl(
										musicItem.title,
										musicItem.artist,
										musicItem.id,
										currentQuality,
									),
									timeoutPromise,
								])
								logInfo(`音源返回:${resp_url}`)
								if (!resp_url || resp_url == '') {
									logInfo(`${currentQuality}音质无可用链接，尝试下一个音质`)
									currentQualityIndex++
									continue
								}
								// 如果当前音质不是原始请求的音质，显示提示
								if (resp_url && currentQuality !== qualityStore.getValue()) {
									showToast('提示', `已自动切换至${currentQuality}音质`, 'info')
									// 更新当前音质设置
									setQuality(currentQuality)
								}
								logInfo(`成功获取${currentQuality}音质的音乐URL:`, resp_url)
							} catch (error) {
								logInfo(`${currentQuality}音质无可用链接(catch),尝试下一个音质`)
								logError(`(catch error):`, error)
								currentQualityIndex++
							}
						}
						if (!resp_url) {
							nowApiState.setValue('异常')
							throw new Error('无法获取任何音质的音乐，请稍后重试。')
						} else {
							logInfo('最终的音乐 URL:', resp_url)
							nowApiState.setValue('正常')
						}
					} catch (error) {
						nowApiState.setValue('异常')
						logError('获取音乐 URL 失败:', error)
						const errorMessage =
							error.message === '请求超时'
								? '获取音乐超时，请稍后重试。'
								: error.message || '获取音乐失败，请稍后重试。'
						showToast(errorMessage, '', 'error')
						// showErrorMessage(errorMessage)
						resp_url = fakeAudioMp3Uri // 使用假的音频 URL 作为后备
					}
				}
				// const resp = await myGetMusicUrl(musicItem, qualityStore.getValue())

				source = {
					url: resp_url,
				}
			} else {
				if (musicItem.url.startsWith('file://')) {
					const isFileExit = await RNFS.exists(musicItem.url)
					if (!isFileExit) {
						musicItem.url = fakeAudioMp3Uri
						logError('本地文件不存在:', musicItem.url)
						showToast('错误', '本地文件不存在，请删除并重新缓存或导入。', 'error')
						return
					}
				}
				const cached = await isCached(musicItem)

				if (cached) {
					const localPath = getLocalFilePath(musicItem)
					source = {
						url: localPath,
					}
					logInfo('使用缓存的音频路径播放:', localPath)
				} else {
					source = {
						url: musicItem.url,
					}
				}

				// setQuality('128k')
			}
		}

		// 6. 特殊类型源
		// if (getUrlExt(source.url) === '.m3u8') {
		//     // @ts-ignore
		//     source.type = 'hls';
		// }
		// 7. 合并结果
		// eslint-disable-next-line prefer-const
		track = mergeProps(musicItem, source) as IMusic.IMusicItem

		logInfo('获取音源成功：', track)
		// 9. 设置音源
		await setTrackSource(track as Track)
		// 4.1 刷新歌词信息
		const lyc = await myGetLyric(musicItem)
		// console.debug(lyc.lyric);
		nowLyricState.setValue(lyc.lyric)
		// 9.1 如果需要缓存,且不是假音频,且不是本地文件
		if (
			track.url !== fakeAudioMp3Uri &&
			!track.url.includes('fake') &&
			!cached &&
			autoCacheLocalStore.getValue() &&
			!track.url.startsWith('file://')
		) {
			// 下载到缓存，延迟5秒后执行
			logInfo('将在5秒后下载缓存:', track.url)
			setTimeout(() => {
				downloadToCache(track)
					.then((localUri) => {
						logInfo('音乐已缓存到本地:', localUri)
						// 更新url,为了删除能够正常删除
						const newTrack = { ...track, url: localUri }
						addImportedLocalMusic([newTrack], false)
					})
					.catch((error) => {
						logError('缓存音乐时出错:', error)
					})
			}, 5000) // 延迟5000毫秒（5秒）
		}

		// 10. 获取补充信息
		// const info: Partial<IMusic.IMusicItem> | null = null
	} catch (e: any) {
		const message = e?.message
		if (message === 'The player is not initialized. Call setupPlayer first.') {
			await ReactNativeTrackPlayer.setupPlayer()
			play(musicItem, forcePlay)
		} else if (message === PlayFailReason.FORBID_CELLUAR_NETWORK_PLAY) {
			logInfo('移动网络')
		} else if (message === PlayFailReason.INVALID_SOURCE) {
			logError('音源为空，播放失败')
			await failToPlay()
		} else if (message === PlayFailReason.PLAY_LIST_IS_EMPTY) {
			// 队列是空的，不应该出现这种情况
		}
	}
}
const cacheAndImportMusic = async (track: IMusic.IMusicItem) => {
	try {
		await ensureCacheDirExists()
		const localPath = getLocalFilePath(track)
		console.log('localPath:', localPath)
		const isCacheExist = await RNFS.exists(localPath)
		if (isCacheExist) {
			logInfo('音乐已缓存到本地:', localPath)
			const newTrack = { ...track, url: `file://${localPath}` }
			await addImportedLocalMusic([newTrack], false)
		} else {
			logInfo('开始下载音乐:', track.url)
			const downloadResult = await RNFS.downloadFile({
				fromUrl: track.url,
				toFile: localPath,
				progressDivider: 1,
				progress: (res) => {
					const progress = res.bytesWritten / res.contentLength
					logInfo(`下载进度: ${(progress * 100).toFixed(2)}%`)
				},
			}).promise

			if (downloadResult.statusCode === 200) {
				logInfo('音乐已缓存到本地:', `${localPath}`)
				const newTrack = { ...track, url: `${localPath}` }
				await addImportedLocalMusic([newTrack], false)
			} else {
				throw new Error(`下载失败，状态码: ${downloadResult.statusCode}`)
			}
		}

		Alert.alert('成功', '音乐已缓存到本地', [{ text: '确定', onPress: () => {} }])
	} catch (error) {
		logError('缓存音乐时出错:', error)
		// await addImportedLocalMusic([track], false)
	}
}

/**
 * 播放音乐，同时替换播放队列
 * @param musicItem 音乐
 * @param newPlayList 替代列表
 */
const playWithReplacePlayList = async (
	musicItem: IMusic.IMusicItem,
	newPlayList: IMusic.IMusicItem[],
) => {
	if (newPlayList.length !== 0) {
		const now = Date.now()
		// if (newPlayList.length > maxMusicQueueLength) {
		//     newPlayList = shrinkPlayListToSize(
		//         newPlayList,
		//         newPlayList.findIndex(it => isSameMediaItem(it, musicItem)),
		//     );
		// }
		const playListItems = newPlayList.map((item, index) =>
			produce(item, (draft) => {
				draft[timeStampSymbol] = now
				draft[sortIndexSymbol] = index
			}),
		)
		setPlayList(
			repeatModeStore.getValue() === MusicRepeatMode.SHUFFLE
				? shuffle(playListItems)
				: playListItems,
		)
		await play(musicItem, true)
	}
}

const skipToNext = async () => {
	if (isPlayListEmpty()) {
		setCurrentMusic(null)
		return
	}

	// TrackPlayer.load(getPlayListMusicAt(currentIndex + 1) as Track)
	await play(getPlayListMusicAt(currentIndex + 1), true)
}

const skipToPrevious = async () => {
	if (isPlayListEmpty()) {
		setCurrentMusic(null)
		return
	}

	await play(getPlayListMusicAt(currentIndex === -1 ? 0 : currentIndex - 1), true)
}

/** 修改当前播放的音质 */
const changeQuality = async (newQuality: IMusic.IQualityKey) => {
	// 获取当前的音乐和进度
	if (newQuality === qualityStore.getValue()) {
		return true
	}

	// 获取当前歌曲
	const musicItem = currentMusicStore.getValue()
	if (!musicItem) {
		return false
	}
	try {
		setQuality(newQuality)
		return true
	} catch {
		// 修改失败
		return false
	}
}

enum PlayFailReason {
	/** 禁止移动网络播放 */
	FORBID_CELLUAR_NETWORK_PLAY = 'FORBID_CELLUAR_NETWORK_PLAY',
	/** 播放列表为空 */
	PLAY_LIST_IS_EMPTY = 'PLAY_LIST_IS_EMPTY',
	/** 无效源 */
	INVALID_SOURCE = 'INVALID_SOURCE',
	/** 非当前音乐 */
}

function useMusicState() {
	const playbackState = usePlaybackState()

	return playbackState.state
}

function getPreviousMusic() {
	const currentMusicItem = currentMusicStore.getValue()
	if (!currentMusicItem) {
		return null
	}

	return getPlayListMusicAt(currentIndex - 1)
}

function getNextMusic() {
	const currentMusicItem = currentMusicStore.getValue()
	if (!currentMusicItem) {
		return null
	}

	return getPlayListMusicAt(currentIndex + 1)
}
const addImportedLocalMusic = async (musicItem: IMusic.IMusicItem[], isAlert: boolean = true) => {
	try {
		console.log('addImportedLocalMusic', musicItem[0])
		const importedLocalMusic = importedLocalMusicStore.getValue() || []
		const newMusicItems = musicItem.filter(
			(newItem) => !importedLocalMusic.some((existingItem) => existingItem.id == newItem.id),
		)
		if (newMusicItems.length === 0) {
			// Alert.alert('提示', '所有选择的音乐已经存在，没有新的音乐被导入。')
			return
		}
		// 确保目标目录存在 isAlert只有导入本地音乐为true。所有自动缓存为false.,不需要移动文件
		if (isAlert) {
			const targetDir = `${RNFS.DocumentDirectoryPath}/importedLocalMusic`
			await ensureDirExists(targetDir)

			// 移动文件并更新musicItem的url
			for (const item of newMusicItems) {
				if (item.url.startsWith('file://')) {
					const originalExtension = item.url.split('.').pop() || 'mp3'

					// 创建一个安全的文件名（移除或替换不允许的字符）
					const safeTitle = item.title.replace(/[/\\?%*:|"<>]/g, '-')
					const safeArtist = item.artist.replace(/[/\\?%*:|"<>]/g, '-')
					const fileName = `${safeTitle}-${safeArtist}.${originalExtension}`
					const newPath = `${targetDir}/${fileName}`
					await FileSystem.moveAsync({
						from: item.url,
						to: newPath,
					})
					item.url = newPath
				}
			}
		}
		const updatedImportedLocalMusic = [...importedLocalMusic, ...musicItem]
		importedLocalMusicStore.setValue(updatedImportedLocalMusic)
		PersistStatus.set('music.importedLocalMusic', updatedImportedLocalMusic)
		if (isAlert) {
			Alert.alert('成功', '音乐导入成功,请手动选择', [
				{ text: '确定', onPress: () => logInfo('Add alert closed') },
			])
		}
	} catch (error) {
		logError('本地音乐保存时出错:', error)
	}
}
const deleteImportedLocalMusic = (musicItemsIdToDelete: string) => {
	try {
		const importedLocalMusic = importedLocalMusicStore.getValue() || []
		let fileUri = ''
		const updatedImportedLocalMusic = importedLocalMusic.filter((item) => {
			if (musicItemsIdToDelete === item.id) {
				fileUri = item.url
			}
			return musicItemsIdToDelete !== item.id
		})
		importedLocalMusicStore.setValue(updatedImportedLocalMusic)
		PersistStatus.set('music.importedLocalMusic', updatedImportedLocalMusic)
		//同时删除本地文
		FileSystem.deleteAsync(fileUri)
		// Alert.alert('成功', '音乐删除成功', [{ text: '确定', onPress: () => {} }])
	} catch (error) {
		logError('删除本地音乐时出错:', error)
	}
}
const isExistImportedLocalMusic = (musicItemName: string) => {
	// todo 检查文件存在？
	const importedLocalMusic = importedLocalMusicStore.getValue() || []
	return importedLocalMusic.some((item) => item.genre === musicItemName)
}
/**
 * 确保缓存目录存在
 */
const ensureCacheDirExists = async () => {
	const dirInfo = await FileSystem.getInfoAsync(cacheDir)
	if (!dirInfo.exists) {
		await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true })
	}
}
/**
 * 确保目录存在
 */
const ensureDirExists = async (dirPath: string) => {
	const dirInfo = await FileSystem.getInfoAsync(dirPath)
	if (!dirInfo.exists) {
		await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true })
	}
}

/**
 * 获取音频文件的本地路径
 * @param musicItem 音乐项
 * @returns 本地文件路径
 */
const getLocalFilePath = (musicItem: IMusic.IMusicItem): string => {
	const format = qualityStore.getValue() === 'flac' ? 'flac' : 'mp3'
	return `${cacheDir}${musicItem.title}-${musicItem.artist}.${format}`
}

/**
 * 检查本地是否存在音频缓存
 * @param musicItem 音乐项
 * @returns 是否存在
 */
const isCached = async (musicItem: IMusic.IMusicItem): Promise<boolean> => {
	const filePath = getLocalFilePath(musicItem)
	const fileInfo = await FileSystem.getInfoAsync(filePath)
	return fileInfo.exists
}
/**
 * 下载音频文件并保存到本地
 * @param musicItem 音乐项
 * @returns 本地文件路径
 */
const downloadToCache = async (musicItem: IMusic.IMusicItem): Promise<string> => {
	try {
		await ensureCacheDirExists()
		const localPath = getLocalFilePath(musicItem)
		const downloadResult = await RNFS.downloadFile({
			fromUrl: musicItem.url,
			toFile: localPath,
			progressDivider: 1,
			progress: (res) => {
				const progress = res.bytesWritten / res.contentLength
				logInfo(`下载进度: ${(progress * 100).toFixed(2)}%`)
			},
		}).promise

		if (downloadResult.statusCode === 200) {
			logInfo('音频文件已缓存到本地:', localPath)
			return localPath
		} else {
			throw new Error(`下载失败，状态码: ${downloadResult.statusCode}`)
		}
	} catch (error) {
		logError('下载音频文件时出错:', error)
		throw error
	}
}
/**
 * 清理所有缓存的音频文件
 */
const clearCache = async () => {
	const dirInfo = await FileSystem.getInfoAsync(cacheDir)
	if (dirInfo.exists) {
		await FileSystem.deleteAsync(cacheDir, { idempotent: true })
		const importedLocalMusic = importedLocalMusicStore.getValue() || []
		const updatedImportedLocalMusic = importedLocalMusic.filter((item) => {
			if (item.url.startsWith(cacheDir)) {
				return false
			}
			return true
		})
		importedLocalMusicStore.setValue(updatedImportedLocalMusic)
		PersistStatus.set('music.importedLocalMusic', updatedImportedLocalMusic)
		logInfo('缓存已清理')
	} else {
		logInfo('缓存目录不存在，无需清理')
	}
}
const toggleAutoCacheLocal = (bool: boolean) => {
	PersistStatus.set('music.autoCacheLocal', bool)
	autoCacheLocalStore.setValue(bool)
}
const toggleIsCachedIconVisible = (bool: boolean) => {
	PersistStatus.set('music.isCachedIconVisible', bool)
	isCachedIconVisibleStore.setValue(bool)
}
const showErrorMessage = (message: string) => {
	// 只在应用在前台时显示 Alert
	if (AppState.currentState === 'active') {
		showToast('错误', message, 'error')
		// Alert.alert('错误', message, [{ text: '确定', onPress: () => {} }])
	}
}
const myTrackPlayer = {
	setupTrackPlayer,
	usePlayList,
	getPlayList,
	addAll,
	add,
	addAsNextTrack,
	skipToNext,
	skipToPrevious,
	play,
	playWithReplacePlayList,
	pause,
	remove,
	clear,
	clearToBePlayed,
	useCurrentMusic: currentMusicStore.useValue,
	getCurrentMusic: currentMusicStore.getValue,
	useRepeatMode: repeatModeStore.useValue,
	getRepeatMode: repeatModeStore.getValue,
	toggleRepeatMode,
	usePlaybackState,
	setRepeatMode,
	setQuality,
	getProgress: ReactNativeTrackPlayer.getProgress,
	useProgress: useProgress,
	seekTo: ReactNativeTrackPlayer.seekTo,
	changeQuality,
	addPlayLists,
	deletePlayLists,
	getPlayListById,
	addMusicApi,
	setMusicApiAsSelectedById,
	deleteMusicApiById,
	addSongToStoredPlayList,
	deleteSongFromStoredPlayList,
	addImportedLocalMusic,
	deleteImportedLocalMusic,
	isExistImportedLocalMusic,
	useCurrentQuality: qualityStore.useValue,
	getCurrentQuality: qualityStore.getValue,
	getRate: ReactNativeTrackPlayer.getRate,
	setRate: ReactNativeTrackPlayer.setRate,
	useMusicState,
	reset: ReactNativeTrackPlayer.reset,
	getPreviousMusic,
	getNextMusic,
	clearCache,
	toggleAutoCacheLocal,
	cacheAndImportMusic,
	isCached,
	toggleIsCachedIconVisible,
	reloadMusicApi,
}

export default myTrackPlayer
export { MusicRepeatMode, State as MusicState }
