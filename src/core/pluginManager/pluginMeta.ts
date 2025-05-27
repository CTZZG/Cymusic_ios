import getOrCreateMMKV from '@/store/getOrCreateMMKV';

const PLUGIN_META_KEY = 'plugin-meta';
const PLUGIN_ORDER_KEY = 'plugin-order';
const PLUGIN_ENABLED_KEY = 'plugin-enabled';

/**
 * 插件元数据管理器
 * 负责插件的配置、顺序、启用状态等元数据的存储和管理
 */
class PluginMeta {
    private storage = getOrCreateMMKV('plugin-meta');

    /**
     * 迁移插件元数据（兼容性处理）
     */
    async migratePluginMeta() {
        // 这里可以添加版本迁移逻辑
        console.log('插件元数据迁移完成');
    }

    /**
     * 获取插件元数据
     */
    getPluginMeta(pluginName: string): IPlugin.IPluginMeta | null {
        try {
            const metaStr = this.storage.getString(`${PLUGIN_META_KEY}-${pluginName}`);
            if (metaStr) {
                return JSON.parse(metaStr);
            }
        } catch (e) {
            console.error('获取插件元数据失败', e);
        }
        return null;
    }

    /**
     * 设置插件元数据
     */
    setPluginMeta(pluginName: string, meta: IPlugin.IPluginMeta) {
        try {
            this.storage.set(`${PLUGIN_META_KEY}-${pluginName}`, JSON.stringify(meta));
        } catch (e) {
            console.error('设置插件元数据失败', e);
        }
    }

    /**
     * 获取插件顺序配置
     */
    getPluginOrder(): Record<string, number> {
        try {
            const orderStr = this.storage.getString(PLUGIN_ORDER_KEY);
            if (orderStr) {
                return JSON.parse(orderStr);
            }
        } catch (e) {
            console.error('获取插件顺序失败', e);
        }
        return {};
    }

    /**
     * 设置插件顺序
     */
    setPluginOrder(order: Record<string, number>) {
        try {
            this.storage.set(PLUGIN_ORDER_KEY, JSON.stringify(order));
        } catch (e) {
            console.error('设置插件顺序失败', e);
        }
    }

    /**
     * 设置单个插件的顺序
     */
    setPluginOrderIndex(pluginName: string, index: number) {
        const currentOrder = this.getPluginOrder();
        currentOrder[pluginName] = index;
        this.setPluginOrder(currentOrder);
    }

    /**
     * 获取插件启用状态配置
     */
    getPluginEnabledConfig(): Record<string, boolean> {
        try {
            const enabledStr = this.storage.getString(PLUGIN_ENABLED_KEY);
            if (enabledStr) {
                return JSON.parse(enabledStr);
            }
        } catch (e) {
            console.error('获取插件启用状态失败', e);
        }
        return {};
    }

    /**
     * 设置插件启用状态配置
     */
    setPluginEnabledConfig(config: Record<string, boolean>) {
        try {
            this.storage.set(PLUGIN_ENABLED_KEY, JSON.stringify(config));
        } catch (e) {
            console.error('设置插件启用状态失败', e);
        }
    }

    /**
     * 检查插件是否启用
     */
    isPluginEnabled(pluginName: string): boolean {
        const config = this.getPluginEnabledConfig();
        // 默认启用
        return config[pluginName] !== false;
    }

    /**
     * 设置插件启用状态
     */
    setPluginEnabled(pluginName: string, enabled: boolean) {
        const config = this.getPluginEnabledConfig();
        config[pluginName] = enabled;
        this.setPluginEnabledConfig(config);
    }

    /**
     * 获取插件用户变量
     */
    getPluginUserVariables(pluginName: string): Record<string, string> {
        const meta = this.getPluginMeta(pluginName);
        return meta?.userVariables || {};
    }

    /**
     * 设置插件用户变量
     */
    setPluginUserVariables(pluginName: string, variables: Record<string, string>) {
        let meta = this.getPluginMeta(pluginName);
        if (!meta) {
            meta = {
                order: 0,
                userVariables: {},
                enabled: true,
            };
        }
        meta.userVariables = variables;
        this.setPluginMeta(pluginName, meta);
    }

    /**
     * 设置单个插件用户变量
     */
    setPluginUserVariable(pluginName: string, key: string, value: string) {
        const variables = this.getPluginUserVariables(pluginName);
        variables[key] = value;
        this.setPluginUserVariables(pluginName, variables);
    }

    /**
     * 获取单个插件用户变量
     */
    getPluginUserVariable(pluginName: string, key: string): string | undefined {
        const variables = this.getPluginUserVariables(pluginName);
        return variables[key];
    }

    /**
     * 删除插件元数据
     */
    removePluginMeta(pluginName: string) {
        try {
            this.storage.delete(`${PLUGIN_META_KEY}-${pluginName}`);

            // 从顺序配置中移除
            const order = this.getPluginOrder();
            delete order[pluginName];
            this.setPluginOrder(order);

            // 从启用状态配置中移除
            const enabled = this.getPluginEnabledConfig();
            delete enabled[pluginName];
            this.setPluginEnabledConfig(enabled);
        } catch (e) {
            console.error('删除插件元数据失败', e);
        }
    }

    /**
     * 清空所有插件元数据
     */
    clearAllPluginMeta() {
        try {
            this.storage.clearAll();
        } catch (e) {
            console.error('清空插件元数据失败', e);
        }
    }
}

// 创建单例实例
export const pluginMeta = new PluginMeta();
