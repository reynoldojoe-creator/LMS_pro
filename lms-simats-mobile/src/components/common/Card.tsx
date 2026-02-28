import React from 'react';
import { View, StyleSheet, ViewStyle, Text, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    contentStyle?: ViewStyle;
    title?: string;
    footer?: React.ReactNode;
    onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    contentStyle,
    title,
    footer,
    onPress
}) => {
    const Container = (onPress ? TouchableOpacity : View) as any;

    return (
        <Container style={[styles.container, style]} onPress={onPress} activeOpacity={0.7}>
            {title && (
                <View style={styles.header}>
                    <Text style={styles.title}>{title}</Text>
                </View>
            )}
            <View style={[styles.content, contentStyle]}>
                {children}
            </View>
            {footer && (
                <View style={styles.footer}>
                    {footer}
                </View>
            )}
        </Container>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        marginVertical: spacing.sm,
        marginHorizontal: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        overflow: 'hidden',
    },
    header: {
        paddingHorizontal: spacing.cardPadding,
        paddingTop: spacing.cardPadding,
        paddingBottom: spacing.sm,
    },
    title: {
        ...typography.headline,
        color: colors.text,
    },
    content: {
        padding: spacing.cardPadding,
    },
    footer: {
        backgroundColor: colors.systemGray6,
        padding: spacing.cardPadding,
        borderTopWidth: 1,
        borderTopColor: colors.separator,
    },
});
