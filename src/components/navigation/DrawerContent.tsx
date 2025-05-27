import Icon from '@/components/base/Icon';
import ThemeText from '@/components/base/ThemeText';
import { rpx } from '@/constants/uiConst';
import { ROUTE_PATH } from '@/core/router';
import { useNavigate } from '@/core/router/useNavigate';
import { useColors } from '@/hooks/useColors';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import React from 'react';
import { BackHandler, StyleSheet, TouchableOpacity, View } from 'react-native';

interface DrawerItem {
    title: string;
    icon: string;
    onPress: () => void;
}

export default function DrawerContent(props: any) {
    const colors = useColors();
    const { navigate, closeDrawer } = useNavigate();

    const handleNavigate = (routeName: any, params?: any) => {
        closeDrawer();
        navigate(routeName, params);
    };

    const basicSettings: DrawerItem[] = [
        {
            title: '基本设置',
            icon: 'cog',
            onPress: () => handleNavigate(ROUTE_PATH.SETTING, { type: 'basic' }),
        },
        {
            title: '插件管理',
            icon: 'cog',
            onPress: () => handleNavigate(ROUTE_PATH.PLUGIN_MANAGE),
        },
        {
            title: '主题设置',
            icon: 'cog',
            onPress: () => handleNavigate(ROUTE_PATH.SETTING, { type: 'theme' }),
        },
    ];

    const musicFeatures: DrawerItem[] = [
        {
            title: '本地音乐',
            icon: 'musical-note',
            onPress: () => handleNavigate(ROUTE_PATH.LOCAL),
        },
        {
            title: '正在下载',
            icon: 'download',
            onPress: () => handleNavigate(ROUTE_PATH.DOWNLOADING),
        },
        {
            title: '历史记录',
            icon: 'cog',
            onPress: () => handleNavigate(ROUTE_PATH.HISTORY),
        },
    ];

    const otherSettings: DrawerItem[] = [
        {
            title: '备份与恢复',
            icon: 'download',
            onPress: () => handleNavigate(ROUTE_PATH.SETTING, { type: 'backup' }),
        },
        {
            title: '权限管理',
            icon: 'cog',
            onPress: () => handleNavigate(ROUTE_PATH.PERMISSIONS),
        },
    ];

    const testFeatures: DrawerItem[] = [
        {
            title: '插件系统测试',
            icon: 'cog',
            onPress: () => handleNavigate(ROUTE_PATH.PLUGIN_TEST),
        },
        {
            title: 'UI组件测试',
            icon: 'cog',
            onPress: () => handleNavigate(ROUTE_PATH.UI_TEST),
        },
    ];

    const renderSection = (title: string, items: DrawerItem[]) => (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.sectionHeader}>
                <ThemeText fontSize="subTitle" fontWeight="bold" fontColor="textSecondary">
                    {title}
                </ThemeText>
            </View>
            {items.map((item, index) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.drawerItem,
                        index < items.length - 1 && { borderBottomColor: colors.divider, borderBottomWidth: 1 }
                    ]}
                    onPress={item.onPress}
                >
                    <Icon name={item.icon as any} size={rpx(40)} color={colors.primary} />
                    <ThemeText fontSize="content" style={styles.drawerItemText}>
                        {item.title}
                    </ThemeText>
                    <Icon name="chevron-right" size={rpx(32)} color={colors.textSecondary} />
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.pageBackground }]}>
            <DrawerContentScrollView {...props} style={styles.scrollView}>
                {/* 应用标题 */}
                <View style={[styles.header, { backgroundColor: colors.appBar }]}>
                    <ThemeText fontSize="appbar" fontWeight="bold" color={colors.appBarText}>
                        Cymusic
                    </ThemeText>
                    <ThemeText fontSize="subTitle" color={colors.appBarText} opacity={0.8}>
                        基于MusicFree架构
                    </ThemeText>
                </View>

                {/* 音乐功能 */}
                {renderSection('音乐功能', musicFeatures)}

                {/* 设置 */}
                {renderSection('设置', basicSettings)}

                {/* 其他设置 */}
                {renderSection('其他', otherSettings)}

                {/* 测试功能 */}
                {renderSection('测试功能', testFeatures)}

                {/* 应用操作 */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <TouchableOpacity
                        style={styles.drawerItem}
                        onPress={() => {
                            closeDrawer();
                            BackHandler.exitApp();
                        }}
                    >
                        <Icon name="home" size={rpx(40)} color={colors.textSecondary} />
                        <ThemeText fontSize="content" style={styles.drawerItemText}>
                            返回桌面
                        </ThemeText>
                    </TouchableOpacity>
                </View>
            </DrawerContentScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: rpx(24),
        marginBottom: rpx(16),
    },
    section: {
        marginHorizontal: rpx(16),
        marginBottom: rpx(16),
        borderRadius: rpx(12),
        overflow: 'hidden',
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sectionHeader: {
        paddingHorizontal: rpx(16),
        paddingVertical: rpx(12),
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: rpx(16),
        paddingVertical: rpx(16),
    },
    drawerItemText: {
        flex: 1,
        marginLeft: rpx(16),
        marginRight: rpx(8),
    },
});
