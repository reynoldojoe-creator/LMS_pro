import React, { useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Button, Tag } from '../../components/common';
import { useRubricStore } from '../../store';

type Props = NativeStackScreenProps<any, 'GenerationResults'>;

/**
 * Extract clean question text from potentially raw JSON stored in questionText.
 */
function getCleanQuestionText(questionText: string): string {
    if (!questionText || typeof questionText !== 'string') return 'No question text';

    // If it doesn't look like JSON, return as-is
    if (!questionText.trim().startsWith('{')) return questionText;

    // Try JSON.parse first
    try {
        const parsed = JSON.parse(questionText);
        const inner = parsed.questions?.[0] || parsed;
        return inner.question_text || inner.questionText || questionText;
    } catch {
        // Truncated JSON — use regex
    }

    // Regex fallback: extract "question_text": "..." 
    const match = questionText.match(/"question_text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (match) {
        return match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').trim();
    }

    return 'Question text unavailable';
}

export const GenerationResultsScreen = ({ navigation, route }: Props) => {
    const { generatedQuestions: paramQuestions, rubricId } = route.params as any;
    const { generatedQuestions: storeQuestions, fetchQuestions, isLoading } = useRubricStore();

    // Use params if available (fresh generation), otherwise store (fetched)
    const questionsToDisplay = paramQuestions || storeQuestions || [];

    // ... inside component

    // Refresh on focus to show latest status
    useFocusEffect(
        useCallback(() => {
            if (rubricId) {
                // Determine if we have a batch ID (e.g. UUID v4) or rubric ID and call appropriate method
                // But safer to try fetchLatestQuestionsForRubric if it looks like rubric ID
                // Or just try fetchQuestions (batch) and fallback?
                // Simplest: The param is named rubricId, so treat it as Rubric ID
                useRubricStore.getState().fetchLatestQuestionsForRubric(rubricId);
            }
        }, [rubricId])
    );

    // Initial load handled by focus effect, but keeping useEffect for params if needed
    // Actually consistent behavior is better:
    useEffect(() => {
        // If we have paramQuestions from navigation, we display them initially
        // But we should also fetch fresh ones if we have an ID
        if (rubricId && !paramQuestions) {
            fetchQuestions(rubricId);
        }
    }, [rubricId, paramQuestions]);

    if (isLoading && !questionsToDisplay.length) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading questions...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const validCount = questionsToDisplay.filter((q: any) => q.status === 'valid' || q.status === 'pending' || q.status === 'approved').length;
    const totalCount = questionsToDisplay.length;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'valid':
            case 'approved': return '✓';
            case 'needs_review':
            case 'pending': return '⚠️'; // Pending often means generated but not vetted
            case 'failed':
            case 'rejected': return '✗';
            default: return '';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'valid':
            case 'approved': return colors.success;
            case 'needs_review':
            case 'pending': return colors.warning;
            case 'failed':
            case 'rejected': return colors.error;
            default: return colors.textSecondary;
        }
    };

    const handleSaveAll = () => {
        navigation.navigate('RubricsList'); // Navigate back to list instead of Subjects
    };

    const handleViewQuestion = (questionId: string) => {
        navigation.navigate('QuestionPreview', { questionId });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backChevron}>‹</Text>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Results</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView>
                {/* Summary */}
                <View style={styles.summary}>
                    <Text style={styles.summaryText}>
                        {validCount}/{totalCount} questions available
                    </Text>
                    <View style={styles.summaryProgress}>
                        <View style={styles.summaryProgressBar}>
                            <View style={[styles.summaryProgressFill, { width: `${totalCount > 0 ? (validCount / totalCount) * 100 : 0}%` }]} />
                        </View>
                    </View>
                </View>

                {/* Questions List */}
                <View style={styles.questionsList}>
                    {questionsToDisplay.map((question: any, index: number) => (
                        <TouchableOpacity
                            key={question.id || index}
                            style={styles.questionCard}
                            onPress={() => handleViewQuestion(question.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.questionHeader}>
                                <Text style={styles.questionNumber}>Q{index + 1}</Text>
                                <View style={styles.questionStatus}>
                                    <Text style={[styles.statusIcon, { color: getStatusColor(question.status) }]}>
                                        {getStatusIcon(question.status)}
                                    </Text>
                                    {/* Removed Validation Score as requested */}
                                </View>
                            </View>

                            <Text style={styles.questionText} numberOfLines={2}>
                                {getCleanQuestionText(question.questionText)}
                            </Text>

                            <View style={styles.questionTags}>
                                <Tag
                                    label={(question.type || 'short').toUpperCase()}
                                    variant="default"
                                    size="sm"
                                />
                                {/* Removed Bloom/Difficulty Tags as requested */}
                            </View>

                            <View style={styles.questionActions}>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Text style={styles.actionButtonText}>View</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
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
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
        backgroundColor: colors.surface,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backChevron: {
        fontSize: 32,
        color: colors.primary,
        fontWeight: '300',
        marginRight: -4,
    },
    backText: {
        ...typography.body,
        color: colors.primary,
    },
    headerTitle: {
        ...typography.navTitle,
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        flex: 1,
    },
    summary: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    summaryText: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    summaryProgress: {
        marginTop: spacing.sm,
    },
    summaryProgressBar: {
        height: 6,
        backgroundColor: colors.iosGray5,
        borderRadius: borderRadius.full,
        overflow: 'hidden',
    },
    summaryProgressFill: {
        height: '100%',
        backgroundColor: colors.success,
    },
    questionsList: {
        padding: spacing.screenHorizontal,
    },
    questionCard: {
        backgroundColor: colors.surface,
        padding: spacing.cardPadding,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    questionNumber: {
        ...typography.bodyBold,
        color: colors.primary,
    },
    questionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIcon: {
        fontSize: 16,
        marginRight: spacing.xs,
    },
    validationScore: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    questionText: {
        ...typography.body,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    questionTags: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    tagGap: {
        width: spacing.xs,
    },
    questionActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.sm,
    },
    actionButton: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
    },
    actionButtonText: {
        ...typography.body,
        color: colors.primary,
    },
    actionButtonDanger: {
        color: colors.error,
    },
    actionSection: {
        padding: spacing.lg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    loadingText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
});
