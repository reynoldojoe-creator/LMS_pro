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

// Custom components
import { GlossyTabBar } from '../components/ios6/GlossyTabBar';

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
    return (
        <Tab.Navigator
            tabBar={(props) => <GlossyTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="ReviewQueue"
                component={ReviewNavigator}
                options={{
                    title: 'Queue',
                    tabBarLabel: 'Queue'
                }}
            />
            <Tab.Screen
                name="Completed"
                component={CompletedScreen}
                options={{
                    title: 'Completed',
                    tabBarLabel: 'Completed',
                    // Adding custom icon name mapping logic if needed in GlossyTabBar
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
