import { colors } from '@/constants/tokens'
import pluginManager from '@/core/pluginManager'
import { defaultStyles } from '@/styles'
import i18n from '@/utils/i18n'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
	Alert,
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface PluginInfo {
	name: string
	platform: string
	state: string
	errorReason?: string
	hash: string
}

const PluginManagerScreen = () => {
	const [plugins, setPlugins] = useState<PluginInfo[]>([])
	const [refreshing, setRefreshing] = useState(false)
	const { top } = useSafeAreaInsets()

	const loadPlugins = () => {
		try {
			const enabledPlugins = pluginManager.getEnabledPlugins()
			const pluginList = enabledPlugins.map(plugin => ({
				name: plugin.name,
				platform: plugin.platform,
				state: plugin.state,
				errorReason: plugin.errorReason,
				hash: plugin.hash,
			}))
			setPlugins(pluginList)
		} catch (error) {
			console.error('加载插件列表失败:', error)
			setPlugins([])
		}
	}

	useEffect(() => {
		loadPlugins()
	}, [])

	const onRefresh = async () => {
		setRefreshing(true)
		try {
			// 重新加载插件
			loadPlugins()
		} catch (error) {
			console.error('刷新插件列表失败:', error)
		} finally {
			setRefreshing(false)
		}
	}

	const handleAddPlugin = () => {
		Alert.alert(
			'添加插件',
			'选择添加插件的方式',
			[
				{
					text: '从文件导入',
					onPress: () => {
						// TODO: 实现文件导入功能
						Alert.alert('提示', '文件导入功能开发中...')
					},
				},
				{
					text: '从URL导入',
					onPress: () => {
						// TODO: 实现URL导入功能
						Alert.alert('提示', 'URL导入功能开发中...')
					},
				},
				{
					text: '取消',
					style: 'cancel',
				},
			]
		)
	}

	const handlePluginAction = (plugin: PluginInfo) => {
		Alert.alert(
			plugin.name,
			`平台: ${plugin.platform}\n状态: ${plugin.state}${plugin.errorReason ? `\n错误: ${plugin.errorReason}` : ''}`,
			[
				{
					text: '删除插件',
					style: 'destructive',
					onPress: () => {
						Alert.alert(
							'确认删除',
							`确定要删除插件 "${plugin.name}" 吗？`,
							[
								{
									text: '取消',
									style: 'cancel',
								},
								{
									text: '删除',
									style: 'destructive',
									onPress: () => {
										// TODO: 实现删除插件功能
										Alert.alert('提示', '删除插件功能开发中...')
									},
								},
							]
						)
					},
				},
				{
					text: '重新加载',
					onPress: () => {
						// TODO: 实现重新加载插件功能
						Alert.alert('提示', '重新加载插件功能开发中...')
					},
				},
				{
					text: '取消',
					style: 'cancel',
				},
			]
		)
	}

	const getStatusColor = (state: string) => {
		switch (state) {
			case 'enabled':
			case 'active':
				return '#4CAF50'
			case 'error':
				return '#F44336'
			case 'loading':
				return '#FF9800'
			default:
				return '#9E9E9E'
		}
	}

	const getStatusText = (state: string) => {
		switch (state) {
			case 'enabled':
			case 'active':
				return '正常'
			case 'error':
				return '错误'
			case 'loading':
				return '加载中'
			default:
				return '未知'
		}
	}

	const renderPluginItem = ({ item }: { item: PluginInfo }) => (
		<TouchableOpacity
			style={styles.pluginItem}
			onPress={() => handlePluginAction(item)}
		>
			<View style={styles.pluginInfo}>
				<Text style={styles.pluginName}>{item.name}</Text>
				<Text style={styles.pluginPlatform}>{item.platform}</Text>
				{item.errorReason && (
					<Text style={styles.pluginError} numberOfLines={2}>
						{item.errorReason}
					</Text>
				)}
			</View>
			<View style={styles.pluginStatus}>
				<View
					style={[
						styles.statusIndicator,
						{ backgroundColor: getStatusColor(item.state) },
					]}
				/>
				<Text style={styles.statusText}>{getStatusText(item.state)}</Text>
			</View>
		</TouchableOpacity>
	)

	const renderEmptyState = () => (
		<View style={styles.emptyState}>
			<MaterialCommunityIcons
				name="puzzle-outline"
				size={64}
				color={colors.textMuted}
			/>
			<Text style={styles.emptyTitle}>暂无插件</Text>
			<Text style={styles.emptySubtitle}>
				点击右上角的 + 按钮添加插件
			</Text>
		</View>
	)

	return (
		<View style={[defaultStyles.container, { paddingTop: top }]}>
			{/* 标题栏 */}
			<View style={styles.header}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>插件管理</Text>
				<TouchableOpacity
					style={styles.addButton}
					onPress={handleAddPlugin}
				>
					<MaterialCommunityIcons name="plus" size={24} color={colors.text} />
				</TouchableOpacity>
			</View>

			{/* 插件列表 */}
			<FlatList
				data={plugins}
				renderItem={renderPluginItem}
				keyExtractor={(item) => item.hash}
				contentContainerStyle={styles.listContainer}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor={colors.primary}
					/>
				}
				ListEmptyComponent={renderEmptyState}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	backButton: {
		padding: 8,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: colors.text,
	},
	addButton: {
		padding: 8,
	},
	listContainer: {
		flexGrow: 1,
		padding: 16,
	},
	pluginItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.surface,
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: colors.border,
	},
	pluginInfo: {
		flex: 1,
	},
	pluginName: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.text,
		marginBottom: 4,
	},
	pluginPlatform: {
		fontSize: 14,
		color: colors.textMuted,
		marginBottom: 4,
	},
	pluginError: {
		fontSize: 12,
		color: '#F44336',
		fontStyle: 'italic',
	},
	pluginStatus: {
		alignItems: 'center',
		gap: 4,
	},
	statusIndicator: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	statusText: {
		fontSize: 12,
		color: colors.textMuted,
	},
	emptyState: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 64,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: colors.text,
		marginTop: 16,
		marginBottom: 8,
	},
	emptySubtitle: {
		fontSize: 14,
		color: colors.textMuted,
		textAlign: 'center',
		lineHeight: 20,
	},
})

export default PluginManagerScreen
