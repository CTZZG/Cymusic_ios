import { TracksList } from '@/components/TracksList'
import { screenPadding } from '@/constants/tokens'
import { trackTitleFilter } from '@/helpers/filter'
import { generateTracksListId } from '@/helpers/miscellaneous'
import { songsNumsToLoadStore } from '@/helpers/trackPlayerIndex'
import { useNavigationSearch } from '@/hooks/useNavigationSearch'
import { useLibraryStore, useTracks, useTracksLoading } from '@/store/library'
import { defaultStyles } from '@/styles'
import i18n from '@/utils/i18n'
import { useMemo } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
const SongsScreen = () => {
	const search = useNavigationSearch({
		searchBarOptions: {
			placeholder: i18n.t('find.inSongs'),
			cancelButtonText: i18n.t('find.cancel'),
		},
	})

	const tracks = useTracks()
	const songsNumsToLoad = songsNumsToLoadStore.useValue()
	const isLoading = useTracksLoading() // 添加加载状态
	const { fetchTracks } = useLibraryStore()
	const filteredTracks = useMemo(() => {
		if (!search) return tracks
		return tracks.filter(trackTitleFilter(search))
	}, [search, tracks])
	const handleLoadMore = () => {
		fetchTracks()
	}

	if (!tracks.length && isLoading) {
		return (
			<View style={[defaultStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
				<ActivityIndicator size="large" />
			</View>
		)
	}
	return (
		<View style={defaultStyles.container}>
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				style={{ paddingHorizontal: screenPadding.horizontal }}
				onScroll={({ nativeEvent }) => {
					const { layoutMeasurement, contentOffset, contentSize } = nativeEvent
					const paddingToBottom = 20
					const isCloseToBottom =
						layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom

					if (isCloseToBottom) {
						handleLoadMore()
					}
				}}
				scrollEventThrottle={400}
			>
				<TracksList
					id={generateTracksListId('songs', search)}
					tracks={filteredTracks}
					scrollEnabled={false}
					numsToPlay={songsNumsToLoad}
				/>
				{/* {isLoading && tracks.length > 0 && (
					<View
						style={{
							paddingVertical: 0,
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<ActivityIndicator size="large" />
					</View>
				)} */}
			</ScrollView>
		</View>
	)
}

export default SongsScreen
