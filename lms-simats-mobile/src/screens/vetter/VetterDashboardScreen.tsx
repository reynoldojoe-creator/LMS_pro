import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useVetterStore } from '../../store/vetterStore';
import { useAuthStore } from '../../store/authStore';
import { LinenBackground, GlossyNavBar, GlossyCard, GlossyButton } from '../../components/ios6';
import { StatCard } from '../../components/faculty/StatCard';
import { colors } from '../../theme/colors';
import { spacing, typography} from '../../theme';

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
        <LinenBackground>
            <GlossyNavBar title="Vetting Dashboard" />

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} tintColor="#333" />
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
                                value={stats.totalReviewedThisWeek}
                                label="Weekly"
                            />
                        </View>
                        <View style={styles.statWrapper}>
                            <StatCard
                                value={stats.totalReviewedThisMonth}
                                label="Monthly"
                            />
                        </View>
                        <View style={styles.statWrapper}>
                            <StatCard
                                value={Math.round(stats.approvalRate * 100)}
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
                            <GlossyCard key={batch.id} title={batch.title}>
                                <View style={styles.batchCardContent}>
                                    <View style={styles.batchInfo}>
                                        <Text style={styles.batchSubtitle}>{batch.facultyName}</Text>
                                        <Text style={styles.batchMeta}>
                                            {batch.reviewedQuestions} / {batch.totalQuestions} Questions
                                        </Text>

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

                                    <GlossyButton
                                        title={batch.reviewedQuestions === batch.totalQuestions ? "Complete" : "Review"}
                                        onPress={() => handleStartReview(batch.id)}
                                        style={styles.reviewButton}
                                    />
                                </View>
                            </GlossyCard>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No pending batches</Text>
                        </View>
                    )}
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </LinenBackground>
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
        fontSize: 18,
        color: '#4C566C',
        fontWeight: '500',
        textShadowColor: 'rgba(255,255,255,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 0,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginTop: 4,
        textShadowColor: 'rgba(255,255,255,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 0,
    },
    section: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4C566C',
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
        textShadowColor: 'rgba(255,255,255,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 0,
    },
    statsRow: {
        flexDirection: 'row',
        marginHorizontal: -spacing.xs,
    },
    statWrapper: {
        flex: 1,
        paddingHorizontal: spacing.xs,
    },
    batchCardContent: {
        padding: spacing.md,
    },
    batchInfo: {
        marginBottom: spacing.md,
    },
    batchSubtitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    batchMeta: {
        fontSize: 14,
        color: '#666',
        marginBottom: spacing.sm,
    },
    progressSection: {
        marginBottom: spacing.xs,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E5E5EA',
: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
    },
    reviewButton: {
        minWidth: 100,
        alignSelf: 'flex-start',
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#8E8E93',
        fontSize: 16,
    },
    bottomSpacer: {
        height: 40,
    }
});
