import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            style={styles.container}
        >
            <LinearGradient
                colors={['#ffffff', '#e0e0e0']}
                style={styles.card}
            >
                <Text style={styles.value} adjustsFontSizeToFit numberOfLines={1}>{value}</Text>
                <Text style={styles.label} adjustsFontSizeToFit numberOfLines={1}>{label}</Text>
            </LinearGradient>
        </Component>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: borderRadius.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    card: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 80,
        borderWidth: 1,
        borderColor: '#a0a0a0',
        borderTopColor: '#c0c0c0',
        borderBottomColor: '#808080',
    },
    value: {
        ...typography.h1,
        color: '#333333',
        marginBottom: spacing.xs,
        textShadowColor: 'rgba(255, 255, 255, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 0,
    },
    label: {
        ...typography.caption,
        color: '#666666',
        textAlign: 'center',
        textShadowColor: 'rgba(255, 255, 255, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 0,
        fontWeight: '600',
    },
});
