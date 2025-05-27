import Icon from '@/components/base/Icon';
import IconButton from '@/components/base/IconButton';
import ThemeText from '@/components/base/ThemeText';
import { rpx } from '@/constants/uiConst';
import { ROUTE_PATH, useParams } from '@/core/router';
import { useNavigate } from '@/core/router/useNavigate';
import { useColors } from '@/hooks/useColors';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SettingItem {
    title: string;
    icon: string;
    onPress: () => void;
    description?: string;
}

export default function SettingPage() {
    const colors = useColors();
    const { goBack, navigate } = useNavigate();
    const params = useParams<'setting'>();
    const settingType = params?.type || 'basic';

    const getSettingItems = (): SettingItem[] => {
        switch (settingType) {
            case 'plugin':
                return [
                    {
                        title: '插件管理',
                        icon: 'cog',
                        description: '管理已安装的插件',
                        onPress: () => navigate(ROUTE_PATH.PLUGIN_MANAGE),
                    },
                    {
                        title: '安装插件',
                        icon: 'plus',
                        description: '从本地或网络安装新插件',
                        onPress: () => console.log('安装插件'),
                    },
                ];
            case 'theme':
                return [
                    {
                        title: '主题设置',
                        icon: 'cog',
                        description: '切换浅色/深色主题',
                        onPress: () => console.log('主题设置'),
                    },
                    {
                        title: '自定义主题',
                        icon: 'cog',
                        description: '创建自定义主题',
                        onPress: () => navigate(ROUTE_PATH.SET_CUSTOM_THEME),
                    },
                ];
            case 'backup':
                return [
                    {
                        title: '备份数据',
                        icon: 'download',
                        description: '备份歌单和设置',
                        onPress: () => console.log('备份数据'),
                    },
                    {
                        title: '恢复数据',
                        icon: 'download',
                        description: '从备份文件恢复',
                        onPress: () => console.log('恢复数据'),
                    },
                ];
            default:
                return [
                    {
                        title: '插件管理',
                        icon: 'cog',
                        description: '管理音源插件',
                        onPress: () => navigate(ROUTE_PATH.PLUGIN_MANAGE),
                    },
                    {
                        title: '主题设置',
                        icon: 'cog',
                        description: '个性化界面主题',
                        onPress: () => navigate(ROUTE_PATH.SETTING, { type: 'theme' }),
                    },
                    {
                        title: '备份与恢复',
                        icon: 'download',
                        description: '数据备份和恢复',
                        onPress: () => navigate(ROUTE_PATH.SETTING, { type: 'backup' }),
                    },
                    {
                        title: 'UI组件测试',
                        icon: 'cog',
                        description: '测试UI组件',
                        onPress: () => navigate(ROUTE_PATH.UI_TEST),
                    },
                ];
        }
    };

    const getTitle = () => {
        switch (settingType) {
            case 'plugin':
                return '插件管理';
            case 'theme':
                return '主题设置';
            case 'backup':
                return '备份与恢复';
            default:
                return '设置';
        }
    };

    const settingItems = getSettingItems();

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
                    {getTitle()}
                </ThemeText>
            </View>

            {/* 设置内容 */}
            <ScrollView style={styles.content}>
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    {settingItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.settingItem,
                                index < settingItems.length - 1 && { borderBottomColor: colors.divider, borderBottomWidth: 1 }
                            ]}
                            onPress={item.onPress}
                        >
                            <Icon name={item.icon as any} size={rpx(40)} color={colors.primary} />
                            <View style={styles.settingInfo}>
                                <ThemeText fontSize="content" fontWeight="medium">
                                    {item.title}
                                </ThemeText>
                                {item.description && (
                                    <ThemeText fontSize="subTitle" fontColor="textSecondary">
                                        {item.description}
                                    </ThemeText>
                                )}
                            </View>
                            <Icon name="chevron-right" size={rpx(32)} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </View>
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
    content: {
        flex: 1,
        padding: rpx(16),
    },
    section: {
        borderRadius: rpx(12),
        overflow: 'hidden',
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: rpx(16),
    },
    settingInfo: {
        flex: 1,
        marginLeft: rpx(16),
        marginRight: rpx(8),
    },
});
