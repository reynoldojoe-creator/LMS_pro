import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useVetterStore } from '../../store/vetterStore';
import { useAuthStore } from '../../store/authStore';
import { ScreenBackground, ModernNavBar, Card, ModernButton } from '../../components/common';
import { StatCard } from '../../components/faculty/StatCard';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Ionicons } from '@expo/vector-icons';

type VetterDashboardScreenNavigationProp = NativeStackNavigationProp<any, 'VetterDashboard'>;

export const VetterDashboardScreen = () => {
    const navigation = useNavigation<VetterDashboardScreenNavigationProp>();
    const { user } = useAuthStore();
    const {
        stats,
        pendingBatches,
        isLoading,
        fetchStats,
        fetchPendingBatches,
        startReview
    } = useVetterStore();

    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        await Promise.all([fetchStats(), fetchPendingBatches()]);
    }, [fetchStats, fetchPendingBatches]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleStartReview = async (batchId: string) => {
        await startReview(batchId);
        navigation.navigate('BatchReview', { batchId });
    };

    return (
        <ScreenBackground>
            <ModernNavBar title="Vetting Dashboard" />

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>Welcome,</Text>
                    <Text style={styles.username}>{user?.name || 'Vetter'}</Text>
                </View>

                {/* Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PERFORMANCE</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statWrapper}>
                            <StatCard
                                value={String(stats.totalReviewedThisWeek ?? 0)}
                                label="Weekly"
                            />
                        </View>
                        <View style={styles.statWrapper}>
                            <StatCard
                                value={String(stats.totalReviewedThisMonth ?? 0)}
                                label="Monthly"
                            />
                        </View>
                        <View style={styles.statWrapper}>
                            <StatCard
                                value={`${Math.round((stats.approvalRate ?? 0) * 100)}%`}
                                label="Approval %"
                            />
                        </View>
                    </View>
                </View>

                {/* Pending Batches */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PENDING REVIEWS</Text>
                    {pendingBatches.length > 0 ? (
                        pendingBatches.map(batch => (
                            <Card key={batch.id} title={batch.title} style={styles.card}>
                                <View style={styles.batchCardContent}>
                                    <View style={styles.batchInfo}>
                                        <View style={styles.batchTitleRow}>
                                            <Ionicons name="school" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.batchSubtitle}>{batch.facultyName}</Text>
                                                <Text style={styles.batchMeta}>
                                                    {batch.reviewedQuestions} / {batch.totalQuestions} Questions
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.progressSection}>
                                            <View style={styles.progressBar}>
                                                <View
                                                    style={[
                                                        styles.progressFill,
                                                        { width: `${(batch.reviewedQuestions / batch.totalQuestions) * 100}%` }
                                                    ]}
                                                />
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.actionRow}>
                                        <ModernButton
                                            title={batch.reviewedQuestions === batch.totalQuestions ? "Complete" : "Start Review"}
                                            onPress={() => navigation.navigate('QuestionReview', { batchId: batch.id })}
                                            size="small"
                                            variant="primary"
                                            style={styles.reviewButton}
                                            icon={<Ionicons name="play" size={20} color={colors.textInverse} />}
                                        />
                                    </View>
                                </View>
                            </Card>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No pending batches</Text>
                        </View>
                    )}
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: spacing.xl,
    },
    header: {
        padding: spacing.lg,
        paddingBottom: spacing.md,
    },
    greeting: {
        ...typography.body,
        color: colors.textSecondary,
    },
    username: {
        ...typography.h2,
        color: colors.textPrimary,
        marginTop: 4,
    },
    section: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    sectionTitle: {
        ...typography.captionBold,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
    },
    statsRow: {
        flexDirection: 'row',
        marginHorizontal: -spacing.xs,
    },
    statWrapper: {
        flex: 1,
        paddingHorizontal: spacing.xs,
    },
    card: {
        marginBottom: spacing.md,
    },
    batchCardContent: {
        // padding: spacing.md, // Card already has padding
    },
    batchInfo: {
        marginBottom: spacing.md,
    },
    batchSubtitle: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    batchMeta: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    progressSection: {
        marginBottom: spacing.xs,
    },
    progressBar: {
        height: 8,
        backgroundColor: colors.systemGray6,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
    },
    reviewButton: {
        alignSelf: 'flex-start',
        minWidth: 100,
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    bottomSpacer: {
        height: 40,
    },
    batchTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    }
});
