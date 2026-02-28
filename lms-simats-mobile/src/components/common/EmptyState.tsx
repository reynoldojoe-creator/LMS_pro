import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useAppTheme } from '../../hooks';
import { Button } from './Button';

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon = '📭',
    title,
    description,
    actionLabel,
    onAction,
}) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    return (
        <View style={styles.container}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.title}>{title}</Text>
            {description && <Text style={styles.description}>{description}</Text>}
            {actionLabel && onAction && (
                <View style={styles.action}>
                    <Button title={actionLabel} onPress={onAction} variant="primary" />
                </View>
            )}
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    icon: {
        fontSize: 64,
        marginBottom: spacing.lg,
        color: colors.textPrimary,
    },
    title: {
        ...typography.h2,
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    description: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    action: {
        marginTop: spacing.md,
    },
});
