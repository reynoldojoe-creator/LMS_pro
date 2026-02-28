import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
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

// Custom components
import { ModernTabBar } from '../components/common/ModernTabBar';

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

// Stack navigator for Completed tab (so it can push to BatchReview/QuestionReview)
const CompletedStack = createNativeStackNavigator();

const CompletedNavigator = () => (
    <CompletedStack.Navigator screenOptions={{ headerShown: false }}>
        <CompletedStack.Screen name="CompletedList" component={CompletedScreen} />
        <CompletedStack.Screen name="BatchReview" component={BatchReviewScreen} />
        <CompletedStack.Screen name="QuestionReview" component={QuestionReviewScreen} />
    </CompletedStack.Navigator>
);

export const VetterNavigator = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <ModernTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="ReviewQueue"
                component={ReviewNavigator}
                options={({ route }: any) => {
                    // Get the name of the focused route in the nested stack
                    const routeName = getFocusedRouteNameFromRoute(route) ?? 'VetterDashboard';
                    const hiddenRoutes = ['BatchReview', 'QuestionReview', 'QuestionPreview', 'GenerationResults'];
                    return {
                        title: 'Queue',
                        tabBarLabel: 'Queue',
                        tabBarStyle: hiddenRoutes.includes(routeName) ? { display: 'none' } : undefined,
                    };
                }}
            />
            <Tab.Screen
                name="Completed"
                component={CompletedNavigator}
                options={({ route }: any) => {
                    const routeName = getFocusedRouteNameFromRoute(route) ?? 'CompletedList';
                    const hiddenRoutes = ['BatchReview', 'QuestionReview'];
                    return {
                        title: 'Completed',
                        tabBarLabel: 'Completed',
                        tabBarStyle: hiddenRoutes.includes(routeName) ? { display: 'none' } : undefined,
                    };
                }}
            />
            <Tab.Screen
                name="Stats"
                component={VetterStatsScreen}
                options={{
                    title: 'Stats',
                    tabBarLabel: 'Stats'
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    title: 'Settings',
                    tabBarLabel: 'Settings'
                }}
            />
        </Tab.Navigator>
    );
};
