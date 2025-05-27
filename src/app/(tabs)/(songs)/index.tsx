import { colors, screenPadding } from '@/constants/tokens'
import { pluginTopListService } from '@/core/pluginManager/topListService'
import { defaultStyles } from '@/styles'
import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'

interface TopListGroup {
	title: string;
	data: TopListItem[];
}

interface TopListItem {
	id: string;
	title: string;
	description?: string;
	coverImg?: string;
	platform: string;
	originalData?: any;
}

const TopListsScreen = () => {
	const [topLists, setTopLists] = useState<TopListGroup[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isRefreshing, setIsRefreshing] = useState(false)

	const loadTopLists = useCallback(async () => {
		try {
			setIsLoading(true)
			const result = await pluginTopListService.getAllTopLists()
			setTopLists(result)
		} catch (error) {
			console.error('加载排行榜失败:', error)
		} finally {
			setIsLoading(false)
		}
	}, [])

	const handleRefresh = useCallback(async () => {
		try {
			setIsRefreshing(true)
			const result = await pluginTopListService.getAllTopLists()
			setTopLists(result)
		} catch (error) {
			console.error('刷新排行榜失败:', error)
		} finally {
			setIsRefreshing(false)
		}
	}, [])

	const handleTopListPress = useCallback((topListItem: TopListItem) => {
		// 导航到排行榜详情页面
		router.push({
			pathname: '/(modals)/topListDetail',
			params: {
				topListData: JSON.stringify(topListItem),
			},
		})
	}, [])

	useEffect(() => {
		loadTopLists()
	}, [loadTopLists])

	if (isLoading && topLists.length === 0) {
		return (
			<View style={[defaultStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={[styles.loadingText, { color: colors.text }]}>
					正在加载排行榜...
				</Text>
			</View>
		)
	}

	if (topLists.length === 0 && !isLoading) {
		return (
			<View style={[defaultStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
				<Text style={[styles.emptyText, { color: colors.textMuted }]}>
					暂无排行榜数据
				</Text>
				<TouchableOpacity style={styles.retryButton} onPress={loadTopLists}>
					<Text style={[styles.retryButtonText, { color: colors.primary }]}>
						重试
					</Text>
				</TouchableOpacity>
			</View>
		)
	}

	return (
		<View style={defaultStyles.container}>
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				style={{ paddingHorizontal: screenPadding.horizontal }}
				refreshControl={
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={handleRefresh}
						tintColor={colors.primary}
					/>
				}
			>
				{topLists.map((group, groupIndex) => (
					<View key={groupIndex} style={styles.groupContainer}>
						<Text style={[styles.groupTitle, { color: colors.text }]}>
							{group.title}
						</Text>
						<View style={styles.topListGrid}>
							{group.data.map((topList, index) => (
								<TouchableOpacity
									key={topList.id}
									style={styles.topListItem}
									onPress={() => handleTopListPress(topList)}
								>
									<Image
										source={{
											uri: topList.coverImg || 'https://via.placeholder.com/120x120?text=榜单'
										}}
										style={styles.topListCover}
										defaultSource={{ uri: 'https://via.placeholder.com/120x120?text=榜单' }}
									/>
									<Text
										style={[styles.topListTitle, { color: colors.text }]}
										numberOfLines={2}
									>
										{topList.title}
									</Text>
									{topList.description && (
										<Text
											style={[styles.topListDescription, { color: colors.textMuted }]}
											numberOfLines={1}
										>
											{topList.description}
										</Text>
									)}
									<Text style={[styles.topListPlatform, { color: colors.primary }]}>
										{topList.platform}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>
				))}
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	loadingText: {
		marginTop: 16,
		fontSize: 16,
	},
	emptyText: {
		fontSize: 16,
		textAlign: 'center',
	},
	retryButton: {
		marginTop: 16,
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
	},
	retryButtonText: {
		fontSize: 16,
		fontWeight: '600',
	},
	groupContainer: {
		marginBottom: 24,
	},
	groupTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 16,
		paddingHorizontal: 4,
	},
	topListGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
	},
	topListItem: {
		width: '48%',
		marginBottom: 16,
		padding: 12,
		borderRadius: 12,
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
	},
	topListCover: {
		width: '100%',
		aspectRatio: 1,
		borderRadius: 8,
		marginBottom: 8,
	},
	topListTitle: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 4,
		lineHeight: 18,
	},
	topListDescription: {
		fontSize: 12,
		marginBottom: 4,
		lineHeight: 16,
	},
	topListPlatform: {
		fontSize: 11,
		fontWeight: '500',
	},
})

export default TopListsScreen
