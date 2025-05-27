/**
 * 插件类定义
 */

import CryptoJs from 'crypto-js';
import { nanoid } from 'nanoid';
// 类型引用通过全局声明，不需要import
import { addFileScheme, getFileName } from '@/utils/fileUtils';
import { devLog, errorLog, trace } from '@/utils/logger';
import { Mp3Util } from '@/utils/mp3Util';
import { exists, stat } from 'react-native-fs';
import { IPluginManager } from './index';

export enum PluginState {
    /** 加载中 */
    Loading = 'loading',
    /** 已挂载 */
    Mounted = 'mounted',
    /** 出错 */
    Error = 'error',
}

export enum PluginErrorReason {
    /** 无法解析 */
    CannotParse = 'cannot-parse',
    /** 版本不匹配 */
    VersionNotMatch = 'version-not-match',
    /** 插件无效 */
    InvalidPlugin = 'invalid-plugin',
}

export const localPluginPlatform = '本地';
export const localPluginHash = 'local-plugin-hash';
export const internalSerializeKey = '$';

/**
 * 插件方法类
 */
export class PluginMethods {
    public plugin: Plugin;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    /** 获取真实源 */
    async getMediaSource(
        musicItem: IMusic.IMusicItemBase,
        quality: IMusic.IQualityKey = 'standard',
        retryCount = 1,
        notUpdateCache = false,
    ): Promise<IPlugin.IMediaSourceResult | null> {
        // 1. 本地搜索
        const localPath = getLocalPath(musicItem);
        if (localPath && (await exists(localPath))) {
            trace('本地播放', localPath);
            return {
                url: addFileScheme(localPath),
            };
        }

        if (musicItem.platform === localPluginPlatform) {
            throw new Error('本地音乐不存在');
        }

        // 2. 插件解析
        if (!this.plugin.instance.getMediaSource) {
            return {
                url: musicItem?.qualities?.[quality]?.url ?? musicItem.url,
            };
        }

        try {
            const { url, headers } = (await this.plugin.instance.getMediaSource(
                musicItem,
                quality,
            )) ?? { url: musicItem?.qualities?.[quality]?.url };

            if (!url) {
                throw new Error('NOT RETRY');
            }

            trace('播放', '插件播放');
            const result = {
                url,
                headers,
                userAgent: headers?.['user-agent'],
            } as IPlugin.IMediaSourceResult;

            return result;
        } catch (e: any) {
            devLog('error', '获取播放源失败', e?.message);
            throw e;
        }
    }

    /** 搜索 */
    async search<T extends ICommon.SupportMediaType>(
        query: string,
        page: number,
        type: T,
    ): Promise<IPlugin.ISearchResult<T>> {
        if (!this.plugin.instance.search) {
            return {
                isEnd: true,
                data: [],
            };
        }

        try {
            const result = await this.plugin.instance.search(query, page, type);
            result.data?.forEach?.(_ => resetMediaItem(_, this.plugin.name));
            return result;
        } catch (e: any) {
            devLog('error', '搜索失败', e?.message);
            return {
                isEnd: true,
                data: [],
            };
        }
    }

    /** 获取歌词 */
    async getLyric(
        musicItem: IMusic.IMusicItemBase,
    ): Promise<IPlugin.ILyricSource | null> {
        if (!this.plugin.instance.getLyric) {
            return null;
        }

        try {
            const result = await this.plugin.instance.getLyric(musicItem);
            return result;
        } catch (e: any) {
            devLog('error', '获取歌词失败', e?.message);
            return null;
        }
    }

    /** 导入歌单 */
    async importMusicSheet(urlLike: string): Promise<IMusic.IMusicItem[]> {
        try {
            const result =
                (await this.plugin.instance?.importMusicSheet?.(urlLike)) ?? [];
            result.forEach(_ => resetMediaItem(_, this.plugin.name));
            return result;
        } catch (e: any) {
            console.log(e);
            devLog('error', '导入歌单失败', e, e?.message);
            return [];
        }
    }

    /** 导入单曲 */
    async importMusicItem(urlLike: string): Promise<IMusic.IMusicItem | null> {
        try {
            const result = await this.plugin.instance?.importMusicItem?.(
                urlLike,
            );
            if (!result) {
                throw new Error();
            }
            resetMediaItem(result, this.plugin.name);
            return result;
        } catch (e: any) {
            devLog('error', '导入单曲失败', e, e?.message);
            return null;
        }
    }
}

/**
 * 插件类
 */
export class Plugin {
    /** 插件名 */
    public name: string;
    /** 插件的hash，作为唯一id */
    public hash: string;
    /** 插件状态：激活、关闭、错误 */
    public state: PluginState = PluginState.Loading;
    /** 插件出错时的原因 */
    public errorReason?: PluginErrorReason;
    /** 插件的实例 */
    public instance: IPlugin.IPluginDefine;
    /** 插件路径 */
    public path: string;
    /** 插件方法 */
    public methods: IPlugin.IPluginInstanceMethods;

    static pluginManager: IPluginManager;

    static injectDependencies(pluginManager: IPluginManager) {
        Plugin.pluginManager = pluginManager;
    }

    constructor(
        funcCode: string | (() => IPlugin.IPluginDefine),
        pluginPath: string,
    ) {
        let _instance: IPlugin.IPluginDefine;

        try {
            if (typeof funcCode === 'string') {
                this.hash = CryptoJs.MD5(funcCode).toString();
                // 创建一个安全的执行环境
                const _module = { exports: {} };
                const _require = (name: string) => {
                    // 这里可以添加允许的模块
                    throw new Error(`Module ${name} is not allowed`);
                };

                // 执行插件代码
                const func = new Function('module', 'exports', 'require', funcCode);
                func(_module, _module.exports, _require);

                if (_module.exports.default) {
                    _instance = _module.exports.default as IPlugin.IPluginInstance;
                } else {
                    _instance = _module.exports as IPlugin.IPluginInstance;
                }
            } else {
                _instance = funcCode();
            }

            // 插件初始化后的一些操作
            if (Array.isArray(_instance.userVariables)) {
                _instance.userVariables = _instance.userVariables.filter(
                    it => it?.key,
                );
            }
            this.checkValid(_instance);
        } catch (e: any) {
            this.state = PluginState.Error;
            this.errorReason = e?.errorReason ?? PluginErrorReason.CannotParse;

            errorLog(`${pluginPath}插件无法解析 `, {
                errorReason: this.errorReason,
                message: e?.message,
                stack: e?.stack,
            });
            _instance = e?.instance ?? {
                platform: '',
                appVersion: '',
                async getMediaSource() {
                    return null;
                },
                async search() {
                    return {};
                },
                async getAlbumInfo() {
                    return null;
                },
            };
        }

        this.instance = _instance;
        this.name = _instance.platform;
        this.path = pluginPath;
        this.methods = new PluginMethods(this) as any;

        if (typeof funcCode === 'string') {
            this.hash = CryptoJs.MD5(funcCode).toString();
        } else {
            this.hash = nanoid();
        }
    }

    private checkValid(instance: IPlugin.IPluginDefine) {
        if (!instance.platform) {
            const e = new Error('插件platform字段不能为空');
            e.errorReason = PluginErrorReason.InvalidPlugin;
            e.instance = instance;
            throw e;
        }

        this.state = PluginState.Mounted;
    }
}

// 本地文件插件
export const localFilePlugin = new Plugin(() => ({
    platform: localPluginPlatform,
    appVersion: '',
    async importMusicItem(urlLike) {
        let meta: any = {};
        let id: string;

        try {
            meta = await Mp3Util.getBasicMeta(urlLike);
            const fileStat = await stat(urlLike);
            id = CryptoJs.MD5(fileStat.originalFilepath).toString(CryptoJs.enc.Hex) || nanoid();
        } catch {
            id = nanoid();
        }

        return {
            id: id,
            platform: localPluginPlatform,
            title: meta?.title ?? getFileName(urlLike),
            artist: meta?.artist ?? '未知歌手',
            duration: parseInt(meta?.duration ?? '0', 10) / 1000,
            album: meta?.album ?? '未知专辑',
            artwork: '',
            [internalSerializeKey]: {
                localPath: urlLike,
            },
            url: urlLike
        };
    },
    async getMediaSource(musicItem, quality) {
        if (quality === 'standard') {
            return {
                url: addFileScheme(musicItem.$?.localPath || musicItem.url),
            };
        }
        return null;
    }
}), '');

// 工具函数
function getLocalPath(musicItem: IMusic.IMusicItemBase): string | undefined {
    return musicItem[internalSerializeKey]?.localPath;
}

function resetMediaItem(mediaItem: any, platform: string) {
    if (mediaItem) {
        mediaItem.platform = platform;
    }
}

// 声明错误类型扩展
declare global {
    interface Error {
        errorReason?: PluginErrorReason;
        instance?: any;
    }
}
