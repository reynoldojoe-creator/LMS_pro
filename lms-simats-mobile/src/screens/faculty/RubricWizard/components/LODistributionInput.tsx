import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing} from '../../../../theme';

interface Props {
    subject: any;
    value: Record<string, number>;
    onChange: (value: Record<string, number>) => void;
}

export const LODistributionInput = ({ subject, value, onChange }: Props) => {
    const los = subject.learningOutcomes || [];

    // Auto-initialize if empty
    useEffect(() => {
        if (Object.keys(value).length === 0 && los.length > 0) {
            const initial: any = {};
            const count = los.length;
            los.forEach((lo: any) => initial[lo.code] = 100 / count);
            onChange(initial);
        }
    }, [los]);

    const handleSliderChange = (loCode: string, newValue: number) => {
        const updated = { ...value, [loCode]: newValue };
        onChange(updated);
    };

    const total = Object.values(value).reduce((a, b) => a + b, 0);

    if (los.length === 0) {
        return <Text style={styles.emptyText}>No Learning Outcomes defined for this subject.</Text>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>LO Distribution Strategy</Text>
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

            {los.map((lo: any) => {
                const percentage = value[lo.code] || 0;
                return (
                    <View key={lo.code} style={styles.itemContainer}>
                        <View style={styles.labelRow}>
                            <Text style={styles.loCode}>{lo.code}</Text>
                            <Text style={styles.percentageText}>{percentage.toFixed(0)}%</Text>
                        </View>
                        <Text style={styles.loDesc} numberOfLines={1}>{lo.description}</Text>

                        <View style={styles.sliderRow}>
                            <TouchableOpacity
                                style={styles.sliderBtn}
                                onPress={() => handleSliderChange(lo.code, Math.max(0, percentage - 5))}
                            >
                                <Text style={styles.sliderBtnText}>−</Text>
                            </TouchableOpacity>
                            <View style={styles.progressBarOuter}>
                                <View style={[styles.progressBarInner, { width: `${percentage}%` }]} />
                            </View>
                            <TouchableOpacity
                                style={styles.sliderBtn}
                                onPress={() => handleSliderChange(lo.code, Math.min(100, percentage + 5))}
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
        borderRadius: 8,
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
    loCode: {
        ...typography.captionBold,
        color: colors.primary,
    },
    percentageText: {
        ...typography.bodyBold,
        color: colors.textPrimary,
    },
    loDesc: {
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
        borderRadius: 8,
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
    emptyText: {
        ...typography.caption,
        color: colors.textTertiary,
        fontStyle: 'italic',
    }
});
