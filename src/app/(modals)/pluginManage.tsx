import { Button } from '@/components/base/Button';
import Icon from '@/components/base/Icon';
import IconButton from '@/components/base/IconButton';
import ThemeText from '@/components/base/ThemeText';
import PluginItem from '@/components/plugin/PluginItem';
import { rpx } from '@/constants/uiConst';
import { PluginManager } from '@/core/pluginManager';
import { Plugin } from '@/core/pluginManager/plugin';
import { useColors } from '@/hooks/useColors';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PluginManageScreen() {
    const colors = useColors();
    const goBack = () => router.back();
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [loading, setLoading] = useState(false);
    const [showInstallDialog, setShowInstallDialog] = useState(false);
    const [installUrl, setInstallUrl] = useState('');

    useEffect(() => {
        loadPlugins();
    }, []);

    const loadPlugins = () => {
        const allPlugins = PluginManager.getPlugins();
        setPlugins(allPlugins);
    };

    const handleInstallFromLocal = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/javascript', 'text/javascript', '*/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets[0]) {
                setLoading(true);
                const file = result.assets[0];
                
                try {
                    const installResult = await PluginManager.installPluginFromLocalFile(
                        file.uri,
                        { useExpoFs: true }
                    );
                    
                    if (installResult.success) {
                        Alert.alert('成功', `插件 "${installResult.pluginName}" 安装成功！`);
                        loadPlugins();
                    } else {
                        Alert.alert('失败', installResult.message);
                    }
                } catch (error: any) {
                    Alert.alert('错误', `安装失败: ${error.message}`);
                }
                
                setLoading(false);
            }
        } catch (error: any) {
            Alert.alert('错误', `选择文件失败: ${error.message}`);
            setLoading(false);
        }
    };

    const handleInstallFromUrl = async () => {
        if (!installUrl.trim()) {
            Alert.alert('错误', '请输入插件URL');
            return;
        }

        setLoading(true);
        try {
            const result = await PluginManager.installPluginFromUrl(installUrl.trim());
            
            if (result.success) {
                Alert.alert('成功', `插件 "${result.pluginName}" 安装成功！`);
                setInstallUrl('');
                setShowInstallDialog(false);
                loadPlugins();
            } else {
                Alert.alert('失败', result.message);
            }
        } catch (error: any) {
            Alert.alert('错误', `安装失败: ${error.message}`);
        }
        
        setLoading(false);
    };

    const handleUninstallAll = () => {
        Alert.alert(
            '卸载全部插件',
            '确认卸载全部插件吗？此操作不可恢复！',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '卸载',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await PluginManager.uninstallAllPlugins();
                            Alert.alert('成功', '所有插件已卸载');
                            loadPlugins();
                        } catch (error: any) {
                            Alert.alert('错误', `卸载失败: ${error.message}`);
                        }
                        setLoading(false);
                    },
                },
            ]
        );
    };

    const handleInstallTestPlugin = async () => {
        const testPluginCode = `
module.exports = {
    platform: "测试音源",
    version: "1.0.0",
    author: "Cymusic Team",
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

        setLoading(true);
        try {
            const { Plugin } = await import('@/core/pluginManager/plugin');
            const plugin = new Plugin(testPluginCode, 'test-plugin.js');
            
            if (plugin.state === 'mounted') {
                const currentPlugins = PluginManager.getPlugins();
                const existingIndex = currentPlugins.findIndex(p => p.name === plugin.name);
                
                if (existingIndex !== -1) {
                    currentPlugins[existingIndex] = plugin;
                } else {
                    currentPlugins.push(plugin);
                }
                
                PluginManager.setPlugins(currentPlugins);
                Alert.alert('成功', `测试插件 "${plugin.name}" 安装成功！`);
                loadPlugins();
            } else {
                Alert.alert('失败', '测试插件创建失败');
            }
        } catch (error: any) {
            Alert.alert('错误', `安装失败: ${error.message}`);
        }
        
        setLoading(false);
    };

    const enabledCount = plugins.filter(p => PluginManager.isPluginEnabled(p)).length;
    const mountedCount = plugins.filter(p => p.state === 'mounted').length;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBackground }]}>
            {/* 导航栏 */}
            <View style={[styles.navbar, { backgroundColor: colors.appBar }]}>
                <IconButton
                    name="chevron-left"
                    onPress={goBack}
                    color={colors.appBarText}
                    accessibilityLabel="返回"
                />
                <ThemeText 
                    fontSize="appbar" 
                    fontWeight="medium"
                    color={colors.appBarText}
                    style={styles.title}
                >
                    插件管理
                </ThemeText>
                <TouchableOpacity onPress={handleUninstallAll} disabled={loading || plugins.length === 0}>
                    <Icon name="x-mark" size={rpx(40)} color={colors.appBarText} />
                </TouchableOpacity>
            </View>

            {/* 统计信息 */}
            <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
                <View style={styles.statItem}>
                    <ThemeText fontSize="title" fontWeight="bold" color={colors.primary}>
                        {plugins.length}
                    </ThemeText>
                    <ThemeText fontSize="subTitle" fontColor="textSecondary">
                        总插件数
                    </ThemeText>
                </View>
                <View style={styles.statItem}>
                    <ThemeText fontSize="title" fontWeight="bold" color={colors.success}>
                        {enabledCount}
                    </ThemeText>
                    <ThemeText fontSize="subTitle" fontColor="textSecondary">
                        已启用
                    </ThemeText>
                </View>
                <View style={styles.statItem}>
                    <ThemeText fontSize="title" fontWeight="bold" color={colors.info}>
                        {mountedCount}
                    </ThemeText>
                    <ThemeText fontSize="subTitle" fontColor="textSecondary">
                        正常运行
                    </ThemeText>
                </View>
            </View>

            {/* 操作按钮 */}
            <View style={[styles.actionContainer, { backgroundColor: colors.card }]}>
                <Button
                    type="primary"
                    text="从本地安装"
                    onPress={handleInstallFromLocal}
                    style={styles.actionButton}
                />
                <Button
                    type="normal"
                    text="从网络安装"
                    onPress={() => setShowInstallDialog(true)}
                    style={styles.actionButton}
                />
                <Button
                    type="normal"
                    text="安装测试插件"
                    onPress={handleInstallTestPlugin}
                    style={styles.actionButton}
                />
            </View>

            {/* 网络安装对话框 */}
            {showInstallDialog && (
                <View style={styles.dialogOverlay}>
                    <View style={[styles.dialog, { backgroundColor: colors.card }]}>
                        <ThemeText fontSize="title" fontWeight="bold" style={styles.dialogTitle}>
                            从网络安装插件
                        </ThemeText>
                        <TextInput
                            style={[styles.urlInput, { 
                                backgroundColor: colors.placeholder,
                                color: colors.text 
                            }]}
                            placeholder="请输入插件URL"
                            placeholderTextColor={colors.textSecondary}
                            value={installUrl}
                            onChangeText={setInstallUrl}
                            multiline
                        />
                        <View style={styles.dialogActions}>
                            <Button
                                type="normal"
                                text="取消"
                                onPress={() => {
                                    setShowInstallDialog(false);
                                    setInstallUrl('');
                                }}
                                style={styles.dialogButton}
                            />
                            <Button
                                type="primary"
                                text="安装"
                                onPress={handleInstallFromUrl}
                                style={styles.dialogButton}
                            />
                        </View>
                    </View>
                </View>
            )}

            {/* 插件列表 */}
            <ScrollView style={styles.content}>
                {loading && (
                    <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
                        <ThemeText fontSize="content" fontColor="textSecondary">
                            正在处理...
                        </ThemeText>
                    </View>
                )}
                
                {plugins.length === 0 ? (
                    <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
                        <Icon name="musical-note" size={rpx(80)} color={colors.textSecondary} />
                        <ThemeText fontSize="title" fontColor="textSecondary" style={styles.emptyTitle}>
                            暂无插件
                        </ThemeText>
                        <ThemeText fontSize="content" fontColor="textSecondary" style={styles.emptyDescription}>
                            点击上方按钮安装插件来扩展音乐源
                        </ThemeText>
                    </View>
                ) : (
                    plugins.map((plugin) => (
                        <PluginItem
                            key={plugin.hash}
                            plugin={plugin}
                            onUpdate={loadPlugins}
                        />
                    ))
                )}
                
                <View style={styles.bottomSpace} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: rpx(16),
        paddingVertical: rpx(12),
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    title: {
        flex: 1,
        marginLeft: rpx(16),
    },
    statsContainer: {
        flexDirection: 'row',
        marginHorizontal: rpx(16),
        marginTop: rpx(16),
        borderRadius: rpx(12),
        padding: rpx(16),
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    actionContainer: {
        flexDirection: 'row',
        marginHorizontal: rpx(16),
        marginTop: rpx(16),
        borderRadius: rpx(12),
        padding: rpx(16),
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    actionButton: {
        flex: 1,
        marginHorizontal: rpx(4),
    },
    content: {
        flex: 1,
        marginTop: rpx(16),
    },
    loadingContainer: {
        margin: rpx(16),
        padding: rpx(32),
        borderRadius: rpx(12),
        alignItems: 'center',
    },
    emptyContainer: {
        margin: rpx(16),
        padding: rpx(32),
        borderRadius: rpx(12),
        alignItems: 'center',
    },
    emptyTitle: {
        marginTop: rpx(16),
        marginBottom: rpx(8),
    },
    emptyDescription: {
        textAlign: 'center',
        lineHeight: rpx(40),
    },
    bottomSpace: {
        height: rpx(80),
    },
    dialogOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    dialog: {
        margin: rpx(32),
        borderRadius: rpx(12),
        padding: rpx(24),
        minWidth: rpx(600),
    },
    dialogTitle: {
        marginBottom: rpx(16),
        textAlign: 'center',
    },
    urlInput: {
        borderRadius: rpx(8),
        padding: rpx(12),
        marginBottom: rpx(16),
        fontSize: rpx(28),
        minHeight: rpx(80),
        textAlignVertical: 'top',
    },
    dialogActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dialogButton: {
        flex: 1,
        marginHorizontal: rpx(8),
    },
});
