import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { Card, ModernButton, Input, Picker } from '../../../../components/common';
import { TopicSelector } from '../components/TopicSelector';
import { CODistributionInput } from '../components/CODistributionInput';
import { LODistributionInput } from '../components/LODistributionInput';
import { BloomDistributionInput } from '../components/BloomDistributionInput';

interface Props {
    subject: any;
    onSubmit: () => void;
}

export const MidtermForm = ({ subject, onSubmit }: Props) => {
    const { control, watch, setValue, formState: { errors } } = useFormContext();
    const coDist = watch('co_distribution');

    // Initialize defaults if empty
    useEffect(() => {
        if (subject.courseOutcomes && (!coDist || Object.keys(coDist).length === 0)) {
            const initial: any = {};
            const count = subject.courseOutcomes.length;
            subject.courseOutcomes.forEach((co: any) => initial[co.code] = 100 / count);
            setValue('co_distribution', initial);
        }
    }, [subject]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Midterm Details</Text>

                <Controller
                    control={control}
                    name="name"
                    rules={{ required: "Name is required" }}
                    render={({ field: { onChange, value } }) => (
                        <Input
                            label="Assessment Name"
                            value={value}
                            onChangeText={onChange}
                            placeholder="e.g. Midterm Exam October 2024"
                            error={errors.name?.message as string}
                        />
                    )}
                />

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                        <Controller
                            control={control}
                            name="total_marks"
                            defaultValue={50}
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    label="Total Marks"
                                    value={value?.toString()}
                                    onChangeText={(t) => onChange(parseInt(t) || 0)}
                                    keyboardType="numeric"
                                />
                            )}
                        />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <Controller
                            control={control}
                            name="duration_minutes"
                            defaultValue={90}
                            render={({ field: { onChange, value } }) => (
                                <Input
                                    label="Duration (min)"
                                    value={value?.toString()}
                                    onChangeText={(t) => onChange(parseInt(t) || 0)}
                                    keyboardType="numeric"
                                />
                            )}
                        />
                    </View>
                </View>
            </Card>

            {/* Topic Selection — key differentiator from Final Exam */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Topics Covered</Text>
                <Text style={styles.helperLabel}>
                    Select the topics included in this midterm exam
                </Text>
                <Controller
                    control={control}
                    name="assignment_config.topics"
                    render={({ field: { value, onChange } }) => (
                        <TopicSelector
                            subject={subject}
                            selectedTopics={value || []}
                            onChange={onChange}
                        />
                    )}
                />
            </Card>

            <Card style={styles.card}>
                <Controller
                    control={control}
                    name="co_distribution"
                    render={({ field: { value, onChange } }) => (
                        <CODistributionInput
                            subject={subject}
                            value={value || {}}
                            onChange={onChange}
                        />
                    )}
                />
            </Card>

            <Card style={styles.card}>
                <Controller
                    control={control}
                    name="lo_distribution"
                    render={({ field: { value, onChange } }) => (
                        <LODistributionInput
                            subject={subject}
                            value={value || {}}
                            onChange={onChange}
                        />
                    )}
                />
            </Card>

            <Card style={styles.card}>
                <Controller
                    control={control}
                    name="bloom_distribution"
                    defaultValue={{ K1: 10, K2: 20, K3: 30, K4: 25, K5: 10, K6: 5 }}
                    render={({ field: { value, onChange } }) => (
                        <BloomDistributionInput
                            value={value || {}}
                            onChange={onChange}
                        />
                    )}
                />
            </Card>

            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Question Pattern</Text>
                <Text style={styles.helperLabel}>Define the number and marks for each question type</Text>

                {/* MCQ Row */}
                <View style={styles.qpRow}>
                    <Text style={styles.qpLabel}>MCQ</Text>
                    <View style={styles.qpControls}>
                        <View style={styles.qpInputs}>
                            <View style={styles.qpInputGroup}>
                                <Text style={styles.qpInputLabel}>Count</Text>
                                <Controller
                                    control={control}
                                    name="question_distribution.mcq.count"
                                    defaultValue={0}
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            style={styles.qpInput}
                                            value={value?.toString()}
                                            onChangeText={(t) => onChange(Math.min(parseInt(t) || 0, 10))}
                                            keyboardType="number-pad"
                                            placeholderTextColor={colors.textTertiary}
                                        />
                                    )}
                                />
                            </View>
                            <Text style={styles.qpSeparator}>×</Text>
                            <View style={styles.qpInputGroup}>
                                <Text style={styles.qpInputLabel}>Marks</Text>
                                <Controller
                                    control={control}
                                    name="question_distribution.mcq.marks_each"
                                    defaultValue={1}
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            style={styles.qpInput}
                                            value={value?.toString()}
                                            onChangeText={(t) => onChange(parseInt(t) || 0)}
                                            keyboardType="number-pad"
                                            placeholderTextColor={colors.textTertiary}
                                        />
                                    )}
                                />
                            </View>
                        </View>
                        <View style={styles.difficultyContainer}>
                            <Controller
                                control={control}
                                name="question_distribution.mcq.difficulty"
                                defaultValue=""
                                render={({ field: { onChange, value } }) => (
                                    <Picker
                                        value={value}
                                        onChange={onChange}
                                        options={[
                                            { label: 'Easy', value: 'easy' },
                                            { label: 'Medium', value: 'medium' },
                                            { label: 'Hard', value: 'hard' }
                                        ]}
                                        placeholder="Difficulty"
                                    />
                                )}
                            />
                        </View>
                    </View>
                </View>

                {/* Short Answer Row */}
                <View style={styles.qpRow}>
                    <Text style={styles.qpLabel}>Short Answer</Text>
                    <View style={styles.qpControls}>
                        <View style={styles.qpInputs}>
                            <View style={styles.qpInputGroup}>
                                <Text style={styles.qpInputLabel}>Count</Text>
                                <Controller
                                    control={control}
                                    name="question_distribution.short_answer.count"
                                    defaultValue={0}
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            style={styles.qpInput}
                                            value={value?.toString()}
                                            onChangeText={(t) => onChange(Math.min(parseInt(t) || 0, 10))}
                                            keyboardType="number-pad"
                                            placeholderTextColor={colors.textTertiary}
                                        />
                                    )}
                                />
                            </View>
                            <Text style={styles.qpSeparator}>×</Text>
                            <View style={styles.qpInputGroup}>
                                <Text style={styles.qpInputLabel}>Marks</Text>
                                <Controller
                                    control={control}
                                    name="question_distribution.short_answer.marks_each"
                                    defaultValue={5}
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            style={styles.qpInput}
                                            value={value?.toString()}
                                            onChangeText={(t) => onChange(parseInt(t) || 0)}
                                            keyboardType="number-pad"
                                            placeholderTextColor={colors.textTertiary}
                                        />
                                    )}
                                />
                            </View>
                        </View>
                        <View style={styles.difficultyContainer}>
                            <Controller
                                control={control}
                                name="question_distribution.short_answer.difficulty"
                                defaultValue=""
                                render={({ field: { onChange, value } }) => (
                                    <Picker
                                        value={value}
                                        onChange={onChange}
                                        options={[
                                            { label: 'Easy', value: 'easy' },
                                            { label: 'Medium', value: 'medium' },
                                            { label: 'Hard', value: 'hard' }
                                        ]}
                                        placeholder="Difficulty"
                                    />
                                )}
                            />
                        </View>
                    </View>
                </View>

                {/* Essay Row */}
                <View style={styles.qpRow}>
                    <Text style={styles.qpLabel}>Essay</Text>
                    <View style={styles.qpControls}>
                        <View style={styles.qpInputs}>
                            <View style={styles.qpInputGroup}>
                                <Text style={styles.qpInputLabel}>Count</Text>
                                <Controller
                                    control={control}
                                    name="question_distribution.essay.count"
                                    defaultValue={0}
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            style={styles.qpInput}
                                            value={value?.toString()}
                                            onChangeText={(t) => onChange(Math.min(parseInt(t) || 0, 10))}
                                            keyboardType="number-pad"
                                            placeholderTextColor={colors.textTertiary}
                                        />
                                    )}
                                />
                            </View>
                            <Text style={styles.qpSeparator}>×</Text>
                            <View style={styles.qpInputGroup}>
                                <Text style={styles.qpInputLabel}>Marks</Text>
                                <Controller
                                    control={control}
                                    name="question_distribution.essay.marks_each"
                                    defaultValue={10}
                                    render={({ field: { onChange, value } }) => (
                                        <TextInput
                                            style={styles.qpInput}
                                            value={value?.toString()}
                                            onChangeText={(t) => onChange(parseInt(t) || 0)}
                                            keyboardType="number-pad"
                                            placeholderTextColor={colors.textTertiary}
                                        />
                                    )}
                                />
                            </View>
                        </View>
                        <View style={styles.difficultyContainer}>
                            <Controller
                                control={control}
                                name="question_distribution.essay.difficulty"
                                defaultValue=""
                                render={({ field: { onChange, value } }) => (
                                    <Picker
                                        value={value}
                                        onChange={onChange}
                                        options={[
                                            { label: 'Easy', value: 'easy' },
                                            { label: 'Medium', value: 'medium' },
                                            { label: 'Hard', value: 'hard' }
                                        ]}
                                        placeholder="Difficulty"
                                    />
                                )}
                            />
                        </View>
                    </View>
                </View>
            </Card>

            <ModernButton
                title="Create Midterm Rubric"
                onPress={onSubmit}
                variant="primary"
                style={styles.submitButton}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: spacing.md,
    },
    card: {
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    row: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    helperLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    qpRow: {
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        paddingVertical: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    qpLabel: {
        ...typography.body,
        color: colors.textPrimary,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    qpControls: {
        flexDirection: 'column',
        alignItems: 'stretch',
    },
    qpInputs: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    qpInputGroup: {
        alignItems: 'center',
    },
    qpInputLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: 2,
        fontSize: 10,
    },
    qpInput: {
        ...typography.body,
        color: colors.textPrimary,
        width: 56,
        textAlign: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    qpSeparator: {
        ...typography.h3,
        color: colors.textSecondary,
        marginHorizontal: spacing.sm,
    },
    submitButton: {
        marginTop: spacing.md,
        marginBottom: spacing.xl,
    },
    difficultyContainer: {
        width: '100%',
    },
});
