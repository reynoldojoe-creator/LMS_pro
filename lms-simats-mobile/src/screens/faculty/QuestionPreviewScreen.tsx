import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useAuthStore, useRubricStore, useFacultyStore } from '../../store';
import { ScreenBackground, ModernNavBar, Card, ModernButton, Tag } from '../../components/common';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<any, 'QuestionPreview'>;

// ... keeping helper functions ...
// (I will assume helper functions are same, but I need to include them in the file content if I replace everything)
// Since I am replacing the whole file content for safety or just the component part?
// The tool `replace_file_content` replaces a block.
// I will replace the imports and the component part.

// Helper functions (same as before)
function extractJsonStringValue(jsonStr: string, key: string): string {
    const regex = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
    const match = jsonStr.match(regex);
    return match ? match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').trim() : '';
}

function extractJsonArrayValues(jsonStr: string, key: string): string[] {
    const regex = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*?)\\]`, 's');
    const match = jsonStr.match(regex);
    if (!match) return [];
    const items: string[] = [];
    const itemRegex = /"((?:[^"\\]|\\.)*)"/g;
    let m;
    while ((m = itemRegex.exec(match[1])) !== null) {
        items.push(m[1].replace(/\\"/g, '"').trim());
    }
    return items;
}

function extractJsonOptions(jsonStr: string): string[] {
    let regex = /"options"\s*:\s*\{([^}]*)\}/s;
    let match = jsonStr.match(regex);
    if (!match) {
        regex = /"options"\s*:\s*\{([^]*)$/s;
        match = jsonStr.match(regex);
    }
    if (!match) return [];
    const content = match[1];
    const items: string[] = [];
    const optionsToFind = ['A', 'B', 'C', 'D', 'E'];
    for (const opt of optionsToFind) {
        const optRegex = new RegExp(`"${opt}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
        const optMatch = content.match(optRegex);
        if (optMatch) {
            items.push(`${opt}) ${optMatch[1].replace(/\\"/g, '"').trim()}`);
        } else {
            const optRegex2 = new RegExp(`"${opt}"\\s*:\\s*([^",}\\]]*)`, 's');
            const optMatch2 = content.match(optRegex2);
            if (optMatch2 && optMatch2[1].trim()) {
                items.push(`${opt}) ${optMatch2[1].trim()}`);
            }
        }
    }
    if (items.length === 0) {
        let m;
        const fallbackRegex = /"([A-Z])"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
        while ((m = fallbackRegex.exec(content)) !== null) {
            items.push(`${m[1]}) ${m[2].replace(/\\"/g, '"').trim()}`);
        }
    }
    return items.sort();
}

function parseQuestion(raw: any) {
    let rawText: string = raw.questionText || raw.question_text || raw.text || '';
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    let bloomLevel = raw.bloomLevel || raw.bloom_level || '';
    let difficulty = raw.difficulty || '';
    let correctAnswer = raw.correctAnswer || raw.correct_answer || '';
    let questionType = raw.questionType || raw.type || raw.question_type || 'short_answer';
    let coId = raw.coId || raw.co_id || raw.co_ids || raw.mapped_co || '';
    let loId = raw.loId || raw.lo_id || raw.lo_ids || raw.mapped_lo || '';
    let validationScore = raw.validationScore || raw.validation_score || 0;

    let options: string[] = [];
    if (raw.options) {
        if (typeof raw.options === 'string') {
            try {
                const parsed = JSON.parse(raw.options);
                if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                    options = Object.entries(parsed).map(([k, v]) => `${k}) ${v}`);
                } else if (Array.isArray(parsed)) {
                    options = parsed;
                }
            } catch { }
        } else if (Array.isArray(raw.options)) {
            options = raw.options;
        } else if (typeof raw.options === 'object') {
            options = Object.entries(raw.options).map(([k, v]) => `${k}) ${v}`);
        }
    }

    let cleanText = '';
    let explanation = '';
    let keyPoints: string[] = [];
    let expectedAnswer = '';

    try {
        if (typeof rawText === 'string' && rawText.trim().startsWith('{')) {
            const parsed = JSON.parse(rawText);
            const inner = parsed.questions?.[0] || parsed;
            cleanText = inner.question_text || inner.questionText || '';
            explanation = inner.explanation || '';
            expectedAnswer = inner.expected_answer || inner.correct_answer || '';
            keyPoints = inner.key_points || inner.keyPoints || [];
            if (options.length === 0 && inner.options) {
                if (typeof inner.options === 'object' && !Array.isArray(inner.options)) {
                    options = Object.entries(inner.options).map(([k, v]) => `${k}) ${v}`);
                } else if (Array.isArray(inner.options)) {
                    options = inner.options;
                }
            }
            bloomLevel = bloomLevel || inner.bloom_level || inner.bloomLevel || 'understand';
            difficulty = difficulty || inner.difficulty || 'medium';
            coId = coId || inner.co_id || inner.co_ids || inner.mapped_co || '';
            loId = loId || inner.lo_id || inner.lo_ids || inner.mapped_lo || '';
        }
    } catch { }

    if ((!cleanText || options.length === 0) && typeof rawText === 'string' && (rawText.includes('question_text') || rawText.includes('"options"'))) {
        if (!cleanText) cleanText = extractJsonStringValue(rawText, 'question_text');
        if (!explanation) explanation = extractJsonStringValue(rawText, 'explanation');
        if (!expectedAnswer) expectedAnswer = extractJsonStringValue(rawText, 'expected_answer') || extractJsonStringValue(rawText, 'correct_answer');
        if (keyPoints.length === 0) keyPoints = extractJsonArrayValues(rawText, 'key_points');
        if (options.length === 0) {
            options = extractJsonOptions(rawText);
            if (options.length === 0) options = extractJsonArrayValues(rawText, 'options');
        }
        if (!bloomLevel) bloomLevel = extractJsonStringValue(rawText, 'bloom_level') || 'understand';
        if (!difficulty) difficulty = extractJsonStringValue(rawText, 'difficulty') || 'medium';
    }

    if (!cleanText) cleanText = rawText;
    if (!correctAnswer && expectedAnswer) correctAnswer = expectedAnswer;

    return {
        id: raw.id,
        text: cleanText,
        type: questionType,
        options,
        correctAnswer,
        explanation: explanation || 'Based on the learning objectives for this topic.',
        keyPoints: Array.isArray(keyPoints) && keyPoints.length > 0
            ? keyPoints
            : ['Review the topic material for detailed understanding'],
        coMapping: coId ? (Array.isArray(coId) ? coId : [coId]) : ['N/A'],
        loMapping: loId ? (Array.isArray(loId) ? loId : [loId]) : ['N/A'],
        bloomLevel: bloomLevel || 'understand',
        difficulty: difficulty || 'medium',
        validationScore,
        status: raw.status || 'pending',
    };
}

export const QuestionPreviewScreen = ({ navigation, route }: Props) => {
    const { questionId, question: passedQuestion, subjectId, topicId } = route.params as any;
    const { generatedQuestions } = useRubricStore();
    const { questions: storeQuestions, updateQuestion, getSubjectById } = useFacultyStore();
    const { currentRole } = useAuthStore();

    // Find question from appropriate store or use passed object
    let foundQuestion = passedQuestion;
    if (!foundQuestion && questionId) {
        foundQuestion = generatedQuestions.find(q => String(q.id) === String(questionId)) ||
            storeQuestions.find(q => String(q.id) === String(questionId));
    }

    const question = foundQuestion ? parseQuestion(foundQuestion) : parseQuestion({});

    // Resolve CO/LO mappings if N/A and we have context
    if (subjectId && topicId && (question.coMapping.includes('N/A') || question.loMapping.includes('N/A'))) {
        const subject = getSubjectById(subjectId);
        const topic = (subject?.topics || []).find(t => t.id === topicId) ||
            subject?.units.flatMap(u => u.topics || []).find(t => t.id === topicId);

        if (topic) {
            if (question.coMapping.includes('N/A') && topic.mappedCOs?.length > 0) {
                question.coMapping = topic.mappedCOs.map((co: any) => co.code || co.id);
            }
            if (question.loMapping.includes('N/A') && topic.learningOutcomes?.length > 0) {
                question.loMapping = topic.learningOutcomes.map((lo: any) => lo.code || lo.id);
            }
        }
    }

    const handleEdit = () => {
        Alert.alert("Edit", "Edit functionality coming soon.");
    };

    const handleApprove = async () => {
        if (foundQuestion?.id) {
            await updateQuestion(foundQuestion.id, { status: 'approved' });
            navigation.goBack();
        }
    };

    const handleDiscard = async () => {
        if (foundQuestion?.id) {
            await updateQuestion(foundQuestion.id, { status: 'rejected' });
            navigation.goBack();
        }
    };

    const handleQuarantine = async () => {
        if (foundQuestion?.id) {
            await updateQuestion(foundQuestion.id, { status: 'quarantined' });
            navigation.goBack();
        }
    };

    const isVetter = currentRole === 'vetter';
    const isMCQ = question.type?.toLowerCase().includes('mcq');

    return (
        <ScreenBackground>
            <ModernNavBar
                title="Question Preview"
                showBack
                onBack={() => navigation.goBack()}
                rightButton={
                    <TouchableOpacity onPress={handleEdit}>
                        <Text style={styles.navText}>Edit</Text>
                    </TouchableOpacity>
                }
            />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.badgeRow}>
                    <Tag label={question.type.toUpperCase()} size="sm" variant="default" color={colors.systemGray5} />
                    <Tag label={question.difficulty} size="sm" variant="difficulty" difficulty={question.difficulty as any} />
                    <Tag label={question.bloomLevel} size="sm" variant="bloom" bloomLevel={question.bloomLevel as any} />
                </View>

                {/* Question Text */}
                <Card title="Question">
                    <Text style={styles.questionText}>{question.text}</Text>
                </Card>

                {/* Options (for MCQ) */}
                {isMCQ && question.options && (
                    <Card title="Options">
                        {question.options.map((option, index) => {
                            const optionLetter = String.fromCharCode(65 + index);
                            const answerLen = question.correctAnswer?.length || 0;
                            const isCorrect =
                                question.correctAnswer === optionLetter ||
                                option === question.correctAnswer ||
                                (answerLen > 1 && option.includes(question.correctAnswer));
                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.option,
                                        isCorrect && styles.optionCorrect,
                                    ]}
                                >
                                    <Text style={styles.optionLabel}>{String.fromCharCode(65 + index)}.</Text>
                                    <Text style={[
                                        styles.optionText,
                                        isCorrect && styles.optionTextCorrect,
                                    ]}>
                                        {option}
                                    </Text>
                                    {isCorrect && (
                                        <Text style={styles.correctBadge}>✓ Correct</Text>
                                    )}
                                </View>
                            );
                        })}
                    </Card>
                )}

                {/* Explanation - Vetter Only */}
                {isVetter && (
                    <Card title="Explanation">
                        <Text style={styles.bodyText}>{question.explanation}</Text>
                    </Card>
                )}

                {/* Key Points - Vetter Only */}
                {isVetter && (
                    <Card title="Key Points">
                        {question.keyPoints.map((point, index) => (
                            <View key={index} style={styles.keyPoint}>
                                <Text style={styles.bullet}>•</Text>
                                <Text style={styles.bodyText}>{point}</Text>
                            </View>
                        ))}
                    </Card>
                )}

                {/* Metadata */}
                <Card title="Metadata">
                    <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>LO Mapping:</Text>
                        <Text style={styles.metadataValue}>
                            {question.loMapping.map((lo: string) => lo.split(':')[0].trim()).join(', ')}
                        </Text>
                    </View>
                </Card>

                {/* Actions - Vetter Only */}
                {isVetter && (
                    <View style={styles.actionSection}>
                        <ModernButton
                            title="Approve"
                            onPress={handleApprove}
                            variant="primary"
                            style={styles.actionButton}
                        />
                        <View style={styles.row}>
                            <ModernButton
                                title="Reject"
                                onPress={handleDiscard}
                                variant="destructive"
                                style={[styles.actionButton, styles.flex1]}
                            />
                            <View style={{ width: spacing.md }} />
                            <ModernButton
                                title="Quarantine"
                                onPress={handleQuarantine}
                                variant="secondary"
                                style={[styles.actionButton, styles.flex1]}
                            />
                        </View>
                    </View>
                )}
            </ScrollView>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xxl
    },
    navText: {
        ...typography.body,
        color: colors.primary,
        fontWeight: 'bold'
    },
    badgeRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
        flexWrap: 'wrap'
    },
    questionText: {
        ...typography.h3,
        color: colors.text,
        lineHeight: 24
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: spacing.sm,
        marginBottom: spacing.xs
    },
    optionCorrect: {
        backgroundColor: colors.green + '20', // 20% opacity
        borderWidth: 1,
        borderColor: colors.green
    },
    optionLabel: {
        ...typography.bodyBold,
        color: colors.text,
        marginRight: spacing.sm,
        minWidth: 20
    },
    optionText: {
        flex: 1,
        ...typography.body,
        color: colors.text
    },
    optionTextCorrect: {
        ...typography.bodyBold,
        color: colors.green
    },
    correctBadge: {
        ...typography.caption1,
        color: colors.green,
        marginLeft: spacing.sm,
        fontWeight: 'bold'
    },
    bodyText: {
        ...typography.body,
        color: colors.textSecondary
    },
    keyPoint: {
        flexDirection: 'row',
        marginBottom: spacing.xs
    },
    bullet: {
        fontSize: 16,
        color: colors.primary,
        marginRight: spacing.sm
    },
    metadataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.separator
    },
    metadataLabel: {
        ...typography.caption1,
        color: colors.textSecondary,
        width: 100
    },
    metadataValue: {
        flex: 1,
        ...typography.body,
        color: colors.text
    },
    actionSection: {
        marginTop: spacing.xl,
        gap: spacing.md
    },
    row: {
        flexDirection: 'row',
    },
    flex1: {
        flex: 1
    },
    actionButton: {
        marginBottom: spacing.sm
    }
});
