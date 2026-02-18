import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
} from 'react-native';
import { typography, spacing} from '../../theme';
import { useAppTheme } from '../../hooks';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    style?: object;
    textStyle?: object;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    icon,
    rightIcon,
    style,
    textStyle: userTextStyle,
}) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    const buttonStyle = [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
    ];

    const textStyle = [
        styles.text,
        styles[`text_${variant}`],
        size === 'lg' ? styles.textSize_lg : (size === 'sm' ? styles.textSize_sm : styles.textSize_md),
        disabled && styles.textDisabled,
        userTextStyle,
    ];

    // Gloss effect only for primary/danger
    const showGloss = !disabled && !loading && (variant === 'primary' || variant === 'danger');

    return (
        <TouchableOpacity
            style={buttonStyle}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {showGloss && <View style={styles.glossOverlay} />}

            {loading ? (
                <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? colors.textInverse : colors.primary} />
            ) : (
                <View style={styles.content}>
                    {icon && <View style={styles.icon}>{icon}</View>}
                    <Text style={textStyle}>{title}</Text>
                    {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
                </View>
            )}
        </TouchableOpacity>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
: 12, // Increased radius
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 2, // Above gloss
    },
    icon: {
        marginRight: spacing.sm,
    },
    rightIcon: {
        marginLeft: spacing.sm,
    },
    glossOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255, 0.15)',
        height: '50%', // Top half highlight
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },

    // Variants
    primary: {
        backgroundColor: colors.primary,
        borderColor: colors.primaryDark,
        borderTopColor: colors.primaryLight, // Simulate light source
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 1,
        elevation: 2,
    },
    secondary: {
        backgroundColor: colors.iosGray6,
        borderColor: colors.border,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    danger: {
        backgroundColor: colors.error,
        borderColor: '#B00020',
        borderTopColor: '#FF6B6B',
    },

    // Sizes
    size_sm: {
        height: 36,
        paddingHorizontal: spacing.md,
    },
    size_md: {
        height: 44,
        paddingHorizontal: spacing.lg,
    },
    size_lg: {
        height: 50,
        paddingHorizontal: spacing.xl,
    },

    // Text
    text: {
        ...typography.bodyBold,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: -1 }, // Etched text
        textShadowRadius: 0,
    },
    text_primary: {
        color: colors.textInverse,
    },
    text_secondary: {
        color: colors.textPrimary,
        textShadowColor: 'rgba(255,255,255,0.5)',
        textShadowOffset: { width: 0, height: 1 },
    },
    text_outline: {
        color: colors.primary,
        textShadowColor: 'transparent',
    },
    text_ghost: {
        color: colors.primary,
        textShadowColor: 'transparent',
    },
    text_danger: {
        color: colors.textInverse,
    },

    textSize_sm: {
        fontSize: 15,
    },
    textSize_md: {
        fontSize: 17,
    },
    textSize_lg: {
        fontSize: 19,
    },

    // States
    disabled: {
        backgroundColor: colors.disabled,
        borderColor: colors.border,
        shadowOpacity: 0,
        borderTopColor: 'transparent',
    },
    textDisabled: {
        color: colors.textTertiary,
        textShadowColor: 'transparent',
    },
    fullWidth: {
        width: '100%',
    },
});
