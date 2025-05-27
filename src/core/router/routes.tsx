import React from 'react';
import { ROUTE_PATH, RoutePaths } from './index';

// 导入页面组件
import Home from '@/pages/Home';
import SearchPage from '@/pages/SearchPage';
import SettingPage from '@/pages/SettingPage';

// 导入测试页面
import PluginTestScreen from '@/app/(modals)/pluginTest';
import UITestScreen from '@/app/(modals)/uiTest';

// 临时占位组件
const PlaceholderPage = ({ title }: { title: string }) => {
    const React = require('react');
    const { View, Text, StyleSheet } = require('react-native');
    const { SafeAreaView } = require('react-native-safe-area-context');

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>页面开发中...</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = {
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
};

type IRoutes = {
    path: RoutePaths;
    component: (...args: any[]) => JSX.Element;
};

export const routes: Array<IRoutes> = [
    {
        path: ROUTE_PATH.HOME,
        component: Home,
    },
    {
        path: ROUTE_PATH.SEARCH_PAGE,
        component: SearchPage,
    },
    {
        path: ROUTE_PATH.SETTING,
        component: SettingPage,
    },
    {
        path: ROUTE_PATH.PLUGIN_TEST,
        component: PluginTestScreen,
    },
    {
        path: ROUTE_PATH.UI_TEST,
        component: UITestScreen,
    },
    {
        path: ROUTE_PATH.PLUGIN_MANAGE,
        component: PluginManagePage,
    },
    // 占位页面
    {
        path: ROUTE_PATH.MUSIC_DETAIL,
        component: () => <PlaceholderPage title="音乐播放页" />,
    },
    {
        path: ROUTE_PATH.LOCAL_SHEET_DETAIL,
        component: () => <PlaceholderPage title="本地歌单页" />,
    },
    {
        path: ROUTE_PATH.ALBUM_DETAIL,
        component: () => <PlaceholderPage title="专辑详情页" />,
    },
    {
        path: ROUTE_PATH.ARTIST_DETAIL,
        component: () => <PlaceholderPage title="歌手详情页" />,
    },
    {
        path: ROUTE_PATH.TOP_LIST,
        component: () => <PlaceholderPage title="榜单页" />,
    },
    {
        path: ROUTE_PATH.TOP_LIST_DETAIL,
        component: () => <PlaceholderPage title="榜单详情页" />,
    },
    {
        path: ROUTE_PATH.LOCAL,
        component: () => <PlaceholderPage title="本地音乐" />,
    },
    {
        path: ROUTE_PATH.DOWNLOADING,
        component: () => <PlaceholderPage title="正在下载" />,
    },
    {
        path: ROUTE_PATH.SEARCH_MUSIC_LIST,
        component: () => <PlaceholderPage title="搜索音乐列表" />,
    },
    {
        path: ROUTE_PATH.MUSIC_LIST_EDITOR,
        component: () => <PlaceholderPage title="批量编辑" />,
    },
    {
        path: ROUTE_PATH.FILE_SELECTOR,
        component: () => <PlaceholderPage title="文件选择器" />,
    },
    {
        path: ROUTE_PATH.RECOMMEND_SHEETS,
        component: () => <PlaceholderPage title="推荐歌单" />,
    },
    {
        path: ROUTE_PATH.PLUGIN_SHEET_DETAIL,
        component: () => <PlaceholderPage title="插件歌单详情" />,
    },
    {
        path: ROUTE_PATH.HISTORY,
        component: () => <PlaceholderPage title="历史记录" />,
    },
    {
        path: ROUTE_PATH.SET_CUSTOM_THEME,
        component: () => <PlaceholderPage title="自定义主题" />,
    },
    {
        path: ROUTE_PATH.PERMISSIONS,
        component: () => <PlaceholderPage title="权限管理" />,
    },
];
