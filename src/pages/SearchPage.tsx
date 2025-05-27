import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { rpx } from '@/constants/uiConst';
import ThemeText from '@/components/base/ThemeText';
import IconButton from '@/components/base/IconButton';
import Icon from '@/components/base/Icon';
import { useNavigate } from '@/core/router/useNavigate';
import { PluginManager } from '@/core/pluginManager';

export default function SearchPage() {
    const colors = useColors();
    const { goBack } = useNavigate();
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        if (!searchText.trim()) return;

        setIsSearching(true);
        try {
            const plugins = PluginManager.getPluginsWithAbility('search');
            console.log('可用插件数量:', plugins.length);
            
            if (plugins.length === 0) {
                console.log('没有可用的搜索插件');
                setSearchResults([]);
                return;
            }

            // 使用第一个可用插件进行搜索
            const plugin = plugins[0];
            console.log('使用插件:', plugin.name);
            
            const result = await plugin.methods.search(searchText, 1, 'music');
            console.log('搜索结果:', result);
            
            setSearchResults(result.data || []);
        } catch (error) {
            console.error('搜索失败:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBackground }]}>
            {/* 导航栏 */}
            <View style={[styles.navbar, { backgroundColor: colors.appBar }]}>
                <IconButton
                    name="chevron-left"
                    onPress={goBack}
                    color={colors.appBarText}
                    accessibilityLabel="返回"
                />
                <ThemeText 
                    fontSize="appbar" 
                    fontWeight="medium"
                    color={colors.appBarText}
                    style={styles.title}
                >
                    搜索音乐
                </ThemeText>
            </View>

            {/* 搜索框 */}
            <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                <View style={[styles.searchBox, { backgroundColor: colors.placeholder }]}>
                    <Icon name="search" size={rpx(32)} color={colors.textSecondary} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="搜索歌曲、歌手、专辑..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchText}
                        onChangeText={setSearchText}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Icon name="x-mark" size={rpx(32)} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity 
                    style={[styles.searchButton, { backgroundColor: colors.primary }]}
                    onPress={handleSearch}
                    disabled={isSearching}
                >
                    <ThemeText color="white" fontWeight="medium">
                        {isSearching ? '搜索中...' : '搜索'}
                    </ThemeText>
                </TouchableOpacity>
            </View>

            {/* 搜索结果 */}
            <ScrollView style={styles.content}>
                {searchResults.length > 0 ? (
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <ThemeText fontSize="title" fontWeight="bold" style={styles.sectionTitle}>
                            搜索结果 ({searchResults.length})
                        </ThemeText>
                        {searchResults.map((item, index) => (
                            <TouchableOpacity 
                                key={index} 
                                style={[styles.resultItem, { borderBottomColor: colors.divider }]}
                            >
                                <View style={styles.resultInfo}>
                                    <ThemeText fontSize="content" fontWeight="medium" numberOfLines={1}>
                                        {item.title || '未知歌曲'}
                                    </ThemeText>
                                    <ThemeText fontSize="subTitle" fontColor="textSecondary" numberOfLines={1}>
                                        {item.artist || '未知歌手'} • {item.album || '未知专辑'}
                                    </ThemeText>
                                </View>
                                <IconButton
                                    name="play"
                                    color={colors.primary}
                                    accessibilityLabel="播放"
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : searchText && !isSearching ? (
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <ThemeText fontSize="content" fontColor="textSecondary" style={styles.emptyText}>
                            没有找到相关结果
                        </ThemeText>
                    </View>
                ) : null}

                {/* 插件状态 */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <ThemeText fontSize="title" fontWeight="bold" style={styles.sectionTitle}>
                        插件状态
                    </ThemeText>
                    <ThemeText fontSize="content" fontColor="textSecondary">
                        已安装插件: {PluginManager.getPlugins().length} 个
                    </ThemeText>
                    <ThemeText fontSize="content" fontColor="textSecondary">
                        可搜索插件: {PluginManager.getPluginsWithAbility('search').length} 个
                    </ThemeText>
                </View>
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
        marginLeft: rpx(16),
    },
    searchContainer: {
        flexDirection: 'row',
        padding: rpx(16),
        alignItems: 'center',
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: rpx(24),
        paddingHorizontal: rpx(16),
        paddingVertical: rpx(8),
        marginRight: rpx(12),
    },
    searchInput: {
        flex: 1,
        fontSize: rpx(28),
        marginLeft: rpx(8),
        paddingVertical: rpx(8),
    },
    searchButton: {
        borderRadius: rpx(20),
        paddingHorizontal: rpx(20),
        paddingVertical: rpx(10),
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
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: rpx(12),
        borderBottomWidth: 1,
    },
    resultInfo: {
        flex: 1,
        marginRight: rpx(12),
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: rpx(32),
    },
});
