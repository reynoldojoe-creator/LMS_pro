import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing} from '../../theme';

interface Props {
    value: string | number;
    label: string;
    color?: string;
}

export const StatBox = ({ value, label, color = colors.primary }: Props) => {
    return (
        <View style={styles.container}>
            <Text
                style={[styles.value, { color }]}
                adjustsFontSizeToFit
                numberOfLines={1}
            >
                {value}
            </Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
        padding: spacing.md,  // Reduced from lg to prevent squeeze
: 16,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    value: {
        ...typography.h1,
        marginBottom: spacing.xs,
    },
    label: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
