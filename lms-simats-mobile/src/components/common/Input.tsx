import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput as RNTextInput,
    StyleSheet,
    TouchableOpacity,
    TextInputProps as RNTextInputProps,
} from 'react-native';
import { typography, spacing } from '../../theme';
import { useAppTheme } from '../../hooks';

interface InputProps extends RNTextInputProps {
    label?: string;
    error?: string;
    variant?: 'default' | 'search' | 'multiline';
    showClearButton?: boolean;
    onClear?: () => void;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    variant = 'default',
    showClearButton = false,
    onClear,
    value,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View style={styles.inputWrapper}>
                <RNTextInput
                    style={[
                        styles.input,
                        variant === 'multiline' && styles.multiline,
                        variant === 'search' && styles.search,
                        isFocused && styles.focused,
                        error && styles.inputError,
                    ]}
                    placeholderTextColor={colors.textTertiary}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    value={value}
                    multiline={variant === 'multiline'}
                    {...props}
                />

                {showClearButton && value && (
                    <TouchableOpacity style={styles.clearButton} onPress={onClear}>
                        <Text style={styles.clearText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.captionBold,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
    },
    inputWrapper: {
        position: 'relative',
    },
    input: {
        ...typography.body,
        height: 44,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: spacing.sm,
        paddingRight: spacing.xl,
        color: colors.textPrimary,
    },
    multiline: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: spacing.sm,
    },
    search: {
        backgroundColor: colors.iosGray6,
        borderRadius: 10,
        borderBottomWidth: 0,
        paddingHorizontal: spacing.md,
    },
    focused: {
        borderBottomColor: colors.primary,
    },
    inputError: {
        borderBottomColor: colors.error,
    },
    clearButton: {
        position: 'absolute',
        right: spacing.sm,
        top: 0,
        height: 44,
        justifyContent: 'center',
        paddingHorizontal: spacing.sm,
    },
    clearText: {
        color: colors.textTertiary,
        fontSize: 18,
    },
    errorText: {
        ...typography.caption,
        color: colors.error,
        marginTop: spacing.xs,
    },
});
