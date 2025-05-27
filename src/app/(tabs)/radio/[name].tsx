import { PlaylistTracksList } from '@/components/PlaylistTracksList'
import { colors, screenPadding } from '@/constants/tokens'
import { getTopListDetail } from '@/helpers/userApi/getMusicSource'
import { usePlaylists } from '@/store/library'
import { defaultStyles } from '@/styles'
import { Redirect, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { Track } from 'react-native-track-player'

const RadioListScreen = () => {
	const { name: playlistName } = useLocalSearchParams<{ name: string }>()
	const { playlists } = usePlaylists()
	const [topListDetail, setTopListDetail] = useState<{ musicList: Track[] } | null>(null)
	const [loading, setLoading] = useState(true)

	const playlist = playlists.find((playlist) => playlist.title === playlistName)

	useEffect(() => {
		const fetchTopListDetail = async () => {
			// console.log(playlistName)
			if (!playlist) {
				console.warn(`Playlist ${playlistName} was not found!`)
				setLoading(false)
				return
			}

			const detail = await getTopListDetail(playlist)
			setTopListDetail(detail)
			// console.log(JSON.stringify(detail));
			setLoading(false)
		}
		fetchTopListDetail()
	}, [])

	if (loading) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: colors.background,
				}}
			>
				<ActivityIndicator size="large" color="#fff" />
			</View>
		)
	}

	if (!playlist || !topListDetail) {
		return <Redirect href={'/(tabs)/radio'} />
	}

	return (
		<View style={defaultStyles.container}>
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				style={{ paddingHorizontal: screenPadding.horizontal }}
			>
				<PlaylistTracksList playlist={playlist} tracks={topListDetail.musicList} />
			</ScrollView>
		</View>
	)
}

export default RadioListScreen
