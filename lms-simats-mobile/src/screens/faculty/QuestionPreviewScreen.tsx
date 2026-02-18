import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Button, Tag, Header } from '../../components/common';
import { useAuthStore, useRubricStore } from '../../store';

type Props = NativeStackScreenProps<any, 'QuestionPreview'>;

/**
 * Extract a JSON string value by key using regex.
 * Works on truncated/malformed JSON where JSON.parse fails.
 */
function extractJsonStringValue(jsonStr: string, key: string): string {
    // Match "key": "value" — handles escaped quotes inside the value
    const regex = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
    const match = jsonStr.match(regex);
    return match ? match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').trim() : '';
}

/**
 * Extract an array of strings from JSON by key using regex.
 * e.g. "key_points": ["point1", "point2"]
 */
function extractJsonArrayValues(jsonStr: string, key: string): string[] {
    const regex = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*?)\\]`, 's');
    const match = jsonStr.match(regex);
    if (!match) return [];
    // Extract individual quoted strings from the array content
    const items: string[] = [];
    const itemRegex = /"((?:[^"\\]|\\.)*)"/g;
    let m;
    while ((m = itemRegex.exec(match[1])) !== null) {
        items.push(m[1].replace(/\\"/g, '"').trim());
    }
    return items;
}

/**
 * Extract options object like {"A": "...", "B": "..."} using regex.
 */
function extractJsonOptions(jsonStr: string): string[] {
    // Try to find the options block
    // 1. Try finding a complete object block: "options": { ... }
    let regex = /"options"\s*:\s*\{([^}]*)\}/s;
    let match = jsonStr.match(regex);

    // 2. If no complete block (truncation), try finding start of options until end of string or next key
    if (!match) {
        regex = /"options"\s*:\s*\{([^]*)$/s;
        match = jsonStr.match(regex);
    }

    if (!match) return [];

    const content = match[1];
    const items: string[] = [];

    // Match "A": "Value" or "A": "Value (with quotes and commas)"
    // We look for "KEY": followed by value until the next "KEY": or end
    const entryRegex = /"([A-Z])"\s*:\s*"?((?:[^",\n]|"(?:[^"\\]|\\.)*")*)"?(?=\s*,?\s*"[A-Z]"\s*:|\s*\}|\s*$)/g;

    let m;
    // Reset regex state just in case
    entryRegex.lastIndex = 0;

    // If the content is very broken, we might need a simpler approach
    // Let's try to match individual options one by one
    const optionsToFind = ['A', 'B', 'C', 'D', 'E'];

    for (const opt of optionsToFind) {
        // Look for "A": "..."
        const optRegex = new RegExp(`"${opt}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
        const optMatch = content.match(optRegex);
        if (optMatch) {
            items.push(`${opt}) ${optMatch[1].replace(/\\"/g, '"').trim()}`);
        } else {
            // Try unquoted value (sometimes happens in bad JSON)
            const optRegex2 = new RegExp(`"${opt}"\\s*:\\s*([^",}\\]]*)`, 's');
            const optMatch2 = content.match(optRegex2);
            if (optMatch2 && optMatch2[1].trim()) {
                items.push(`${opt}) ${optMatch2[1].trim()}`);
            }
        }
    }

    // If that didn't work well (e.g. standard "A": "val", "B": "val"), try the global match again
    if (items.length === 0) {
        let m;
        const fallbackRegex = /"([A-Z])"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
        while ((m = fallbackRegex.exec(content)) !== null) {
            items.push(`${m[1]}) ${m[2].replace(/\\"/g, '"').trim()}`);
        }
    }

    return items.sort(); // Ensure A, B, C order
}

/**
 * Deeply parse a question object that may have raw JSON stuffed into questionText.
 * The backend sometimes stores the entire LLM output (often truncated) as question_text.
 */
function parseQuestion(raw: any) {
    let rawText: string = raw.questionText || raw.question_text || raw.text || '';

    // Clean up markdown code blocks if present
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    // --- Use DB-level fields as primary sources (they're reliable) ---
    let bloomLevel = raw.bloomLevel || raw.bloom_level || '';
    let difficulty = raw.difficulty || '';
    let correctAnswer = raw.correctAnswer || raw.correct_answer || '';
    let questionType = raw.type || raw.question_type || 'short_answer';
    let coId = raw.coId || raw.co_id || raw.co_ids || raw.mapped_co || '';
    let loId = raw.loId || raw.lo_id || raw.lo_ids || raw.mapped_lo || '';
    let validationScore = raw.validationScore || raw.validation_score || 0;

    // --- Parse options from DB field ---
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
            } catch {
                // ignore
            }
        } else if (Array.isArray(raw.options)) {
            options = raw.options;
        } else if (typeof raw.options === 'object') {
            options = Object.entries(raw.options).map(([k, v]) => `${k}) ${v}`);
        }
    }

    // --- Extract clean question text from the raw JSON blob ---
    let cleanText = '';
    let explanation = '';
    let keyPoints: string[] = [];
    let expectedAnswer = '';

    // Step 1: Try JSON.parse (works if the LLM output is complete, valid JSON)
    try {
        if (typeof rawText === 'string' && rawText.trim().startsWith('{')) {
            const parsed = JSON.parse(rawText);
            const inner = parsed.questions?.[0] || parsed;
            cleanText = inner.question_text || inner.questionText || '';
            explanation = inner.explanation || '';
            expectedAnswer = inner.expected_answer || inner.correct_answer || '';
            keyPoints = inner.key_points || inner.keyPoints || [];
            // Extract options from parsed JSON if DB options are empty
            if (options.length === 0 && inner.options) {
                if (typeof inner.options === 'object' && !Array.isArray(inner.options)) {
                    options = Object.entries(inner.options).map(([k, v]) => `${k}) ${v}`);
                } else if (Array.isArray(inner.options)) {
                    options = inner.options;
                }
            }
            // Use parsed fields as fallbacks for DB fields
            bloomLevel = bloomLevel || inner.bloom_level || inner.bloomLevel || 'understand';
            difficulty = difficulty || inner.difficulty || 'medium';
            coId = coId || inner.co_id || inner.co_ids || inner.mapped_co || '';
            loId = loId || inner.lo_id || inner.lo_ids || inner.mapped_lo || '';
        }
    } catch {
        // JSON.parse failed — truncated JSON, use regex fallback
    }

    // Step 2: Regex fallback for truncated/malformed JSON
    if ((!cleanText || options.length === 0) && typeof rawText === 'string' && (rawText.includes('question_text') || rawText.includes('"options"'))) {
        if (!cleanText) cleanText = extractJsonStringValue(rawText, 'question_text');
        if (!explanation) explanation = extractJsonStringValue(rawText, 'explanation');
        if (!expectedAnswer) expectedAnswer = extractJsonStringValue(rawText, 'expected_answer') || extractJsonStringValue(rawText, 'correct_answer');
        if (keyPoints.length === 0) keyPoints = extractJsonArrayValues(rawText, 'key_points');

        // Extract options from JSON blob if DB options are empty
        if (options.length === 0) {
            options = extractJsonOptions(rawText);

            // Also try array-style options if object style failed
            if (options.length === 0) {
                options = extractJsonArrayValues(rawText, 'options');
            }
        }

        // Extract bloom/difficulty from JSON if not in DB
        if (!bloomLevel) {
            bloomLevel = extractJsonStringValue(rawText, 'bloom_level') || 'understand';
        }
        if (!difficulty) {
            difficulty = extractJsonStringValue(rawText, 'difficulty') || 'medium';
        }
    }

    // Step 3: If still no clean text, use the raw text but strip any JSON wrapper
    if (!cleanText) {
        cleanText = rawText;
    }

    // Use expectedAnswer as correctAnswer fallback
    if (!correctAnswer && expectedAnswer) {
        correctAnswer = expectedAnswer;
    }

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
    };
}

export const QuestionPreviewScreen = ({ navigation, route }: Props) => {
    const { questionId } = route.params as { questionId: string };
    const { generatedQuestions } = useRubricStore();
    const { currentRole } = useAuthStore();

    // Use loose comparison (==) to handle string/number mismatch
    const foundQuestion = generatedQuestions.find(q => String(q.id) === String(questionId));
    const question = foundQuestion ? parseQuestion(foundQuestion) : parseQuestion({});

    const handleEdit = () => {
        // ...
    };

    const handleApprove = () => {
        // TODO: Approve question
        navigation.goBack();
    };

    const handleDiscard = () => {
        // TODO: Discard question
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            {/* ... header ... */}
            <Header
                title="Question Preview"
                onBack={() => navigation.goBack()}
                rightAction={
                    <TouchableOpacity onPress={handleEdit}>
                        <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                }
            />

            <ScrollView style={styles.content}>
                {/* Question Text */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Question</Text>
                    <View style={styles.card}>
                        <Text style={styles.questionText}>{question.text}</Text>
                    </View>
                </View>

                {/* Options (for MCQ) */}
                {question.type === 'mcq' && question.options && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Options</Text>
                        <View style={styles.card}>
                            {question.options.map((option, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.option,
                                        option === question.correctAnswer && styles.optionCorrect,
                                    ]}
                                >
                                    <Text style={styles.optionLabel}>{String.fromCharCode(65 + index)}.</Text>
                                    <Text style={[
                                        styles.optionText,
                                        option === question.correctAnswer && styles.optionTextCorrect,
                                    ]}>
                                        {option}
                                    </Text>
                                    {option === question.correctAnswer && (
                                        <Text style={styles.correctBadge}>✓ Correct</Text>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Explanation */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Explanation</Text>
                    <View style={styles.card}>
                        <Text style={styles.bodyText}>{question.explanation}</Text>
                    </View>
                </View>

                {/* Key Points */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Key Points</Text>
                    <View style={styles.card}>
                        {question.keyPoints.map((point, index) => (
                            <View key={index} style={styles.keyPoint}>
                                <Text style={styles.bullet}>•</Text>
                                <Text style={styles.bodyText}>{point}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Metadata */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Metadata</Text>
                    <View style={styles.card}>
                        <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>CO Mapping:</Text>
                            <Text style={styles.metadataValue}>{question.coMapping.join(', ')}</Text>
                        </View>
                        <View style={styles.metadataRow}>
                            <Text style={styles.metadataLabel}>LO Mapping:</Text>
                            <Text style={styles.metadataValue}>{question.loMapping.join(', ')}</Text>
                        </View>
                    </View>
                </View>

                {/* Actions - Only for Vetter or Admin */}
                {currentRole !== 'faculty' && (
                    <View style={styles.actionSection}>
                        <Button
                            title="Approve Question"
                            onPress={handleApprove}
                            variant="primary"
                            fullWidth
                            size="lg"
                        />
                        <View style={styles.actionGap} />
                        <Button
                            title="Discard Question"
                            onPress={handleDiscard}
                            variant="outline"
                            fullWidth
                            size="lg"
                        />
                    </View>
                )}
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
    editText: {
        ...typography.body,
        color: colors.primary,
        flex: 1,
        textAlign: 'right',
    },
    content: {
        flex: 1,
    },
    section: {
        marginTop: spacing.lg,
        marginHorizontal: spacing.screenHorizontal,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    card: {
        backgroundColor: colors.surface,
        padding: spacing.cardPadding,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    questionText: {
        ...typography.h3,
        color: colors.textPrimary,
        lineHeight: 24,
        textAlign: 'right',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.sm,
        marginBottom: spacing.xs,
    },
    optionCorrect: {
        backgroundColor: colors.success + '20',
        borderWidth: 1,
        borderColor: colors.success,
    },
    optionLabel: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        marginRight: spacing.sm,
        minWidth: 24,
    },
    optionText: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
    },
    optionTextCorrect: {
        ...typography.bodyBold,
        color: colors.success,
    },
    correctBadge: {
        ...typography.captionBold,
        color: colors.success,
    },
    bodyText: {
        ...typography.body,
        color: colors.textPrimary,
        lineHeight: 22,
    },
    keyPoint: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    bullet: {
        ...typography.body,
        color: colors.primary,
        marginRight: spacing.sm,
    },
    metadataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    metadataLabel: {
        ...typography.bodyBold,
        color: colors.textSecondary,
        width: 140,
    },
    metadataValue: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
    },
    actionSection: {
        padding: spacing.lg,
        marginTop: spacing.lg,
    },
    actionGap: {
        height: spacing.md,
    },
});
