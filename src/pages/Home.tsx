import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { rpx } from '@/constants/uiConst';
import ThemeText from '@/components/base/ThemeText';
import IconButton from '@/components/base/IconButton';
import { Button } from '@/components/base/Button';
import { useNavigate } from '@/core/router/useNavigate';
import { ROUTE_PATH } from '@/core/router';

export default function Home() {
    const colors = useColors();
    const { navigate, openDrawer } = useNavigate();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBackground }]}>
            {/* 导航栏 */}
            <View style={[styles.navbar, { backgroundColor: colors.appBar }]}>
                <IconButton
                    name="bars-3"
                    onPress={openDrawer}
                    color={colors.appBarText}
                    accessibilityLabel="打开侧边栏"
                />
                <ThemeText 
                    fontSize="appbar" 
                    fontWeight="bold"
                    color={colors.appBarText}
                    style={styles.title}
                >
                    Cymusic
                </ThemeText>
                <IconButton
                    name="search"
                    onPress={() => navigate(ROUTE_PATH.SEARCH_PAGE)}
                    color={colors.appBarText}
                    accessibilityLabel="搜索"
                />
            </View>

            {/* 主要内容 */}
            <ScrollView style={styles.content}>
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <ThemeText fontSize="title" fontWeight="bold" style={styles.sectionTitle}>
                        欢迎使用 Cymusic
                    </ThemeText>
                    <ThemeText fontSize="content" fontColor="textSecondary" style={styles.description}>
                        这是一个基于MusicFree架构重构的音乐播放器，支持插件系统和多音源播放。
                    </ThemeText>
                </View>

                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <ThemeText fontSize="title" fontWeight="bold" style={styles.sectionTitle}>
                        快速开始
                    </ThemeText>
                    
                    <Button
                        type="primary"
                        text="搜索音乐"
                        onPress={() => navigate(ROUTE_PATH.SEARCH_PAGE)}
                        style={styles.button}
                    />
                    
                    <Button
                        type="normal"
                        text="本地音乐"
                        onPress={() => navigate(ROUTE_PATH.LOCAL)}
                        style={styles.button}
                    />
                    
                    <Button
                        type="normal"
                        text="插件管理"
                        onPress={() => navigate(ROUTE_PATH.SETTING, { type: 'plugin' })}
                        style={styles.button}
                    />
                </View>

                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <ThemeText fontSize="title" fontWeight="bold" style={styles.sectionTitle}>
                        测试功能
                    </ThemeText>
                    
                    <Button
                        type="normal"
                        text="插件系统测试"
                        onPress={() => navigate(ROUTE_PATH.PLUGIN_TEST)}
                        style={styles.button}
                    />
                    
                    <Button
                        type="normal"
                        text="UI组件测试"
                        onPress={() => navigate(ROUTE_PATH.UI_TEST)}
                        style={styles.button}
                    />
                </View>

                {/* 底部间距 */}
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
        textAlign: 'center',
        marginHorizontal: rpx(16),
    },
    content: {
        flex: 1,
        padding: rpx(16),
    },
    section: {
        borderRadius: rpx(12),
        padding: rpx(16),
        marginBottom: rpx(16),
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sectionTitle: {
        marginBottom: rpx(12),
    },
    description: {
        lineHeight: rpx(40),
    },
    button: {
        marginBottom: rpx(12),
    },
    bottomSpace: {
        height: rpx(80),
    },
});
