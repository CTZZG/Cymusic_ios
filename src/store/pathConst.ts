import { Platform } from 'react-native'

// 动态导入RNFS以避免Web环境错误
let RNFS: any = null
let CachesDirectoryPath = ''

if (Platform.OS !== 'web') {
	try {
		RNFS = require('react-native-fs')
		CachesDirectoryPath = RNFS.CachesDirectoryPath
	} catch (error) {
		console.warn('react-native-fs not available:', error)
	}
}

// 基础路径设置
export const basePath = Platform.OS === 'web'
	? '/tmp/cymusic' // Web环境使用临时路径
	: Platform.OS === 'android'
		? RNFS?.ExternalDirectoryPath || '/storage/emulated/0/Android/data/com.cymusic/files' // Android 存储路径
		: RNFS?.DocumentDirectoryPath || '/var/mobile/Containers/Data/Application/cymusic' // iOS 存储路径

// 导出路径配置
export default {
	basePath,
	pluginPath: `${basePath}/plugins/`, // 插件路径
	logPath: `${basePath}/log/`, // 日志路径
	dataPath: `${basePath}/data/`, // 数据路径
	cachePath: `${basePath}/cache/`, // 缓存路径
	musicCachePath: `${CachesDirectoryPath || `${basePath}/cache`}/TrackPlayer`, // 音乐缓存路径
	imageCachePath: `${CachesDirectoryPath || `${basePath}/cache`}/image_manager_disk_cache`, // 图片缓存路径
	lrcCachePath: `${basePath}/cache/lrc/`, // 歌词缓存路径
	downloadPath: `${basePath}/download/`, // 下载路径
	downloadMusicPath: `${basePath}/download/music/`, // 音乐下载路径
	mmkvPath: `${basePath}/mmkv`, // MMKV 存储路径
	mmkvCachePath: `${basePath}/cache/mmkv`, // MMKV 缓存路径
}
