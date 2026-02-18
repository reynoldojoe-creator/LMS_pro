import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../../../theme';

interface Props {
    subject: any;
    value: Record<string, number>;
    onChange: (value: Record<string, number>) => void;
}

export const CODistributionInput = ({ subject, value, onChange }: Props) => {
    const cos = subject.courseOutcomes || [];

    const handleSliderChange = (coCode: string, newValue: number) => {
        const updated = { ...value, [coCode]: newValue };
        onChange(updated);
    };

    const total = Object.values(value).reduce((a, b) => a + b, 0);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>CO Distribution Strategy</Text>
                <View style={[
                    styles.totalBadge,
                    Math.abs(total - 100) < 1 ? styles.totalBadgeGood : styles.totalBadgeError
                ]}>
                    <Text style={[
                        styles.totalBadgeText,
                        Math.abs(total - 100) < 1 ? styles.totalBadgeTextGood : styles.totalBadgeTextError
                    ]}>
                        Total: {total.toFixed(0)}%
                    </Text>
                </View>
            </View>

            {cos.map((co: any) => {
                const percentage = value[co.code] || 0;
                return (
                    <View key={co.code} style={styles.itemContainer}>
                        <View style={styles.labelRow}>
                            <Text style={styles.coCode}>{co.code}</Text>
                            <Text style={styles.percentageText}>{percentage}%</Text>
                        </View>
                        <Text style={styles.coDesc} numberOfLines={1}>{co.description}</Text>

                        <View style={styles.sliderRow}>
                            <TouchableOpacity
                                style={styles.sliderBtn}
                                onPress={() => handleSliderChange(co.code, Math.max(0, percentage - 5))}
                            >
                                <Text style={styles.sliderBtnText}>−</Text>
                            </TouchableOpacity>
                            <View style={styles.progressBarOuter}>
                                <View style={[styles.progressBarInner, { width: `${percentage}%` }]} />
                            </View>
                            <TouchableOpacity
                                style={styles.sliderBtn}
                                onPress={() => handleSliderChange(co.code, Math.min(100, percentage + 5))}
                            >
                                <Text style={styles.sliderBtnText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        ...typography.bodyBold,
        color: colors.textPrimary,
    },
    totalBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
    },
    totalBadgeGood: {
        backgroundColor: colors.success + '10',
        borderColor: colors.success,
    },
    totalBadgeError: {
        backgroundColor: colors.error + '10',
        borderColor: colors.error,
    },
    totalBadgeText: {
        ...typography.captionBold,
    },
    totalBadgeTextGood: {
        color: colors.success,
    },
    totalBadgeTextError: {
        color: colors.error,
    },
    itemContainer: {
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    coCode: {
        ...typography.captionBold,
        color: colors.primary,
    },
    percentageText: {
        ...typography.bodyBold,
        color: colors.textPrimary,
    },
    coDesc: {
        ...typography.caption,
        color: colors.textSecondary,
        fontSize: 10,
        marginBottom: spacing.sm,
    },
    sliderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    sliderBtn: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sliderBtnText: {
        color: colors.textInverse,
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 22,
    },
    progressBarOuter: {
        flex: 1,
        height: 10,
        backgroundColor: colors.iosGray5,
        borderRadius: 5,
        marginHorizontal: spacing.sm,
        overflow: 'hidden',
    },
    progressBarInner: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 5,
    },
});
