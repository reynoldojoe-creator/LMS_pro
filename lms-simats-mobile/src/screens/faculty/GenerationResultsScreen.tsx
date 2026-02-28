import React, { useEffect, useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, ActionSheetIOS, Platform, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Tag, ScreenBackground, ModernNavBar, ModernButton, Card } from '../../components/common';
import { useRubricStore } from '../../store';
import { API_CONFIG } from '../../services/api';

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
    const { generatedQuestions: storeQuestions, fetchQuestions, isLoading, fetchLatestQuestionsForRubric } = useRubricStore();

    // Use paramQuestions initially (if navigating directly from generation), 
    // but fall back to store questions if loading from the rubric list.
    const questionsToDisplay = paramQuestions && paramQuestions.length > 0 ? paramQuestions : storeQuestions || [];

    const [isExporting, setIsExporting] = useState(false);

    useFocusEffect(
        useCallback(() => {
            // Only fetch from store if we didn't just receive fresh questions locally
            if (rubricId && (!paramQuestions || paramQuestions.length === 0)) {
                fetchLatestQuestionsForRubric(rubricId);
            }
        }, [rubricId, paramQuestions, fetchLatestQuestionsForRubric])
    );

    if (isLoading && !questionsToDisplay.length) {
        return (
            <ScreenBackground>
                <ModernNavBar title="Results" showBack onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading questions...</Text>
                </View>
            </ScreenBackground>
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

    const performExport = async (format: 'pdf' | 'docx') => {
        if (!rubricId) return;
        setIsExporting(true);
        try {
            const exportUrl = `${API_CONFIG.BASE_URL}/rubrics/${rubricId}/export-${format}`;

            // FileSystem.documentDirectory might be null on some platforms (e.g. web), 
            // but we're forcing native mobile so it's guaranteed. We cast as string.
            const dir = FileSystem.documentDirectory as string;
            const fileUri = `${dir}Rubric_Questions.${format}`;

            const { uri, status } = await FileSystem.downloadAsync(exportUrl, fileUri);

            if (status !== 200) {
                Alert.alert("Export Error", "Failed to generate the file. Ensure backend is running and valid.");
                return;
            }

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(uri, { UTI: format === 'pdf' ? 'com.adobe.pdf' : 'org.openxmlformats.wordprocessingml.document' });
            } else {
                Alert.alert("Saved", `File safely downloaded to ${uri}`);
            }
        } catch (error) {
            console.error("Export error:", error);
            Alert.alert("Export Error", "Something went wrong while exporting the file.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleExport = () => {
        if (!rubricId || isExporting) return;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', 'Export as PDF', 'Export as DOCX'],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) performExport('pdf');
                    else if (buttonIndex === 2) performExport('docx');
                }
            );
        } else {
            Alert.alert(
                "Export Options",
                "Choose export format",
                [
                    { text: "Export as PDF", onPress: () => performExport('pdf') },
                    { text: "Export as DOCX", onPress: () => performExport('docx') },
                    { text: "Cancel", style: "cancel" }
                ]
            );
        }
    };

    return (
        <ScreenBackground>
            <ModernNavBar
                title="Results"
                showBack
                onBack={() => navigation.goBack()}
                rightButton={
                    <TouchableOpacity onPress={handleExport} disabled={isExporting} style={{ padding: 8, marginRight: -8 }}>
                        {isExporting ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Ionicons name="download-outline" size={24} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                }
            />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Summary */}
                <Card title="Summary" style={styles.card}>
                    <Text style={styles.summaryText}>
                        {validCount}/{totalCount} questions available
                    </Text>
                    <View style={styles.summaryProgress}>
                        <View style={styles.summaryProgressBar}>
                            <View style={[styles.summaryProgressFill, { width: `${totalCount > 0 ? (validCount / totalCount) * 100 : 0}%` }]} />
                        </View>
                    </View>
                </Card>

                {/* Questions List */}
                {questionsToDisplay.map((question: any, index: number) => (
                    <Card key={question.id || index} style={styles.card}>
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
                            <View style={styles.metaTag}><Text style={styles.metaText}>{(question.questionType || question.question_type || question.type || 'mcq').toUpperCase()}</Text></View>
                            <View style={styles.metaTag}><Text style={styles.metaText}>{question.marks} Marks</Text></View>
                        </View>

                        <ModernButton
                            title="View Details"
                            onPress={() => navigation.navigate('QuestionPreview', {
                                questionId: question.id,
                                question: question
                            })}
                            size="small"
                            variant="secondary"
                            style={{ marginTop: 10 }}
                        />
                    </Card>
                ))}
            </ScrollView>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { paddingBottom: spacing.xl },
    loadingText: { marginTop: 10, ...typography.body, color: colors.textSecondary },
    summaryText: { ...typography.bodyBold, color: colors.textPrimary, textAlign: 'center', marginBottom: 10 },
    summaryProgress: { height: 8, backgroundColor: colors.systemGray6, borderRadius: 4, overflow: 'hidden' },
    summaryProgressBar: { flex: 1 },
    summaryProgressFill: { height: '100%', backgroundColor: colors.success },
    questionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    questionNumber: { ...typography.bodyBold, color: colors.primary },
    questionStatus: { flexDirection: 'row', alignItems: 'center' },
    statusIcon: { ...typography.captionBold },
    questionText: { ...typography.body, color: colors.textPrimary, marginBottom: 10 },
    questionMeta: { flexDirection: 'row', gap: 5 },
    metaTag: { backgroundColor: colors.systemGray6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    metaText: { ...typography.captionBold, color: colors.textSecondary },
    card: { marginBottom: spacing.md },
});
