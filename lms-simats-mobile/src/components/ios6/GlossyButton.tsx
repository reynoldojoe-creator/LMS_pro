import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

type ButtonVariant = 'blue' | 'red' | 'green' | 'gray' | 'orange';

interface GlossyButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
    size?: 'small' | 'medium' | 'large';
}

const getGradient = (variant: ButtonVariant, disabled: boolean): readonly [string, string, ...string[]] => {
    if (disabled) return ['#AUAUA', '#8E8E93']; // Fallback for disabled, though we usually just lower opacity

    switch (variant) {
        case 'blue': return colors.ios.blueGradient as any;
        case 'red': return colors.ios.redGradient as any;
        case 'green': return colors.ios.greenGradient as any;
        case 'orange': return colors.ios.orangeGradient as any;
        case 'gray': default: return colors.ios.grayGradient as any;
    }
};

const getBorderColor = (variant: ButtonVariant): string => {
    switch (variant) {
        case 'blue': return '#204060';
        case 'red': return '#800000';
        case 'green': return '#006000';
        case 'orange': return '#CC8400';
        case 'gray': default: return '#999999';
    }
};

const getTextColor = (variant: ButtonVariant): string => {
    if (variant === 'gray') return '#000000';
    return '#FFFFFF';
};

const getTextShadow = (variant: ButtonVariant): object => {
    if (variant === 'gray') {
        return { textShadowColor: 'rgba(255, 255, 255, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 0 };
    }
    return { textShadowColor: 'rgba(0, 0, 0, 0.4)', textShadowOffset: { width: 0, height: -1 }, textShadowRadius: 0 };
};

export const GlossyButton: React.FC<GlossyButtonProps> = ({
    title,
    onPress,
    variant = 'gray',
    style,
    textStyle,
    disabled = false,
    size = 'medium'
}) => {
    const gradientColors = getGradient(variant, disabled);
    const borderColor = getBorderColor(variant);
    const textColor = getTextColor(variant);
    const textShadow = getTextShadow(variant);

    const height = size === 'small' ? 30 : size === 'large' ? 50 : 44;
    const fontSize = size === 'small' ? 13 : size === 'large' ? 18 : 16;
    const paddingHorizontal = size === 'small' ? 10 : 20;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
            style={[
                styles.container,
                { height, borderColor, opacity: disabled ? 0.6 : 1 },
                style
            ]}
        >
            <LinearGradient
                colors={gradientColors}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                {/* Inner Highlight (Gloss) */}
                <LinearGradient
                    colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
                    style={styles.gloss}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                />

                <Text style={[
                    styles.text,
                    { color: textColor, fontSize },
                    textShadow,
                    textStyle
                ]}>
                    {title}
                </Text>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderRadius: 5,
        overflow: 'hidden',
        // iOS 6 buttons had a minimal shadow under the button itself sometimes, but mostly relied on the gradient
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 1,
        shadowOpacity: 1,
        backgroundColor: 'transparent' // vital for shadow
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    gloss: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%', // Top half gloss
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    text: {
        fontWeight: 'bold',
        backgroundColor: 'transparent',
        zIndex: 1,
    }
});
