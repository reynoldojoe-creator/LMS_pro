import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useVetterStore } from '../../store';
import { LoadingSpinner } from '../../components/common';

export const VetterStatsScreen = () => {
    const { stats, fetchStats, isLoading } = useVetterStore();

    useEffect(() => {
        fetchStats();
    }, []);

    if (isLoading) {
        return <LoadingSpinner fullScreen />;
    }

    const approvalPercentage = Math.round(stats.approvalRate * 100);
    const rejectionEntries = Object.entries(stats.rejectionReasons).sort((a, b) => b[1] - a[1]);
    const totalRejections = rejectionEntries.reduce((sum, [, count]) => sum + count, 0);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Statistics</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Summary Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Review Summary</Text>

                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.totalReviewedThisWeek}</Text>
                            <Text style={styles.statLabel}>This Week</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.totalReviewedThisMonth}</Text>
                            <Text style={styles.statLabel}>This Month</Text>
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={[styles.statValue, { color: colors.success }]}>
                                {approvalPercentage}%
                            </Text>
                            <Text style={styles.statLabel}>Approval Rate</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.averageTimePerQuestion}s</Text>
                            <Text style={styles.statLabel}>Avg Time/Question</Text>
                        </View>
                    </View>
                </View>

                {/* Rejection Reasons */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Common Rejection Reasons</Text>

                    <View style={styles.reasonsCard}>
                        {rejectionEntries.map(([reason, count]) => {
                            const percentage = totalRejections > 0 ? (count / totalRejections) * 100 : 0;

                            return (
                                <View key={reason} style={styles.reasonRow}>
                                    <View style={styles.reasonInfo}>
                                        <Text style={styles.reasonText}>{reason}</Text>
                                        <Text style={styles.reasonCount}>{count} times</Text>
                                    </View>
                                    <View style={styles.reasonBar}>
                                        <View
                                            style={[
                                                styles.reasonBarFill,
                                                { width: `${percentage}%` },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.reasonPercentage}>
                                        {Math.round(percentage)}%
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Performance Insights */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Insights</Text>

                    <View style={styles.insightCard}>
                        <Text style={styles.insightIcon}>📈</Text>
                        <View style={styles.insightContent}>
                            <Text style={styles.insightTitle}>Great Work!</Text>
                            <Text style={styles.insightText}>
                                Your approval rate is {approvalPercentage}%, which is above average.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.insightCard}>
                        <Text style={styles.insightIcon}>⚡</Text>
                        <View style={styles.insightContent}>
                            <Text style={styles.insightTitle}>Efficient Reviewer</Text>
                            <Text style={styles.insightText}>
                                You're averaging {stats.averageTimePerQuestion} seconds per question, maintaining quality while being efficient.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: spacing.screenHorizontal,
        paddingVertical: spacing.md,
    },
    headerTitle: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        marginTop: spacing.lg,
        marginHorizontal: spacing.screenHorizontal,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    statValue: {
        ...typography.h1,
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    reasonsCard: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    reasonRow: {
        marginBottom: spacing.md,
    },
    reasonInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    reasonText: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
    },
    reasonCount: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    reasonBar: {
        height: 8,
        backgroundColor: colors.iosGray5,
        borderRadius: borderRadius.full,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    reasonBarFill: {
        height: '100%',
        backgroundColor: colors.error,
    },
    reasonPercentage: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'right',
    },
    insightCard: {
        flexDirection: 'row',
        backgroundColor: colors.primary + '10',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.primary + '30',
        marginBottom: spacing.md,
    },
    insightIcon: {
        fontSize: 32,
        marginRight: spacing.md,
    },
    insightContent: {
        flex: 1,
    },
    insightTitle: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    insightText: {
        ...typography.caption,
        color: colors.textSecondary,
        lineHeight: 18,
    },
});
