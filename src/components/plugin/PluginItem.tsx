import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { rpx } from '@/constants/uiConst';
import ThemeText from '@/components/base/ThemeText';
import Icon from '@/components/base/Icon';
import { PluginManager } from '@/core/pluginManager';
import { Plugin } from '@/core/pluginManager/plugin';

interface PluginItemProps {
    plugin: Plugin;
    onUpdate?: () => void;
}

export default function PluginItem({ plugin, onUpdate }: PluginItemProps) {
    const colors = useColors();
    const [enabled, setEnabled] = useState(() => PluginManager.isPluginEnabled(plugin));
    const [expanded, setExpanded] = useState(false);

    const handleToggleEnabled = (value: boolean) => {
        setEnabled(value);
        PluginManager.setPluginEnabled(plugin, value);
        onUpdate?.();
    };

    const handleUpdate = async () => {
        try {
            await PluginManager.updatePlugin(plugin);
            Alert.alert('成功', '插件已更新到最新版本');
            onUpdate?.();
        } catch (error: any) {
            Alert.alert('更新失败', error?.message || '更新插件时发生错误');
        }
    };

    const handleUninstall = () => {
        Alert.alert(
            '卸载插件',
            `确认卸载插件「${plugin.name}」吗？`,
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '卸载',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await PluginManager.uninstallPlugin(plugin.hash);
                            Alert.alert('成功', '插件卸载成功');
                            onUpdate?.();
                        } catch (error) {
                            Alert.alert('失败', '卸载插件时发生错误');
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = () => {
        switch (plugin.state) {
            case 'mounted':
                return enabled ? colors.success : colors.textSecondary;
            case 'error':
                return colors.danger;
            default:
                return colors.textSecondary;
        }
    };

    const getStatusText = () => {
        switch (plugin.state) {
            case 'mounted':
                return enabled ? '已启用' : '已禁用';
            case 'error':
                return '错误';
            case 'loading':
                return '加载中';
            default:
                return '未知';
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            {/* 插件头部信息 */}
            <TouchableOpacity
                style={styles.header}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
            >
                <View style={styles.headerLeft}>
                    <View style={styles.titleRow}>
                        <ThemeText fontSize="title" fontWeight="bold" numberOfLines={1}>
                            {plugin.name}
                        </ThemeText>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                            <ThemeText fontSize="tiny" color="white">
                                {getStatusText()}
                            </ThemeText>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <ThemeText fontSize="subTitle" fontColor="textSecondary">
                            版本: {plugin.instance.version || '未知'}
                        </ThemeText>
                        {plugin.instance.author && (
                            <ThemeText fontSize="subTitle" fontColor="textSecondary">
                                • 作者: {plugin.instance.author}
                            </ThemeText>
                        )}
                    </View>
                </View>
                <View style={styles.headerRight}>
                    <Switch
                        value={enabled}
                        onValueChange={handleToggleEnabled}
                        trackColor={{ false: colors.placeholder, true: colors.primary }}
                        thumbColor={enabled ? colors.appBarText : colors.textSecondary}
                        disabled={plugin.state !== 'mounted'}
                    />
                    <Icon
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={rpx(32)}
                        color={colors.textSecondary}
                    />
                </View>
            </TouchableOpacity>

            {/* 展开的操作区域 */}
            {expanded && (
                <View style={[styles.expandedContent, { borderTopColor: colors.divider }]}>
                    <View style={styles.actionRow}>
                        {plugin.instance.srcUrl && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                                onPress={handleUpdate}
                            >
                                <Icon name="download" size={rpx(32)} color={colors.appBarText} />
                                <ThemeText fontSize="subTitle" color={colors.appBarText}>
                                    更新
                                </ThemeText>
                            </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.danger }]}
                            onPress={handleUninstall}
                        >
                            <Icon name="x-mark" size={rpx(32)} color={colors.appBarText} />
                            <ThemeText fontSize="subTitle" color={colors.appBarText}>
                                卸载
                            </ThemeText>
                        </TouchableOpacity>
                    </View>

                    {/* 插件详细信息 */}
                    <View style={styles.detailsSection}>
                        <ThemeText fontSize="subTitle" fontWeight="bold" style={styles.detailsTitle}>
                            插件信息
                        </ThemeText>
                        <View style={styles.detailRow}>
                            <ThemeText fontSize="subTitle" fontColor="textSecondary">
                                哈希值: {plugin.hash.substring(0, 16)}...
                            </ThemeText>
                        </View>
                        <View style={styles.detailRow}>
                            <ThemeText fontSize="subTitle" fontColor="textSecondary">
                                状态: {plugin.state}
                            </ThemeText>
                        </View>
                        {plugin.instance.srcUrl && (
                            <View style={styles.detailRow}>
                                <ThemeText fontSize="subTitle" fontColor="textSecondary" numberOfLines={2}>
                                    源地址: {plugin.instance.srcUrl}
                                </ThemeText>
                            </View>
                        )}
                        {plugin.errorReason && (
                            <View style={styles.detailRow}>
                                <ThemeText fontSize="subTitle" color={colors.danger}>
                                    错误原因: {plugin.errorReason}
                                </ThemeText>
                            </View>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: rpx(16),
        marginVertical: rpx(8),
        borderRadius: rpx(12),
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: rpx(16),
    },
    headerLeft: {
        flex: 1,
        marginRight: rpx(12),
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: rpx(4),
    },
    statusBadge: {
        marginLeft: rpx(8),
        paddingHorizontal: rpx(8),
        paddingVertical: rpx(2),
        borderRadius: rpx(10),
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    expandedContent: {
        borderTopWidth: 1,
        padding: rpx(16),
        paddingTop: rpx(12),
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: rpx(16),
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: rpx(12),
        paddingVertical: rpx(8),
        borderRadius: rpx(8),
        marginLeft: rpx(8),
    },
    detailsSection: {
        marginTop: rpx(8),
    },
    detailsTitle: {
        marginBottom: rpx(8),
    },
    detailRow: {
        marginBottom: rpx(4),
    },
});
