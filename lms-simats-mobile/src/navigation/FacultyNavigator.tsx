import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppTheme } from '../hooks';

// Import screens
import { DashboardScreen } from '../screens/faculty/DashboardScreen';
import { SubjectsListScreen } from '../screens/faculty/SubjectsListScreen';
import { SubjectDetailScreen } from '../screens/faculty/SubjectDetailScreen';
import { SubjectWizardScreen } from '../screens/faculty/SubjectWizard/SubjectWizardScreen';
import { UnitDetailScreen } from '../screens/faculty/UnitDetailScreen';
import { TopicDetailScreen } from '../screens/faculty/TopicDetailScreen';
import { EditCOLOScreen } from '../screens/faculty/EditCOLOScreen';
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

// Custom Tab Bar
// import { ModernTabBar } from '../components/common/ModernTabBar'; // It is already imported below, so we just remove the GlossyTabBar import.

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

// Import ModernTabBar
import { ModernTabBar } from '../components/common/ModernTabBar';
import { QuestionBankScreen } from '../screens/faculty/QuestionBankScreen';

// Constants...
// ...

const HomeNavigator = () => (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
        <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
        <HomeStack.Screen name="Settings" component={SettingsScreen} />
        <HomeStack.Screen name="Profile" component={ProfileScreen} />
        <HomeStack.Screen name="QuestionBank" component={QuestionBankScreen} />
        <HomeStack.Screen name="QuickGenerate" component={QuickGenerateScreen} />
        <HomeStack.Screen name="Generating" component={GeneratingScreen} />
        <HomeStack.Screen name="GenerationResults" component={GenerationResultsScreen} />
        <HomeStack.Screen name="QuestionPreview" component={QuestionPreviewScreen} />
    </HomeStack.Navigator>
);

const Tab = createBottomTabNavigator();

export const FacultyNavigator = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <ModernTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeNavigator}
                options={{
                    title: 'Home',
                    tabBarLabel: 'Home'
                }}
            />
            <Tab.Screen
                name="Subjects"
                component={SubjectsNavigator}
                options={{
                    title: 'Subjects',
                    tabBarLabel: 'Subjects'
                }}
            />
            <Tab.Screen
                name="Rubrics"
                component={RubricsNavigator}
                options={{
                    title: 'Rubrics',
                    tabBarLabel: 'Rubrics'
                }}
            />
            <Tab.Screen
                name="Reports"
                component={ReportsScreen}
                options={{
                    title: 'Reports',
                    tabBarLabel: 'Reports'
                }}
            />
        </Tab.Navigator>
    );
};


