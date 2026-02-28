import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';

const BLOOM_LEVELS = [
    { key: 'K1', label: 'Remember', color: colors.bloomRemember },
    { key: 'K2', label: 'Understand', color: colors.bloomUnderstand },
    { key: 'K3', label: 'Apply', color: colors.bloomApply },
    { key: 'K4', label: 'Analyze', color: colors.bloomAnalyze },
    { key: 'K5', label: 'Evaluate', color: colors.bloomEvaluate },
    { key: 'K6', label: 'Create', color: colors.bloomCreate },
];

const STANDARD_PRESET: Record<string, number> = {
    K1: 10, K2: 20, K3: 30, K4: 25, K5: 10, K6: 5,
};

interface Props {
    value: Record<string, number>;
    onChange: (value: Record<string, number>) => void;
}

export const BloomDistributionInput = ({ value, onChange }: Props) => {
    const distribution = value && Object.keys(value).length > 0 ? value : { ...STANDARD_PRESET };

    const handleChange = (key: string, delta: number) => {
        const current = distribution[key] || 0;
        const next = Math.max(0, Math.min(100, current + delta));
        onChange({ ...distribution, [key]: next });
    };

    const applyPreset = () => {
        onChange({ ...STANDARD_PRESET });
    };

    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    const isValid = Math.abs(total - 100) < 1;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Bloom&apos;s Level Distribution</Text>
                <View style={[
                    styles.totalBadge,
                    isValid ? styles.totalBadgeGood : styles.totalBadgeError,
                ]}>
                    <Text style={[
                        styles.totalBadgeText,
                        isValid ? styles.totalBadgeTextGood : styles.totalBadgeTextError,
                    ]}>
                        Total: {total.toFixed(0)}%
                    </Text>
                </View>
            </View>

            {BLOOM_LEVELS.map(({ key, label, color }) => {
                const pct = distribution[key] || 0;
                return (
                    <View key={key} style={styles.itemContainer}>
                        <View style={styles.labelRow}>
                            <View style={styles.levelBadge}>
                                <View style={[styles.levelDot, { backgroundColor: color }]} />
                                <Text style={styles.levelCode}>{key}</Text>
                                <Text style={styles.levelLabel}>{label}</Text>
                            </View>
                            <Text style={styles.percentageText}>{pct}%</Text>
                        </View>

                        <View style={styles.sliderRow}>
                            <TouchableOpacity
                                style={styles.sliderBtn}
                                onPress={() => handleChange(key, -5)}
                            >
                                <Text style={styles.sliderBtnText}>−</Text>
                            </TouchableOpacity>
                            <View style={styles.progressBarOuter}>
                                <View style={[
                                    styles.progressBarInner,
                                    { width: `${pct}%`, backgroundColor: color },
                                ]} />
                            </View>
                            <TouchableOpacity
                                style={styles.sliderBtn}
                                onPress={() => handleChange(key, 5)}
                            >
                                <Text style={styles.sliderBtnText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            })}

            <TouchableOpacity style={styles.presetButton} onPress={applyPreset}>
                <Text style={styles.presetButtonText}>Standard Pattern</Text>
            </TouchableOpacity>
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
        marginBottom: spacing.sm,
        paddingBottom: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    levelDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    levelCode: {
        ...typography.captionBold,
        color: colors.textPrimary,
        marginRight: 4,
    },
    levelLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    percentageText: {
        ...typography.bodyBold,
        color: colors.textPrimary,
    },
    sliderRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
        borderRadius: 5,
    },
    presetButton: {
        marginTop: spacing.sm,
        alignSelf: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 10,
        backgroundColor: colors.secondaryBackground,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    presetButtonText: {
        ...typography.captionBold,
        color: colors.primary,
    },
});
