import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
// Using pure RN components for CO slider - no external dependency needed
import { colors, typography, spacing} from '../../theme';
import { useRubricStore } from '../../store';
import { useFacultyStore } from '../../store';
import { Button, Input, Modal, Header, Card } from '../../components/common'; // Added Header, Card
import { Picker } from '../../components/common/Picker'; // Added Picker
import { FadeInView } from '../../components/common/FadeInView'; // Added FadeInView
import type { CreateRubricInput, RubricSection, QuestionType, CORequirement } from '../../types';

type Props = NativeStackScreenProps<any, 'CreateRubric'>;

const EXAM_TYPES = [
    { label: 'Final Exam', value: 'final' },
    { label: 'Midterm Exam', value: 'midterm' },
    { label: 'Quiz', value: 'quiz' },
    { label: 'Assignment', value: 'assignment' },
];

export const CreateRubricScreen = ({ navigation }: Props) => {
    const { createRubric } = useRubricStore();
    const { subjects, fetchSubjects, isLoadingSubjects } = useFacultyStore();

    const [examType, setExamType] = useState<'final' | 'midterm' | 'quiz' | 'assignment'>('final');
    const [subjectId, setSubjectId] = useState('');
    const [title, setTitle] = useState('Quiz - December 2024');
    const [duration, setDuration] = useState('30');
    const [totalMarks, setTotalMarks] = useState('20');
    const [showSubjectPicker, setShowSubjectPicker] = useState(false);

    // Question Type Counts & Marks
    const [mcqCount, setMcqCount] = useState('5');
    const [mcqMarks, setMcqMarks] = useState('2');
    const [shortCount, setShortCount] = useState('2');
    const [shortMarks, setShortMarks] = useState('5');
    const [essayCount, setEssayCount] = useState('0');
    const [essayMarks, setEssayMarks] = useState('10');

    // CO Distribution (coId -> percentage)
    const [coDistribution, setCoDistribution] = useState<Record<string, number>>({});

    // State for presets
    const [isLoadingPreset, setIsLoadingPreset] = useState(false);

    // Fetch subjects on mount
    useEffect(() => {
        if (subjects.length === 0) {
            fetchSubjects();
        }
    }, []);

    // Set default subject when subjects load
    useEffect(() => {
        if (subjects.length > 0 && !subjectId) {
            setSubjectId(subjects[0].id);
        }
    }, [subjects]);

    // Load preset when exam type changes
    useEffect(() => {
        const loadPreset = async () => {
            setIsLoadingPreset(true);
            try {
                // In a real app, use an API service. For now, we mock the preset fetch or use a hardcoded one if API not ready
                // But we should try to hit the backend
                // const response = await fetch(`http://localhost:8000/rubrics/presets/${examType}`);
                // const preset = await response.json();

                // Using hardcoded for immediate feedback as duplicate of backend logic
                //Ideally this comes from backend
                interface Preset {
                    total_marks: number;
                    duration: number;
                    mcq: number;
                    short: number;
                    essay: number;
                }

                let preset: Preset = { total_marks: 100, duration: 180, mcq: 20, short: 5, essay: 3 }; // Default

                switch (examType) {
                    case 'final':
                        preset = { total_marks: 100, duration: 180, mcq: 20, short: 5, essay: 3 };
                        break;
                    case 'midterm':
                        preset = { total_marks: 50, duration: 90, mcq: 15, short: 4, essay: 0 };
                        break;
                    case 'quiz':
                        preset = { total_marks: 20, duration: 30, mcq: 10, short: 0, essay: 0 };
                        break;
                    case 'assignment':
                        preset = { total_marks: 10, duration: 0, mcq: 0, short: 0, essay: 1 };
                        break;
                }

                setTotalMarks(preset.total_marks.toString());
                setDuration(preset.duration.toString());
                // Don't override question counts - let user define their own pattern
                setTitle(`${examType.charAt(0).toUpperCase() + examType.slice(1)} - ${new Date().getFullYear()}`);

            } catch (error) {
                console.error("Failed to load preset", error);
            } finally {
                setIsLoadingPreset(false);
            }
        };
        loadPreset();
    }, [examType]);

    // Initialize CO distribution when subject changes
    useEffect(() => {
        const selectedSubject = subjects.find(s => s.id === subjectId);
        // Fix: Backend returns camelCase `courseOutcomes`
        const outcomes = selectedSubject?.courseOutcomes || [];

        if (outcomes.length > 0) {
            const coCount = outcomes.length;
            const equalPercentage = Math.floor(100 / coCount);
            const remainder = 100 - (equalPercentage * coCount);

            const initialDist: Record<string, number> = {};
            outcomes.forEach((co: any, index: number) => {
                // Give remainder to first CO to ensure total is 100%
                initialDist[co.id] = index === 0 ? equalPercentage + remainder : equalPercentage;
            });
            setCoDistribution(initialDist);
        }
    }, [subjectId, subjects]); // Added subjects dependency

    const selectedSubject = subjects.find(s => s.id === subjectId);

    // Calculate total CO percentage
    const getTotalCOPercentage = () => {
        return Object.values(coDistribution).reduce((sum, val) => sum + val, 0);
    };

    const handleCOSliderChange = (coId: string, value: number) => {
        // This function is likely obsolete if we replaced UI but keeping for compatibility if logic calls it
        setCoDistribution(prev => ({ ...prev, [coId]: value }));
    };

    // New handler for Picker in CO list (if we were using this screen for COs, but `RubricWizard` is the main one now?
    // Wait, the user asked to fix `RubricWizard/components/CODistributionInput.tsx`.
    // This `CreateRubricScreen.tsx` seems to have its OWN CO distribution UI (lines 343-393 in old file).
    // I should probably replace THAT with the reusable component `CODistributionInput` from RubricWizard, OR refactor it here too.
    // For now, I'll refactor it to use `Picker` here as well, mirroring the fix.

    const handleCreate = async () => {
        // Validation: CO percentages must total 100%
        const totalCO = getTotalCOPercentage();
        const outcomes = selectedSubject?.courseOutcomes || [];

        if (selectedSubject && outcomes.length > 0 && Math.abs(totalCO - 100) > 0.1) {
            Alert.alert(
                'Invalid CO Distribution',
                `CO percentages must total 100%. Current total: ${totalCO.toFixed(1)}%`
            );
            return;
        }

        // Prepare user-defined question pattern as sections
        const sections = [
            { type: 'mcq', count: parseInt(mcqCount) || 0, marksEach: parseInt(mcqMarks) || 2 },
            { type: 'short_answer', count: parseInt(shortCount) || 0, marksEach: parseInt(shortMarks) || 5 },
            { type: 'essay', count: parseInt(essayCount) || 0, marksEach: parseInt(essayMarks) || 10 },
        ].filter(s => s.count > 0);

        try {
            const coDistByCode: Record<string, number> = {};
            (selectedSubject?.courseOutcomes || []).forEach((co: any) => {
                coDistByCode[co.code] = coDistribution[co.id] || 0;
            });

            // Construct backend-compatible object (camelCase keys for main.py)
            const payload = {
                title: title,
                subjectId: subjectId,
                examType: examType,
                sections: sections,
                coRequirements: Object.entries(coDistByCode).map(([code, pct]) => ({ code, percentage: pct })),
                totalMarks: parseInt(totalMarks),
                duration: parseInt(duration),
                difficultyDistribution: {},
                unitsCovered: [],
            };

            await createRubric(payload as any);
            navigation.goBack();

        } catch (e) {
            Alert.alert("Error", "Failed to create rubric");
        }
    };

    // Helper for Picker options
    const PERCENTAGE_OPTIONS = Array.from({ length: 21 }, (_, i) => ({
        label: `${i * 5}%`,
        value: i * 5
    }));

    return (
        <View style={styles.container}>
            <Header
                title="Create Rubric"
                showBackButton={true}
                onBack={() => navigation.goBack()}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoiding}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <FadeInView duration={600}>
                        <View style={styles.form}>
                            {/* Exam Type - Replaced Radio with Picker */}
                            <Card title="Exam Configuration" style={styles.cardSpacing}>
                                <Picker
                                    label="Exam Type"
                                    value={examType}
                                    options={EXAM_TYPES}
                                    onChange={(val) => setExamType(val)}
                                />

                                {/* Subject */}
                                <View style={styles.field}>
                                    <Text style={styles.label}>Subject</Text>
                                    {isLoadingSubjects ? (
                                        <View style={styles.pickerTrigger}>
                                            <Text style={styles.pickerText}>Loading subjects...</Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.pickerTrigger}
                                            onPress={() => setShowSubjectPicker(true)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.pickerText}>
                                                {selectedSubject ? `${selectedSubject.code} - ${selectedSubject.name}` : 'Select Subject'}
                                            </Text>
                                            <Text style={styles.pickerChevron}>▼</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </Card>

                            <Card title="Details" style={styles.cardSpacing}>
                                {/* Title */}
                                <Input
                                    label="Exam Title"
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="e.g., Final Exam - December 2024"
                                />

                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                                        <Input
                                            label="Duration (min)"
                                            value={duration}
                                            onChangeText={setDuration}
                                            keyboardType="number-pad"
                                            placeholder="180"
                                        />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                                        <Input
                                            label="Total Marks"
                                            value={totalMarks}
                                            onChangeText={setTotalMarks}
                                            keyboardType="number-pad"
                                            placeholder="100"
                                        />
                                    </View>
                                </View>
                            </Card>

                            <Card title="Question Pattern" style={styles.cardSpacing}>
                                <Text style={styles.helperText}>Define the number and marks for each question type</Text>

                                {/* MCQ */}
                                <View style={styles.questionPatternRow}>
                                    <Text style={styles.questionTypeLabel}>MCQ</Text>
                                    <View style={styles.questionPatternInputs}>
                                        <View style={styles.patternInputGroup}>
                                            <Text style={styles.patternInputLabel}>Count</Text>
                                            <TextInput
                                                style={styles.questionTypeInput}
                                                value={mcqCount}
                                                onChangeText={setMcqCount}
                                                keyboardType="number-pad"
                                                placeholder="0"
                                                placeholderTextColor={colors.textTertiary}
                                            />
                                        </View>
                                        <Text style={styles.patternSeparator}>×</Text>
                                        <View style={styles.patternInputGroup}>
                                            <Text style={styles.patternInputLabel}>Marks</Text>
                                            <TextInput
                                                style={styles.questionTypeInput}
                                                value={mcqMarks}
                                                onChangeText={setMcqMarks}
                                                keyboardType="number-pad"
                                                placeholder="2"
                                                placeholderTextColor={colors.textTertiary}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Short Answer */}
                                <View style={styles.questionPatternRow}>
                                    <Text style={styles.questionTypeLabel}>Short Answer</Text>
                                    <View style={styles.questionPatternInputs}>
                                        <View style={styles.patternInputGroup}>
                                            <Text style={styles.patternInputLabel}>Count</Text>
                                            <TextInput
                                                style={styles.questionTypeInput}
                                                value={shortCount}
                                                onChangeText={setShortCount}
                                                keyboardType="number-pad"
                                                placeholder="0"
                                                placeholderTextColor={colors.textTertiary}
                                            />
                                        </View>
                                        <Text style={styles.patternSeparator}>×</Text>
                                        <View style={styles.patternInputGroup}>
                                            <Text style={styles.patternInputLabel}>Marks</Text>
                                            <TextInput
                                                style={styles.questionTypeInput}
                                                value={shortMarks}
                                                onChangeText={setShortMarks}
                                                keyboardType="number-pad"
                                                placeholder="5"
                                                placeholderTextColor={colors.textTertiary}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Essay */}
                                <View style={styles.questionPatternRow}>
                                    <Text style={styles.questionTypeLabel}>Essay</Text>
                                    <View style={styles.questionPatternInputs}>
                                        <View style={styles.patternInputGroup}>
                                            <Text style={styles.patternInputLabel}>Count</Text>
                                            <TextInput
                                                style={styles.questionTypeInput}
                                                value={essayCount}
                                                onChangeText={setEssayCount}
                                                keyboardType="number-pad"
                                                placeholder="0"
                                                placeholderTextColor={colors.textTertiary}
                                            />
                                        </View>
                                        <Text style={styles.patternSeparator}>×</Text>
                                        <View style={styles.patternInputGroup}>
                                            <Text style={styles.patternInputLabel}>Marks</Text>
                                            <TextInput
                                                style={styles.questionTypeInput}
                                                value={essayMarks}
                                                onChangeText={setEssayMarks}
                                                keyboardType="number-pad"
                                                placeholder="10"
                                                placeholderTextColor={colors.textTertiary}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </Card>

                            {/* CO Distribution */}
                            {selectedSubject && (selectedSubject.courseOutcomes || []).length > 0 && (
                                <Card title="CO Distribution" style={styles.cardSpacing}>
                                    <View style={styles.coHeader}>
                                        <Text style={styles.helperText}>Must total 100%</Text>
                                        <View style={[
                                            styles.totalBadge,
                                            Math.abs(getTotalCOPercentage() - 100) < 0.1 ? styles.totalBadgeGood : styles.totalBadgeError
                                        ]}>
                                            <Text style={[
                                                styles.totalBadgeText,
                                                Math.abs(getTotalCOPercentage() - 100) < 0.1 ? styles.totalBadgeTextGood : styles.totalBadgeTextError
                                            ]}>
                                                {getTotalCOPercentage().toFixed(0)}%
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.coContainer}>
                                        {(selectedSubject.courseOutcomes || []).map((co: any) => {
                                            const percentage = coDistribution[co.id] || 0;
                                            return (
                                                <View key={co.id} style={styles.coItem}>
                                                    <View style={styles.coLabelRow}>
                                                        <Text style={styles.coCode}>{co.code}</Text>
                                                        <Text style={styles.coPercentage}>{percentage}%</Text>
                                                    </View>

                                                    <Text style={styles.coDescription} numberOfLines={1}>{co.description}</Text>

                                                    {/* Pure RN slider: progress bar + stepper buttons */}
                                                    <View style={styles.sliderRow}>
                                                        <TouchableOpacity
                                                            style={styles.sliderBtn}
                                                            onPress={() => handleCOSliderChange(co.id, Math.max(0, percentage - 5))}
                                                        >
                                                            <Text style={styles.sliderBtnText}>−</Text>
                                                        </TouchableOpacity>
                                                        <View style={styles.progressBarOuter}>
                                                            <View style={[styles.progressBarInner, { width: `${percentage}%` }]} />
                                                        </View>
                                                        <TouchableOpacity
                                                            style={styles.sliderBtn}
                                                            onPress={() => handleCOSliderChange(co.id, Math.min(100, percentage + 5))}
                                                        >
                                                            <Text style={styles.sliderBtnText}>+</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </Card>
                            )}

                            {/* Create Button */}
                            <View style={styles.actionSection}>
                                <Button
                                    title="Create Rubric"
                                    onPress={handleCreate}
                                    variant="primary"
                                    fullWidth
                                    size="lg"
                                />
                            </View>
                        </View>
                    </FadeInView>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Subject Picker Modal */}
            <Modal
                visible={showSubjectPicker}
                onClose={() => setShowSubjectPicker(false)}
                title="Select Subject"
            >
                <ScrollView style={{ maxHeight: 400 }}>
                    {subjects.map((subject) => (
                        <TouchableOpacity
                            key={subject.id}
                            style={styles.pickerOption}
                            onPress={() => {
                                setSubjectId(subject.id);
                                setShowSubjectPicker(false);
                            }}
                        >
                            <Text style={styles.pickerOptionText}>
                                {subject.code} - {subject.name}
                            </Text>
                            {subjectId === subject.id && <Text style={styles.checkmark}>✓</Text>}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    keyboardAvoiding: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100, // Fix bottom cutoff
    },
    form: {
        padding: spacing.screenHorizontal,
        paddingTop: spacing.md,
    },
    cardSpacing: {
        marginBottom: spacing.md,
    },
    row: {
        flexDirection: 'row',
    },
    field: {
        marginTop: spacing.md,
    },
    label: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    helperText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    pickerTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
: 12,
        minHeight: 44,
    },
    pickerText: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
    },
    pickerChevron: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    questionTypeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    questionTypeLabel: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
    },
    questionTypeInput: {
        ...typography.body,
        color: colors.textPrimary,
        backgroundColor: colors.iosGray6,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
: 8,
        width: 60,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    questionPatternRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    questionPatternInputs: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    patternInputGroup: {
        alignItems: 'center',
    },
    patternInputLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: 2,
        fontSize: 10,
    },
    patternSeparator: {
        ...typography.h3,
        color: colors.textSecondary,
        marginHorizontal: spacing.sm,
    },
    coHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    totalBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
: 8,
        borderWidth: 1,
    },
    totalBadgeGood: {
        backgroundColor: colors.success + '10', // 10% opacity
        borderColor: colors.success,
    },
    totalBadgeError: {
        backgroundColor: colors.error + '10',
        borderColor: colors.error,
    },
    totalBadgeText: {
        ...typography.captionBold,
    },
    totalBadgeTextGood: {
        color: colors.success,
    },
    totalBadgeTextError: {
        color: colors.error,
    },
    coContainer: {
        marginTop: spacing.sm,
    },
    coItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
        paddingBottom: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    coLabelRow: {
        flex: 1,
        marginRight: spacing.md,
    },
    coCode: {
        ...typography.captionBold,
        color: colors.primary,
    },
    coPercentage: {
        ...typography.h3,
        color: colors.primary,
    },
    coDescription: {
        ...typography.caption,
        color: colors.textSecondary,
        fontSize: 10,
    },
    sliderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    sliderBtn: {
        width: 32,
        height: 32,
: 8,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sliderBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 22,
    },
    progressBarOuter: {
        flex: 1,
        height: 10,
        backgroundColor: colors.iosGray5,
: 5,
        marginHorizontal: spacing.sm,
        overflow: 'hidden',
    },
    progressBarInner: {
        height: '100%',
        backgroundColor: colors.primary,
: 5,
    },
    pickerContainer: {
        width: 100,
    },
    actionSection: {
        marginTop: spacing.xl,
        marginBottom: spacing.xxl,
    },
    pickerOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    pickerOptionText: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
    },
    checkmark: {
        ...typography.h3,
        color: colors.primary,
    },
});

