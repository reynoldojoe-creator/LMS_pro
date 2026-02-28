import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';

interface QuickActionProps {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    onPress: () => void;
}

export const QuickAction: React.FC<QuickActionProps> = ({
    title,
    icon,
    color,
    onPress
}) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
                <Ionicons name={icon as any} size={28} color="white" />
            </View>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: '25%', // 4 columns
        marginBottom: spacing.lg,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18, // Squircle-ish
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        ...typography.caption1,
        color: colors.text,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '500',
    }
});
