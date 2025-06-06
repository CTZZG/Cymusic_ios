import NoPlugin from '@/components/base/noPlugin';
import { fontWeightConst } from '@/constants/uiConst';
import PluginManager from '@/core/pluginManager';
import useColors from '@/hooks/useColors';
import rpx, { vw } from '@/utils/rpx';
import React, { useState } from 'react';
import { Text } from 'react-native';
import { TabBar, TabView } from 'react-native-tab-view';
import SheetBody from './sheetBody';

export default function Body() {
    const [index, setIndex] = useState(0);
    const colors = useColors();
    const routes = PluginManager.getSortedPluginsWithAbility('getRecommendSheetsByTag').map(
        _ => ({
            key: _.hash,
            title: _.name,
        }),
    );

    const renderTabBar = (_: any) => (
        <TabBar
            {..._}
            scrollEnabled
            style={{
                backgroundColor: 'transparent',
                shadowColor: 'transparent',
                borderColor: 'transparent',
            }}
            tabStyle={{
                width: 'auto',
            }}
            pressColor="transparent"
            inactiveColor={colors.text}
            activeColor={colors.primary}
            renderLabel={({ route, focused, color }) => (
                <Text
                    numberOfLines={1}
                    style={{
                        width: rpx(160),
                        fontWeight: focused
                            ? fontWeightConst.bolder
                            : fontWeightConst.medium,
                        color,
                        textAlign: 'center',
                    }}>
                    {route.title ?? '(未命名)'}
                </Text>
            )}
            indicatorStyle={{
                backgroundColor: colors.primary,
                height: rpx(4),
            }}
        />
    );

    if (!routes?.length) {
        return <NoPlugin notSupportType="推荐歌单" />;
    }
    return (
        <TabView
            lazy
            navigationState={{
                index,
                routes,
            }}
            renderTabBar={renderTabBar}
            renderScene={props => {
                return <SheetBody hash={props.route.key} />;
            }}
            onIndexChange={setIndex}
            initialLayout={{ width: vw(100) }}
            swipeEnabled={false}
        />
    );
}
