import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useForm, FormProvider } from 'react-hook-form';
import { FinalExamForm } from './forms/FinalExamForm';
// import { MidtermForm } from './forms/MidtermForm';
import { QuizForm } from './forms/QuizForm';
// import { AssignmentForm } from './forms/AssignmentForm';
import { useRubricStore } from '../../../store/rubricStore';
import { subjectService } from '../../../services/subjectService';

type Props = NativeStackScreenProps<any, 'RubricWizard'>;

export const RubricWizardScreen = ({ route, navigation }: Props) => {
    const { subjectId, examType } = route.params;
    const [subject, setSubject] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { createRubric } = useRubricStore();

    const methods = useForm({
        defaultValues: {
            name: '',
            total_marks: 100,
            duration_minutes: 180,
            units_covered: [],
            question_distribution: {}, // Will be populated by specific form
            co_distribution: {},
            lo_distribution: {},

            difficulty_distribution: {},
            assignment_config: {}
        }
    });

    useEffect(() => {
        loadSubjectDetails();
    }, []);

    const loadSubjectDetails = async () => {
        try {
            const data = await subjectService.getById(subjectId);
            setSubject(data);
        } catch (error) {
            Alert.alert("Error", "Failed to load subject details");
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data: any) => {
        try {
            // Transform data as needed before sending
            const payload = {
                ...data,
                subject_id: parseInt(subjectId),
                exam_type: examType,
                // Ensure distributions sum to 100/correct values is handled by form validation usually
                // but we can add final check here
            };

            await createRubric(payload);
            Alert.alert("Success", "Rubric created successfully", [
                { text: "OK", onPress: () => navigation.navigate('RubricsList', { subjectId }) } // Assume flow returns to list
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to create rubric");
        }
    };

    const renderForm = () => {
        if (!subject) return null;

        switch (examType) {
            case 'final':
                return <FinalExamForm subject={subject} onSubmit={methods.handleSubmit(onSubmit)} />;
            case 'midterm':
                return <Text>Midterm Form (Coming Soon)</Text>; // <MidtermForm subject={subject} onSubmit={methods.handleSubmit(onSubmit)} />;
            case 'quiz':
                return <QuizForm subject={subject} onSubmit={methods.handleSubmit(onSubmit)} />;
            case 'assignment':
                return <Text>Assignment Form (Coming Soon)</Text>; // <AssignmentForm subject={subject} onSubmit={methods.handleSubmit(onSubmit)} />;
            default:
                return <Text>Unknown Exam Type</Text>;
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <FormProvider {...methods}>
                {renderForm()}
            </FormProvider>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
