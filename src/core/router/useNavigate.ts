/**
 * 导航Hook
 */

import { useNavigation } from '@react-navigation/native';
import { ROUTE_PATH, RoutePaths } from './index';

export function useNavigate() {
    const navigation = useNavigation<any>();

    const navigate = (routeName: RoutePaths, params?: any) => {
        navigation.navigate(routeName, params);
    };

    const goBack = () => {
        navigation.goBack();
    };

    const replace = (routeName: RoutePaths, params?: any) => {
        navigation.replace(routeName, params);
    };

    const reset = (routeName: RoutePaths, params?: any) => {
        navigation.reset({
            index: 0,
            routes: [{ name: routeName, params }],
        });
    };

    const openDrawer = () => {
        if (navigation.openDrawer) {
            navigation.openDrawer();
        }
    };

    const closeDrawer = () => {
        if (navigation.closeDrawer) {
            navigation.closeDrawer();
        }
    };

    return {
        navigate,
        goBack,
        replace,
        reset,
        openDrawer,
        closeDrawer,
        navigation,
    };
}
