import { Track } from 'react-native-track-player';
import pluginManager from './index';

/**
 * 插件化搜索服务
 * 提供统一的搜索接口，支持多插件搜索聚合
 */

export interface SearchResult {
    data: Track[];
    hasMore: boolean;
    isEnd?: boolean;
}

export interface SearchOptions {
    query: string;
    page: number;
    type: 'music' | 'artist' | 'album' | 'sheet';
    pluginName?: string; // 指定插件搜索
}

/**
 * 搜索状态枚举
 */
export enum SearchState {
    IDLE = 'idle',
    SEARCHING = 'searching',
    SUCCESS = 'success',
    ERROR = 'error',
    NO_PLUGIN = 'no_plugin',
}

/**
 * 插件化搜索服务类
 */
class PluginSearchService {
    /**
     * 执行搜索
     */
    async search(options: SearchOptions): Promise<SearchResult> {
        const { query, page, type, pluginName } = options;

        // 获取可用的搜索插件
        const plugins = pluginName
            ? [pluginManager.getByName(pluginName)].filter(Boolean)
            : pluginManager.getSortedPluginsWithAbility('search');

        if (plugins.length === 0) {
            throw new Error('没有可用的搜索插件');
        }

        // 如果指定了插件，只使用该插件搜索
        if (pluginName) {
            const plugin = plugins[0];
            if (!plugin) {
                throw new Error(`插件 ${pluginName} 不存在`);
            }
            return await this.searchWithPlugin(plugin, query, page, type);
        }

        // 多插件聚合搜索
        return await this.aggregateSearch(plugins, query, page, type);
    }

    /**
     * 使用单个插件搜索
     */
    private async searchWithPlugin(plugin: any, query: string, page: number, type: string): Promise<SearchResult> {
        try {
            const result = await plugin.methods.search(query, page, type);

            // 转换数据格式为Track格式
            const tracks = this.convertToTracks(result.data || [], plugin.name, type);

            return {
                data: tracks,
                hasMore: !result.isEnd,
                isEnd: result.isEnd,
            };
        } catch (error) {
            console.error(`插件 ${plugin.name} 搜索失败:`, error);
            throw error;
        }
    }

    /**
     * 多插件聚合搜索
     */
    private async aggregateSearch(plugins: any[], query: string, page: number, type: string): Promise<SearchResult> {
        const allResults: Track[] = [];
        let hasMore = false;

        // 并发搜索所有插件
        const searchPromises = plugins.map(async (plugin) => {
            try {
                const result = await plugin.methods.search(query, page, type);
                const tracks = this.convertToTracks(result.data || [], plugin.name, type);

                if (!result.isEnd) {
                    hasMore = true;
                }

                return tracks;
            } catch (error) {
                console.error(`插件 ${plugin.name} 搜索失败:`, error);
                return [];
            }
        });

        const results = await Promise.all(searchPromises);

        // 合并所有结果
        results.forEach(tracks => {
            allResults.push(...tracks);
        });

        // 去重和排序
        const uniqueTracks = this.deduplicateAndSort(allResults);

        return {
            data: uniqueTracks,
            hasMore,
        };
    }

    /**
     * 转换插件数据为Track格式
     */
    private convertToTracks(data: any[], pluginName: string, type: string): Track[] {
        return data.map((item, index) => {
            if (type === 'music') {
                return {
                    id: `${pluginName}-${item.id || index}`,
                    title: item.title || item.name || '',
                    artist: item.artist || item.singer || '',
                    album: item.album || '',
                    artwork: item.artwork || item.coverImg || '',
                    duration: item.duration || 0,
                    url: item.url || '',
                    platform: pluginName,
                    originalData: item, // 保存原始数据
                };
            } else if (type === 'artist') {
                return {
                    id: `${pluginName}-artist-${item.id || index}`,
                    title: item.name || item.title || '',
                    artist: item.name || item.title || '',
                    artwork: item.avatar || item.artwork || item.coverImg || '',
                    url: '', // 艺术家类型不需要播放URL
                    platform: pluginName,
                    isArtist: true,
                    originalData: item,
                };
            } else if (type === 'album') {
                return {
                    id: `${pluginName}-album-${item.id || index}`,
                    title: item.title || item.name || '',
                    artist: item.artist || item.singer || '',
                    artwork: item.artwork || item.coverImg || '',
                    url: '', // 专辑类型不需要播放URL
                    platform: pluginName,
                    isAlbum: true,
                    originalData: item,
                };
            } else if (type === 'sheet') {
                return {
                    id: `${pluginName}-sheet-${item.id || index}`,
                    title: item.title || item.name || '',
                    artist: item.artist || item.creator || '',
                    artwork: item.artwork || item.coverImg || '',
                    url: '', // 歌单类型不需要播放URL
                    platform: pluginName,
                    isSheet: true,
                    playCount: item.playCount,
                    worksNums: item.worksNums,
                    originalData: item,
                };
            }

            // 默认返回音乐格式
            return {
                id: `${pluginName}-${item.id || index}`,
                title: item.title || item.name || '',
                artist: item.artist || item.singer || '',
                artwork: item.artwork || item.coverImg || '',
                url: item.url || '', // 音乐需要播放URL
                platform: pluginName,
                originalData: item,
            };
        });
    }

    /**
     * 去重和排序
     */
    private deduplicateAndSort(tracks: Track[]): Track[] {
        // 简单的去重逻辑：基于title和artist
        const seen = new Set<string>();
        const uniqueTracks = tracks.filter(track => {
            const key = `${track.title}-${track.artist}`.toLowerCase();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });

        // 可以添加更复杂的排序逻辑
        return uniqueTracks;
    }

    /**
     * 获取支持搜索的插件列表
     */
    getSearchablePlugins() {
        return pluginManager.getSortedPluginsWithAbility('search');
    }

    /**
     * 检查是否有可用的搜索插件
     */
    hasSearchablePlugins(): boolean {
        return this.getSearchablePlugins().length > 0;
    }
}

// 创建单例实例
export const pluginSearchService = new PluginSearchService();
