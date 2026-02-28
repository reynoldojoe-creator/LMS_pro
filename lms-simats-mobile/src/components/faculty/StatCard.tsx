import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { colors } from '../../theme/colors';

interface StatCardProps {
    value: number | string;
    label: string;
    onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label, onPress }) => {
    const Component = onPress ? TouchableOpacity : View;

    return (
        <Component
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            style={styles.container}
        >
            <View style={styles.content}>
                <Text
                    style={styles.value}
                >
                    {String(value)}
                </Text>
                <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
            </View>
        </Component>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
        minHeight: 88,
        justifyContent: 'center',

        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    content: {
        padding: spacing.md,
        alignItems: 'center',
    },
    value: {
        ...typography.h1,
        fontSize: 36,
        color: colors.primary, // or text based on design
        marginBottom: 4,
        fontWeight: '700',
        textAlign: 'center',
    },
    label: {
        ...typography.caption1,
        color: colors.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        fontSize: 11,
    },
});
