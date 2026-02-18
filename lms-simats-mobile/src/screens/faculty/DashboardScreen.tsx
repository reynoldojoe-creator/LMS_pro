import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useFacultyStore } from '../../store/facultyStore';
import { useAuthStore } from '../../store/authStore';
import { useAppTheme } from '../../hooks';
import { spacing, typography} from '../../theme';

// iOS 6 Components
import { LinenBackground } from '../../components/ios6/LinenBackground';
import { GlossyNavBar } from '../../components/ios6/GlossyNavBar';
import { StatCard } from '../../components/faculty/StatCard';
import { AppIcon } from '../../components/ios6/AppIcon';
import { GlossyCard } from '../../components/ios6/GlossyCard';

type DashboardNavigationProp = NativeStackNavigationProp<any>;

export const DashboardScreen = () => {
    const navigation = useNavigation<DashboardNavigationProp>();
    const { colors } = useAppTheme();
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
        <LinenBackground>
            <GlossyNavBar
                title="Dashboard"
                rightButton={
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                        <Ionicons name="settings-sharp" size={24} color="#fff" style={styles.settingsIcon} />
                    </TouchableOpacity>
                }
            />

            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#333" />
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
                    <Text style={styles.sectionTitle}>OVERVIEW</Text>
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
                        <View style={styles.statWrapper}>
                            <StatCard
                                value={stats?.pendingReview || 0}
                                label="Review"
                                onPress={() => { }}
                            />
                        </View>
                    </View>
                </View>

                {/* Apps Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
                    <View style={styles.iconGrid}>
                        <AppIcon
                            title="Subjects"
                            color={['#4A90E2', '#0056D2']}
                            onPress={() => navigation.navigate('Subjects')}
                        />
                        <AppIcon
                            title="New Subject"
                            color={['#50E3C2', '#2E8B73']}
                            onPress={() => navigation.navigate('CreateSubject')}
                        />
                        <AppIcon
                            title="Q-Bank"
                            color={['#F5A623', '#D08906']}
                            onPress={() => navigation.navigate('QuestionBank')}
                        />
                        <AppIcon
                            title="Rubrics"
                            color={['#9013FE', '#5B08A5']}
                            onPress={() => navigation.navigate('Rubrics')}
                        />
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
                    {recentActivity && recentActivity.length > 0 ? (
                        <GlossyCard>
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
                                </View>
                            ))}
                        </GlossyCard>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No recent activity</Text>
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
    settingsIcon: {
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: -1 },
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
        justifyContent: 'space-between',
        marginHorizontal: -spacing.xs,
    },
    statWrapper: {
        flex: 1,
        paddingHorizontal: spacing.xs,
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginHorizontal: -10, // Compensate for icon margins
    },
    activityItem: {
        padding: spacing.md,
        backgroundColor: 'white',
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    activityContent: {
        flex: 1,
    },
    activityDesc: {
        fontSize: 16,
        color: '#000',
        marginBottom: 4,
    },
    activityMeta: {
        fontSize: 13,
        color: '#8E8E93',
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
