import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import TrackPlayer from 'react-native-track-player';
import Toast from 'react-native-toast-message';

// 导入导航器
import AppNavigator from '@/navigation/AppNavigator';

// 导入服务和配置
import { playbackService } from '@/constants/playbackService';
import i18n, { setI18nConfig } from '@/utils/i18n';

// 防止启动画面自动隐藏
SplashScreen.preventAutoHideAsync();

// 注册播放服务
TrackPlayer.registerPlaybackService(() => playbackService);

// 设置国际化
setI18nConfig();

export default function App() {
    const [appIsReady, setAppIsReady] = useState(false);
    
    // 加载字体
    const [fontsLoaded] = useFonts({
        // 这里可以添加自定义字体
    });

    useEffect(() => {
        async function prepare() {
            try {
                // 这里可以添加其他初始化逻辑
                console.log('🚀 应用初始化开始...');
                
                // 模拟一些初始化时间
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                console.log('✅ 应用初始化完成');
            } catch (e) {
                console.warn('❌ 应用初始化失败:', e);
            } finally {
                setAppIsReady(true);
            }
        }

        prepare();
    }, []);

    const onLayoutRootView = useCallback(async () => {
        if (appIsReady && fontsLoaded) {
            // 隐藏启动画面
            await SplashScreen.hideAsync();
        }
    }, [appIsReady, fontsLoaded]);

    if (!appIsReady || !fontsLoaded) {
        return null;
    }

    return (
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <AppNavigator />
            <Toast />
        </View>
    );
}
