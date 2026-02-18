import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';
import { useAppTheme } from '../hooks';

// Import vetter screens
import { VetterDashboardScreen } from '../screens/vetter/VetterDashboardScreen';
import { BatchReviewScreen } from '../screens/vetter/BatchReviewScreen';
import { QuestionReviewScreen } from '../screens/vetter/QuestionReviewScreen';
import { CompletedScreen } from '../screens/vetter/CompletedScreen';
import { VetterStatsScreen } from '../screens/vetter/VetterStatsScreen';
import { SettingsScreen } from '../screens/common/SettingsScreen';
import { ProfileScreen } from '../screens/common/ProfileScreen';
import { QuestionPreviewScreen } from '../screens/faculty/QuestionPreviewScreen';
import { GenerationResultsScreen } from '../screens/faculty/GenerationResultsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack navigator for Review Queue
const ReviewStack = createNativeStackNavigator();

const ReviewNavigator = () => (
    <ReviewStack.Navigator screenOptions={{ headerShown: false }}>
        <ReviewStack.Screen name="VetterDashboard" component={VetterDashboardScreen} />
        <ReviewStack.Screen name="BatchReview" component={BatchReviewScreen} />
        <ReviewStack.Screen name="QuestionReview" component={QuestionReviewScreen} />
        <ReviewStack.Screen name="QuestionPreview" component={QuestionPreviewScreen} />
        <ReviewStack.Screen name="GenerationResults" component={GenerationResultsScreen} />
        <ReviewStack.Screen name="Settings" component={SettingsScreen} />
        <ReviewStack.Screen name="Profile" component={ProfileScreen} />
    </ReviewStack.Navigator>
);

export const VetterNavigator = () => {
    const { colors } = useAppTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.iosGray3,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.divider,
                    borderTopWidth: 1,
                    paddingTop: spacing.xs,
                    paddingBottom: spacing.sm,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                },
            }}
        >
            <Tab.Screen
                name="ReviewQueue"
                component={ReviewNavigator}
                options={{
                    tabBarLabel: 'Review',
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ fontSize: size, color }}>📋</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Completed"
                component={CompletedScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ fontSize: size, color }}>✓</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Stats"
                component={VetterStatsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ fontSize: size, color }}>📊</Text>
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    placeholderText: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    placeholderSubtext: {
        ...typography.body,
        color: colors.textSecondary,
    },
});
