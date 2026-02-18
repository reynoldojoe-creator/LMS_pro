import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing} from '../../theme';
import { useAuthStore, useRubricStore } from '../../store';
import { LinenBackground, GlossyNavBar, GlossyCard, GlossyButton } from '../../components/ios6';

type Props = NativeStackScreenProps<any, 'QuestionPreview'>;

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
    let questionType = raw.type || raw.question_type || 'short_answer';
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
    };
}

export const QuestionPreviewScreen = ({ navigation, route }: Props) => {
    const { questionId } = route.params as { questionId: string };
    const { generatedQuestions } = useRubricStore();
    const { currentRole } = useAuthStore();

    const foundQuestion = generatedQuestions.find(q => String(q.id) === String(questionId));
    const question = foundQuestion ? parseQuestion(foundQuestion) : parseQuestion({});

    const handleEdit = () => {
        // TODO
    };

    const handleApprove = () => {
        // TODO
        navigation.goBack();
    };

    const handleDiscard = () => {
        // TODO
        navigation.goBack();
    };

    return (
        <LinenBackground>
            <GlossyNavBar
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
                {/* Question Text */}
                <GlossyCard title="Question">
                    <Text style={styles.questionText}>{question.text}</Text>
                </GlossyCard>

                {/* Options (for MCQ) */}
                {question.type === 'mcq' && question.options && (
                    <GlossyCard title="Options">
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
                    </GlossyCard>
                )}

                {/* Explanation */}
                <GlossyCard title="Explanation">
                    <Text style={styles.bodyText}>{question.explanation}</Text>
                </GlossyCard>

                {/* Key Points */}
                <GlossyCard title="Key Points">
                    {question.keyPoints.map((point, index) => (
                        <View key={index} style={styles.keyPoint}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.bodyText}>{point}</Text>
                        </View>
                    ))}
                </GlossyCard>

                {/* Metadata */}
                <GlossyCard title="Metadata">
                    <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>CO Mapping:</Text>
                        <Text style={styles.metadataValue}>{question.coMapping.join(', ')}</Text>
                    </View>
                    <View style={styles.metadataRow}>
                        <Text style={styles.metadataLabel}>LO Mapping:</Text>
                        <Text style={styles.metadataValue}>{question.loMapping.join(', ')}</Text>
                    </View>
                </GlossyCard>

                {/* Actions */}
                {currentRole !== 'faculty' && (
                    <View style={styles.actionSection}>
                        <GlossyButton title="Approve Question" onPress={handleApprove} />
                        <View style={styles.actionGap} />
                        <GlossyButton title="Discard Question" onPress={handleDiscard} style={styles.discardButton} />
                    </View>
                )}
            </ScrollView>
        </LinenBackground>
    );
};

const styles = StyleSheet.create({
    content: { paddingBottom: spacing.xl },
    navText: { color: 'white', fontWeight: 'bold', fontSize: 16, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: -1 }, textShadowRadius: 0 },
    questionText: { fontSize: 16, fontWeight: '500', color: '#333', lineHeight: 24 },
    option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10,: 5, marginBottom: 5 },
    optionCorrect: { backgroundColor: '#E0F8E0', borderWidth: 1, borderColor: '#B0E0B0' },
    optionLabel: { fontWeight: 'bold', color: '#333', marginRight: 10, minWidth: 20 },
    optionText: { flex: 1, color: '#333', fontSize: 14 },
    optionTextCorrect: { fontWeight: 'bold', color: '#006400' },
    correctBadge: { fontSize: 12, fontWeight: 'bold', color: '#006400', marginLeft: 5 },
    bodyText: { fontSize: 14, color: '#333', lineHeight: 20 },
    keyPoint: { flexDirection: 'row', marginBottom: 5 },
    bullet: { fontSize: 16, color: colors.primary, marginRight: 5 },
    metadataRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    metadataLabel: { fontWeight: 'bold', color: '#666', width: 100 },
    metadataValue: { flex: 1, color: '#333' },
    actionSection: { padding: 20 },
    actionGap: { height: 10 },
    discardButton: { backgroundColor: '#FF3B30' },
});
