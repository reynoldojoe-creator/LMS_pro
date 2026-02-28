import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    subject: any;
    selectedTopics: number[];
    onChange: (selected: number[]) => void;
    maxSelection?: number;
}

export const TopicSelector = ({ subject, selectedTopics, onChange, maxSelection }: Props) => {
    // Subject API returns topics as a flat array: subject.topics
    const topics = subject.topics || [];

    const handleToggle = (topicId: number) => {
        if (selectedTopics.includes(topicId)) {
            onChange(selectedTopics.filter(id => id !== topicId));
        } else {
            if (maxSelection && selectedTopics.length >= maxSelection) {
                return;
            }
            onChange([...selectedTopics, topicId]);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>
                {"Select Topics" + (maxSelection ? ` (Max ${maxSelection})` : '')}
            </Text>
            {topics.length === 0 ? (
                <Text style={styles.emptyText}>No topics found for this subject.</Text>
            ) : (
                <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled>
                    <View style={styles.topicsGrid}>
                        {topics.map((topic: any) => {
                            const isSelected = selectedTopics.includes(topic.id);
                            return (
                                <TouchableOpacity
                                    key={topic.id}
                                    style={[
                                        styles.topicChip,
                                        isSelected && styles.topicChipSelected
                                    ]}
                                    onPress={() => handleToggle(topic.id)}
                                >
                                    <Text style={[
                                        styles.topicText,
                                        isSelected && styles.topicTextSelected
                                    ]}>
                                        {topic.name}
                                    </Text>
                                    {isSelected && (
                                        <Ionicons name="checkmark" size={12} color="#FFFFFF" style={{ marginLeft: 4 }} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    emptyText: {
        ...typography.caption,
        color: colors.textTertiary,
        fontStyle: 'italic',
    },
    topicsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    topicChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: 9999,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.divider,
        marginRight: spacing.sm,
        marginBottom: spacing.sm,
    },
    topicChipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    topicText: {
        ...typography.caption,
        color: colors.textPrimary,
    },
    topicTextSelected: {
        color: '#FFFFFF',
    },
});
