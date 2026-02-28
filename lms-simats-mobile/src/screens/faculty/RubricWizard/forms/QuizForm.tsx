import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { Card, ModernButton, Input, SegmentedControl } from '../../../../components/common';
import { TopicSelector } from '../components/TopicSelector';

interface Props {
    subject: any;
    onSubmit: () => void;
}

export const QuizForm = ({ subject, onSubmit }: Props) => {
    const { control, watch, setValue, formState: { errors } } = useFormContext();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Quiz Details</Text>

                <Controller
                    control={control}
                    name="name"
                    rules={{ required: "Name is required" }}
                    render={({ field: { onChange, value } }) => (
                        <Input
                            label="Quiz Name"
                            value={value}
                            onChangeText={onChange}
                            placeholder="e.g. Unit 1 Quiz"
                            error={errors.name?.message as string}
                        />
                    )}
                />

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                        <Controller
                            control={control}
                            name="total_marks"
                            defaultValue={20}
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
                            defaultValue={20}
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
                    name="assignment_config.topics"
                    render={({ field: { value, onChange } }) => (
                        <TopicSelector
                            subject={subject}
                            selectedTopics={value || []}
                            onChange={onChange}
                            maxSelection={2}
                        />
                    )}
                />
            </Card>

            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Configuration</Text>
                <Text style={styles.label}>Question Type</Text>
                <Controller
                    control={control}
                    name="assignment_config.question_type"
                    defaultValue="mcq"
                    render={({ field: { value, onChange } }) => (
                        <View style={styles.segmentContainer}>
                            <SegmentedControl
                                segments={['MCQ', 'Short Answer']}
                                selectedIndex={value === 'mcq' ? 0 : 1}
                                onChange={(index) => onChange(index === 0 ? 'mcq' : 'short_answer')}
                            />
                        </View>
                    )}
                />


            </Card>

            <ModernButton
                title="Create Quiz"
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
    },
    label: {
        ...typography.captionBold,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        marginTop: spacing.sm,
    },
    segmentContainer: {
        marginBottom: spacing.md,
    },
    submitButton: {
        marginTop: spacing.md,
        marginBottom: spacing.xl,
    },
});
