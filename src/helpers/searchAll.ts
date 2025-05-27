// helpers/searchAll.ts

import { pluginSearchService } from '@/core/pluginManager/searchService'
import { Track } from 'react-native-track-player'

const PAGE_SIZE = 20

type SearchType = 'songs' | 'artists'

const searchAll = async (
	searchText: string,
	page: number = 1,
	type: SearchType = 'songs',
): Promise<{ data: Track[]; hasMore: boolean }> => {
	console.log('插件化搜索:', searchText, 'page:', page, 'type:', type)

	try {
		// 检查是否有可用的搜索插件
		if (!pluginSearchService.hasSearchablePlugins()) {
			console.warn('没有可用的搜索插件，回退到原始搜索');
			// 回退到原始搜索逻辑
			return await fallbackSearch(searchText, page, type);
		}

		// 转换搜索类型
		const pluginSearchType = type === 'songs' ? 'music' : 'artist';

		// 使用插件搜索
		const result = await pluginSearchService.search({
			query: searchText,
			page,
			type: pluginSearchType as any,
		});

		console.log('插件搜索结果:', result);

		return {
			data: result.data,
			hasMore: result.hasMore,
		};
	} catch (error) {
		console.error('插件搜索失败，回退到原始搜索:', error);
		// 出错时回退到原始搜索
		return await fallbackSearch(searchText, page, type);
	}
}

/**
 * 回退搜索逻辑（使用原始API）
 */
async function fallbackSearch(
	searchText: string,
	page: number,
	type: SearchType,
): Promise<{ data: Track[]; hasMore: boolean }> {
	// 动态导入原始搜索函数，避免循环依赖
	const { searchArtist, searchMusic } = await import('@/helpers/userApi/xiaoqiu');

	let result;
	if (type === 'songs') {
		console.log('回退搜索: 歌曲');
		result = await searchMusic(searchText, page, PAGE_SIZE);
	} else {
		console.log('回退搜索: 歌手');
		result = await searchArtist(searchText, page);
		// Transform artist results to Track format
		result.data = result.data.map((artist: any) => ({
			id: artist.id,
			title: artist.name,
			artist: artist.name,
			artwork: artist.avatar,
			isArtist: true,
		})) as Track[];
	}

	const hasMore = result.data.length === PAGE_SIZE;

	return {
		data: result.data as Track[],
		hasMore,
	};
}

export default searchAll
