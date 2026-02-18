import React, { useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing} from '../../theme';
import { Tag } from '../../components/common';
import { useRubricStore } from '../../store';
import { LinenBackground, GlossyNavBar, GlossyCard, GlossyButton } from '../../components/ios6';

type Props = NativeStackScreenProps<any, 'GenerationResults'>;

function getCleanQuestionText(questionText: string): string {
    if (!questionText || typeof questionText !== 'string') return 'No question text';
    if (!questionText.trim().startsWith('{')) return questionText;
    try {
        const parsed = JSON.parse(questionText);
        const inner = parsed.questions?.[0] || parsed;
        return inner.question_text || inner.questionText || questionText;
    } catch { }

    const match = questionText.match(/"question_text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (match) {
        return match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').trim();
    }
    return 'Question text unavailable';
}

export const GenerationResultsScreen = ({ navigation, route }: Props) => {
    const { generatedQuestions: paramQuestions, rubricId } = route.params as any;
    const { generatedQuestions: storeQuestions, fetchQuestions, isLoading } = useRubricStore();

    const questionsToDisplay = paramQuestions || storeQuestions || [];

    useFocusEffect(
        useCallback(() => {
            if (rubricId) {
                useRubricStore.getState().fetchLatestQuestionsForRubric(rubricId);
            }
        }, [rubricId])
    );

    useEffect(() => {
        if (rubricId && !paramQuestions) {
            fetchQuestions(rubricId);
        }
    }, [rubricId, paramQuestions]);

    if (isLoading && !questionsToDisplay.length) {
        return (
            <LinenBackground>
                <GlossyNavBar title="Results" showBack onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4C566C" />
                    <Text style={styles.loadingText}>Loading questions...</Text>
                </View>
            </LinenBackground>
        );
    }

    const validCount = questionsToDisplay.filter((q: any) => q.status === 'valid' || q.status === 'pending' || q.status === 'approved').length;
    const totalCount = questionsToDisplay.length;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'valid':
            case 'approved': return '✓';
            case 'needs_review':
            case 'pending': return '⚠️';
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

    const handleViewQuestion = (questionId: string) => {
        navigation.navigate('QuestionPreview', { questionId });
    };

    return (
        <LinenBackground>
            <GlossyNavBar title="Results" showBack onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Summary */}
                <GlossyCard title="Summary">
                    <Text style={styles.summaryText}>
                        {validCount}/{totalCount} questions available
                    </Text>
                    <View style={styles.summaryProgress}>
                        <View style={styles.summaryProgressBar}>
                            <View style={[styles.summaryProgressFill, { width: `${totalCount > 0 ? (validCount / totalCount) * 100 : 0}%` }]} />
                        </View>
                    </View>
                </GlossyCard>

                {/* Questions List */}
                {questionsToDisplay.map((question: any, index: number) => (
                    <GlossyCard key={question.id || index}>
                        <View style={styles.questionHeader}>
                            <Text style={styles.questionNumber}>Q{index + 1}</Text>
                            <View style={styles.questionStatus}>
                                <Text style={[styles.statusIcon, { color: getStatusColor(question.status) }]}>
                                    {getStatusIcon(question.status)} {question.status.toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.questionText} numberOfLines={3}>
                            {getCleanQuestionText(question.questionText)}
                        </Text>

                        <View style={styles.questionMeta}>
                            <View style={styles.metaTag}><Text style={styles.metaText}>{(question.type || 'short').toUpperCase()}</Text></View>
                            <View style={styles.metaTag}><Text style={styles.metaText}>{question.marks} Marks</Text></View>
                        </View>

                        <GlossyButton title="View Details" onPress={() => handleViewQuestion(question.id)} size="small" style={{ marginTop: 10 }} />
                    </GlossyCard>
                ))}
            </ScrollView>
        </LinenBackground>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { paddingBottom: spacing.xl },
    loadingText: { marginTop: 10, color: '#666' },
    summaryText: { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 10 },
    summaryProgress: { height: 10, backgroundColor: '#DDD',: 5, overflow: 'hidden', borderWidth: 1, borderColor: '#CCC' },
    summaryProgressBar: { flex: 1 },
    summaryProgressFill: { height: '100%', backgroundColor: colors.success }, // Could be a gradient image or linear gradient if possible
    questionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    questionNumber: { fontWeight: 'bold', fontSize: 16, color: colors.primary },
    questionStatus: { flexDirection: 'row', alignItems: 'center' },
    statusIcon: { fontWeight: 'bold', fontSize: 12 },
    questionText: { fontSize: 14, color: '#333', marginBottom: 10, lineHeight: 20 },
    questionMeta: { flexDirection: 'row', gap: 5 },
    metaTag: { backgroundColor: '#EEE', paddingHorizontal: 6, paddingVertical: 2,: 4 },
    metaText: { fontSize: 10, color: '#555', fontWeight: 'bold' },
});
