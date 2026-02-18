import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { typography, spacing, borderRadius } from '../../theme';
import { useFacultyStore, useAuthStore } from '../../store';
import { useAppTheme } from '../../hooks';
import { StatCard } from '../../components/faculty/StatCard';
import { GroupedList, LoadingSkeleton, ErrorState } from '../../components/common';
import type { GroupedListSection } from '../../components/common';

type Props = NativeStackScreenProps<any, 'Dashboard'>;

export const DashboardScreen = ({ navigation }: Props) => {
    const { user } = useAuthStore();
    const { stats, recentActivity, isLoadingSubjects: isLoadingDashboard, error, fetchDashboard } = useFacultyStore();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const onRefresh = useCallback(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formatTimestamp = (timestampString: string | Date) => {
        const timestamp = typeof timestampString === 'string' ? new Date(timestampString) : timestampString;
        const now = Date.now();
        const diff = now - timestamp.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        const days = Math.floor(hours / 24);
        if (days === 1) return 'Yesterday';
        return `${days} days ago`;
    };

    const quickActionsSections: GroupedListSection[] = [
        {
            title: 'Quick Actions',
            data: [
                {
                    id: '1',
                    label: 'Add New Subject',
                    icon: '📚',
                    showChevron: true,
                    onPress: () => navigation.navigate('Subjects', { screen: 'AddSubject' }),
                },

                {
                    id: '3',
                    label: 'Create Exam Rubric',
                    icon: '📋',
                    showChevron: true,
                    onPress: () => navigation.navigate('Rubrics', { screen: 'CreateRubric' }),
                },
            ],
        },
    ];

    if (error && !stats) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <ErrorState
                    message={error}
                    onRetry={fetchDashboard}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={isLoadingDashboard} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{getGreeting()}, {user?.name || 'Faculty'}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Quick Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Stats</Text>
                    <View style={styles.statsRow}>
                        {isLoadingDashboard && !stats ? (
                            <>
                                <LoadingSkeleton variant="card" width="30%" height={100} />
                                <View style={styles.statGap} />
                                <LoadingSkeleton variant="card" width="30%" height={100} />
                                <View style={styles.statGap} />
                                <LoadingSkeleton variant="card" width="30%" height={100} />
                            </>
                        ) : (
                            <>
                                <StatCard value={stats?.activeSubjects || 0} label="Subjects" />
                                <View style={styles.statGap} />
                                <StatCard value={stats?.totalQuestions || 0} label="Questions" />
                                <View style={styles.statGap} />
                                <StatCard value={stats?.pendingReview || 0} label="Pending" />
                            </>
                        )}
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <GroupedList sections={quickActionsSections} />
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitleInline}>Recent Activity</Text>
                    {isLoadingDashboard && !recentActivity ? (
                        <View style={{ paddingHorizontal: spacing.screenHorizontal }}>
                            <LoadingSkeleton variant="list" />
                            <LoadingSkeleton variant="list" />
                            <LoadingSkeleton variant="list" />
                        </View>
                    ) : recentActivity && recentActivity.length > 0 ? (
                        <View style={styles.activityCard}>
                            {recentActivity.map((activity, index) => (
                                <View
                                    key={activity.id}
                                    style={[
                                        styles.activityItem,
                                        index !== recentActivity.length - 1 && styles.activityItemBorder,
                                    ]}
                                >
                                    <View style={styles.activityDot} />
                                    <View style={styles.activityContent}>
                                        <Text style={styles.activityDescription}>{activity.description}</Text>
                                        <Text style={styles.activityTime}>
                                            {activity.subject} • {formatTimestamp(activity.timestamp)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.emptyText}>No recent activity</Text>
                    )}
                </View>
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
    greeting: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    settingsButton: {
        padding: spacing.xs,
    },
    settingsIcon: {
        fontSize: 24,
        color: colors.textPrimary,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        paddingHorizontal: spacing.screenHorizontal,
        marginBottom: spacing.md,
    },
    sectionTitleInline: {
        ...typography.h3,
        color: colors.textPrimary,
        paddingHorizontal: spacing.screenHorizontal,
        marginBottom: spacing.sm,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing.screenHorizontal,
    },
    statGap: {
        width: spacing.sm,
    },
    activityCard: {
        backgroundColor: colors.surface,
        marginHorizontal: spacing.screenHorizontal,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    activityItem: {
        flexDirection: 'row',
        paddingVertical: spacing.sm,
    },
    activityItemBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    activityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
        marginTop: 6,
        marginRight: spacing.sm,
    },
    activityContent: {
        flex: 1,
    },
    activityDescription: {
        ...typography.body,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    activityTime: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
});
