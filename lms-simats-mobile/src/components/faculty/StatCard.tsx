import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { typography, spacing, borderRadius } from '../../theme';
import { useAppTheme } from '../../hooks';

interface StatCardProps {
    value: number;
    label: string;
    onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label, onPress }) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const Component = onPress ? TouchableOpacity : View;

    return (
        <Component
            style={styles.card}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <Text style={styles.value} adjustsFontSizeToFit numberOfLines={1}>{value}</Text>
            <Text style={styles.label} adjustsFontSizeToFit numberOfLines={1}>{label}</Text>
        </Component>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 80,
        borderWidth: 1,
        borderColor: colors.border,
    },
    value: {
        ...typography.h1,
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    label: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
