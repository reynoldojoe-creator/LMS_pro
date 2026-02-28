import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useFacultyStore } from '../../store';
import { ScreenBackground, ModernNavBar, InsetGroupedList } from '../../components/common';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<any, 'UnitDetail'>;

export const UnitDetailScreen = ({ route, navigation }: Props) => {
    const { subjectId, unitId } = route.params as { subjectId: string; unitId: string };
    const { getSubjectById } = useFacultyStore();
    const subject = getSubjectById(subjectId);
    const unit = (subject?.units || []).find(u => u.id === unitId);

    if (!subject || !unit) {
        return (
            <ScreenBackground>
                <ModernNavBar title="Unit Error" showBack onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <Text>Unit not found</Text>
                </View>
            </ScreenBackground>
        );
    }

    const handleTopicPress = (topicId: string) => {
        navigation.navigate('TopicDetail', { subjectId, unitId, topicId });
    };

    const items = unit.topics?.map(topic => ({
        id: topic.id,
        title: topic.name,
        subtitle: `${topic.questionCount || 0} Questions Generated`,
        onPress: () => handleTopicPress(topic.id),
        showChevron: true,
        icon: 'document-text-outline'
    })) || [];

    if (items.length === 0) {
        items.push({ title: 'No topics found' } as any);
    }

    return (
        <ScreenBackground>
            <ModernNavBar
                title={`Unit ${unit.number}`}
                showBack
                onBack={() => navigation.goBack()}
            />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerSection}>
                    <Text style={styles.unitTitle}>{unit.title}</Text>
                    <Text style={styles.unitDesc}>{unit.description || 'No description available'}</Text>
                </View>

                <InsetGroupedList
                    header="TOPICS"
                    items={items}
                />
            </ScrollView>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: {
        paddingBottom: spacing.xl,
    },
    headerSection: {
        padding: spacing.lg,
        alignItems: 'center',
    },
    unitTitle: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    unitDesc: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
