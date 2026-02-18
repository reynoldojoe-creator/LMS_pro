import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useAppTheme } from '../../hooks';

interface LoadingSkeletonProps {
    variant?: 'card' | 'list' | 'text' | 'rect';
    width?: number | string;
    height?: number | string;
    style?: ViewStyle;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
    variant = 'rect',
    width = '100%',
    height = 20,
    style,
}) => {
    const { colors } = useAppTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [opacity]);

    const getVariantStyle = () => {
        switch (variant) {
            case 'card':
                return { borderRadius: 12, height: 120 };
            case 'list':
                return { borderRadius: 8, height: 60, marginBottom: 12 };
            case 'text':
                return { borderRadius: 4, height: 16, marginBottom: 8 };
            default:
                return { borderRadius: 8 };
        }
    };

    const combinedStyle = [
        getVariantStyle(),
        {
            width,
            height: variant === 'text' || variant === 'list' || variant === 'card' ? undefined : height,
            backgroundColor: colors.border, // Use border color or a dedicated skeleton color
            opacity,
        },
        style,
    ];

    return <Animated.View style={combinedStyle as any} />;
};
