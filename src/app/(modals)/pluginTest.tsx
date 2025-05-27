import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/tokens';
import pluginManager from '@/core/pluginManager';
import { getPluginSystemStatus } from '@/core/bootstrap';

export default function PluginTestScreen() {
    const [pluginStatus, setPluginStatus] = useState<any>(null);
    const [testResults, setTestResults] = useState<any[]>([]);

    useEffect(() => {
        loadPluginStatus();
    }, []);

    const loadPluginStatus = () => {
        const status = getPluginSystemStatus();
        setPluginStatus(status);
    };

    const testPluginSearch = async () => {
        try {
            const plugins = pluginManager.getEnabledPlugins();
            const results = [];

            for (const plugin of plugins) {
                if (plugin.methods.search) {
                    try {
                        const searchResult = await plugin.methods.search('测试', 1, 'music');
                        results.push({
                            plugin: plugin.name,
                            type: 'search',
                            success: true,
                            data: searchResult,
                        });
                    } catch (error) {
                        results.push({
                            plugin: plugin.name,
                            type: 'search',
                            success: false,
                            error: error.message,
                        });
                    }
                }
            }

            setTestResults(results);
        } catch (error) {
            console.error('测试插件搜索失败:', error);
        }
    };

    const testPluginTopLists = async () => {
        try {
            const plugins = pluginManager.getEnabledPlugins();
            const results = [];

            for (const plugin of plugins) {
                if (plugin.methods.getTopLists) {
                    try {
                        const topLists = await plugin.methods.getTopLists();
                        results.push({
                            plugin: plugin.name,
                            type: 'topLists',
                            success: true,
                            data: topLists,
                        });
                    } catch (error) {
                        results.push({
                            plugin: plugin.name,
                            type: 'topLists',
                            success: false,
                            error: error.message,
                        });
                    }
                }
            }

            setTestResults(results);
        } catch (error) {
            console.error('测试插件榜单失败:', error);
        }
    };

    const testPluginRecommendSheets = async () => {
        try {
            const plugins = pluginManager.getEnabledPlugins();
            const results = [];

            for (const plugin of plugins) {
                if (plugin.methods.getRecommendSheetTags) {
                    try {
                        const sheetTags = await plugin.methods.getRecommendSheetTags();
                        results.push({
                            plugin: plugin.name,
                            type: 'recommendSheets',
                            success: true,
                            data: sheetTags,
                        });
                    } catch (error) {
                        results.push({
                            plugin: plugin.name,
                            type: 'recommendSheets',
                            success: false,
                            error: error.message,
                        });
                    }
                }
            }

            setTestResults(results);
        } catch (error) {
            console.error('测试插件推荐歌单失败:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <Text style={styles.title}>插件系统测试</Text>

                {/* 插件状态 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>插件状态</Text>
                    {pluginStatus ? (
                        <View>
                            <Text style={styles.text}>
                                总插件数: {pluginStatus.totalPlugins}
                            </Text>
                            <Text style={styles.text}>
                                已启用插件数: {pluginStatus.enabledPlugins}
                            </Text>
                            {pluginStatus.plugins.map((plugin: any, index: number) => (
                                <View key={index} style={styles.pluginItem}>
                                    <Text style={styles.pluginName}>{plugin.name}</Text>
                                    <Text style={styles.pluginState}>
                                        状态: {plugin.state} | 
                                        启用: {plugin.enabled ? '是' : '否'}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.text}>加载中...</Text>
                    )}
                </View>

                {/* 测试按钮 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>功能测试</Text>
                    <TouchableOpacity style={styles.button} onPress={testPluginSearch}>
                        <Text style={styles.buttonText}>测试搜索功能</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={testPluginTopLists}>
                        <Text style={styles.buttonText}>测试榜单功能</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={testPluginRecommendSheets}>
                        <Text style={styles.buttonText}>测试推荐歌单功能</Text>
                    </TouchableOpacity>
                </View>

                {/* 测试结果 */}
                {testResults.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>测试结果</Text>
                        {testResults.map((result, index) => (
                            <View key={index} style={styles.resultItem}>
                                <Text style={styles.resultPlugin}>
                                    插件: {result.plugin}
                                </Text>
                                <Text style={styles.resultType}>
                                    类型: {result.type}
                                </Text>
                                <Text style={[
                                    styles.resultStatus,
                                    { color: result.success ? 'green' : 'red' }
                                ]}>
                                    状态: {result.success ? '成功' : '失败'}
                                </Text>
                                {result.success ? (
                                    <Text style={styles.resultData}>
                                        数据: {JSON.stringify(result.data, null, 2)}
                                    </Text>
                                ) : (
                                    <Text style={styles.resultError}>
                                        错误: {result.error}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
        padding: 16,
        backgroundColor: colors.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 12,
    },
    text: {
        fontSize: 14,
        color: colors.text,
        marginBottom: 8,
    },
    pluginItem: {
        marginBottom: 12,
        padding: 8,
        backgroundColor: colors.background,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    pluginName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
    pluginState: {
        fontSize: 12,
        color: colors.textMuted,
    },
    button: {
        backgroundColor: colors.primary,
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    resultItem: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: colors.background,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    resultPlugin: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text,
    },
    resultType: {
        fontSize: 12,
        color: colors.textMuted,
    },
    resultStatus: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    resultData: {
        fontSize: 10,
        color: colors.textMuted,
        marginTop: 4,
        fontFamily: 'monospace',
    },
    resultError: {
        fontSize: 12,
        color: 'red',
        marginTop: 4,
    },
});
