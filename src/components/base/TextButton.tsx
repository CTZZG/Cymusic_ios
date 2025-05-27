import React from 'react';
import { Pressable } from 'react-native';
import ThemeText from './ThemeText';
import { rpx } from '@/constants/uiConst';
import { CustomizedColors } from '@/hooks/useColors';

interface IButtonProps {
    withHorizontalPadding?: boolean;
    style?: any;
    hitSlop?: number;
    children: string;
    fontColor?: keyof CustomizedColors;
    onPress?: () => void;
}

export default function TextButton(props: IButtonProps) {
    const { children, onPress, fontColor, hitSlop, withHorizontalPadding } = props;
    
    return (
        <Pressable
            {...props}
            style={[
                withHorizontalPadding
                    ? {
                          paddingHorizontal: rpx(24),
                      }
                    : null,
                props.style,
            ]}
            hitSlop={hitSlop ?? (withHorizontalPadding ? 0 : rpx(28))}
            onPress={onPress}
            accessible
            accessibilityLabel={children}>
            <ThemeText fontColor={fontColor}>{children}</ThemeText>
        </Pressable>
    );
}
