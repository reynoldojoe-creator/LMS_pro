import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, View, StyleProp } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

export interface ModernButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    icon?: React.ReactNode;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    style,
    textStyle,
    icon
}) => {

    const getBackgroundColor = () => {
        if (disabled) return colors.systemGray5;
        switch (variant) {
            case 'primary': return colors.blue;
            case 'secondary': return colors.systemGray5;
            case 'destructive': return colors.red;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return colors.blue;
        }
    };

    const getTextColor = () => {
        if (disabled) return colors.systemGray3;
        switch (variant) {
            case 'primary': return colors.textInverse;
            case 'secondary': return colors.blue;
            case 'destructive': return colors.textInverse;
            case 'outline': return colors.blue;
            case 'ghost': return colors.blue;
            default: return colors.textInverse;
        }
    };

    const getBorderColor = () => {
        if (variant === 'outline') return disabled ? colors.systemGray4 : colors.blue;
        return 'transparent';
    };

    const getHeight = () => {
        switch (size) {
            case 'small': return 32;
            case 'medium': return 44;
            case 'large': return 50;
            default: return 44;
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'small': return 15;
            case 'medium': return 17;
            case 'large': return 17;
            default: return 17;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    borderWidth: variant === 'outline' ? 1 : 0,
                    height: getHeight(),
                    paddingHorizontal: size === 'small' ? 12 : 20,
                },
                style
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <View style={styles.contentContainer}>
                    {icon && <View style={styles.iconContainer}>{icon}</View>}
                    <Text
                        style={[
                            styles.text,
                            {
                                color: getTextColor(),
                                fontSize: getFontSize(),
                            },
                            textStyle
                        ]}
                    >
                        {title}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: 6,
    },
    text: {
        ...typography.bodyBold,
        textAlign: 'center',
    },
});
