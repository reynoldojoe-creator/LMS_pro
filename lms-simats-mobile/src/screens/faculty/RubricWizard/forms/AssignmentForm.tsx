import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { Card, ModernButton, Input, Picker } from '../../../../components/common';
import { TopicSelector } from '../components/TopicSelector';

interface Props {
    subject: any;
    onSubmit: () => void;
}

export const AssignmentForm = ({ subject, onSubmit }: Props) => {
    const { control, formState: { errors } } = useFormContext();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Assignment Details</Text>

                <Controller
                    control={control}
                    name="name"
                    rules={{ required: "Name is required" }}
                    render={({ field: { onChange, value } }) => (
                        <Input
                            label="Assignment Name"
                            value={value}
                            onChangeText={onChange}
                            placeholder="e.g. Assignment 1 — Data Structures"
                            error={errors.name?.message as string}
                        />
                    )}
                />
            </Card>

            {/* Topic Selection — single topic for focused assignment */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Select Topic</Text>
                <Text style={styles.helperLabel}>
                    Choose the topic this assignment will be based on
                </Text>
                <Controller
                    control={control}
                    name="assignment_config.topics"
                    render={({ field: { value, onChange } }) => (
                        <TopicSelector
                            subject={subject}
                            selectedTopics={value || []}
                            onChange={onChange}
                            maxSelection={1}
                        />
                    )}
                />
            </Card>

            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Configuration</Text>

                <Controller
                    control={control}
                    name="assignment_config.question_count"
                    defaultValue={3}
                    render={({ field: { onChange, value } }) => (
                        <Input
                            label="Number of Assignment Questions"
                            value={value?.toString()}
                            onChangeText={(t) => onChange(parseInt(t) || 1)}
                            keyboardType="numeric"
                            placeholder="3"
                        />
                    )}
                />

                <View style={styles.spacer} />

                <Controller
                    control={control}
                    name="assignment_config.difficulty"
                    defaultValue="medium"
                    render={({ field: { onChange, value } }) => (
                        <View>
                            <Text style={styles.fieldLabel}>Difficulty</Text>
                            <Picker
                                value={value}
                                onChange={onChange}
                                options={[
                                    { label: 'Easy', value: 'easy' },
                                    { label: 'Medium', value: 'medium' },
                                    { label: 'Hard', value: 'hard' }
                                ]}
                                placeholder="Select difficulty"
                            />
                        </View>
                    )}
                />

                <View style={styles.spacer} />

                <Controller
                    control={control}
                    name="total_marks"
                    defaultValue={25}
                    render={({ field: { onChange, value } }) => (
                        <Input
                            label="Total Marks"
                            value={value?.toString()}
                            onChangeText={(t) => onChange(parseInt(t) || 0)}
                            keyboardType="numeric"
                        />
                    )}
                />
            </Card>

            <ModernButton
                title="Generate Assignment"
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
    helperLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    fieldLabel: {
        ...typography.captionBold,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    spacer: {
        height: spacing.md,
    },
    submitButton: {
        marginTop: spacing.md,
        marginBottom: spacing.xl,
    },
});
