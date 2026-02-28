import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useFacultyStore } from '../../store/facultyStore';
import { useAuthStore } from '../../store/authStore';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

// Modern Components
import { ScreenBackground, ModernNavBar, Card } from '../../components/common';
import { StatCard } from '../../components/faculty/StatCard';
import { QuickAction } from '../../components/faculty/QuickAction';

type DashboardNavigationProp = NativeStackNavigationProp<any>;

export const DashboardScreen = () => {
    const navigation = useNavigation<DashboardNavigationProp>();
    const { user } = useAuthStore();
    const {
        stats,
        recentActivity,
        isLoadingSubjects: isLoading,
        fetchDashboard
    } = useFacultyStore();

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const onRefresh = useCallback(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formatTimestamp = (date: Date | string) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <ScreenBackground>
            <ModernNavBar
                title="Dashboard"
                rightButton={
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                        <Ionicons name="settings-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                }
            />

            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.contentContainer}
            >
                {/* Greeting Header */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>{getGreeting()},</Text>
                    <Text style={styles.username}>{user?.name || 'Faculty'}</Text>
                </View>

                {/* Quick Stats */}
                <View style={styles.section}>
                    {/* <Text style={styles.sectionTitle}>Overview</Text> */}
                    <View style={styles.statsRow}>
                        <View style={styles.statWrapper}>
                            <StatCard
                                value={stats?.activeSubjects || 0}
                                label="Subjects"
                                onPress={() => navigation.navigate('Subjects')}
                            />
                        </View>
                        <View style={styles.statWrapper}>
                            <StatCard
                                value={stats?.totalQuestions || 0}
                                label="Questions"
                                onPress={() => navigation.navigate('QuestionBank')}
                            />
                        </View>
                    </View>
                    <View style={[styles.statsRow, { marginTop: spacing.md }]}>
                        <View style={styles.statWrapper}>
                            <StatCard
                                value={stats?.pendingReview || 0}
                                label="Pending Review"
                                onPress={() => { }}
                            />
                        </View>
                    </View>
                </View>

                {/* Quick Actions Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.iconGrid}>
                        <QuickAction
                            title="Subjects"
                            icon="book-outline"
                            color={colors.blue}
                            onPress={() => navigation.navigate('Subjects')}
                        />
                        <QuickAction
                            title="New Subject"
                            icon="add-circle-outline"
                            color={colors.green}
                            onPress={() => navigation.navigate('Subjects', { screen: 'AddSubject' })}
                        />
                        <QuickAction
                            title="Quick Gen"
                            icon="flash-outline"
                            color={colors.orange}
                            onPress={() => navigation.navigate('QuickGenerate')}
                        />
                        <QuickAction
                            title="Rubrics"
                            icon="list-outline"
                            color={colors.purple}
                            onPress={() => navigation.navigate('Rubrics')}
                        />
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    {recentActivity && recentActivity.length > 0 ? (
                        <Card>
                            {recentActivity.map((activity, index) => (
                                <View
                                    key={activity.id || index}
                                    style={[
                                        styles.activityItem,
                                        index !== recentActivity.length - 1 && styles.borderBottom
                                    ]}
                                >
                                    <View style={styles.activityContent}>
                                        <Text style={styles.activityDesc}>{activity.description}</Text>
                                        <Text style={styles.activityMeta}>
                                            {activity.subject ? `${activity.subject} • ` : ''}{formatTimestamp(activity.timestamp)}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                                </View>
                            ))}
                        </Card>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No recent activity</Text>
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
        padding: spacing.screenHorizontal,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
    },
    greeting: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    username: {
        ...typography.h1,
        color: colors.text,
    },
    section: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.screenHorizontal,
    },
    sectionTitle: {
        ...typography.headline, // Section header style
        color: colors.text,
        marginBottom: spacing.md,
        marginLeft: 4,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    statWrapper: {
        flex: 1,
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -spacing.xs, // Compensate for item padding if needed
    },
    activityItem: {
        paddingVertical: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    borderBottom: {
        borderBottomWidth: 0.5,
        borderBottomColor: colors.separator,
    },
    activityContent: {
        flex: 1,
        paddingRight: spacing.sm,
    },
    activityDesc: {
        ...typography.body,
        fontSize: 15,
        color: colors.text,
        marginBottom: 4,
    },
    activityMeta: {
        ...typography.caption1,
        color: colors.textSecondary,
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        ...typography.body,
        color: colors.textTertiary,
    },
    bottomSpacer: {
        height: 40,
    }
});
