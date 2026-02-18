import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing} from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/common';

type Props = NativeStackScreenProps<any, 'RubricTypeSelection'>;

interface ExamTypeOption {
    id: string;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
}

const EXAM_TYPES: ExamTypeOption[] = [
    {
        id: 'final',
        title: 'Final Exam',
        description: 'Comprehensive assessment covering multiple units with varied question types.',
        icon: 'school',
        color: '#4F46E5' // Indigo
    },
    {
        id: 'midterm',
        title: 'Midterm Exam',
        description: 'Assessment covering specific units (typically 1-3) to gauge progress.',
        icon: 'time',
        color: '#0EA5E9' // Sky
    },
    {
        id: 'quiz',
        title: 'Quiz',
        description: 'Short, focused assessment on specific topics or a single unit.',
        icon: 'flash',
        color: '#F59E0B' // Amber
    },
    {
        id: 'assignment',
        title: 'Assignment',
        description: 'Project, report, or task-based assessment with custom criteria.',
        icon: 'document-text',
        color: '#10B981' // Emerald
    }
];

export const RubricTypeSelectionScreen = ({ navigation, route }: Props) => {
    const { subjectId } = route.params;

    const handleSelect = (typeId: string) => {
        navigation.navigate('RubricWizard', { subjectId, examType: typeId });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Assessment Type</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.subtitle}>
                    Choose the type of assessment you want to create a rubric for.
                </Text>

                {EXAM_TYPES.map((type) => (
                    <TouchableOpacity key={type.id} onPress={() => handleSelect(type.id)}>
                        <Card style={styles.card}>
                            <View style={[styles.iconContainer, { backgroundColor: type.color + '20' }]}>
                                <Ionicons name={type.icon} size={28} color={type.color} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.title}>{type.title}</Text>
                                <Text style={styles.description}>{type.description}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                        </Card>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.screenHorizontal,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    headerTitle: {
        ...typography.navTitle,
        color: colors.textPrimary,
    },
    content: {
        padding: spacing.md,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    iconContainer: {
        width: 48,
        height: 48,
: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    description: {
        ...typography.caption,
        color: colors.textSecondary,
        lineHeight: 18,
    },
});
