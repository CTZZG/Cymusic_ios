/**
 * 插件元数据管理
 * 负责插件的启用状态、排序等元数据的存储和管理
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PLUGIN_ENABLED_KEY = 'plugin_enabled';
const PLUGIN_ORDER_KEY = 'plugin_order';

interface IPluginMeta {
    setPluginEnabled(pluginName: string, enabled: boolean): void;
    isPluginEnabled(pluginName: string): boolean;
    getPluginOrder(): Record<string, number>;
    setPluginOrder(order: Record<string, number>): void;
}

class PluginMetaImpl implements IPluginMeta {
    private enabledCache: Record<string, boolean> = {};
    private orderCache: Record<string, number> = {};
    private initialized = false;

    private async init() {
        if (this.initialized) return;

        try {
            // 加载启用状态
            const enabledData = await AsyncStorage.getItem(PLUGIN_ENABLED_KEY);
            if (enabledData) {
                this.enabledCache = JSON.parse(enabledData);
            }

            // 加载排序
            const orderData = await AsyncStorage.getItem(PLUGIN_ORDER_KEY);
            if (orderData) {
                this.orderCache = JSON.parse(orderData);
            }

            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize plugin meta:', error);
            this.initialized = true; // 即使失败也标记为已初始化，避免重复尝试
        }
    }

    async setPluginEnabled(pluginName: string, enabled: boolean): Promise<void> {
        await this.init();

        this.enabledCache[pluginName] = enabled;

        try {
            await AsyncStorage.setItem(PLUGIN_ENABLED_KEY, JSON.stringify(this.enabledCache));
        } catch (error) {
            console.error('Failed to save plugin enabled state:', error);
        }
    }

    async isPluginEnabled(pluginName: string): Promise<boolean> {
        await this.init();

        // 默认启用
        return this.enabledCache[pluginName] !== false;
    }

    async getPluginOrder(): Promise<Record<string, number>> {
        await this.init();
        return { ...this.orderCache };
    }

    async setPluginOrder(order: Record<string, number>): Promise<void> {
        await this.init();

        this.orderCache = { ...order };

        try {
            await AsyncStorage.setItem(PLUGIN_ORDER_KEY, JSON.stringify(this.orderCache));
        } catch (error) {
            console.error('Failed to save plugin order:', error);
        }
    }

    // 同步版本的方法（为了兼容现有代码）
    setPluginEnabledSync(pluginName: string, enabled: boolean): void {
        this.setPluginEnabled(pluginName, enabled);
    }

    isPluginEnabledSync(pluginName: string): boolean {
        // 如果还没初始化，默认返回true
        if (!this.initialized) {
            return true;
        }
        return this.enabledCache[pluginName] !== false;
    }

    getPluginOrderSync(): Record<string, number> {
        if (!this.initialized) {
            return {};
        }
        return { ...this.orderCache };
    }

    setPluginOrderSync(order: Record<string, number>): void {
        this.setPluginOrder(order);
    }
}

export const pluginMeta = new PluginMetaImpl();
