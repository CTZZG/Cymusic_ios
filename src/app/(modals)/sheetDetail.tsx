import { TracksList } from '@/components/TracksList';
import { colors, screenPadding } from '@/constants/tokens';
import { pluginRecommendService } from '@/core/pluginManager/recommendService';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Track } from 'react-native-track-player';

interface RecommendSheet {
    id: string;
    title: string;
    description?: string;
    coverImg?: string;
    platform: string;
    playCount?: number | string;
    originalData?: any;
}

export default function SheetDetailScreen() {
    const { sheetData } = useLocalSearchParams<{ sheetData: string }>();
    const [sheetItem, setSheetItem] = useState<RecommendSheet | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (sheetData) {
            try {
                const parsedData = JSON.parse(sheetData);
                setSheetItem(parsedData);
            } catch (error) {
                console.error('解析歌单数据失败:', error);
                router.back();
            }
        }
    }, [sheetData]);

    const loadSheetDetail = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
        if (!sheetItem) return;

        try {
            if (isRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            const result = await pluginRecommendService.getRecommendSheetDetail({
                ...sheetItem,
                playCount: typeof sheetItem.playCount === 'string' ? parseInt(sheetItem.playCount) || 0 : sheetItem.playCount || 0
            }, pageNum);

            if (isRefresh || pageNum === 1) {
                setTracks(result.musicList);
            } else {
                setTracks(prev => [...prev, ...result.musicList]);
            }

            setHasMore(!result.isEnd);
            setPage(pageNum);
        } catch (error) {
            console.error('加载歌单详情失败:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [sheetItem]);

    const handleRefresh = useCallback(() => {
        loadSheetDetail(1, true);
    }, [loadSheetDetail]);

    const handleLoadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            loadSheetDetail(page + 1);
        }
    }, [isLoading, hasMore, page, loadSheetDetail]);

    useEffect(() => {
        if (sheetItem) {
            loadSheetDetail(1);
        }
    }, [sheetItem, loadSheetDetail]);

    if (!sheetItem) {
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

            <View style={styles.sheetInfo}>
                <Image
                    source={{
                        uri: sheetItem.coverImg || 'https://via.placeholder.com/120x120?text=歌单'
                    }}
                    style={styles.coverImage}
                    defaultSource={{ uri: 'https://via.placeholder.com/120x120?text=歌单' }}
                />
                <View style={styles.infoContainer}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {sheetItem.title}
                    </Text>
                    {sheetItem.description && (
                        <Text style={[styles.description, { color: colors.textMuted }]}>
                            {sheetItem.description}
                        </Text>
                    )}
                    <View style={styles.metaContainer}>
                        {sheetItem.playCount && (
                            <Text style={[styles.playCount, { color: colors.textMuted }]}>
                                播放 {sheetItem.playCount}
                            </Text>
                        )}
                        <Text style={[styles.platform, { color: colors.primary }]}>
                            来源: {sheetItem.platform}
                        </Text>
                    </View>
                </View>
            </View>

            {isLoading && tracks.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.text }]}>
                        正在加载歌单...
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
                    id={`sheet-${sheetItem.id}`}
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
    sheetInfo: {
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
        marginBottom: 8,
        lineHeight: 18,
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    playCount: {
        fontSize: 12,
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
