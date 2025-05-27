import { Button } from '@/components/base/Button';
import Icon from '@/components/base/Icon';
import IconButton from '@/components/base/IconButton';
import ThemeText from '@/components/base/ThemeText';
import { rpx } from '@/constants/uiConst';
import { useColors } from '@/hooks/useColors';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MusicSheet {
    id: string;
    title: string;
    platform: string;
    coverImg?: string;
    worksNum: number;
    createAt: number;
    description?: string;
}

const FavoritesScreen = () => {
    const colors = useColors();
    const [musicSheets, setMusicSheets] = useState<MusicSheet[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadMusicSheets();
    }, []);

    const loadMusicSheets = async () => {
        setLoading(true);
        try {
            // 模拟加载歌单数据
            const mockSheets: MusicSheet[] = [
                {
                    id: 'favorites',
                    title: '我喜欢的音乐',
                    platform: '本地',
                    coverImg: 'https://y.qq.com/mediastyle/global/img/cover_like.png?max_age=2592000',
                    worksNum: 0,
                    createAt: Date.now(),
                    description: '收藏的音乐'
                },
                {
                    id: 'local',
                    title: '本地音乐',
                    platform: '本地',
                    worksNum: 0,
                    createAt: Date.now(),
                    description: '本地和缓存的音乐'
                },
                {
                    id: 'recent',
                    title: '最近播放',
                    platform: '本地',
                    worksNum: 0,
                    createAt: Date.now(),
                    description: '最近播放的音乐'
                }
            ];
            setMusicSheets(mockSheets);
        } catch (error) {
            console.log('加载歌单失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSheet = () => {
        Alert.prompt(
            '新建歌单',
            '请输入歌单名称',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '确定',
                    onPress: (text) => {
                        if (text && text.trim()) {
                            createNewSheet(text.trim());
                        }
                    }
                }
            ],
            'plain-text',
            '',
            'default'
        );
    };

    const createNewSheet = (title: string) => {
        const newSheet: MusicSheet = {
            id: Date.now().toString(),
            title,
            platform: '本地',
            worksNum: 0,
            createAt: Date.now(),
            description: '自定义歌单'
        };
        setMusicSheets(prev => [...prev, newSheet]);
    };

    const handleSheetPress = (sheet: MusicSheet) => {
        if (sheet.id === 'favorites') {
            router.push('/(tabs)/favorites/favoriteMusic');
        } else if (sheet.id === 'local') {
            router.push('/(tabs)/favorites/localMusic');
        } else if (sheet.id === 'recent') {
            // 跳转到最近播放页面
            console.log('跳转到最近播放');
        } else {
            router.push(`/(tabs)/favorites/${sheet.id}`);
        }
    };

    const handleSheetLongPress = (sheet: MusicSheet) => {
        if (sheet.id === 'favorites' || sheet.id === 'local' || sheet.id === 'recent') {
            return; // 系统歌单不允许删除
        }

        Alert.alert(
            '删除歌单',
            `确认删除歌单「${sheet.title}」吗？`,
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '删除',
                    style: 'destructive',
                    onPress: () => {
                        setMusicSheets(prev => prev.filter(s => s.id !== sheet.id));
                    }
                }
            ]
        );
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    const renderSheetItem = ({ item }: { item: MusicSheet }) => (
        <TouchableOpacity
            style={[styles.sheetItem, { backgroundColor: colors.card }]}
            onPress={() => handleSheetPress(item)}
            onLongPress={() => handleSheetLongPress(item)}
        >
            <View style={styles.sheetCover}>
                {item.coverImg ? (
                    <Icon name="musical-note" size={rpx(80)} color={colors.primary} />
                ) : (
                    <Icon name="musical-note" size={rpx(80)} color={colors.textSecondary} />
                )}
            </View>

            <View style={styles.sheetInfo}>
                <ThemeText fontSize="content" fontWeight="medium" numberOfLines={1}>
                    {item.title}
                </ThemeText>
                <View style={styles.sheetMeta}>
                    <ThemeText fontSize="subTitle" fontColor="textSecondary">
                        {item.worksNum} 首
                    </ThemeText>
                    <Text style={[styles.separator, { color: colors.textSecondary }]}> • </Text>
                    <ThemeText fontSize="subTitle" fontColor="textSecondary">
                        {formatDate(item.createAt)}
                    </ThemeText>
                </View>
                {item.description && (
                    <ThemeText fontSize="subTitle" fontColor="textSecondary" numberOfLines={1}>
                        {item.description}
                    </ThemeText>
                )}
            </View>

            <TouchableOpacity
                style={styles.moreButton}
                onPress={() => {
                    // 显示更多选项
                    console.log('更多选项:', item.title);
                }}
            >
                <Icon name="ellipsis-horizontal" size={rpx(32)} color={colors.textSecondary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: colors.appBar }]}>
            <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                    <ThemeText fontSize="appbar" fontWeight="bold" color={colors.appBarText}>
                        我的收藏
                    </ThemeText>
                    <ThemeText fontSize="subTitle" color={colors.appBarText} opacity={0.8}>
                        {musicSheets.length} 个歌单
                    </ThemeText>
                </View>

                <View style={styles.headerActions}>
                    <IconButton
                        name="magnifying-glass"
                        color={colors.appBarText}
                        onPress={() => {
                            // 搜索歌单
                            console.log('搜索歌单');
                        }}
                    />
                    <IconButton
                        name="plus"
                        color={colors.appBarText}
                        onPress={handleCreateSheet}
                    />
                </View>
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Icon name="heart" size={rpx(120)} color={colors.textSecondary} />
            <ThemeText fontSize="title" fontColor="textSecondary" style={styles.emptyTitle}>
                暂无歌单
            </ThemeText>
            <ThemeText fontSize="content" fontColor="textSecondary" style={styles.emptyDescription}>
                点击右上角的 + 号创建你的第一个歌单
            </ThemeText>
            <Button
                type="primary"
                text="创建歌单"
                onPress={handleCreateSheet}
                style={styles.createButton}
            />
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBackground }]}>
            {renderHeader()}

            <FlatList
                data={musicSheets}
                renderItem={renderSheetItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={musicSheets.length === 0 ? styles.emptyList : undefined}
                showsVerticalScrollIndicator={false}
                refreshing={loading}
                onRefresh={loadMusicSheets}
                numColumns={2}
                columnWrapperStyle={styles.row}
            />
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
    row: {
        justifyContent: 'space-between',
        paddingHorizontal: rpx(16),
    },
    sheetItem: {
        width: rpx(340),
        padding: rpx(24),
        marginVertical: rpx(8),
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
    sheetInfo: {
        flex: 1,
        marginBottom: rpx(12),
    },
    sheetMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: rpx(4),
        marginBottom: rpx(8),
    },
    separator: {
        fontSize: rpx(24),
    },
    moreButton: {
        alignSelf: 'flex-end',
        padding: rpx(8),
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: rpx(64),
    },
    emptyList: {
        flex: 1,
    },
    emptyTitle: {
        marginTop: rpx(32),
        marginBottom: rpx(16),
    },
    emptyDescription: {
        textAlign: 'center',
        lineHeight: rpx(40),
        marginBottom: rpx(32),
    },
    createButton: {
        minWidth: rpx(200),
    },
});

export default FavoritesScreen
