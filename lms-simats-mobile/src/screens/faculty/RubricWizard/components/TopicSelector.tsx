import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, typography, spacing} from '../../../../theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    subject: any;
    selectedTopics: number[];
    onChange: (selected: number[]) => void;
    maxSelection?: number;
}

export const TopicSelector = ({ subject, selectedTopics, onChange, maxSelection }: Props) => {
    const units = subject.units || [];

    const handleToggle = (topicId: number) => {
        if (selectedTopics.includes(topicId)) {
            onChange(selectedTopics.filter(id => id !== topicId));
        } else {
            if (maxSelection && selectedTopics.length >= maxSelection) {
                // Could show toast/alert here
                return;
            }
            onChange([...selectedTopics, topicId]);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Select Topics {maxSelection ? `(Max ${maxSelection})` : ''}</Text>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {units.map((unit: any) => (
                    <View key={unit.unit_number} style={styles.unitContainer}>
                        <Text style={styles.unitTitle}>Unit {unit.unit_number}: {unit.unit_title}</Text>
                        <View style={styles.topicsGrid}>
                            {unit.topics?.map((topic: any) => {
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
                                            isSelected && { color: '#FFFFFF' }
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
                    </View>
                ))}
            </ScrollView>
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
    unitContainer: {
        marginBottom: spacing.sm,
    },
    unitTitle: {
        ...typography.captionBold,
        color: colors.textSecondary,
        marginBottom: 4,
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
: 9999,
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
