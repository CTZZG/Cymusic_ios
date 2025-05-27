import { Button } from '@/components/base/Button';
import Icon from '@/components/base/Icon';
import IconButton from '@/components/base/IconButton';
import ThemeText from '@/components/base/ThemeText';
import { rpx } from '@/constants/uiConst';
import { PluginManager } from '@/core/pluginManager';
import { useColors } from '@/hooks/useColors';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface QuickAction {
    id: string;
    title: string;
    icon: string;
    color: string;
    onPress: () => void;
}

interface RecommendSheet {
    id: string;
    title: string;
    platform: string;
    coverImg?: string;
    description?: string;
    worksNum?: number;
}

interface TopListItem {
    id: string;
    title: string;
    platform: string;
    description?: string;
}

const RadioScreen = () => {
    const colors = useColors();
    const [loading, setLoading] = useState(false);
    const [recommendSheets, setRecommendSheets] = useState<RecommendSheet[]>([]);
    const [topLists, setTopLists] = useState<TopListItem[]>([]);

    useEffect(() => {
        loadDiscoverData();
    }, []);

    const loadDiscoverData = async () => {
        setLoading(true);
        try {
            // 模拟加载推荐数据
            const mockRecommendSheets: RecommendSheet[] = [
                {
                    id: '1',
                    title: '热门华语',
                    platform: '推荐',
                    description: '最新最热的华语歌曲',
                    worksNum: 50
                },
                {
                    id: '2',
                    title: '经典老歌',
                    platform: '推荐',
                    description: '经典怀旧金曲',
                    worksNum: 100
                },
                {
                    id: '3',
                    title: '流行摇滚',
                    platform: '推荐',
                    description: '动感摇滚音乐',
                    worksNum: 80
                },
                {
                    id: '4',
                    title: '轻音乐',
                    platform: '推荐',
                    description: '放松心情的轻音乐',
                    worksNum: 60
                }
            ];

            const mockTopLists: TopListItem[] = [
                {
                    id: '1',
                    title: '热歌榜',
                    platform: '榜单',
                    description: '最热门的歌曲排行'
                },
                {
                    id: '2',
                    title: '新歌榜',
                    platform: '榜单',
                    description: '最新发布的歌曲'
                },
                {
                    id: '3',
                    title: '原创榜',
                    platform: '榜单',
                    description: '优秀原创音乐'
                }
            ];

            setRecommendSheets(mockRecommendSheets);
            setTopLists(mockTopLists);
        } catch (error) {
            console.log('加载发现数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions: QuickAction[] = [
        {
            id: '1',
            title: '推荐歌单',
            icon: 'fire',
            color: colors.danger,
            onPress: () => {
                console.log('推荐歌单');
            }
        },
        {
            id: '2',
            title: '排行榜',
            icon: 'trophy',
            color: colors.warning,
            onPress: () => {
                console.log('排行榜');
            }
        },
        {
            id: '3',
            title: '播放记录',
            icon: 'clock',
            color: colors.info,
            onPress: () => {
                console.log('播放记录');
            }
        },
        {
            id: '4',
            title: '本地音乐',
            icon: 'folder',
            color: colors.success,
            onPress: () => {
                router.push('/(tabs)/favorites/localMusic');
            }
        }
    ];

    // 渲染顶部导航栏
    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: colors.appBar }]}>
            <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                    <ThemeText fontSize="appbar" fontWeight="bold" color={colors.appBarText}>
                        发现音乐
                    </ThemeText>
                    <ThemeText fontSize="subTitle" color={colors.appBarText} opacity={0.8}>
                        探索更多精彩内容
                    </ThemeText>
                </View>

                <View style={styles.headerActions}>
                    <IconButton
                        name="magnifying-glass"
                        color={colors.appBarText}
                        onPress={() => {
                            router.push('/(tabs)/search');
                        }}
                    />
                </View>
            </View>
        </View>
    );

    // 渲染快捷操作
    const renderQuickActions = () => (
        <View style={styles.quickActionsContainer}>
            <ThemeText fontSize="title" fontWeight="bold" style={styles.sectionTitle}>
                快捷操作
            </ThemeText>
            <View style={styles.quickActions}>
                {quickActions.map((action) => (
                    <TouchableOpacity
                        key={action.id}
                        style={[styles.quickActionItem, { backgroundColor: colors.card }]}
                        onPress={action.onPress}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                            <Icon name={action.icon as any} size={rpx(48)} color={colors.appBarText} />
                        </View>
                        <ThemeText fontSize="subTitle" fontWeight="medium" style={styles.quickActionText}>
                            {action.title}
                        </ThemeText>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    // 渲染推荐歌单
    const renderRecommendSheets = () => (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <ThemeText fontSize="title" fontWeight="bold">
                    推荐歌单
                </ThemeText>
                <TouchableOpacity onPress={() => console.log('查看更多推荐歌单')}>
                    <ThemeText fontSize="content" fontColor="textSecondary">
                        更多 →
                    </ThemeText>
                </TouchableOpacity>
            </View>

            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={recommendSheets}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.sheetItem, { backgroundColor: colors.card }]}
                        onPress={() => {
                            console.log('打开推荐歌单:', item.title);
                        }}
                    >
                        <View style={styles.sheetCover}>
                            <Icon name="musical-note" size={rpx(60)} color={colors.primary} />
                        </View>
                        <ThemeText fontSize="content" fontWeight="medium" numberOfLines={1} style={styles.sheetTitle}>
                            {item.title}
                        </ThemeText>
                        <ThemeText fontSize="subTitle" fontColor="textSecondary" numberOfLines={1}>
                            {item.worksNum} 首
                        </ThemeText>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.horizontalList}
            />
        </View>
    );

    // 渲染排行榜
    const renderTopLists = () => (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <ThemeText fontSize="title" fontWeight="bold">
                    音乐榜单
                </ThemeText>
                <TouchableOpacity onPress={() => console.log('查看更多榜单')}>
                    <ThemeText fontSize="content" fontColor="textSecondary">
                        更多 →
                    </ThemeText>
                </TouchableOpacity>
            </View>

            {topLists.map((item, index) => (
                <TouchableOpacity
                    key={item.id}
                    style={[styles.topListItem, { backgroundColor: colors.card }]}
                    onPress={() => {
                        console.log('打开榜单:', item.title);
                    }}
                >
                    <View style={[styles.topListRank, { backgroundColor: colors.primary }]}>
                        <ThemeText fontSize="content" fontWeight="bold" color={colors.appBarText}>
                            {index + 1}
                        </ThemeText>
                    </View>
                    <View style={styles.topListInfo}>
                        <ThemeText fontSize="content" fontWeight="medium">
                            {item.title}
                        </ThemeText>
                        <ThemeText fontSize="subTitle" fontColor="textSecondary" numberOfLines={1}>
                            {item.description}
                        </ThemeText>
                    </View>
                    <Icon name="chevron-right" size={rpx(32)} color={colors.textSecondary} />
                </TouchableOpacity>
            ))}
        </View>
    );

    // 渲染无插件状态
    const renderNoPlugin = () => (
        <View style={styles.noPluginContainer}>
            <Icon name="exclamation-triangle" size={rpx(120)} color={colors.warning} />
            <ThemeText fontSize="title" fontWeight="bold" style={styles.noPluginTitle}>
                暂无可用插件
            </ThemeText>
            <ThemeText fontSize="content" fontColor="textSecondary" style={styles.noPluginDescription}>
                请先安装并启用音源插件来获取推荐内容
            </ThemeText>
            <Button
                type="primary"
                text="去插件管理"
                onPress={() => {
                    router.push('/(modals)/pluginManage');
                }}
                style={styles.pluginButton}
            />
        </View>
    );

    // 检查是否有可用插件
    const hasPlugins = () => {
        const plugins = PluginManager.getPlugins();
        return plugins.some(p => PluginManager.isPluginEnabled(p));
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBackground }]}>
            {renderHeader()}

            {hasPlugins() ? (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {renderQuickActions()}
                    {renderRecommendSheets()}
                    {renderTopLists()}
                    <View style={styles.bottomSpace} />
                </ScrollView>
            ) : (
                renderNoPlugin()
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: rpx(32),
        paddingVertical: rpx(24),
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: {
        flex: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    quickActionsContainer: {
        paddingHorizontal: rpx(32),
        paddingVertical: rpx(24),
    },
    sectionTitle: {
        marginBottom: rpx(24),
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickActionItem: {
        width: (SCREEN_WIDTH - rpx(96)) / 4,
        alignItems: 'center',
        paddingVertical: rpx(24),
        borderRadius: rpx(12),
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    quickActionIcon: {
        width: rpx(80),
        height: rpx(80),
        borderRadius: rpx(40),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: rpx(12),
    },
    quickActionText: {
        textAlign: 'center',
    },
    sectionContainer: {
        paddingHorizontal: rpx(32),
        paddingVertical: rpx(24),
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: rpx(24),
    },
    horizontalList: {
        paddingRight: rpx(32),
    },
    sheetItem: {
        width: rpx(240),
        padding: rpx(16),
        marginRight: rpx(16),
        borderRadius: rpx(12),
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sheetCover: {
        width: rpx(120),
        height: rpx(120),
        borderRadius: rpx(12),
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: rpx(16),
        alignSelf: 'center',
    },
    sheetTitle: {
        marginBottom: rpx(4),
    },
    topListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: rpx(24),
        paddingVertical: rpx(20),
        marginBottom: rpx(12),
        borderRadius: rpx(12),
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    topListRank: {
        width: rpx(60),
        height: rpx(60),
        borderRadius: rpx(30),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: rpx(24),
    },
    topListInfo: {
        flex: 1,
    },
    noPluginContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: rpx(64),
    },
    noPluginTitle: {
        marginTop: rpx(32),
        marginBottom: rpx(16),
    },
    noPluginDescription: {
        textAlign: 'center',
        lineHeight: rpx(40),
        marginBottom: rpx(32),
    },
    pluginButton: {
        minWidth: rpx(200),
    },
    bottomSpace: {
        height: rpx(80),
    },
});

export default RadioScreen
