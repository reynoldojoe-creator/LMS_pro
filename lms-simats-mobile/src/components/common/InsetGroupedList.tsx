import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { Ionicons } from '@expo/vector-icons';

interface ListItem {
    title: string;
    subtitle?: string;
    icon?: string;
    iconColor?: string;
    onPress?: () => void;
    value?: string | React.ReactNode;
    destructive?: boolean;
    showChevron?: boolean;
}

interface InsetGroupedListProps {
    items: ListItem[];
    header?: string;
    footer?: string;
    style?: ViewStyle;
}

export const InsetGroupedList: React.FC<InsetGroupedListProps> = ({
    items,
    header,
    footer,
    style
}) => {
    return (
        <View style={[styles.container, style]}>
            {header && <Text style={styles.header}>{header.toUpperCase()}</Text>}

            <View style={styles.listContainer}>
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const ItemWrapper = item.onPress ? TouchableOpacity : View;

                    return (
                        <View key={index}>
                            <ItemWrapper
                                onPress={item.onPress}
                                style={styles.itemContainer}
                                activeOpacity={item.onPress ? 0.7 : 1}
                            >
                                <View style={styles.contentContainer}>
                                    {/* Icon */}
                                    {item.icon && (
                                        <View style={[styles.iconContainer, { backgroundColor: item.iconColor || colors.blue }]}>
                                            <Ionicons name={item.icon as any} size={16} color="white" />
                                        </View>
                                    )}

                                    {/* Text Content */}
                                    <View style={styles.textContainer}>
                                        <Text style={[
                                            styles.title,
                                            item.destructive && styles.destructiveTitle
                                        ]}>
                                            {item.title}
                                        </Text>
                                        {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
                                    </View>

                                    {/* Value / Right content */}
                                    {item.value && (
                                        <View style={styles.valueContainer}>
                                            {typeof item.value === 'string' ? (
                                                <Text style={styles.valueText}>{item.value}</Text>
                                            ) : item.value}
                                        </View>
                                    )}

                                    {/* Chevron */}
                                    {(item.showChevron || item.onPress) && (
                                        <Ionicons
                                            name="chevron-forward"
                                            size={20}
                                            color={colors.systemGray3}
                                            style={styles.chevron}
                                        />
                                    )}
                                </View>
                            </ItemWrapper>
                            {!isLast && <View style={styles.separator} />}
                        </View>
                    );
                })}
            </View>

            {footer && <Text style={styles.footer}>{footer}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.sectionGap,
    },
    header: {
        ...typography.caption1,
        color: colors.textSecondary,
        paddingHorizontal: spacing.screenHorizontal + 4,
        marginBottom: 6,
    },
    footer: {
        ...typography.caption1,
        color: colors.textSecondary,
        paddingHorizontal: spacing.screenHorizontal + 4,
        marginTop: 6,
    },
    listContainer: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        marginHorizontal: spacing.screenHorizontal,
    },
    itemContainer: {
        minHeight: 44,
        justifyContent: 'center',
        backgroundColor: colors.card,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        ...typography.body,
        color: colors.text,
    },
    destructiveTitle: {
        color: colors.error,
    },
    subtitle: {
        ...typography.caption1,
        color: colors.textSecondary,
        marginTop: 2,
    },
    valueContainer: {
        marginLeft: 8,
    },
    valueText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    chevron: {
        marginLeft: 8,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.separator,
        marginLeft: 16 + 28 + 12, // Align with text start (padding + icon width + margin)
    }
});
