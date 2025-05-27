/**
 * 插件管理器
 * 负责插件的加载、安装、卸载、管理等功能
 */

import { errorLog, trace } from '@/utils/logger';
import axios from 'axios';
import { compare } from 'compare-versions';
import { readAsStringAsync } from 'expo-file-system';
import { ToastAndroid } from 'react-native';
import { exists, mkdir, readFile, readdir } from 'react-native-fs';
import { Plugin, PluginState, localFilePlugin, localPluginHash, localPluginPlatform } from './plugin';
import { pluginMeta } from './pluginMeta';
// 类型引用通过全局声明，不需要import
import { EventEmitter } from 'eventemitter3';

export interface IInstallPluginConfig {
    notCheckVersion?: boolean;
}

export interface IInstallPluginResult {
    success: boolean;
    message: string;
    pluginName: string;
    pluginHash: string;
    pluginUrl?: string;
}

export interface IPluginManager {
    setup(): Promise<void>;
    installPluginFromLocalFile(
        pluginPath: string,
        config?: IInstallPluginConfig & { useExpoFs?: boolean }
    ): Promise<IInstallPluginResult>;
    installPluginFromUrl(
        url: string,
        config?: IInstallPluginConfig
    ): Promise<IInstallPluginResult>;
    uninstallPlugin(hash: string): Promise<void>;
    uninstallAllPlugins(): Promise<void>;
    updatePlugin(plugin: Plugin): Promise<void>;
    getByMedia(mediaItem: ICommon.IMediaBase): Plugin | undefined;
    getByName(name: string): Plugin | undefined;
    getByHash(hash: string): Plugin | undefined;
    getPlugins(): Plugin[];
    getValidPlugins(): Plugin[];
    getPluginsWithAbility(ability: keyof IPlugin.IPluginInstanceMethods): Plugin[];
    getSortedPluginsWithAbility(ability: keyof IPlugin.IPluginInstanceMethods): Plugin[];
    setPluginEnabled(plugin: Plugin, enabled: boolean): void;
    isPluginEnabled(plugin: Plugin): boolean;
    setPlugins(plugins: Plugin[]): void;
}

class PluginManagerImpl implements IPluginManager {
    private plugins: Plugin[] = [];
    private ee = new EventEmitter();

    constructor() {
        Plugin.injectDependencies(this);
    }

    async setup(): Promise<void> {
        try {
            const pluginBasePath = '/storage/emulated/0/Android/data/com.cymusic/files/plugins';

            // 确保插件目录存在
            if (!(await exists(pluginBasePath))) {
                await mkdir(pluginBasePath, { NSURLIsExcludedFromBackupKey: true });
            }

            const allPlugins: Plugin[] = [];
            const pluginsFileItems = await readdir(pluginBasePath);

            for (let i = 0; i < pluginsFileItems.length; ++i) {
                const pluginFileItem = pluginsFileItems[i];
                trace('初始化插件', pluginFileItem);

                const pluginPath = `${pluginBasePath}/${pluginFileItem}`;
                if (pluginFileItem.endsWith('.js')) {
                    const funcCode = await readFile(pluginPath, 'utf8');
                    const plugin = new Plugin(funcCode, pluginPath);

                    const _pluginIndex = allPlugins.findIndex(
                        p => p.hash === plugin.hash,
                    );
                    if (_pluginIndex !== -1) {
                        // 重复插件，直接忽略
                        continue;
                    }
                    if (plugin.state === PluginState.Mounted) {
                        allPlugins.push(plugin);
                    }
                }
            }

            this.setPlugins(allPlugins);
        } catch (e: any) {
            ToastAndroid.show(
                `插件初始化失败:${e?.message ?? e}`,
                ToastAndroid.LONG,
            );
            errorLog('插件初始化失败', e?.message);
            throw e;
        }
    }

    async installPluginFromLocalFile(
        pluginPath: string,
        config?: IInstallPluginConfig & { useExpoFs?: boolean }
    ): Promise<IInstallPluginResult> {
        let funcCode: string;
        if (config?.useExpoFs) {
            funcCode = await readAsStringAsync(pluginPath);
        } else {
            funcCode = await readFile(pluginPath, 'utf8');
        }

        if (funcCode) {
            const plugin = new Plugin(funcCode, pluginPath);
            let allPlugins = [...this.getPlugins()];

            const _pluginIndex = allPlugins.findIndex(p => p.hash === plugin.hash);
            if (_pluginIndex !== -1) {
                return {
                    success: true,
                    message: '插件已安装',
                    pluginName: plugin.name,
                    pluginHash: plugin.hash,
                };
            }

            const oldVersionPlugin = allPlugins.find(p => p.name === plugin.name);
            if (oldVersionPlugin && !config?.notCheckVersion) {
                if (
                    compare(
                        oldVersionPlugin.instance.version ?? '',
                        plugin.instance.version ?? '',
                        '>',
                    )
                ) {
                    return {
                        success: false,
                        message: '已安装更新版本的插件',
                        pluginName: plugin.name,
                        pluginHash: plugin.hash,
                    };
                }
            }

            if (oldVersionPlugin) {
                allPlugins = allPlugins.filter(p => p.name !== plugin.name);
            }

            if (plugin.state === PluginState.Mounted) {
                allPlugins.push(plugin);
                this.setPlugins(allPlugins);
                return {
                    success: true,
                    message: '插件安装成功',
                    pluginName: plugin.name,
                    pluginHash: plugin.hash,
                };
            } else {
                return {
                    success: false,
                    message: '插件安装失败',
                    pluginName: plugin.name,
                    pluginHash: plugin.hash,
                };
            }
        }

        throw new Error('无法读取插件文件');
    }

    async installPluginFromUrl(
        url: string,
        config?: IInstallPluginConfig
    ): Promise<IInstallPluginResult> {
        try {
            const funcCode = (
                await axios.get(url, {
                    headers: {
                        'Cache-Control': 'no-cache',
                        Pragma: 'no-cache',
                        Expires: '0',
                    },
                })
            ).data;

            if (funcCode) {
                const plugin = new Plugin(funcCode, '');
                let allPlugins = [...this.getPlugins()];
                const pluginIndex = allPlugins.findIndex(p => p.hash === plugin.hash);

                if (pluginIndex !== -1) {
                    return {
                        success: true,
                        message: '插件已安装',
                        pluginName: plugin.name,
                        pluginHash: plugin.hash,
                        pluginUrl: url,
                    };
                }

                const oldVersionPlugin = allPlugins.find(p => p.name === plugin.name);
                if (oldVersionPlugin && !config?.notCheckVersion) {
                    if (
                        compare(
                            oldVersionPlugin.instance.version ?? '',
                            plugin.instance.version ?? '',
                            '>',
                        )
                    ) {
                        return {
                            success: false,
                            message: '已安装更新版本的插件',
                            pluginName: plugin.name,
                            pluginHash: plugin.hash,
                            pluginUrl: url,
                        };
                    }
                }

                if (oldVersionPlugin) {
                    allPlugins = allPlugins.filter(p => p.name !== plugin.name);
                }

                if (plugin.state === PluginState.Mounted) {
                    allPlugins.push(plugin);
                    this.setPlugins(allPlugins);
                    return {
                        success: true,
                        message: '插件安装成功',
                        pluginName: plugin.name,
                        pluginHash: plugin.hash,
                        pluginUrl: url,
                    };
                } else {
                    return {
                        success: false,
                        message: '插件安装失败',
                        pluginName: plugin.name,
                        pluginHash: plugin.hash,
                        pluginUrl: url,
                    };
                }
            }
        } catch (e: any) {
            throw new Error(`插件安装失败: ${e?.message ?? e}`);
        }

        throw new Error('无法下载插件');
    }

    async uninstallPlugin(hash: string): Promise<void> {
        const allPlugins = this.getPlugins().filter(p => p.hash !== hash);
        this.setPlugins(allPlugins);
    }

    async uninstallAllPlugins(): Promise<void> {
        this.setPlugins([]);
    }

    async updatePlugin(plugin: Plugin): Promise<void> {
        const updateUrl = plugin.instance.srcUrl;
        if (!updateUrl) {
            throw new Error('没有更新源');
        }
        try {
            await this.installPluginFromUrl(updateUrl);
        } catch (e: any) {
            if (e.message === '插件已安装') {
                throw new Error('当前已是最新版本');
            } else {
                throw e;
            }
        }
    }

    getByMedia(mediaItem: ICommon.IMediaBase): Plugin | undefined {
        return this.getByName(mediaItem?.platform);
    }

    getByName(name: string): Plugin | undefined {
        return name === localPluginPlatform
            ? localFilePlugin
            : this.getPlugins().find(_ => _.name === name);
    }

    getByHash(hash: string): Plugin | undefined {
        return hash === localPluginHash
            ? localFilePlugin
            : this.getPlugins().find(_ => _.hash === hash);
    }

    getPlugins(): Plugin[] {
        return this.plugins;
    }

    getValidPlugins(): Plugin[] {
        return this.plugins.filter(p => p.state === PluginState.Mounted);
    }

    getPluginsWithAbility(ability: keyof IPlugin.IPluginInstanceMethods): Plugin[] {
        return this.getValidPlugins().filter(
            plugin =>
                this.isPluginEnabled(plugin) &&
                typeof plugin.instance[ability] === 'function'
        );
    }

    getSortedPluginsWithAbility(ability: keyof IPlugin.IPluginInstanceMethods): Plugin[] {
        const order = pluginMeta.getPluginOrderSync();
        return [...this.getPluginsWithAbility(ability)].sort((a, b) =>
            (order[a.name] ?? Infinity) - (order[b.name] ?? Infinity) < 0
                ? -1
                : 1,
        );
    }

    setPluginEnabled(plugin: Plugin, enabled: boolean): void {
        this.ee.emit('enabled-updated', plugin.name, enabled);
        pluginMeta.setPluginEnabledSync(plugin.name, enabled);
    }

    isPluginEnabled(plugin: Plugin): boolean {
        return pluginMeta.isPluginEnabledSync(plugin.name);
    }

    setPlugins(plugins: Plugin[]): void {
        this.plugins = plugins;
        this.ee.emit('plugins-updated', plugins);
    }
}

export const PluginManager = new PluginManagerImpl();
export default PluginManager;
