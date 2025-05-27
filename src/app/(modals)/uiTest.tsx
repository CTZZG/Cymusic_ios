import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { rpx } from '@/constants/uiConst';

// 导入我们的UI组件
import ThemeText from '@/components/base/ThemeText';
import { Button } from '@/components/base/Button';
import Icon from '@/components/base/Icon';
import IconButton from '@/components/base/IconButton';
import TextButton from '@/components/base/TextButton';

export default function UITestScreen() {
    const colors = useColors();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBackground }]}>
            <View style={[styles.header, { backgroundColor: colors.appBar }]}>
                <IconButton
                    name="chevron-left"
                    onPress={() => router.back()}
                    color={colors.appBarText}
                    accessibilityLabel="返回"
                />
                <ThemeText 
                    fontSize="appbar" 
                    fontWeight="medium"
                    color={colors.appBarText}
                    style={styles.title}
                >
                    UI组件测试
                </ThemeText>
            </View>

            <ScrollView style={styles.content}>
                {/* 文本组件测试 */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <ThemeText fontSize="title" fontWeight="bold" style={styles.sectionTitle}>
                        文本组件
                    </ThemeText>
                    <ThemeText fontSize="huge">超大文本</ThemeText>
                    <ThemeText fontSize="large">大文本</ThemeText>
                    <ThemeText fontSize="title">标题文本</ThemeText>
                    <ThemeText fontSize="content">内容文本</ThemeText>
                    <ThemeText fontSize="subTitle">副标题文本</ThemeText>
                    <ThemeText fontSize="tiny">小文本</ThemeText>
                    <ThemeText fontColor="textSecondary">次要文本</ThemeText>
                    <ThemeText color={colors.primary}>主色调文本</ThemeText>
                </View>

                {/* 按钮组件测试 */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <ThemeText fontSize="title" fontWeight="bold" style={styles.sectionTitle}>
                        按钮组件
                    </ThemeText>
                    <Button 
                        type="primary" 
                        text="主要按钮" 
                        onPress={() => console.log('主要按钮点击')}
                        style={styles.button}
                    />
                    <Button 
                        type="normal" 
                        text="普通按钮" 
                        onPress={() => console.log('普通按钮点击')}
                        style={styles.button}
                    />
                    <TextButton 
                        onPress={() => console.log('文本按钮点击')}
                        fontColor="primary"
                        style={styles.button}
                    >
                        文本按钮
                    </TextButton>
                </View>

                {/* 图标组件测试 */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <ThemeText fontSize="title" fontWeight="bold" style={styles.sectionTitle}>
                        图标组件
                    </ThemeText>
                    <View style={styles.iconRow}>
                        <Icon name="play" size={32} color={colors.primary} />
                        <Icon name="pause" size={32} color={colors.primary} />
                        <Icon name="skip-left" size={32} color={colors.primary} />
                        <Icon name="skip-right" size={32} color={colors.primary} />
                        <Icon name="heart" size={32} color={colors.danger} />
                        <Icon name="share" size={32} color={colors.text} />
                    </View>
                    <View style={styles.iconRow}>
                        <IconButton 
                            name="home" 
                            sizeType="large"
                            onPress={() => console.log('首页图标点击')}
                            accessibilityLabel="首页"
                        />
                        <IconButton 
                            name="search" 
                            sizeType="large"
                            onPress={() => console.log('搜索图标点击')}
                            accessibilityLabel="搜索"
                        />
                        <IconButton 
                            name="library" 
                            sizeType="large"
                            onPress={() => console.log('库图标点击')}
                            accessibilityLabel="音乐库"
                        />
                        <IconButton 
                            name="cog" 
                            sizeType="large"
                            onPress={() => console.log('设置图标点击')}
                            accessibilityLabel="设置"
                        />
                    </View>
                </View>

                {/* 颜色主题测试 */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <ThemeText fontSize="title" fontWeight="bold" style={styles.sectionTitle}>
                        颜色主题
                    </ThemeText>
                    <View style={styles.colorRow}>
                        <View style={[styles.colorBox, { backgroundColor: colors.primary }]} />
                        <ThemeText>主色调</ThemeText>
                    </View>
                    <View style={styles.colorRow}>
                        <View style={[styles.colorBox, { backgroundColor: colors.success }]} />
                        <ThemeText>成功色</ThemeText>
                    </View>
                    <View style={styles.colorRow}>
                        <View style={[styles.colorBox, { backgroundColor: colors.danger }]} />
                        <ThemeText>危险色</ThemeText>
                    </View>
                    <View style={styles.colorRow}>
                        <View style={[styles.colorBox, { backgroundColor: colors.info }]} />
                        <ThemeText>信息色</ThemeText>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
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
        marginLeft: rpx(16),
        flex: 1,
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
        marginBottom: rpx(16),
    },
    button: {
        marginBottom: rpx(12),
    },
    iconRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: rpx(16),
    },
    colorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: rpx(8),
    },
    colorBox: {
        width: rpx(32),
        height: rpx(32),
        borderRadius: rpx(4),
        marginRight: rpx(12),
    },
});
