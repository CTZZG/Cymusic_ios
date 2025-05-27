import { Track } from 'react-native-track-player';
import pluginManager from './index';

/**
 * 插件化排行榜服务
 * 提供统一的排行榜接口，支持多插件排行榜聚合
 */

export interface TopListGroup {
    title: string;
    data: TopListItem[];
}

export interface TopListItem {
    id: string;
    title: string;
    description?: string;
    coverImg?: string;
    platform: string;
    originalData?: any;
}

export interface TopListDetail {
    isEnd: boolean;
    musicList: Track[];
}

/**
 * 插件化排行榜服务类
 */
class PluginTopListService {
    /**
     * 获取所有插件的排行榜
     */
    async getAllTopLists(): Promise<TopListGroup[]> {
        const plugins = pluginManager.getSortedPluginsWithAbility('getTopLists');

        if (plugins.length === 0) {
            return [];
        }

        const allTopLists: TopListGroup[] = [];

        // 并发获取所有插件的排行榜
        const topListPromises = plugins.map(async (plugin) => {
            try {
                const result = await plugin.methods.getTopLists();
                return this.convertTopLists(result || [], plugin.name);
            } catch (error) {
                console.error(`插件 ${plugin.name} 获取排行榜失败:`, error);
                return [];
            }
        });

        const results = await Promise.all(topListPromises);

        // 合并所有结果
        results.forEach(topLists => {
            allTopLists.push(...topLists);
        });

        return allTopLists;
    }

    /**
     * 获取指定插件的排行榜
     */
    async getTopListsByPlugin(pluginName: string): Promise<TopListGroup[]> {
        const plugin = pluginManager.getByName(pluginName);

        if (!plugin || !plugin.methods.getTopLists) {
            throw new Error(`插件 ${pluginName} 不存在或不支持排行榜功能`);
        }

        try {
            const result = await plugin.methods.getTopLists();
            return this.convertTopLists(result || [], plugin.name);
        } catch (error) {
            console.error(`插件 ${pluginName} 获取排行榜失败:`, error);
            throw error;
        }
    }

    /**
     * 获取排行榜详情
     */
    async getTopListDetail(
        topListItem: TopListItem,
        page: number = 1
    ): Promise<TopListDetail> {
        const plugin = pluginManager.getByName(topListItem.platform);

        if (!plugin || !plugin.methods.getTopListDetail) {
            throw new Error(`插件 ${topListItem.platform} 不存在或不支持排行榜详情功能`);
        }

        try {
            const result = await plugin.methods.getTopListDetail(
                topListItem.originalData || topListItem,
                page
            );

            // 转换音乐列表为Track格式
            const tracks = this.convertMusicListToTracks(
                result.musicList || [],
                topListItem.platform
            );

            return {
                isEnd: result.isEnd || false,
                musicList: tracks,
            };
        } catch (error) {
            console.error(`获取排行榜详情失败:`, error);
            throw error;
        }
    }

    /**
     * 转换插件排行榜数据格式
     */
    private convertTopLists(data: any[], pluginName: string): TopListGroup[] {
        if (!Array.isArray(data)) {
            return [];
        }

        return data.map((group, groupIndex) => ({
            title: group.title || `${pluginName} 排行榜`,
            data: (group.data || []).map((item: any, index: number) => ({
                id: `${pluginName}-toplist-${item.id || `${groupIndex}-${index}`}`,
                title: item.title || item.name || '',
                description: item.description || '',
                coverImg: item.coverImg || item.artwork || '',
                platform: pluginName,
                originalData: item,
            })),
        }));
    }

    /**
     * 转换音乐列表为Track格式
     */
    private convertMusicListToTracks(musicList: any[], pluginName: string): Track[] {
        return musicList.map((item, index) => ({
            id: `${pluginName}-music-${item.id || index}`,
            title: item.title || item.name || '',
            artist: item.artist || item.singer || '',
            album: item.album || '',
            artwork: item.artwork || item.coverImg || '',
            duration: item.duration || 0,
            url: item.url || '',
            platform: pluginName,
            originalData: item,
        }));
    }



    /**
     * 获取支持排行榜的插件列表
     */
    getTopListPlugins() {
        return pluginManager.getSortedPluginsWithAbility('getTopLists');
    }

    /**
     * 检查是否有可用的排行榜插件
     */
    hasTopListPlugins(): boolean {
        return this.getTopListPlugins().length > 0;
    }
}

// 创建单例实例
export const pluginTopListService = new PluginTopListService();
