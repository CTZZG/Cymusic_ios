import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// 导入路由配置
import { routes } from '@/core/router/routes';
import { ROUTE_PATH } from '@/core/router';

// 导入组件
import DrawerContent from '@/components/navigation/DrawerContent';
import Home from '@/pages/Home';

// 导入插件管理器
import { PluginManager } from '@/core/pluginManager';

// 导入主题
import { useColors } from '@/hooks/useColors';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// 主页面的Drawer导航器
function HomeDrawerNavigator() {
    return (
        <Drawer.Navigator
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    width: '80%',
                },
            }}
            drawerContent={(props) => <DrawerContent {...props} />}
        >
            <Drawer.Screen name="HOME-MAIN" component={Home} />
        </Drawer.Navigator>
    );
}

// 主Stack导航器
function AppStackNavigator() {
    const colors = useColors();
    
    return (
        <Stack.Navigator
            initialRouteName={ROUTE_PATH.HOME}
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 200,
                contentStyle: { backgroundColor: colors.pageBackground },
            }}
        >
            {/* 主页使用Drawer导航 */}
            <Stack.Screen 
                name={ROUTE_PATH.HOME} 
                component={HomeDrawerNavigator} 
            />
            
            {/* 其他页面使用Stack导航 */}
            {routes
                .filter(route => route.path !== ROUTE_PATH.HOME)
                .map(route => (
                    <Stack.Screen
                        key={route.path}
                        name={route.path}
                        component={route.component}
                    />
                ))
            }
        </Stack.Navigator>
    );
}

// 主题配置
function getNavigationTheme(colors: any) {
    return {
        dark: false,
        colors: {
            primary: colors.primary,
            background: colors.pageBackground,
            card: colors.card,
            text: colors.text,
            border: colors.divider,
            notification: colors.primary,
        },
    };
}

export default function AppNavigator() {
    const colors = useColors();
    
    // 初始化插件系统
    useEffect(() => {
        const initPluginSystem = async () => {
            try {
                console.log('🔌 开始初始化插件系统...');
                await PluginManager.setup();
                console.log('✅ 插件系统初始化完成');
            } catch (error) {
                console.error('❌ 插件系统初始化失败:', error);
            }
        };
        
        initPluginSystem();
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <NavigationContainer theme={getNavigationTheme(colors)}>
                    <AppStackNavigator />
                    <StatusBar style="auto" />
                </NavigationContainer>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
