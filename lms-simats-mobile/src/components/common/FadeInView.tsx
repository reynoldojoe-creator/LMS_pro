import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface FadeInViewProps {
    children: React.ReactNode;
    style?: ViewStyle;
    duration?: number;
    delay?: number;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
    children,
    style,
    duration = 500,
    delay = 0,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: duration,
            delay: delay,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim, duration, delay]);

    return (
        <Animated.View
            style={{
                ...style,
                opacity: fadeAnim,
                transform: [
                    {
                        translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0], // Slide up slightly
                        }),
                    },
                ],
            }}
        >
            {children}
        </Animated.View>
    );
};
