import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface Props {
    label: string;
    value: number;
    maxValue?: number;
    color?: string;
    showPercentage?: boolean;
}

export const HorizontalBarChart = ({
    label,
    value,
    maxValue = 100,
    color = colors.primary,
    showPercentage = false,
}: Props) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    const displayValue = showPercentage ? `${Math.round(percentage)}%` : value;

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.barContainer}>
                <View style={[styles.bar, { width: `${percentage}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.value}>{displayValue}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.sm,
    },
    label: {
        ...typography.body,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    barContainer: {
        height: 24,
        backgroundColor: colors.iosGray5,
        borderRadius: borderRadius.sm,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    bar: {
        height: '100%',
    },
    value: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'right',
    },
});
