/**
 * 路由配置
 */

import { useRoute } from '@react-navigation/native';

/** 路由key */
export const ROUTE_PATH = {
    /** 主页 */
    HOME: 'home',
    /** 音乐播放页 */
    MUSIC_DETAIL: 'music-detail',
    /** 搜索页 */
    SEARCH_PAGE: 'search-page',
    /** 本地歌单页 */
    LOCAL_SHEET_DETAIL: 'local-sheet-detail',
    /** 专辑页 */
    ALBUM_DETAIL: 'album-detail',
    /** 歌手页 */
    ARTIST_DETAIL: 'artist-detail',
    /** 榜单页 */
    TOP_LIST: 'top-list',
    /** 榜单详情页 */
    TOP_LIST_DETAIL: 'top-list-detail',
    /** 设置页 */
    SETTING: 'setting',
    /** 本地音乐 */
    LOCAL: 'local',
    /** 正在下载 */
    DOWNLOADING: 'downloading',
    /** 从歌曲列表中搜索 */
    SEARCH_MUSIC_LIST: 'search-music-list',
    /** 批量编辑 */
    MUSIC_LIST_EDITOR: 'music-list-editor',
    /** 选择文件夹 */
    FILE_SELECTOR: 'file-selector',
    /** 推荐歌单 */
    RECOMMEND_SHEETS: 'recommend-sheets',
    /** 歌单详情 */
    PLUGIN_SHEET_DETAIL: 'plugin-sheet-detail',
    /** 历史记录 */
    HISTORY: 'history',
    /** 自定义主题 */
    SET_CUSTOM_THEME: 'set-custom-theme',
    /** 权限管理 */
    PERMISSIONS: 'permissions',
    /** 插件测试 */
    PLUGIN_TEST: 'plugin-test',
    /** UI测试 */
    UI_TEST: 'ui-test',
    /** 插件管理 */
    PLUGIN_MANAGE: 'plugin-manage',
} as const;

export type RoutePaths = typeof ROUTE_PATH[keyof typeof ROUTE_PATH];

type RouterParamsBase = Record<RoutePaths, any>;

/** 路由参数 */
interface RouterParams extends RouterParamsBase {
    home: undefined;
    'music-detail': undefined;
    'search-page': undefined;
    'local-sheet-detail': {
        id: string;
    };
    'album-detail': {
        albumItem: any; // IAlbum.IAlbumItem;
    };
    'artist-detail': {
        artistItem: any; // IArtist.IArtistItem;
        pluginHash: string;
    };
    setting: {
        type: string;
    };
    local: undefined;
    downloading: undefined;
    'search-music-list': {
        musicList: any[] | null; // IMusic.IMusicItem[] | null;
        musicSheet?: any; // IMusic.IMusicSheetItem;
    };
    'music-list-editor': {
        musicSheet?: any; // Partial<IMusic.IMusicSheetItem>;
        musicList: any[] | null; // IMusic.IMusicItem[] | null;
    };
    'file-selector': {
        fileType?: 'folder' | 'file' | 'file-and-folder';
        multi?: boolean;
        actionText?: string;
        actionIcon?: string;
        onAction?: (
            selectedFiles: {
                path: string;
                type: 'file' | 'folder';
            }[],
        ) => Promise<boolean>;
        matchExtension?: (path: string) => boolean;
    };
    'top-list-detail': {
        pluginHash: string;
        topList: any; // IMusic.IMusicSheetItemBase;
    };
    'plugin-sheet-detail': {
        pluginHash?: string;
        sheetInfo: any; // IMusic.IMusicSheetItemBase;
    };
    'plugin-test': undefined;
    'ui-test': undefined;
    'plugin-manage': undefined;
    'set-custom-theme': undefined;
    permissions: undefined;
    history: undefined;
    'recommend-sheets': undefined;
}

/** 路由参数Hook */
export function useParams<T extends RoutePaths>(): RouterParams[T] {
    const route = useRoute<any>();
    const routeParams = route?.params as RouterParams[T];
    return routeParams;
}
