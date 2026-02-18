import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { typography, spacing, borderRadius } from '../../theme';
import { useAppTheme } from '../../hooks';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    action?: React.ReactNode;
    grouped?: boolean;
    style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
    children,
    title,
    action,
    grouped = false,
    style,
}) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    return (
        <View style={[styles.card, grouped && styles.grouped, style]}>
            {title && (
                <View style={styles.header}>
                    <Text style={styles.title}>{title}</Text>
                    {action && <View style={styles.action}>{action}</View>}
                </View>
            )}
            <View style={title ? styles.body : styles.bodyNoTitle}>{children}</View>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    grouped: {
        borderRadius: borderRadius.xl,
        marginHorizontal: spacing.screenHorizontal,
        shadowOpacity: 0.05,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.cardPadding,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        backgroundColor: 'rgba(0,0,0,0.02)', // Subtle header tint
        borderTopLeftRadius: borderRadius.lg, // Match card radius
        borderTopRightRadius: borderRadius.lg,
    },
    title: {
        ...typography.h3,
        color: colors.textPrimary,
        textShadowColor: 'rgba(255,255,255,0.5)',
        textShadowOffset: { width: 0, height: 1 },
    },
    action: {
        marginLeft: spacing.sm,
    },
    body: {
        padding: spacing.cardPadding,
    },
    bodyNoTitle: {
        padding: spacing.cardPadding,
        borderRadius: borderRadius.lg,
    },
});
