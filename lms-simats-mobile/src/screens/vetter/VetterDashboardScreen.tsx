import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { typography, spacing, borderRadius } from '../../theme';
import { useVetterStore } from '../../store';
import { useAppTheme } from '../../hooks';
import { LoadingSpinner, EmptyState, Tag } from '../../components/common';

type Props = NativeStackScreenProps<any, 'VetterDashboard'>;

export const VetterDashboardScreen = ({ navigation }: Props) => {
    const { pendingBatches, fetchPendingBatches, isLoading } = useVetterStore();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    useFocusEffect(
        useCallback(() => {
            fetchPendingBatches();
        }, [])
    );

    const handleBatchPress = (batchId: string) => {
        navigation.navigate('BatchReview', { batchId });
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays === 1) return 'Yesterday';
        return `${diffDays} days ago`;
    };

    const isUrgent = (batch: any) => {
        if (!batch.dueDate) return false;
        const dueDate = new Date(batch.dueDate);
        const now = new Date();
        const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return diffHours < 48; // Urgent if due within 48 hours
    };

    if (isLoading && pendingBatches.length === 0) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Review Queue</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconButton}>
                        <Text style={styles.settingsIcon}>⚙️</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.summaryCard}>
                <Text style={styles.summaryText}>
                    Pending Review: {pendingBatches.length} batch{pendingBatches.length !== 1 ? 'es' : ''}
                </Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {pendingBatches.length === 0 ? (
                    <EmptyState
                        icon="✓"
                        title="All Caught Up!"
                        description="No pending reviews at the moment"
                    />
                ) : (
                    <View style={styles.batchesList}>
                        {pendingBatches.map((batch) => {
                            const progress = batch.totalQuestions > 0
                                ? batch.reviewedQuestions / batch.totalQuestions
                                : 0;
                            const urgent = isUrgent(batch);

                            return (
                                <TouchableOpacity
                                    key={batch.id}
                                    style={[styles.batchCard, urgent && styles.urgentCard]}
                                    onPress={() => handleBatchPress(batch.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.batchHeader}>
                                        <Text style={styles.batchTitle}>{batch.title}</Text>
                                        {urgent && <Tag label="⚠️ Urgent" color={colors.error} />}
                                    </View>

                                    <Text style={styles.batchMeta}>
                                        {batch.facultyName} • {batch.totalQuestions} questions
                                    </Text>

                                    <Text style={styles.batchGenerated}>
                                        Generated: {getTimeAgo(batch.generatedAt)}
                                    </Text>

                                    {batch.dueDate && (
                                        <Text style={styles.batchDue}>
                                            Due: {new Date(batch.dueDate).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </Text>
                                    )}

                                    {batch.reviewedQuestions > 0 && (
                                        <View style={styles.progressSection}>
                                            <View style={styles.progressBar}>
                                                <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
                                            </View>
                                            <Text style={styles.progressText}>
                                                {batch.reviewedQuestions}/{batch.totalQuestions}
                                            </Text>
                                        </View>
                                    )}

                                    <View style={styles.actionButton}>
                                        <Text style={styles.actionButtonText}>
                                            {batch.reviewedQuestions > 0 ? 'Continue Review →' : 'Start Review →'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.screenHorizontal,
        paddingVertical: spacing.md,
    },
    headerTitle: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    filterText: {
        ...typography.body,
        color: colors.primary,
    },
    iconButton: {
        padding: spacing.xs,
    },
    settingsIcon: {
        fontSize: 24,
        color: colors.textPrimary,
    },
    summaryCard: {
        backgroundColor: colors.primary + '15',
        marginHorizontal: spacing.screenHorizontal,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    summaryText: {
        ...typography.bodyBold,
        color: colors.primary,
        textAlign: 'center',
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
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    urgentCard: {
        borderColor: colors.error,
        borderWidth: 2,
    },
    batchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.xs,
    },
    batchTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        flex: 1,
        marginRight: spacing.sm,
    },
    batchMeta: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    batchGenerated: {
        ...typography.caption,
        color: colors.textTertiary,
        marginBottom: spacing.xs,
    },
    batchDue: {
        ...typography.caption,
        color: colors.error,
        marginBottom: spacing.sm,
    },
    progressSection: {
        marginTop: spacing.sm,
        marginBottom: spacing.md,
    },
    progressBar: {
        height: 8,
        backgroundColor: colors.iosGray5,
        borderRadius: borderRadius.full,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
    },
    progressText: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'right',
    },
    actionButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.sm,
        alignItems: 'center',
    },
    actionButtonText: {
        ...typography.bodyBold,
        color: colors.textInverse,
    },
});
