import { useColorScheme } from 'react-native';
import Color from 'color';

export interface CustomizedColors {
    text: string;
    textSecondary: string;
    primary: string;
    pageBackground: string;
    shadow: string;
    appBar: string;
    appBarText: string;
    musicBar: string;
    musicBarText: string;
    divider: string;
    listActive: string;
    mask: string;
    backdrop: string;
    tabBar: string;
    placeholder: string;
    success: string;
    danger: string;
    info: string;
    card: string;
    background: string;
}

const lightTheme: CustomizedColors = {
    text: '#333333',
    textSecondary: Color('#333333').alpha(0.7).toString(),
    primary: '#f17d34',
    pageBackground: '#fafafa',
    shadow: '#000',
    appBar: '#f17d34',
    appBarText: '#fefefe',
    musicBar: '#f2f2f2',
    musicBarText: '#333333',
    divider: 'rgba(0,0,0,0.1)',
    listActive: 'rgba(0,0,0,0.1)',
    mask: 'rgba(51,51,51,0.2)',
    backdrop: '#f0f0f0',
    tabBar: '#f0f0f0',
    placeholder: '#eaeaea',
    success: '#08A34C',
    danger: '#FC5F5F',
    info: '#0A95C8',
    card: '#e2e2e288',
    background: '#fafafa',
};

const darkTheme: CustomizedColors = {
    text: '#ffffff',
    textSecondary: Color('#ffffff').alpha(0.7).toString(),
    primary: '#f17d34',
    pageBackground: '#121212',
    shadow: '#000',
    appBar: '#1f1f1f',
    appBarText: '#ffffff',
    musicBar: '#1f1f1f',
    musicBarText: '#ffffff',
    divider: 'rgba(255,255,255,0.1)',
    listActive: 'rgba(255,255,255,0.1)',
    mask: 'rgba(0,0,0,0.5)',
    backdrop: '#1f1f1f',
    tabBar: '#1f1f1f',
    placeholder: '#333333',
    success: '#08A34C',
    danger: '#FC5F5F',
    info: '#0A95C8',
    card: '#2a2a2a88',
    background: '#121212',
};

export function useColors(): CustomizedColors {
    const colorScheme = useColorScheme();
    return colorScheme === 'dark' ? darkTheme : lightTheme;
}

export { CustomizedColors };
