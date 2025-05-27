import { sha256 } from 'js-sha256';
import DeviceInfo from 'react-native-device-info';
import { satisfies } from 'semver';

/**
 * 插件方法包装器类
 * 为插件实例的方法提供包装和错误处理
 */
export class PluginMethodsWrapper {
    private plugin: Plugin;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    // 实现所有插件方法的包装
    async search<T extends ICommon.SupportMediaType>(
        query: string,
        page: number,
        type: T,
    ): Promise<any> {
        if (!this.plugin.instance.search) {
            throw new Error('Plugin does not support search');
        }
        return this.plugin.instance.search(query, page, type);
    }

    async getMediaSource(
        musicItem: IMusic.IMusicItemBase,
        quality: IMusic.IQualityKey,
    ): Promise<any> {
        if (!this.plugin.instance.getMediaSource) {
            return null;
        }
        return this.plugin.instance.getMediaSource(musicItem, quality);
    }

    async getMusicInfo(
        musicBase: ICommon.IMediaBase,
    ): Promise<Partial<IMusic.IMusicItem> | null> {
        if (!this.plugin.instance.getMusicInfo) {
            return null;
        }
        return this.plugin.instance.getMusicInfo(musicBase);
    }

    async getLyric(
        musicItem: IMusic.IMusicItemBase,
    ): Promise<any> {
        if (!this.plugin.instance.getLyric) {
            return null;
        }
        return this.plugin.instance.getLyric(musicItem);
    }

    async getAlbumInfo(
        albumItem: IAlbum.IAlbumItemBase,
        page: number,
    ): Promise<any> {
        if (!this.plugin.instance.getAlbumInfo) {
            return null;
        }
        return this.plugin.instance.getAlbumInfo(albumItem, page);
    }

    async getMusicSheetInfo(
        sheetItem: IMusic.IMusicSheetItem,
        page: number,
    ): Promise<any> {
        if (!this.plugin.instance.getMusicSheetInfo) {
            return null;
        }
        return this.plugin.instance.getMusicSheetInfo(sheetItem, page);
    }

    async getArtistWorks<T extends IArtist.ArtistMediaType>(
        artistItem: IArtist.IArtistItem,
        page: number,
        type: T,
    ): Promise<any> {
        if (!this.plugin.instance.getArtistWorks) {
            throw new Error('Plugin does not support getArtistWorks');
        }
        return this.plugin.instance.getArtistWorks(artistItem, page, type);
    }

    async importMusicSheet(
        urlLike: string,
    ): Promise<IMusic.IMusicItem[] | null> {
        if (!this.plugin.instance.importMusicSheet) {
            return null;
        }
        return this.plugin.instance.importMusicSheet(urlLike);
    }

    async importMusicItem(
        urlLike: string,
    ): Promise<IMusic.IMusicItem | null> {
        if (!this.plugin.instance.importMusicItem) {
            return null;
        }
        return this.plugin.instance.importMusicItem(urlLike);
    }

    async getTopLists(): Promise<any[]> {
        if (!this.plugin.instance.getTopLists) {
            return [];
        }
        return this.plugin.instance.getTopLists();
    }

    async getTopListDetail(
        topListItem: IMusic.IMusicSheetItemBase,
        page: number,
    ): Promise<any> {
        if (!this.plugin.instance.getTopListDetail) {
            throw new Error('Plugin does not support getTopListDetail');
        }
        return this.plugin.instance.getTopListDetail(topListItem, page);
    }

    async getRecommendSheetTags(): Promise<any> {
        if (!this.plugin.instance.getRecommendSheetTags) {
            return {};
        }
        return this.plugin.instance.getRecommendSheetTags();
    }

    async getRecommendSheetsByTag(
        tag: ICommon.IUnique,
        page?: number,
    ): Promise<any> {
        if (!this.plugin.instance.getRecommendSheetsByTag) {
            return { isEnd: true, data: [] };
        }
        return this.plugin.instance.getRecommendSheetsByTag(tag, page);
    }

    async getRecommendSheetDetail(sheet: any, page: number = 1): Promise<any> {
        if (!this.plugin.instance.getRecommendSheetDetail) {
            return { musicList: [], isEnd: true };
        }
        return this.plugin.instance.getRecommendSheetDetail(sheet, page);
    }


}

/**
 * 插件类
 * 表示一个插件实例，包含插件的状态、实例和方法
 */
export class Plugin {
    /** 插件名 */
    public name: string;
    /** 插件平台名 */
    public platform: string;
    /** 插件的hash，作为唯一id */
    public hash: string;
    /** 插件状态：激活、关闭、错误 */
    public state: string = 'loading';
    /** 插件出错时的原因 */
    public errorReason?: string;
    /** 插件的实例 */
    public instance: any;
    /** 插件路径 */
    public path: string;
    /** 插件方法 */
    public methods: PluginMethodsWrapper;

    constructor(
        funcCode: string | (() => any),
        pluginPath: string,
    ) {
        let _instance: any;

        try {
            if (typeof funcCode === 'string') {
                // 执行插件代码
                const _module = { exports: {} };
                const _require = (name: string) => {
                    // 简单的require实现，可以根据需要扩展
                    throw new Error(`Module ${name} not found`);
                };

                // 创建插件执行环境
                const func = new Function('module', 'exports', 'require', funcCode);
                func(_module, _module.exports, _require);

                if ((_module.exports as any).default) {
                    _instance = (_module.exports as any).default;
                } else {
                    _instance = _module.exports;
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
            this.state = 'error';
            this.errorReason = e?.errorReason ?? 'cannot-parse';

            console.error(`${pluginPath}插件无法解析`, {
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
                    return { isEnd: true, data: [] };
                },
                async getAlbumInfo() {
                    return null;
                },
            };
        }

        this.instance = _instance;
        this.path = pluginPath;
        this.name = _instance.platform;
        this.platform = _instance.platform;

        // 检测name & 计算hash
        if (this.name === '' || !this.name) {
            this.hash = '';
            this.state = 'error';
            this.errorReason = this.errorReason ?? 'cannot-parse';
        } else {
            if (typeof funcCode === 'string') {
                this.hash = sha256(funcCode).toString();
            } else {
                this.hash = sha256(pluginPath + "@" + DeviceInfo.getVersion()).toString();
            }
        }

        if (this.state !== 'error') {
            this.state = 'mounted';
        }
        this.methods = new PluginMethodsWrapper(this);
    }

    private checkValid(_instance: any) {
        /** 版本号校验 */
        if (
            _instance.appVersion &&
            !satisfies(DeviceInfo.getVersion(), _instance.appVersion)
        ) {
            throw {
                instance: _instance,
                state: 'error',
                errorReason: 'version-not-match',
            };
        }
        return true;
    }
}
