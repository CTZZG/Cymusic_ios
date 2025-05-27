import { colors, screenPadding } from '@/constants/tokens'
import { pluginRecommendService, RecommendSheet, RecommendSheetTags } from '@/core/pluginManager/recommendService'
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

const RecommendSheetsScreen = () => {
	const [recommendData, setRecommendData] = useState<RecommendSheetTags>({ pinned: [], data: [] })
	const [isLoading, setIsLoading] = useState(true)
	const [isRefreshing, setIsRefreshing] = useState(false)

	const loadRecommendSheets = useCallback(async () => {
		try {
			setIsLoading(true)
			console.log('开始加载推荐歌单...')
			const result = await pluginRecommendService.getAllRecommendSheetTags()
			console.log('推荐歌单加载结果:', result)
			setRecommendData(result)
		} catch (error) {
			console.error('加载推荐歌单失败:', error)
			// 设置默认数据以避免黑屏
			setRecommendData({
				pinned: [],
				data: [{
					title: '测试分类',
					data: [{
						id: 'test-1',
						title: '测试歌单',
						description: '这是一个测试歌单',
						coverImg: 'https://via.placeholder.com/120x120?text=测试',
						platform: '测试插件',
						playCount: '1000'
					}]
				}]
			})
		} finally {
			setIsLoading(false)
		}
	}, [])

	const handleRefresh = useCallback(async () => {
		try {
			setIsRefreshing(true)
			const result = await pluginRecommendService.getAllRecommendSheetTags()
			setRecommendData(result)
		} catch (error) {
			console.error('刷新推荐歌单失败:', error)
		} finally {
			setIsRefreshing(false)
		}
	}, [])

	const handleSheetPress = useCallback((sheet: RecommendSheet) => {
		// 导航到歌单详情页面
		router.push({
			pathname: '/(modals)/sheetDetail',
			params: {
				sheetData: JSON.stringify(sheet),
			},
		})
	}, [])

	useEffect(() => {
		loadRecommendSheets()
	}, [loadRecommendSheets])

	if (isLoading && recommendData.pinned?.length === 0) {
		return (
			<View style={[defaultStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={[styles.loadingText, { color: colors.text }]}>
					正在加载推荐歌单...
				</Text>
			</View>
		)
	}

	const hasData = (recommendData.pinned && recommendData.pinned.length > 0) ||
					(recommendData.data && recommendData.data.length > 0)

	if (!hasData && !isLoading) {
		return (
			<View style={[defaultStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
				<Text style={[styles.emptyText, { color: colors.textMuted }]}>
					暂无推荐歌单数据
				</Text>
				<TouchableOpacity style={styles.retryButton} onPress={loadRecommendSheets}>
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
				{/* 精选歌单 */}
				{recommendData.pinned && recommendData.pinned.length > 0 && (
					<View style={styles.sectionContainer}>
						<Text style={[styles.sectionTitle, { color: colors.text }]}>
							精选歌单
						</Text>
						<View style={styles.sheetGrid}>
							{recommendData.pinned.map((sheet, index) => (
								<TouchableOpacity
									key={sheet.id}
									style={styles.sheetItem}
									onPress={() => handleSheetPress(sheet)}
								>
									<Image
										source={{
											uri: sheet.coverImg || 'https://via.placeholder.com/120x120?text=歌单'
										}}
										style={styles.sheetCover}
										defaultSource={{ uri: 'https://via.placeholder.com/120x120?text=歌单' }}
									/>
									<Text
										style={[styles.sheetTitle, { color: colors.text }]}
										numberOfLines={2}
									>
										{sheet.title}
									</Text>
									{sheet.description && (
										<Text
											style={[styles.sheetDescription, { color: colors.textMuted }]}
											numberOfLines={1}
										>
											{sheet.description}
										</Text>
									)}
									<View style={styles.sheetMeta}>
										{sheet.playCount && (
											<Text style={[styles.sheetMetaText, { color: colors.textMuted }]}>
												播放 {sheet.playCount}
											</Text>
										)}
										<Text style={[styles.sheetPlatform, { color: colors.primary }]}>
											{sheet.platform}
										</Text>
									</View>
								</TouchableOpacity>
							))}
						</View>
					</View>
				)}

				{/* 分类歌单 */}
				{recommendData.data && recommendData.data.map((category, categoryIndex) => (
					<View key={categoryIndex} style={styles.sectionContainer}>
						<Text style={[styles.sectionTitle, { color: colors.text }]}>
							{category.title}
						</Text>
						<View style={styles.sheetGrid}>
							{category.data.map((sheet, index) => (
								<TouchableOpacity
									key={sheet.id}
									style={styles.sheetItem}
									onPress={() => handleSheetPress(sheet)}
								>
									<Image
										source={{
											uri: sheet.coverImg || 'https://via.placeholder.com/120x120?text=歌单'
										}}
										style={styles.sheetCover}
										defaultSource={{ uri: 'https://via.placeholder.com/120x120?text=歌单' }}
									/>
									<Text
										style={[styles.sheetTitle, { color: colors.text }]}
										numberOfLines={2}
									>
										{sheet.title}
									</Text>
									{sheet.description && (
										<Text
											style={[styles.sheetDescription, { color: colors.textMuted }]}
											numberOfLines={1}
										>
											{sheet.description}
										</Text>
									)}
									<View style={styles.sheetMeta}>
										{sheet.playCount && (
											<Text style={[styles.sheetMetaText, { color: colors.textMuted }]}>
												播放 {sheet.playCount}
											</Text>
										)}
										<Text style={[styles.sheetPlatform, { color: colors.primary }]}>
											{sheet.platform}
										</Text>
									</View>
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
	sectionContainer: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 16,
		paddingHorizontal: 4,
	},
	sheetGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
	},
	sheetItem: {
		width: '48%',
		marginBottom: 16,
		padding: 12,
		borderRadius: 12,
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
	},
	sheetCover: {
		width: '100%',
		aspectRatio: 1,
		borderRadius: 8,
		marginBottom: 8,
	},
	sheetTitle: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 4,
		lineHeight: 18,
	},
	sheetDescription: {
		fontSize: 12,
		marginBottom: 6,
		lineHeight: 16,
	},
	sheetMeta: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	sheetMetaText: {
		fontSize: 11,
	},
	sheetPlatform: {
		fontSize: 11,
		fontWeight: '500',
	},
})

export default RecommendSheetsScreen
