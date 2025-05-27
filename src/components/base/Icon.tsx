import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 图标名称映射 - 将MusicFree的图标名称映射到Ionicons
const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    'bars-3': 'menu',
    'magnifying-glass': 'search',
    'play': 'play',
    'pause': 'pause',
    'skip-left': 'play-skip-back',
    'skip-right': 'play-skip-forward',
    'playlist': 'list',
    'heart': 'heart',
    'heart-outline': 'heart-outline',
    'download': 'download',
    'share': 'share',
    'more': 'ellipsis-horizontal',
    'x-mark': 'close',
    'plus': 'add',
    'minus': 'remove',
    'chevron-left': 'chevron-back',
    'chevron-right': 'chevron-forward',
    'chevron-up': 'chevron-up',
    'chevron-down': 'chevron-down',
    'cog': 'settings',
    'folder': 'folder',
    'musical-note': 'musical-note',
    'user': 'person',
    'home': 'home',
    'search': 'search',
    'library': 'library',
    'radio': 'radio',
};

export type IIconName = keyof typeof iconMap;

interface IIconProps {
    name: IIconName;
    size?: number;
    color?: string;
    onPress?: () => void;
    style?: any;
    accessible?: boolean;
    accessibilityLabel?: string;
}

export default function Icon(props: IIconProps) {
    const { 
        name, 
        size = 24, 
        color = '#000', 
        onPress, 
        style,
        accessible = true,
        accessibilityLabel 
    } = props;

    const ioniconsName = iconMap[name] || 'help-circle';

    const iconElement = (
        <Ionicons 
            name={ioniconsName} 
            size={size} 
            color={color} 
            style={style}
        />
    );

    if (onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
                style={styles.touchable}
                accessible={accessible}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="button"
            >
                {iconElement}
            </TouchableOpacity>
        );
    }

    return iconElement;
}

const styles = StyleSheet.create({
    touchable: {
        padding: 4,
    },
});
