import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 响应式像素单位
export function rpx(px: number): number {
    return (px * screenWidth) / 750;
}

// 字体大小常量
export const fontSizeConst = {
    tiny: rpx(20),
    subTitle: rpx(24),
    content: rpx(28),
    title: rpx(32),
    appbar: rpx(36),
    large: rpx(40),
    huge: rpx(48),
} as const;

// 字体粗细常量
export const fontWeightConst = {
    thin: '100',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
    black: '900',
} as const;

// 图标大小常量
export const iconSizeConst = {
    tiny: rpx(24),
    light: rpx(32),
    normal: rpx(48),
    large: rpx(56),
    huge: rpx(72),
} as const;

// 颜色键类型
export type ColorKey = 'normal' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

// 颜色映射
export const colorMap: Record<ColorKey, keyof CustomizedColors> = {
    normal: 'text',
    primary: 'primary',
    secondary: 'textSecondary',
    success: 'success',
    danger: 'danger',
    warning: 'primary', // 暂时使用primary
    info: 'info',
};

// 自定义颜色类型
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
