import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import { colors, typography, spacing } from '../../../../theme';
import { Card, Button, Input, Picker } from '../../../../components/common';
import { CODistributionInput } from '../components/CODistributionInput';
import { LODistributionInput } from '../components/LODistributionInput';

interface Props {
    subject: any;
    onSubmit: () => void;
}

export const FinalExamForm = ({ subject, onSubmit }: Props) => {
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
                <Text style={styles.sectionTitle}>Basic Details</Text>

                <Controller
                    control={control}
                    name="name"
                    rules={{ required: "Name is required" }}
                    render={({ field: { onChange, value } }) => (
                        <Input
                            label="Assessment Name"
                            value={value}
                            onChangeText={onChange}
                            placeholder="e.g. End Semester Exam May 2024"
                            error={errors.name?.message as string}
                        />
                    )}
                />

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                        <Controller
                            control={control}
                            name="total_marks"
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
                <Text style={styles.sectionTitle}>Question Pattern</Text>
                <Text style={styles.helperLabel}>Define the number and marks for each question type</Text>

                {/* MCQ Row */}
                <View style={styles.qpRow}>
                    <Text style={styles.qpLabel}>MCQ</Text>
                    <View style={styles.qpInputs}>
                        <View style={styles.qpInputGroup}>
                            <Text style={styles.qpInputLabel}>Count</Text>
                            <Controller
                                control={control}
                                name="question_distribution.mcq.count"
                                defaultValue={20}
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
                        <Text style={styles.qpSeparator}>×</Text>
                        <View style={styles.qpInputGroup}>
                            <Text style={styles.qpInputLabel}>Marks</Text>
                            <Controller
                                control={control}
                                name="question_distribution.mcq.marks_each"
                                defaultValue={2}
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
                            defaultValue="medium"
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

                {/* Short Answer Row */}
                <View style={styles.qpRow}>
                    <Text style={styles.qpLabel}>Short Answer</Text>
                    <View style={styles.qpInputs}>
                        <View style={styles.qpInputGroup}>
                            <Text style={styles.qpInputLabel}>Count</Text>
                            <Controller
                                control={control}
                                name="question_distribution.short_answer.count"
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
                        <Text style={styles.qpSeparator}>×</Text>
                        <View style={styles.qpInputGroup}>
                            <Text style={styles.qpInputLabel}>Marks</Text>
                            <Controller
                                control={control}
                                name="question_distribution.short_answer.marks_each"
                                defaultValue={6}
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
                            defaultValue="medium"
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

                {/* Essay Row */}
                <View style={styles.qpRow}>
                    <Text style={styles.qpLabel}>Essay</Text>
                    <View style={styles.qpInputs}>
                        <View style={styles.qpInputGroup}>
                            <Text style={styles.qpInputLabel}>Count</Text>
                            <Controller
                                control={control}
                                name="question_distribution.essay.count"
                                defaultValue={3}
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
                            defaultValue="medium"
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
            </Card>

            <Button
                title="Create Rubric"
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
    infoText: {
        ...typography.body,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    helperLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    qpRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    qpLabel: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
        fontWeight: '600',
    },
    qpInputs: {
        flexDirection: 'row',
        alignItems: 'center',
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
        marginTop: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
});
