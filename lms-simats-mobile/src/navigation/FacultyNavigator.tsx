import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';
import { useAppTheme } from '../hooks';

// Import screens
import { DashboardScreen } from '../screens/faculty/DashboardScreen';
import { SubjectsListScreen } from '../screens/faculty/SubjectsListScreen';
import { SubjectDetailScreen } from '../screens/faculty/SubjectDetailScreen';
// import { AddSubjectScreen } from '../screens/faculty/AddSubjectScreen';
import { SubjectWizardScreen } from '../screens/faculty/SubjectWizard/SubjectWizardScreen';
import { UnitDetailScreen } from '../screens/faculty/UnitDetailScreen';
import { TopicDetailScreen } from '../screens/faculty/TopicDetailScreen';
import { EditCOLOScreen } from '../screens/faculty/EditCOLOScreen';
// EditSyllabusScreen removed — syllabus extractor no longer used
import { QuickGenerateScreen } from '../screens/faculty/QuickGenerateScreen';
import { GeneratingScreen } from '../screens/faculty/GeneratingScreen';
import { GenerationResultsScreen } from '../screens/faculty/GenerationResultsScreen';
import { QuestionPreviewScreen } from '../screens/faculty/QuestionPreviewScreen';
import { RubricsListScreen } from '../screens/faculty/RubricsListScreen';
import { CreateRubricScreen } from '../screens/faculty/CreateRubricScreen';
import { RubricSubjectSelectionScreen } from '../screens/faculty/RubricWizard/RubricSubjectSelectionScreen';
import { RubricTypeSelectionScreen } from '../screens/faculty/RubricWizard/RubricTypeSelectionScreen';
import { RubricWizardScreen } from '../screens/faculty/RubricWizard/RubricWizardScreen';
import { RubricDetailScreen } from '../screens/faculty/RubricDetailScreen';
import { ReportsScreen } from '../screens/faculty/ReportsScreen';
import { SettingsScreen } from '../screens/common/SettingsScreen';
import { ProfileScreen } from '../screens/common/ProfileScreen';

// Placeholder screens
const PlaceholderScreen = ({ title }: { title: string }) => (
    <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>{title}</Text>
        <Text style={styles.placeholderSubtext}>Coming soon...</Text>
    </View>
);

const GenerateScreen = () => <PlaceholderScreen title="Generate Questions" />;

// Stack navigator for Rubrics
const RubricsStack = createNativeStackNavigator();

const RubricsNavigator = () => (
    <RubricsStack.Navigator screenOptions={{ headerShown: false }}>
        <RubricsStack.Screen name="RubricsList" component={RubricsListScreen} />
        <RubricsStack.Screen name="CreateRubric" component={CreateRubricScreen} />
        <RubricsStack.Screen name="RubricSubjectSelection" component={RubricSubjectSelectionScreen} />
        <RubricsStack.Screen name="RubricTypeSelection" component={RubricTypeSelectionScreen} />
        <RubricsStack.Screen name="RubricWizard" component={RubricWizardScreen} />
        <RubricsStack.Screen name="RubricDetail" component={RubricDetailScreen} />
        <RubricsStack.Screen name="GenerationResults" component={GenerationResultsScreen} />
        <RubricsStack.Screen name="QuestionPreview" component={QuestionPreviewScreen} />
    </RubricsStack.Navigator>
);

// Stack navigator for Subjects
const SubjectsStack = createNativeStackNavigator();

const SubjectsNavigator = () => (
    <SubjectsStack.Navigator screenOptions={{ headerShown: false }}>
        <SubjectsStack.Screen name="SubjectsList" component={SubjectsListScreen} />
        <SubjectsStack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
        <SubjectsStack.Screen name="UnitDetail" component={UnitDetailScreen} />
        <SubjectsStack.Screen name="AddSubject" component={SubjectWizardScreen} />
        <SubjectsStack.Screen name="TopicDetail" component={TopicDetailScreen} />
        <SubjectsStack.Screen name="EditCOLO" component={EditCOLOScreen} />
        <SubjectsStack.Screen name="QuickGenerate" component={QuickGenerateScreen} />
        <SubjectsStack.Screen name="Generating" component={GeneratingScreen} />
        <SubjectsStack.Screen name="GenerationResults" component={GenerationResultsScreen} />
        <SubjectsStack.Screen name="QuestionPreview" component={QuestionPreviewScreen} />
        <SubjectsStack.Screen name="Settings" component={SettingsScreen} />
        <SubjectsStack.Screen name="Profile" component={ProfileScreen} />
    </SubjectsStack.Navigator>
);

const HomeStack = createNativeStackNavigator();

const HomeNavigator = () => (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
        <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
        <HomeStack.Screen name="Settings" component={SettingsScreen} />
        <HomeStack.Screen name="Profile" component={ProfileScreen} />
    </HomeStack.Navigator>
);

const Tab = createBottomTabNavigator();



// ... (keep View, Text imports)
// Remove static colors import or keep for other things if needed, but we used it for tabBar

export const FacultyNavigator = () => {
    const { colors } = useAppTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.iosGray,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopWidth: 1,
                    borderTopColor: colors.divider,
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '500',
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeNavigator}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ fontSize: size, color }}>🏠</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Subjects"
                component={SubjectsNavigator}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ fontSize: size, color }}>📚</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Rubrics"
                component={RubricsNavigator}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ fontSize: size, color }}>📋</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Reports"
                component={ReportsScreen}
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
        marginBottom: 8,
    },
    placeholderSubtext: {
        ...typography.body,
        color: colors.textSecondary,
    },
});
