import { PluginManager } from '@/core/pluginManager';
import { testPluginSystem } from '@/core/pluginManager/test';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PluginTestScreen() {
    const [plugins, setPlugins] = useState<any[]>([]);
    const [testResults, setTestResults] = useState<string[]>([]);

    useEffect(() => {
        loadPlugins();
    }, []);

    const loadPlugins = () => {
        const allPlugins = PluginManager.getPlugins();
        setPlugins(allPlugins);
    };

    const runPluginTest = async () => {
        setTestResults(['开始测试插件系统...']);

        try {
            const success = await testPluginSystem();
            if (success) {
                setTestResults(prev => [...prev, '✅ 插件系统测试通过！']);
            } else {
                setTestResults(prev => [...prev, '❌ 插件系统测试失败！']);
            }
        } catch (error) {
            setTestResults(prev => [...prev, `❌ 测试出错: ${error.message}`]);
        }
    };

    const installTestPlugin = async () => {
        const testPluginCode = `
module.exports = {
    platform: "测试音源",
    version: "1.0.0",
    author: "Cymusic",
    async search(query, page, type) {
        return {
            isEnd: false,
            data: [
                {
                    id: "test_" + Date.now(),
                    title: "测试歌曲 - " + query,
                    artist: "测试歌手",
                    platform: "测试音源",
                    duration: 180,
                    album: "测试专辑",
                    artwork: ""
                }
            ]
        };
    },
    async getMediaSource(musicItem, quality) {
        return {
            url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
        };
    }
};
        `;

        try {
            // 直接使用插件代码创建插件，而不是从文件安装
            const { Plugin } = await import('@/core/pluginManager/plugin');
            const plugin = new Plugin(testPluginCode, 'test-plugin.js');

            if (plugin.state === 'mounted') {
                // 手动添加到插件管理器
                const currentPlugins = PluginManager.getPlugins();
                const existingIndex = currentPlugins.findIndex(p => p.name === plugin.name);

                if (existingIndex !== -1) {
                    currentPlugins[existingIndex] = plugin;
                } else {
                    currentPlugins.push(plugin);
                }

                PluginManager.setPlugins(currentPlugins);

                Alert.alert('成功', `插件 "${plugin.name}" 安装成功！`);
                loadPlugins();
            } else {
                Alert.alert('失败', '插件创建失败');
            }

        } catch (error) {
            Alert.alert('错误', `安装失败: ${error.message}`);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← 返回</Text>
                </TouchableOpacity>
                <Text style={styles.title}>插件系统测试</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>已安装插件 ({plugins.length})</Text>
                    {plugins.length === 0 ? (
                        <Text style={styles.emptyText}>暂无插件</Text>
                    ) : (
                        plugins.map((plugin, index) => (
                            <View key={index} style={styles.pluginItem}>
                                <Text style={styles.pluginName}>{plugin.name}</Text>
                                <Text style={styles.pluginInfo}>
                                    版本: {plugin.instance.version || '未知'} |
                                    状态: {plugin.state} |
                                    作者: {plugin.instance.author || '未知'}
                                </Text>
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>测试操作</Text>
                    <TouchableOpacity style={styles.button} onPress={runPluginTest}>
                        <Text style={styles.buttonText}>运行插件系统测试</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={installTestPlugin}>
                        <Text style={styles.buttonText}>安装测试插件</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={loadPlugins}>
                        <Text style={styles.buttonText}>刷新插件列表</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>测试结果</Text>
                    {testResults.length === 0 ? (
                        <Text style={styles.emptyText}>暂无测试结果</Text>
                    ) : (
                        testResults.map((result, index) => (
                            <Text key={index} style={styles.testResult}>{result}</Text>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        marginRight: 16,
    },
    backButtonText: {
        fontSize: 16,
        color: '#007AFF',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    emptyText: {
        color: '#999',
        fontStyle: 'italic',
    },
    pluginItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingVertical: 8,
    },
    pluginName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    pluginInfo: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    testResult: {
        fontSize: 12,
        color: '#333',
        marginBottom: 4,
        fontFamily: 'monospace',
    },
});
