import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface ToastProps {
    visible: boolean;
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onHide?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
    visible,
    message,
    type = 'info',
    duration = 3000,
    onHide,
}) => {
    const translateY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 8,
                }),
                Animated.delay(duration),
                Animated.timing(translateY, {
                    toValue: -100,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                onHide?.();
            });
        }
    }, [visible]);

    if (!visible) return null;

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return colors.success;
            case 'error':
                return colors.error;
            case 'info':
                return colors.info;
            default:
                return colors.textPrimary;
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']} pointerEvents="none">
            <Animated.View
                style={[
                    styles.toast,
                    { backgroundColor: getBackgroundColor(), transform: [{ translateY }] },
                ]}
            >
                <Text style={styles.message}>{message}</Text>
            </Animated.View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
    },
    toast: {
        marginHorizontal: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    message: {
        ...typography.bodyBold,
        color: colors.textInverse,
        textAlign: 'center',
    },
});
