import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing} from '../../theme';
import { useFacultyStore } from '../../store';
import { Button, Header, Card } from '../../components/common';
import { Picker } from '../../components/common/Picker';
import { FadeInView } from '../../components/common/FadeInView';
import type { QuestionType, DifficultyLevel } from '../../types';

type Props = NativeStackScreenProps<any, 'QuickGenerate'>;

const QUESTION_TYPES = [
    { label: 'Multiple Choice (MCQ)', value: 'mcq' },
    { label: 'Short Answer', value: 'short' },
    { label: 'Essay / Long Answer', value: 'essay' },
];

const DIFFICULTIES = [
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' },
];

export const QuickGenerateScreen = ({ navigation, route }: Props) => {
    const { subjects } = useFacultyStore();
    const preSelectedSubjectId = route.params?.subjectId;
    const preSelectedTopicId = route.params?.topicId;

    const [selectedSubjectId, setSelectedSubjectId] = useState(preSelectedSubjectId || subjects[0]?.id || '');
    const [selectedTopicId, setSelectedTopicId] = useState(preSelectedTopicId || '');
    const [questionType, setQuestionType] = useState<QuestionType>('mcq');
    const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
    const [count, setCount] = useState(5);

    const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

    // Memoize options to prevent re-renders
    const subjectOptions = useMemo(() =>
        subjects.map(s => ({ label: `${s.code} - ${s.name}`, value: s.id })),
        [subjects]);

    const topicOptions = useMemo(() =>
        (selectedSubject?.topics || []).map(t => ({ label: t.name, value: t.id })),
        [selectedSubject]);

    const handleGenerate = () => {
        navigation.navigate('Generating', {
            subjectId: selectedSubjectId,
            topicId: selectedTopicId,
            questionType,
            bloomLevel: 'apply', // Default
            difficulty,
            count,
        });
    };

    const isFormValid = selectedSubjectId && selectedTopicId && count > 0;

    return (
        <View style={styles.container}>
            <Header
                title="Quick Generate"
                showBackButton={true}
                onBack={() => navigation.goBack()}
            />

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <FadeInView duration={600}>
                    <View style={styles.form}>
                        <Card title="Context" style={styles.cardSpacing}>
                            {/* Subject Picker */}
                            <Picker
                                label="Subject"
                                value={selectedSubjectId}
                                options={subjectOptions}
                                onChange={(val) => {
                                    setSelectedSubjectId(val);
                                    setSelectedTopicId(''); // Reset topic
                                }}
                                placeholder="Select Subject"
                            />

                            {/* Topic Picker */}
                            <Picker
                                label="Topic"
                                value={selectedTopicId}
                                options={topicOptions}
                                onChange={setSelectedTopicId}
                                placeholder="Select Topic"
                                disabled={!selectedSubjectId}
                            />
                        </Card>

                        <Card title="Configuration" style={styles.cardSpacing}>
                            {/* Question Type */}
                            <Picker
                                label="Question Type"
                                value={questionType}
                                options={QUESTION_TYPES}
                                onChange={setQuestionType}
                            />

                            {/* Difficulty */}
                            <Picker
                                label="Difficulty"
                                value={difficulty}
                                options={DIFFICULTIES}
                                onChange={setDifficulty}
                            />
                        </Card>

                        <Card title="Quantity" style={styles.cardSpacing}>
                            <View style={styles.stepperContainer}>
                                <Text style={styles.label}>Number of Questions</Text>
                                <View style={styles.stepper}>
                                    <TouchableOpacity
                                        style={styles.stepperButton}
                                        onPress={() => setCount(Math.max(1, count - 1))}
                                    >
                                        <Text style={styles.stepperButtonText}>−</Text>
                                    </TouchableOpacity>
                                    <View style={styles.stepperValueContainer}>
                                        <Text style={styles.stepperValue}>{count}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.stepperButton}
                                        onPress={() => setCount(Math.min(20, count + 1))}
                                    >
                                        <Text style={styles.stepperButtonText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Card>

                        {/* Generate Button */}
                        <View style={styles.actionSection}>
                            <Button
                                title="Generate Questions"
                                onPress={handleGenerate}
                                disabled={!isFormValid}
                                variant="primary"
                                fullWidth
                                size="lg"
                            />
                        </View>
                    </View>
                </FadeInView>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    form: {
        padding: spacing.screenHorizontal,
        paddingTop: spacing.md,
    },
    cardSpacing: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.body,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    stepperContainer: {
        paddingVertical: spacing.sm,
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    stepperButton: {
        width: 44,
        height: 44,
: 12,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    stepperButtonText: {
        ...typography.h2,
        color: colors.primary,
        lineHeight: 30, // Center visually
    },
    stepperValueContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 44,
        backgroundColor: colors.iosGray6,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.border,
        marginHorizontal: -1, // Overlap borders slightly
        zIndex: -1,
    },
    stepperValue: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    actionSection: {
        marginTop: spacing.xl,
        marginBottom: spacing.xxl,
    },
});
