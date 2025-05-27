import Icon from '@/components/base/Icon';
import IconButton from '@/components/base/IconButton';
import ThemeText from '@/components/base/ThemeText';
import { rpx } from '@/constants/uiConst';
import { useColors } from '@/hooks/useColors';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MusicItem {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration?: number;
    artwork?: string;
    platform?: string;
}
const SongsScreen = () => {
    const colors = useColors();
    const [musicList, setMusicList] = useState<MusicItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadLocalMusic();
    }, []);

    const loadLocalMusic = async () => {
        setLoading(true);
        try {
            // 这里将来会从本地存储或插件系统加载音乐
            const mockData: MusicItem[] = [
                {
                    id: '1',
                    title: '示例歌曲 1',
                    artist: '示例歌手',
                    album: '示例专辑',
                    duration: 180,
                    platform: '本地音乐'
                },
                {
                    id: '2',
                    title: '示例歌曲 2',
                    artist: '另一个歌手',
                    album: '另一个专辑',
                    duration: 240,
                    platform: '本地音乐'
                }
            ];
            setMusicList(mockData);
        } catch (error) {
            console.log('加载音乐失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderMusicItem = ({ item, index }: { item: MusicItem; index: number }) => (
        <TouchableOpacity
            style={[styles.musicItem, { backgroundColor: colors.card }]}
            onPress={() => {
                // 播放音乐
                console.log('播放音乐:', item.title);
            }}
        >
            <View style={styles.musicInfo}>
                <View style={styles.indexContainer}>
                    <Text style={[styles.indexText, { color: colors.textSecondary }]}>
                        {(index + 1).toString().padStart(2, '0')}
                    </Text>
                </View>

                <View style={styles.musicDetails}>
                    <ThemeText fontSize="content" fontWeight="medium" numberOfLines={1}>
                        {item.title}
                    </ThemeText>
                    <View style={styles.artistRow}>
                        <ThemeText fontSize="subTitle" fontColor="textSecondary" numberOfLines={1}>
                            {item.artist}
                        </ThemeText>
                        {item.album && (
                            <>
                                <Text style={[styles.separator, { color: colors.textSecondary }]}> • </Text>
                                <ThemeText fontSize="subTitle" fontColor="textSecondary" numberOfLines={1}>
                                    {item.album}
                                </ThemeText>
                            </>
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.musicActions}>
                <ThemeText fontSize="subTitle" fontColor="textSecondary" style={styles.duration}>
                    {formatDuration(item.duration)}
                </ThemeText>
                <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => {
                        // 显示更多选项
                        console.log('更多选项:', item.title);
                    }}
                >
                    <Icon name="ellipsis-horizontal" size={rpx(32)} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: colors.appBar }]}>
            <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                    <ThemeText fontSize="appbar" fontWeight="bold" color={colors.appBarText}>
                        我的音乐
                    </ThemeText>
                    <ThemeText fontSize="subTitle" color={colors.appBarText} opacity={0.8}>
                        {musicList.length} 首歌曲
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
                    <IconButton
                        name="plus"
                        color={colors.appBarText}
                        onPress={() => {
                            // 添加音乐
                            console.log('添加音乐');
                        }}
                    />
                </View>
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Icon name="musical-note" size={rpx(120)} color={colors.textSecondary} />
            <ThemeText fontSize="title" fontColor="textSecondary" style={styles.emptyTitle}>
                暂无音乐
            </ThemeText>
            <ThemeText fontSize="content" fontColor="textSecondary" style={styles.emptyDescription}>
                点击右上角的 + 号添加音乐
            </ThemeText>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBackground }]}>
            {renderHeader()}

            <FlatList
                data={musicList}
                renderItem={renderMusicItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={musicList.length === 0 ? styles.emptyList : undefined}
                showsVerticalScrollIndicator={false}
                refreshing={loading}
                onRefresh={loadLocalMusic}
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
    musicItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: rpx(32),
        paddingVertical: rpx(24),
        marginHorizontal: rpx(16),
        marginVertical: rpx(4),
        borderRadius: rpx(12),
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    musicInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    indexContainer: {
        width: rpx(60),
        alignItems: 'center',
    },
    indexText: {
        fontSize: rpx(28),
        fontWeight: 'bold',
    },
    musicDetails: {
        flex: 1,
        marginLeft: rpx(24),
    },
    artistRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: rpx(4),
    },
    separator: {
        fontSize: rpx(24),
    },
    musicActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    duration: {
        marginRight: rpx(16),
        minWidth: rpx(80),
        textAlign: 'right',
    },
    moreButton: {
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
    },
});

export default SongsScreen
