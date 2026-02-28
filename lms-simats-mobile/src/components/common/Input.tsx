import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput as RNTextInput,
    StyleSheet,
    TouchableOpacity,
    TextInputProps as RNTextInputProps,
    Platform,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends RNTextInputProps {
    label?: string;
    error?: string;
    variant?: 'default' | 'filled' | 'outline';
    showClearButton?: boolean;
    onClear?: () => void;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap; // Or custom node if needed, but keeping simple for now
    onRightIconPress?: () => void;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    variant = 'filled', // Modern iOS default is often filled (gray background)
    showClearButton = false,
    onClear,
    value,
    leftIcon,
    rightIcon,
    onRightIconPress,
    style,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View style={[
                styles.inputContainer,
                variant === 'filled' && styles.filledContainer,
                variant === 'outline' && styles.outlineContainer,
                isFocused && variant === 'outline' && styles.focusedOutline,
                !!error && styles.errorContainer,
            ]}>
                {leftIcon && (
                    <Ionicons
                        name={leftIcon as any}
                        size={20}
                        color={colors.textSecondary}
                        style={styles.leftIcon}
                    />
                )}

                <RNTextInput
                    style={[
                        styles.input,
                        (leftIcon ? { paddingLeft: 0 } : { paddingLeft: spacing.md }),
                        style
                    ]}
                    placeholderTextColor={colors.textTertiary}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    value={value}
                    selectionColor={colors.blue}
                    {...props}
                />

                {showClearButton && value ? (
                    <TouchableOpacity onPress={onClear} style={styles.rightAction}>
                        <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                ) : rightIcon ? (
                    <TouchableOpacity onPress={onRightIconPress} disabled={!onRightIconPress} style={styles.rightAction}>
                        <Ionicons name={rightIcon as any} size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                ) : null}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.caption1,
        color: colors.text,
        marginBottom: 6,
        fontWeight: '500',
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
    filledContainer: {
        backgroundColor: colors.systemGray6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    outlineContainer: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.systemGray4,
    },
    focusedOutline: {
        borderColor: colors.blue,
    },
    errorContainer: {
        borderColor: colors.red,
        borderWidth: 1,
    },
    input: {
        flex: 1,
        height: '100%',
        ...typography.body,
        color: colors.text,
        paddingRight: spacing.md,
    },
    leftIcon: {
        marginLeft: spacing.md,
        marginRight: spacing.sm,
    },
    rightAction: {
        paddingHorizontal: spacing.md,
        height: '100%',
        justifyContent: 'center',
    },
    errorText: {
        ...typography.caption1,
        color: colors.red,
        marginTop: 4,
        marginLeft: 4,
    },
});
