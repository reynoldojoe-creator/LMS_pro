import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing} from '../../theme';
import { useVetterStore } from '../../store';
import { LoadingSpinner, EmptyState } from '../../components/common';

export const CompletedScreen = () => {
    const { completedBatches, fetchCompletedBatches, isLoading } = useVetterStore();

    useEffect(() => {
        fetchCompletedBatches();
    }, []);

    if (isLoading && completedBatches.length === 0) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Completed Reviews</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {completedBatches.length === 0 ? (
                    <EmptyState
                        icon="📋"
                        title="No Completed Reviews"
                        description="Completed review batches will appear here"
                    />
                ) : (
                    <View style={styles.batchesList}>
                        {completedBatches.map((batch) => (
                            <View key={batch.id} style={styles.batchCard}>
                                <Text style={styles.batchTitle}>{batch.title}</Text>
                                <Text style={styles.batchMeta}>
                                    {batch.facultyName} • {batch.totalQuestions} questions
                                </Text>
                                <Text style={styles.completedDate}>
                                    Completed: {new Date(batch.generatedAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </Text>

                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statValue, { color: colors.success }]}>
                                            {batch.approvedCount}
                                        </Text>
                                        <Text style={styles.statLabel}>Approved</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statValue, { color: colors.error }]}>
                                            {batch.rejectedCount}
                                        </Text>
                                        <Text style={styles.statLabel}>Rejected</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statValue, { color: colors.warning }]}>
                                            {batch.quarantinedCount}
                                        </Text>
                                        <Text style={styles.statLabel}>Quarantined</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
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
    batchesList: {
        padding: spacing.screenHorizontal,
    },
    batchCard: {
        backgroundColor: colors.surface,
        padding: spacing.cardPadding,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
    },
    batchTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    batchMeta: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    completedDate: {
        ...typography.caption,
        color: colors.textTertiary,
        marginBottom: spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: colors.iosGray6,
        borderRadius: 12,
        padding: spacing.md,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        ...typography.h2,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    statDivider: {
        width: 1,
        backgroundColor: colors.divider,
        marginHorizontal: spacing.sm,
    },
});
