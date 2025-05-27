import { Button } from '@/components/base/Button';
import Icon from '@/components/base/Icon';
import ThemeText from '@/components/base/ThemeText';
import { rpx } from '@/constants/uiConst';
import { PluginManager } from '@/core/pluginManager';
import { useColors } from '@/hooks/useColors';
import React, { useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 搜索状态枚举
enum PageStatus {
    EDITING = 'editing',
    SEARCHING = 'searching',
    RESULT = 'result',
    NO_PLUGIN = 'no_plugin'
}

// 搜索类型
type SearchType = 'music' | 'album' | 'artist' | 'sheet';

interface MusicItem {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration?: number;
    artwork?: string;
    platform?: string;
}

interface SearchResult {
    music: MusicItem[];
    album: any[];
    artist: any[];
    sheet: any[];
}

const SearchScreen = () => {
    const colors = useColors();
    const [pageStatus, setPageStatus] = useState<PageStatus>(PageStatus.EDITING);
    const [query, setQuery] = useState('');
    const [searchType, setSearchType] = useState<SearchType>('music');
    const [searchResults, setSearchResults] = useState<SearchResult>({
        music: [],
        album: [],
        artist: [],
        sheet: []
    });
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSearchHistory();
    }, []);

    const loadSearchHistory = async () => {
        try {
            // 这里将来会从AsyncStorage加载搜索历史
            const mockHistory = ['流行音乐', '经典老歌', '摇滚', '民谣'];
            setSearchHistory(mockHistory);
        } catch (error) {
            console.log('加载搜索历史失败:', error);
        }
    };

    const performSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        setPageStatus(PageStatus.SEARCHING);

        try {
            // 检查是否有可用的插件
            const plugins = PluginManager.getPlugins();
            const enabledPlugins = plugins.filter(p => PluginManager.isPluginEnabled(p));

            if (enabledPlugins.length === 0) {
                setPageStatus(PageStatus.NO_PLUGIN);
                return;
            }

            // 模拟搜索结果
            const mockResults: SearchResult = {
                music: [
                    {
                        id: '1',
                        title: `${searchQuery} - 搜索结果1`,
                        artist: '示例歌手',
                        album: '示例专辑',
                        duration: 180,
                        platform: '测试音源'
                    },
                    {
                        id: '2',
                        title: `${searchQuery} - 搜索结果2`,
                        artist: '另一个歌手',
                        album: '另一个专辑',
                        duration: 240,
                        platform: '测试音源'
                    }
                ],
                album: [],
                artist: [],
                sheet: []
            };

            setSearchResults(mockResults);
            setPageStatus(PageStatus.RESULT);

            // 添加到搜索历史
            if (!searchHistory.includes(searchQuery)) {
                setSearchHistory(prev => [searchQuery, ...prev.slice(0, 9)]);
            }

        } catch (error) {
            console.log('搜索失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = () => {
        performSearch(query);
    };

    const handleHistoryItemPress = (historyQuery: string) => {
        setQuery(historyQuery);
        performSearch(historyQuery);
    };

    const clearSearchHistory = () => {
        setSearchHistory([]);
    };

    const removeHistoryItem = (item: string) => {
        setSearchHistory(prev => prev.filter(h => h !== item));
    };

    // 渲染搜索栏
    const renderSearchBar = () => (
        <View style={[styles.searchBar, { backgroundColor: colors.appBar }]}>
            <View style={[styles.searchInputContainer, { backgroundColor: colors.card }]}>
                <Icon name="magnifying-glass" size={rpx(32)} color={colors.textSecondary} />
                <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="搜索音乐、歌手、专辑..."
                    placeholderTextColor={colors.textSecondary}
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearchSubmit}
                    returnKeyType="search"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <Icon name="x-mark" size={rpx(32)} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    // 渲染搜索类型标签
    const renderSearchTypeTabs = () => (
        <View style={styles.tabContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(['music', 'album', 'artist', 'sheet'] as SearchType[]).map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={[
                            styles.tab,
                            { backgroundColor: searchType === type ? colors.primary : colors.card }
                        ]}
                        onPress={() => setSearchType(type)}
                    >
                        <ThemeText
                            fontSize="content"
                            color={searchType === type ? colors.appBarText : colors.text}
                        >
                            {type === 'music' ? '单曲' :
                             type === 'album' ? '专辑' :
                             type === 'artist' ? '歌手' : '歌单'}
                        </ThemeText>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    // 渲染搜索历史
    const renderHistoryPanel = () => (
        <View style={styles.historyContainer}>
            <View style={styles.historyHeader}>
                <ThemeText fontSize="title" fontWeight="bold">
                    搜索历史
                </ThemeText>
                {searchHistory.length > 0 && (
                    <TouchableOpacity onPress={clearSearchHistory}>
                        <ThemeText fontSize="content" fontColor="textSecondary">
                            清空
                        </ThemeText>
                    </TouchableOpacity>
                )}
            </View>

            {searchHistory.length === 0 ? (
                <View style={styles.emptyHistory}>
                    <Icon name="clock" size={rpx(80)} color={colors.textSecondary} />
                    <ThemeText fontSize="content" fontColor="textSecondary" style={styles.emptyText}>
                        暂无搜索历史
                    </ThemeText>
                </View>
            ) : (
                <ScrollView style={styles.historyList}>
                    {searchHistory.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.historyItem, { backgroundColor: colors.card }]}
                            onPress={() => handleHistoryItemPress(item)}
                        >
                            <Icon name="clock" size={rpx(32)} color={colors.textSecondary} />
                            <ThemeText fontSize="content" style={styles.historyText}>
                                {item}
                            </ThemeText>
                            <TouchableOpacity
                                onPress={() => removeHistoryItem(item)}
                                style={styles.removeButton}
                            >
                                <Icon name="x-mark" size={rpx(24)} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );

    // 渲染搜索结果
    const renderSearchResults = () => {
        const currentResults = searchResults[searchType];

        if (searchType === 'music') {
            return (
                <FlatList
                    data={currentResults}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity
                            style={[styles.musicItem, { backgroundColor: colors.card }]}
                            onPress={() => {
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
                                        <Text style={[styles.separator, { color: colors.textSecondary }]}> • </Text>
                                        <ThemeText fontSize="subTitle" fontColor="textSecondary" numberOfLines={1}>
                                            {item.platform}
                                        </ThemeText>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.moreButton}>
                                <Icon name="ellipsis-horizontal" size={rpx(32)} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyResults}>
                            <Icon name="musical-note" size={rpx(80)} color={colors.textSecondary} />
                            <ThemeText fontSize="content" fontColor="textSecondary">
                                暂无搜索结果
                            </ThemeText>
                        </View>
                    )}
                />
            );
        }

        return (
            <View style={styles.emptyResults}>
                <Icon name="musical-note" size={rpx(80)} color={colors.textSecondary} />
                <ThemeText fontSize="content" fontColor="textSecondary">
                    该类型搜索功能开发中...
                </ThemeText>
            </View>
        );
    };

    // 渲染加载状态
    const renderLoading = () => (
        <View style={styles.loadingContainer}>
            <Icon name="arrow-path" size={rpx(80)} color={colors.primary} />
            <ThemeText fontSize="content" fontColor="textSecondary" style={styles.loadingText}>
                正在搜索...
            </ThemeText>
        </View>
    );

    // 渲染无插件状态
    const renderNoPlugin = () => (
        <View style={styles.noPluginContainer}>
            <Icon name="exclamation-triangle" size={rpx(80)} color={colors.warning} />
            <ThemeText fontSize="title" fontWeight="bold" style={styles.noPluginTitle}>
                暂无可用插件
            </ThemeText>
            <ThemeText fontSize="content" fontColor="textSecondary" style={styles.noPluginDescription}>
                请先安装并启用音源插件才能进行搜索
            </ThemeText>
            <Button
                type="primary"
                text="去插件管理"
                onPress={() => {
                    // 跳转到插件管理页面
                    console.log('跳转到插件管理');
                }}
                style={styles.pluginButton}
            />
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBackground }]}>
            {renderSearchBar()}

            {pageStatus === PageStatus.RESULT && renderSearchTypeTabs()}

            <View style={styles.content}>
                {pageStatus === PageStatus.EDITING && renderHistoryPanel()}
                {pageStatus === PageStatus.SEARCHING && renderLoading()}
                {pageStatus === PageStatus.RESULT && renderSearchResults()}
                {pageStatus === PageStatus.NO_PLUGIN && renderNoPlugin()}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchBar: {
        paddingHorizontal: rpx(32),
        paddingVertical: rpx(24),
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: rpx(24),
        paddingVertical: rpx(16),
        borderRadius: rpx(64),
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: rpx(16),
        fontSize: rpx(32),
        includeFontPadding: false,
    },
    tabContainer: {
        paddingHorizontal: rpx(32),
        paddingVertical: rpx(16),
    },
    tab: {
        paddingHorizontal: rpx(24),
        paddingVertical: rpx(12),
        borderRadius: rpx(32),
        marginRight: rpx(16),
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    content: {
        flex: 1,
    },
    historyContainer: {
        flex: 1,
        paddingHorizontal: rpx(32),
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: rpx(32),
    },
    emptyHistory: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: rpx(16),
    },
    historyList: {
        flex: 1,
    },
    historyItem: {
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
    historyText: {
        flex: 1,
        marginLeft: rpx(16),
    },
    removeButton: {
        padding: rpx(8),
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
    moreButton: {
        padding: rpx(8),
    },
    emptyResults: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: rpx(64),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: rpx(16),
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
});

export default SearchScreen
