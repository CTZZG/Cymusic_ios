import React from 'react';
import { StyleSheet } from 'react-native';
import { ColorKey, colorMap, iconSizeConst } from '@/constants/uiConst';
import { useColors } from '@/hooks/useColors';
import Icon, { IIconName } from './Icon';

interface IIconButtonProps {
    name: IIconName;
    style?: any;
    sizeType?: keyof typeof iconSizeConst;
    fontColor?: ColorKey;
    color?: string;
    onPress?: () => void;
    accessibilityLabel?: string;
}

export default function IconButton(props: IIconButtonProps) {
    const { sizeType = 'normal', fontColor = 'normal', style, color } = props;
    const colors = useColors();
    const size = iconSizeConst[sizeType];

    return (
        <Icon
            {...props}
            color={color ?? colors[colorMap[fontColor]]}
            style={[{ minWidth: size }, styles.textCenter, style]}
            size={size}
        />
    );
}

const styles = StyleSheet.create({
    textCenter: {
        textAlignVertical: 'center',
    },
});
