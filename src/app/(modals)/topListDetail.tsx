import React, { useCallback, useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ActivityIndicator, 
    RefreshControl,
    Image,
    TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, screenPadding } from '@/constants/tokens';
import { defaultStyles } from '@/styles';
import { pluginTopListService } from '@/core/pluginManager/topListService';
import { TracksList } from '@/components/TracksList';
import { Track } from 'react-native-track-player';

interface TopListItem {
    id: string;
    title: string;
    description?: string;
    coverImg?: string;
    platform: string;
    originalData?: any;
}

export default function TopListDetailScreen() {
    const { topListData } = useLocalSearchParams<{ topListData: string }>();
    const [topListItem, setTopListItem] = useState<TopListItem | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (topListData) {
            try {
                const parsedData = JSON.parse(topListData);
                setTopListItem(parsedData);
            } catch (error) {
                console.error('解析排行榜数据失败:', error);
                router.back();
            }
        }
    }, [topListData]);

    const loadTopListDetail = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
        if (!topListItem) return;

        try {
            if (isRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            const result = await pluginTopListService.getTopListDetail(topListItem, pageNum);
            
            if (isRefresh || pageNum === 1) {
                setTracks(result.musicList);
            } else {
                setTracks(prev => [...prev, ...result.musicList]);
            }
            
            setHasMore(!result.isEnd);
            setPage(pageNum);
        } catch (error) {
            console.error('加载排行榜详情失败:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [topListItem]);

    const handleRefresh = useCallback(() => {
        loadTopListDetail(1, true);
    }, [loadTopListDetail]);

    const handleLoadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            loadTopListDetail(page + 1);
        }
    }, [isLoading, hasMore, page, loadTopListDetail]);

    useEffect(() => {
        if (topListItem) {
            loadTopListDetail(1);
        }
    }, [topListItem, loadTopListDetail]);

    if (!topListItem) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.text }]}>
                        正在加载...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => router.back()}
                >
                    <Text style={[styles.backButtonText, { color: colors.primary }]}>
                        ← 返回
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.topListInfo}>
                <Image
                    source={{ 
                        uri: topListItem.coverImg || 'https://via.placeholder.com/120x120?text=榜单' 
                    }}
                    style={styles.coverImage}
                    defaultSource={{ uri: 'https://via.placeholder.com/120x120?text=榜单' }}
                />
                <View style={styles.infoContainer}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {topListItem.title}
                    </Text>
                    {topListItem.description && (
                        <Text style={[styles.description, { color: colors.textMuted }]}>
                            {topListItem.description}
                        </Text>
                    )}
                    <Text style={[styles.platform, { color: colors.primary }]}>
                        来源: {topListItem.platform}
                    </Text>
                </View>
            </View>

            {isLoading && tracks.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.text }]}>
                        正在加载排行榜...
                    </Text>
                </View>
            ) : tracks.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                        暂无歌曲数据
                    </Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                        <Text style={[styles.retryButtonText, { color: colors.primary }]}>
                            重试
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TracksList
                    id={`toplist-${topListItem.id}`}
                    tracks={tracks}
                    scrollEnabled={true}
                    onEndReached={handleLoadMore}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: screenPadding.horizontal,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    backButton: {
        alignSelf: 'flex-start',
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    topListInfo: {
        flexDirection: 'row',
        padding: screenPadding.horizontal,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    coverImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 16,
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        marginBottom: 4,
        lineHeight: 18,
    },
    platform: {
        fontSize: 12,
        fontWeight: '500',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: screenPadding.horizontal,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
