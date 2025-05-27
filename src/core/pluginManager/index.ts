import { pathConst } from '@/constants/pathConst';
import { EventEmitter } from 'events';
import { Plugin } from './plugin';
import { pluginMeta } from './pluginMeta';

/**
 * 插件管理器类
 * 负责插件的加载、管理、启用/禁用等功能
 */
class PluginManager {
    private plugins: Plugin[] = [];
    private eventEmitter = new EventEmitter();

    /**
     * 初始化插件管理器，从文件系统加载所有插件
     */
    async setup() {
        try {
            await pluginMeta.migratePluginMeta();
            // 加载插件
            const { platformFS } = await import('./platformAdapter');
            const pluginsFileItems = await platformFS.readDir(pathConst.pluginPath);
            const allPlugins: Array<Plugin> = [];

            for (let i = 0; i < pluginsFileItems.length; ++i) {
                const pluginFileItem = pluginsFileItems[i];
                console.log('初始化插件', pluginFileItem);
                if (
                    pluginFileItem.isFile() &&
                    (pluginFileItem.name?.endsWith?.('.js') ||
                        pluginFileItem.path?.endsWith?.('.js'))
                ) {
                    const funcCode = await platformFS.readFile(pluginFileItem.path, 'utf8');
                    const plugin = new Plugin(funcCode, pluginFileItem.path);

                    const _pluginIndex = allPlugins.findIndex(
                        p => p.hash === plugin.hash,
                    );
                    if (_pluginIndex !== -1) {
                        // 重复插件，直接忽略
                        continue;
                    }
                    if (plugin.state === 'mounted') {
                        allPlugins.push(plugin);
                    }
                }
            }

            this.setPlugins(allPlugins);
        } catch (e: any) {
            console.error(`插件初始化失败:${e?.message ?? e}`);
            throw e;
        }
    }

    /**
     * 设置插件列表
     */
    setPlugins(plugins: Plugin[]) {
        this.plugins = plugins;
        this.eventEmitter.emit('plugins-updated', plugins);
    }

    /**
     * 获取所有插件
     */
    getPlugins() {
        return this.plugins;
    }

    /**
     * 通过名称获取插件
     */
    getByName(name: string) {
        return this.getPlugins().find(_ => _.name === name);
    }

    /**
     * 通过哈希值获取插件
     */
    getByHash(hash: string) {
        return this.getPlugins().find(_ => _.hash === hash);
    }

    /**
     * 通过媒体项的平台信息获取对应的插件
     */
    getByMedia(mediaItem: ICommon.IMediaBase) {
        return this.getByName(mediaItem?.platform);
    }

    /**
     * 获取所有已启用的插件
     */
    getEnabledPlugins() {
        return this.getPlugins().filter(it => pluginMeta.isPluginEnabled(it.name));
    }

    /**
     * 获取按顺序排序的所有插件
     */
    getSortedPlugins() {
        const order = pluginMeta.getPluginOrder();
        return [...this.getPlugins()].sort((a, b) =>
            (order[a.name] ?? Infinity) - (order[b.name] ?? Infinity) < 0
                ? -1
                : 1,
        );
    }

    /**
     * 获取所有实现特定功能的插件
     */
    getPluginsWithAbility(ability: string) {
        return this.getEnabledPlugins().filter(
            plugin => typeof (plugin.instance as any)[ability] === 'function',
        );
    }

    /**
     * 获取所有实现特定功能的已启用插件，并按顺序排序
     */
    getSortedPluginsWithAbility(ability: string) {
        const order = pluginMeta.getPluginOrder();
        return [...this.getPluginsWithAbility(ability)].sort((a, b) =>
            (order[a.name] ?? Infinity) - (order[b.name] ?? Infinity) < 0
                ? -1
                : 1,
        );
    }

    /**
     * 设置插件的启用状态
     */
    setPluginEnabled(plugin: Plugin, enabled: boolean) {
        this.eventEmitter.emit('enabled-updated', plugin.name, enabled);
        pluginMeta.setPluginEnabled(plugin.name, enabled);
    }

    /**
     * 检查插件是否已启用
     */
    isPluginEnabled(plugin: Plugin) {
        return pluginMeta.isPluginEnabled(plugin.name);
    }

    /**
     * 监听插件事件
     */
    on(event: string, listener: (...args: any[]) => void) {
        this.eventEmitter.on(event, listener);
    }

    /**
     * 移除事件监听器
     */
    off(event: string, listener: (...args: any[]) => void) {
        this.eventEmitter.off(event, listener);
    }
}

// 创建单例实例
const pluginManager = new PluginManager();

/**
 * 插件系统启动函数
 */
export async function bootstrap() {
    console.log('插件系统启动中...');

    try {
        // 创建测试插件
        const testPlugin = `
            module.exports = {
                platform: "测试插件",
                appVersion: ">=0.1.0",
                async search(query, page = 1, type = 'music') {
                    return {
                        isEnd: true,
                        data: [{
                            id: 'test-1',
                            title: '测试歌曲',
                            artist: '测试艺术家',
                            type: 'music'
                        }]
                    };
                },
                async getTopLists() {
                    return [{
                        title: '测试排行榜',
                        data: [{
                            id: 'test-toplist-1',
                            title: '测试排行榜',
                            description: '这是一个测试排行榜'
                        }]
                    }];
                },
                async getRecommendSheetTags() {
                    return {
                        pinned: [{
                            id: 'test-sheet-1',
                            title: '测试歌单',
                            description: '这是一个测试歌单'
                        }],
                        data: []
                    };
                }
            };
        `;

        const testPluginInstance = new Plugin(testPlugin, 'test-plugin.js');
        pluginManager.setPlugins([testPluginInstance]);

        console.log('插件系统启动完成，已加载测试插件');
    } catch (error) {
        console.error('插件系统启动失败:', error);
        throw error;
    }
}

export default pluginManager;
