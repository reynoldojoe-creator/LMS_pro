import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface Props {
    message: string;
    type?: 'warning' | 'info' | 'error';
}

export const CoverageWarning = ({ message, type = 'warning' }: Props) => {
    const getColor = () => {
        switch (type) {
            case 'error': return colors.error;
            case 'info': return colors.iosBlue;
            default: return colors.warning;
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'error': return '✗';
            case 'info': return 'ℹ️';
            default: return '⚠️';
        }
    };

    const color = getColor();

    return (
        <View style={[styles.container, { backgroundColor: color + '15', borderColor: color + '30' }]}>
            <Text style={styles.icon}>{getIcon()}</Text>
            <Text style={[styles.message, { color: colors.textPrimary }]}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        marginTop: spacing.sm,
    },
    icon: {
        fontSize: 16,
        marginRight: spacing.sm,
    },
    message: {
        ...typography.caption,
        flex: 1,
    },
});
