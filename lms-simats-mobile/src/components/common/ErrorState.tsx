import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../hooks';
import { Ionicons } from '@expo/vector-icons';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
    title?: string;
    icon?: keyof typeof Ionicons.glyphMap;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
    message = 'Something went wrong',
    onRetry,
    title = 'Error',
    icon = 'alert-circle-outline'
}) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon as any} size={48} color={colors.error} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {onRetry && (
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={onRetry}
                    activeOpacity={0.7}
                >
                    <Ionicons name="refresh" size={20} color={colors.textInverse} />
                    <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: colors.background,
    },
    iconContainer: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 50,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    retryText: {
        color: colors.textInverse,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
