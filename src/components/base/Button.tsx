import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle, GestureResponderEvent } from 'react-native';
import ThemeText from './ThemeText';
import { useColors } from '@/hooks/useColors';
import { rpx } from '@/constants/uiConst';

export function Button(props: {
    type?: 'normal' | 'primary';
    text: string;
    style?: StyleProp<ViewStyle>;
    onPress?: (evt: GestureResponderEvent) => void;
}) {
    const { type = 'normal', text, style, onPress } = props;
    const colors = useColors();

    return (
        <TouchableOpacity
            activeOpacity={0.6}
            onPress={onPress}
            style={[
                styles.bottomBtn,
                {
                    backgroundColor:
                        type === 'normal' ? colors.placeholder : colors.primary,
                },
                style,
            ]}>
            <ThemeText color={type === 'normal' ? undefined : 'white'}>
                {text}
            </ThemeText>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    bottomBtn: {
        borderRadius: rpx(8),
        flexShrink: 0,
        justifyContent: 'center',
        alignItems: 'center',
        height: rpx(72),
    },
});
