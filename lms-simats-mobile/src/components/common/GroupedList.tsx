import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { typography, spacing, borderRadius } from '../../theme';
import { useAppTheme } from '../../hooks';

export interface GroupedListSection {
    title?: string;
    data: GroupedListItem[];
}

export interface GroupedListItem {
    id: string;
    label: string;
    value?: string;
    icon?: React.ReactNode | string;
    onPress?: () => void;
    showChevron?: boolean;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
}

interface GroupedListProps {
    sections: GroupedListSection[];
}

export const GroupedList: React.FC<GroupedListProps> = ({ sections }) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    return (
        <View style={styles.container}>
            {sections.map((section, sectionIndex) => (
                <View key={sectionIndex} style={styles.section}>
                    {section.title && (
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                    )}

                    <View style={styles.list}>
                        {section.data.map((item, itemIndex) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.item,
                                    itemIndex !== section.data.length - 1 && styles.itemWithBorder,
                                ]}
                                onPress={item.onPress}
                                disabled={!item.onPress}
                                activeOpacity={0.7}
                            >
                                {item.icon && (
                                    <View style={styles.icon}>
                                        {typeof item.icon === 'string' ? (
                                            <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                                        ) : (
                                            item.icon
                                        )}
                                    </View>
                                )}

                                <Text style={styles.label}>{item.label}</Text>

                                {item.value && <Text style={styles.value}>{item.value}</Text>}

                                {item.showSwitch && (
                                    <Switch
                                        value={item.switchValue}
                                        onValueChange={item.onSwitchChange}
                                        trackColor={{ false: colors.iosGray4, true: colors.success }}
                                        ios_backgroundColor={colors.iosGray4}
                                    />
                                )}

                                {item.showChevron && (
                                    <Text style={styles.chevron}>›</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ))}
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        gap: spacing.sectionGap,
    },
    section: {
        marginHorizontal: spacing.screenHorizontal,
    },
    sectionTitle: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: spacing.sm,
        marginLeft: spacing.sm,
    },
    list: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.listItemVertical,
        paddingHorizontal: spacing.listItemHorizontal,
        minHeight: 44,
        backgroundColor: colors.surface,
    },
    itemWithBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    icon: {
        marginRight: spacing.md,
    },
    label: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
    },
    value: {
        ...typography.body,
        color: colors.textSecondary,
        marginRight: spacing.sm,
    },
    chevron: {
        ...typography.h2,
        color: colors.iosGray3,
        fontWeight: '300',
    },
});
