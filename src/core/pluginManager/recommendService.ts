import pluginManager from './index';

/**
 * 插件化推荐歌单服务
 * 提供统一的推荐歌单接口，支持多插件歌单聚合
 */

export interface RecommendTag {
    id: string;
    title: string;
    description?: string;
    platform: string;
    originalData?: any;
}

export interface RecommendSheet {
    id: string;
    title: string;
    description?: string;
    coverImg?: string;
    platform: string;
    playCount?: number;
    worksNums?: number;
    originalData?: any;
}

export interface RecommendSheetTags {
    pinned?: RecommendSheet[];
    data?: {
        title: string;
        data: RecommendSheet[];
    }[];
}

export interface RecommendSheetsResult {
    isEnd: boolean;
    data: RecommendSheet[];
}

/**
 * 插件化推荐歌单服务类
 */
class PluginRecommendService {
    /**
     * 获取所有插件的推荐歌单标签
     */
    async getAllRecommendSheetTags(): Promise<RecommendSheetTags> {
        const plugins = pluginManager.getSortedPluginsWithAbility('getRecommendSheetTags');

        if (plugins.length === 0) {
            return { pinned: [], data: [] };
        }

        const allPinned: RecommendSheet[] = [];
        const allData: { title: string; data: RecommendSheet[] }[] = [];

        // 并发获取所有插件的推荐歌单标签
        const tagPromises = plugins.map(async (plugin) => {
            try {
                const result = await plugin.methods.getRecommendSheetTags();
                return this.convertRecommendSheetTags(result || {}, plugin.name);
            } catch (error) {
                console.error(`插件 ${plugin.name} 获取推荐歌单标签失败:`, error);
                return { pinned: [], data: [] };
            }
        });

        const results = await Promise.all(tagPromises);

        // 合并所有结果
        results.forEach(result => {
            if (result.pinned) {
                allPinned.push(...result.pinned);
            }
            if (result.data) {
                allData.push(...result.data);
            }
        });

        return {
            pinned: allPinned,
            data: allData,
        };
    }

    /**
     * 获取指定插件的推荐歌单标签
     */
    async getRecommendSheetTagsByPlugin(pluginName: string): Promise<RecommendSheetTags> {
        const plugin = pluginManager.getByName(pluginName);

        if (!plugin || !plugin.methods.getRecommendSheetTags) {
            throw new Error(`插件 ${pluginName} 不存在或不支持推荐歌单标签功能`);
        }

        try {
            const result = await plugin.methods.getRecommendSheetTags();
            return this.convertRecommendSheetTags(result || {}, plugin.name);
        } catch (error) {
            console.error(`插件 ${pluginName} 获取推荐歌单标签失败:`, error);
            throw error;
        }
    }

    /**
     * 根据标签获取推荐歌单
     */
    async getRecommendSheetsByTag(
        tag: RecommendTag,
        page: number = 1
    ): Promise<RecommendSheetsResult> {
        const plugin = pluginManager.getByName(tag.platform);

        if (!plugin || !plugin.methods.getRecommendSheetsByTag) {
            throw new Error(`插件 ${tag.platform} 不存在或不支持根据标签获取推荐歌单功能`);
        }

        try {
            const result = await plugin.methods.getRecommendSheetsByTag(
                tag.originalData || tag,
                page
            );

            // 转换歌单列表
            const sheets = this.convertRecommendSheets(
                result.data || [],
                tag.platform
            );

            return {
                isEnd: result.isEnd || false,
                data: sheets,
            };
        } catch (error) {
            console.error(`根据标签获取推荐歌单失败:`, error);
            throw error;
        }
    }

    /**
     * 获取所有插件的推荐歌单（聚合）
     */
    async getAllRecommendSheets(page: number = 1): Promise<RecommendSheetsResult> {
        const plugins = pluginManager.getSortedPluginsWithAbility('getRecommendSheetTags');

        if (plugins.length === 0) {
            return { isEnd: true, data: [] };
        }

        const allSheets: RecommendSheet[] = [];
        let hasMore = false;

        // 并发获取所有插件的推荐歌单
        const sheetPromises = plugins.map(async (plugin) => {
            try {
                // 先获取标签
                const tagsResult = await plugin.methods.getRecommendSheetTags();
                if (!tagsResult || !tagsResult.pinned || tagsResult.pinned.length === 0) {
                    return [];
                }

                // 获取精选歌单
                const sheets = this.convertRecommendSheets(tagsResult.pinned || [], plugin.name);
                return sheets;
            } catch (error) {
                console.error(`插件 ${plugin.name} 获取推荐歌单失败:`, error);
                return [];
            }
        });

        const results = await Promise.all(sheetPromises);

        // 合并所有结果
        results.forEach(sheets => {
            allSheets.push(...sheets);
        });

        return {
            isEnd: true, // 聚合结果暂时不支持分页
            data: allSheets,
        };
    }

    /**
     * 转换推荐歌单标签数据格式
     */
    private convertRecommendSheetTags(data: any, pluginName: string): RecommendSheetTags {
        const result: RecommendSheetTags = {
            pinned: [],
            data: [],
        };

        // 转换精选歌单
        if (data.pinned && Array.isArray(data.pinned)) {
            result.pinned = this.convertRecommendSheets(data.pinned, pluginName);
        }

        // 转换分类数据
        if (data.data && Array.isArray(data.data)) {
            result.data = data.data.map((category: any) => ({
                title: category.title || '',
                data: this.convertRecommendSheets(category.data || [], pluginName),
            }));
        }

        return result;
    }

    /**
     * 转换推荐歌单数据格式
     */
    private convertRecommendSheets(sheets: any[], pluginName: string): RecommendSheet[] {
        return sheets.map((item, index) => ({
            id: `${pluginName}-sheet-${item.id || index}`,
            title: item.title || item.name || '',
            description: item.description || '',
            coverImg: item.coverImg || item.artwork || '',
            platform: pluginName,
            playCount: item.playCount || 0,
            worksNums: item.worksNums || 0,
            originalData: item,
        }));
    }

    /**
     * 获取推荐歌单详情
     */
    async getRecommendSheetDetail(
        sheet: RecommendSheet,
        page: number = 1
    ): Promise<{ musicList: any[]; isEnd: boolean }> {
        const plugin = pluginManager.getByName(sheet.platform);

        if (!plugin || !plugin.methods.getRecommendSheetDetail) {
            throw new Error(`插件 ${sheet.platform} 不存在或不支持获取歌单详情功能`);
        }

        try {
            console.log(`获取插件 ${plugin.name} 的歌单详情: ${sheet.title}`);

            const result = await plugin.methods.getRecommendSheetDetail(
                sheet.originalData || sheet,
                page
            );

            if (!result) {
                return { musicList: [], isEnd: true };
            }

            // 转换数据格式
            const musicList = result.musicList?.map((item: any) => ({
                id: item.id || `${plugin.name}-${item.title}-${item.artist}`,
                title: item.title || '未知标题',
                artist: item.artist || '未知艺术家',
                album: item.album || '未知专辑',
                artwork: item.artwork || item.coverImg,
                url: item.url || '',
                platform: plugin.name,
                duration: item.duration,
                originalData: item
            })) || [];

            console.log(`插件 ${plugin.name} 返回歌单详情: ${musicList.length} 首歌曲`);

            return {
                musicList,
                isEnd: result.isEnd || false
            };

        } catch (error) {
            console.error(`获取歌单详情失败:`, error);
            throw error;
        }
    }

    /**
     * 获取支持推荐歌单的插件列表
     */
    getRecommendPlugins() {
        return pluginManager.getSortedPluginsWithAbility('getRecommendSheetTags');
    }

    /**
     * 检查是否有可用的推荐歌单插件
     */
    hasRecommendPlugins(): boolean {
        return this.getRecommendPlugins().length > 0;
    }
}

// 创建单例实例
export const pluginRecommendService = new PluginRecommendService();
