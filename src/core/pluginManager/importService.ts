/**
 * 插件化歌单导入服务
 * 负责通过插件导入歌单和单曲
 */

import { Track } from 'react-native-track-player';
import pluginManager from './index';

export interface ImportResult {
	success: boolean;
	data?: Track[];
	error?: string;
	plugin?: string;
}

export interface ImportSingleResult {
	success: boolean;
	data?: Track;
	error?: string;
	plugin?: string;
}

class PluginImportService {
	/**
	 * 获取支持歌单导入的插件列表
	 */
	getSupportedPlugins(): Array<{ name: string; platform: string; hints?: string[] }> {
		const plugins = pluginManager.getEnabledPlugins();
		return plugins
			.filter(plugin => plugin.instance?.importMusicSheet)
			.map(plugin => ({
				name: plugin.name,
				platform: plugin.platform,
				hints: plugin.instance?.hints?.importMusicSheet || []
			}));
	}

	/**
	 * 获取支持单曲导入的插件列表
	 */
	getSupportedSingleImportPlugins(): Array<{ name: string; platform: string; hints?: string[] }> {
		const plugins = pluginManager.getEnabledPlugins();
		return plugins
			.filter(plugin => plugin.instance?.importMusicItem)
			.map(plugin => ({
				name: plugin.name,
				platform: plugin.platform,
				hints: plugin.instance?.hints?.importMusicItem || []
			}));
	}

	/**
	 * 通过指定插件导入歌单
	 */
	async importMusicSheetByPlugin(
		pluginName: string,
		urlLike: string
	): Promise<ImportResult> {
		try {
			const plugin = pluginManager.getByName(pluginName);
			if (!plugin) {
				return {
					success: false,
					error: `插件 ${pluginName} 不存在`
				};
			}

			if (!plugin.instance?.importMusicSheet) {
				return {
					success: false,
					error: `插件 ${pluginName} 不支持歌单导入`
				};
			}

			console.log(`开始通过插件 ${pluginName} 导入歌单: ${urlLike}`);

			const result = await plugin.methods.importMusicSheet(urlLike);

			if (!result || result.length === 0) {
				return {
					success: false,
					error: '导入失败：未找到歌曲或歌单为空',
					plugin: pluginName
				};
			}

			// 转换数据格式
			const tracks: Track[] = result.map((item: any) => ({
				id: item.id || `${item.platform}-${item.title}-${item.artist}`,
				title: item.title || '未知标题',
				artist: item.artist || '未知艺术家',
				album: item.album || '未知专辑',
				artwork: item.artwork || item.coverImg,
				url: item.url || '',
				platform: item.platform || pluginName,
				duration: item.duration,
				originalData: item
			}));

			console.log(`插件 ${pluginName} 成功导入 ${tracks.length} 首歌曲`);

			return {
				success: true,
				data: tracks,
				plugin: pluginName
			};

		} catch (error) {
			console.error(`插件 ${pluginName} 导入歌单失败:`, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : '导入失败',
				plugin: pluginName
			};
		}
	}

	/**
	 * 通过指定插件导入单曲
	 */
	async importMusicItemByPlugin(
		pluginName: string,
		urlLike: string
	): Promise<ImportSingleResult> {
		try {
			const plugin = pluginManager.getByName(pluginName);
			if (!plugin) {
				return {
					success: false,
					error: `插件 ${pluginName} 不存在`
				};
			}

			if (!plugin.instance?.importMusicItem) {
				return {
					success: false,
					error: `插件 ${pluginName} 不支持单曲导入`
				};
			}

			console.log(`开始通过插件 ${pluginName} 导入单曲: ${urlLike}`);

			const result = await plugin.methods.importMusicItem(urlLike);

			if (!result) {
				return {
					success: false,
					error: '导入失败：未找到歌曲',
					plugin: pluginName
				};
			}

			// 转换数据格式
			const track: Track = {
				id: result.id || `${result.platform}-${result.title}-${result.artist}`,
				title: result.title || '未知标题',
				artist: result.artist || '未知艺术家',
				album: result.album || '未知专辑',
				artwork: result.artwork || result.coverImg,
				url: result.url || '',
				platform: result.platform || pluginName,
				duration: result.duration,
				originalData: result
			};

			console.log(`插件 ${pluginName} 成功导入单曲: ${track.title}`);

			return {
				success: true,
				data: track,
				plugin: pluginName
			};

		} catch (error) {
			console.error(`插件 ${pluginName} 导入单曲失败:`, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : '导入失败',
				plugin: pluginName
			};
		}
	}

	/**
	 * 自动检测并导入歌单（尝试所有支持的插件）
	 */
	async autoImportMusicSheet(urlLike: string): Promise<ImportResult> {
		const supportedPlugins = this.getSupportedPlugins();

		if (supportedPlugins.length === 0) {
			return {
				success: false,
				error: '没有找到支持歌单导入的插件'
			};
		}

		// 尝试每个插件
		for (const plugin of supportedPlugins) {
			try {
				const result = await this.importMusicSheetByPlugin(plugin.name, urlLike);
				if (result.success && result.data && result.data.length > 0) {
					return result;
				}
			} catch (error) {
				console.log(`插件 ${plugin.name} 导入失败，尝试下一个插件`);
				continue;
			}
		}

		return {
			success: false,
			error: '所有插件都无法导入该歌单'
		};
	}

	/**
	 * 自动检测并导入单曲（尝试所有支持的插件）
	 */
	async autoImportMusicItem(urlLike: string): Promise<ImportSingleResult> {
		const supportedPlugins = this.getSupportedSingleImportPlugins();

		if (supportedPlugins.length === 0) {
			return {
				success: false,
				error: '没有找到支持单曲导入的插件'
			};
		}

		// 尝试每个插件
		for (const plugin of supportedPlugins) {
			try {
				const result = await this.importMusicItemByPlugin(plugin.name, urlLike);
				if (result.success && result.data) {
					return result;
				}
			} catch (error) {
				console.log(`插件 ${plugin.name} 导入失败，尝试下一个插件`);
				continue;
			}
		}

		return {
			success: false,
			error: '所有插件都无法导入该单曲'
		};
	}

	/**
	 * 验证URL是否可能是歌单链接
	 */
	validatePlaylistUrl(url: string): boolean {
		// 基本的URL格式验证
		try {
			new URL(url);
			return true;
		} catch {
			// 可能是其他格式的标识符
			return url.length > 0 && url.trim().length > 0;
		}
	}

	/**
	 * 获取插件的导入提示信息
	 */
	getImportHints(pluginName: string): { playlist?: string[]; single?: string[] } {
		const plugin = pluginManager.getByName(pluginName);
		if (!plugin?.instance?.hints) {
			return {};
		}

		return {
			playlist: plugin.instance.hints.importMusicSheet,
			single: plugin.instance.hints.importMusicItem
		};
	}
}

export const pluginImportService = new PluginImportService();
