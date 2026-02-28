import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useVetterStore } from '../../store';
import { LoadingSpinner, EmptyState } from '../../components/common';
import { Ionicons } from '@expo/vector-icons';

export const CompletedScreen = () => {
    const { completedBatches, fetchCompletedBatches, isLoading } = useVetterStore();
    const navigation = useNavigation<any>();

    useEffect(() => {
        fetchCompletedBatches();
    }, []);

    const handleEditBatch = (batchId: string) => {
        navigation.navigate('BatchReview', { batchId });
    };

    if (isLoading && completedBatches.length === 0) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Completed Reviews</Text>
                <Text style={styles.headerSubtitle}>Tap "Edit" to change your response on any question</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 100 }}>
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
                                <View style={styles.batchHeader}>
                                    <View style={{ flex: 1 }}>
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
                                    </View>
                                    <TouchableOpacity
                                        style={styles.editButton}
                                        onPress={() => handleEditBatch(batch.id)}
                                    >
                                        <Ionicons name="create-outline" size={16} color={colors.primary} />
                                        <Text style={styles.editButtonText}>Edit</Text>
                                    </TouchableOpacity>
                                </View>

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
                                        <Text style={styles.statLabel}>Flagged</Text>
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
    headerSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 4,
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
    batchHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
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
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: colors.primary + '12',
        borderWidth: 1,
        borderColor: colors.primary + '30',
        gap: 4,
    },
    editButtonText: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: '600',
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
