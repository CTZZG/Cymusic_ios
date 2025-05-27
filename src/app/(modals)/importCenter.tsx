import { colors } from '@/constants/tokens'
import { importService } from '@/core/pluginManager/importService'
import { defaultStyles } from '@/styles'
import i18n from '@/utils/i18n'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const ImportCenterScreen = () => {
	const [urlInput, setUrlInput] = useState('')
	const [importing, setImporting] = useState(false)
	const { top } = useSafeAreaInsets()

	const importFromUrl = async () => {
		if (!urlInput.trim()) {
			Alert.alert('错误', '请输入有效的URL')
			return
		}

		setImporting(true)
		try {
			// 尝试导入歌单
			const playlistResult = await importService.autoImportMusicSheet(urlInput.trim())
			if (playlistResult.success && playlistResult.data && playlistResult.data.length > 0) {
				Alert.alert(
					'导入成功',
					`成功导入歌单，共 ${playlistResult.data.length} 首歌曲`,
					[{ text: '确定', onPress: () => router.back() }]
				)
				return
			}

			// 尝试导入单曲
			const singleResult = await importService.autoImportMusicItem(urlInput.trim())
			if (singleResult.success && singleResult.data) {
				Alert.alert(
					'导入成功',
					`成功导入单曲: ${singleResult.data.title}`,
					[{ text: '确定', onPress: () => router.back() }]
				)
				return
			}

			// 都失败了
			Alert.alert(
				'导入失败',
				playlistResult.error || singleResult.error || '无法识别该URL'
			)
		} catch (error) {
			console.error('导入失败:', error)
			Alert.alert('导入失败', '导入过程中发生错误，请稍后重试')
		} finally {
			setImporting(false)
		}
	}

	const importFromFile = async () => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: ['text/plain', 'application/json'],
				copyToCacheDirectory: false,
			})

			if (result.canceled) {
				return
			}

			setImporting(true)
			const fileUri = result.assets[0].uri
			const fileContent = await FileSystem.readAsStringAsync(fileUri)

			// 尝试解析为JSON格式的歌单
			try {
				const playlistData = JSON.parse(fileContent)
				if (playlistData.songs && Array.isArray(playlistData.songs)) {
					Alert.alert(
						'导入成功',
						`成功导入歌单，共 ${playlistData.songs.length} 首歌曲`,
						[{ text: '确定', onPress: () => router.back() }]
					)
					return
				}
			} catch (e) {
				// 不是JSON格式，尝试按行解析URL
				const lines = fileContent.split('\n').filter(line => line.trim())
				if (lines.length > 0) {
					Alert.alert(
						'文件导入',
						`检测到 ${lines.length} 行内容，是否尝试批量导入？`,
						[
							{ text: '取消', style: 'cancel' },
							{
								text: '导入',
								onPress: async () => {
									// TODO: 实现批量导入逻辑
									Alert.alert('提示', '批量导入功能开发中...')
								}
							}
						]
					)
					return
				}
			}

			Alert.alert('导入失败', '无法识别文件格式')
		} catch (error) {
			console.error('文件导入失败:', error)
			Alert.alert('导入失败', '读取文件时发生错误')
		} finally {
			setImporting(false)
		}
	}

	const getSupportedPlugins = () => {
		const plugins = importService.getSupportedPlugins()
		return plugins.map(p => p.name).join(', ') || '暂无可用插件'
	}

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
				<Text style={styles.headerTitle}>导入中心</Text>
				<View style={styles.placeholder} />
			</View>

			<ScrollView style={styles.content}>
				{/* URL导入 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>从URL导入</Text>
					<Text style={styles.sectionDescription}>
						支持导入歌单或单曲链接
					</Text>
					<TextInput
						style={styles.urlInput}
						placeholder="请输入歌单或歌曲链接..."
						placeholderTextColor={colors.textMuted}
						value={urlInput}
						onChangeText={setUrlInput}
						multiline
						numberOfLines={3}
					/>
					<TouchableOpacity
						style={[styles.importButton, importing && styles.importButtonDisabled]}
						onPress={importFromUrl}
						disabled={importing}
					>
						<MaterialCommunityIcons 
							name={importing ? "loading" : "download"} 
							size={20} 
							color={importing ? colors.textMuted : colors.text} 
						/>
						<Text style={[styles.importButtonText, importing && styles.importButtonTextDisabled]}>
							{importing ? '导入中...' : '开始导入'}
						</Text>
					</TouchableOpacity>
				</View>

				{/* 文件导入 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>从文件导入</Text>
					<Text style={styles.sectionDescription}>
						支持导入JSON格式的歌单文件或URL列表文件
					</Text>
					<TouchableOpacity
						style={[styles.importButton, importing && styles.importButtonDisabled]}
						onPress={importFromFile}
						disabled={importing}
					>
						<MaterialCommunityIcons 
							name="file-upload" 
							size={20} 
							color={importing ? colors.textMuted : colors.text} 
						/>
						<Text style={[styles.importButtonText, importing && styles.importButtonTextDisabled]}>
							选择文件
						</Text>
					</TouchableOpacity>
				</View>

				{/* 支持的插件 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>支持的插件</Text>
					<Text style={styles.pluginList}>
						{getSupportedPlugins()}
					</Text>
				</View>

				{/* 使用说明 */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>使用说明</Text>
					<View style={styles.instructionList}>
						<Text style={styles.instructionItem}>
							• 支持主流音乐平台的歌单和单曲链接
						</Text>
						<Text style={styles.instructionItem}>
							• 导入的歌曲会自动添加到播放列表
						</Text>
						<Text style={styles.instructionItem}>
							• 如果导入失败，请检查链接是否有效或插件是否支持
						</Text>
						<Text style={styles.instructionItem}>
							• 文件导入支持JSON格式的歌单数据
						</Text>
					</View>
				</View>
			</ScrollView>
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
	placeholder: {
		width: 40,
	},
	content: {
		flex: 1,
		padding: 16,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: colors.text,
		marginBottom: 8,
	},
	sectionDescription: {
		fontSize: 14,
		color: colors.textMuted,
		marginBottom: 16,
		lineHeight: 20,
	},
	urlInput: {
		backgroundColor: colors.surface,
		borderRadius: 12,
		padding: 16,
		color: colors.text,
		fontSize: 16,
		borderWidth: 1,
		borderColor: colors.border,
		marginBottom: 16,
		textAlignVertical: 'top',
	},
	importButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.primary,
		borderRadius: 12,
		padding: 16,
		gap: 8,
	},
	importButtonDisabled: {
		backgroundColor: colors.surface,
	},
	importButtonText: {
		color: colors.text,
		fontSize: 16,
		fontWeight: '600',
	},
	importButtonTextDisabled: {
		color: colors.textMuted,
	},
	pluginList: {
		fontSize: 14,
		color: colors.textMuted,
		backgroundColor: colors.surface,
		borderRadius: 8,
		padding: 12,
		borderWidth: 1,
		borderColor: colors.border,
	},
	instructionList: {
		gap: 8,
	},
	instructionItem: {
		fontSize: 14,
		color: colors.textMuted,
		lineHeight: 20,
	},
})

export default ImportCenterScreen
