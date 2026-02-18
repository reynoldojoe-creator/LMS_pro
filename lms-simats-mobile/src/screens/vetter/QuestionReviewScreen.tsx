import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useVetterStore } from '../../store';
import { Button, Tag, LoadingSpinner } from '../../components/common';
import { RejectReasonModal } from './RejectReasonModal';
import { QuarantineModal } from './QuarantineModal';
import { ApprovalFeedbackModal } from './ApprovalFeedbackModal';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

type Props = NativeStackScreenProps<any, 'QuestionReview'>;

export const QuestionReviewScreen = ({ route, navigation }: Props) => {
    const { batchId, questionId: initialQuestionId } = route.params as { batchId: string; questionId?: string };
    const { currentBatch, startReview, approveQuestion, rejectQuestion, quarantineQuestion, isLoading } = useVetterStore();

    // Local state for index navigation
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isExpandedRAG, setIsExpandedRAG] = useState(false);

    // Modals
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showQuarantineModal, setShowQuarantineModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);

    useEffect(() => {
        if (!currentBatch || currentBatch.id !== batchId) {
            startReview(batchId);
        }
    }, [batchId]);

    useEffect(() => {
        if (currentBatch && initialQuestionId) {
            const idx = currentBatch.questions.findIndex(q => q.id === initialQuestionId);
            if (idx >= 0) setCurrentIndex(idx);
        }
    }, [currentBatch, initialQuestionId]);

    if (isLoading || !currentBatch) {
        return <LoadingSpinner fullScreen />;
    }

    const question = currentBatch.questions[currentIndex];
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === currentBatch.questions.length - 1;

    if (!question) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>No questions found in this batch.</Text>
            </SafeAreaView>
        );
    }

    const handleNext = () => {
        if (!isLast) setCurrentIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (!isFirst) setCurrentIndex(prev => prev - 1);
    };

    const toggleRAG = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpandedRAG(!isExpandedRAG);
    };

    const handleApprove = async (feedback?: any) => {
        // Feedback is optional notes/adjustments
        await approveQuestion(question.id, feedback?.coAdjustments, feedback?.loAdjustments);
        // Note: passing 'notes' to approveQuestion depends on store update. 
        // For now, let's assume store handles it or we update store later to accept notes.
        // We updated backend to accept notes, but store function signature might need update or we pass in adjustments object.

        setShowApproveModal(false);
        if (!isLast) handleNext();
        else navigation.goBack();
    };

    const handleReject = async (reason: string) => {
        await rejectQuestion(question.id, reason);
        setShowRejectModal(false);
        if (!isLast) handleNext();
        else navigation.goBack();
    };

    const handleQuarantine = async (notes: string) => {
        await quarantineQuestion(question.id, notes);
        setShowQuarantineModal(false);
        if (!isLast) handleNext();
        else navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backChevron}>‹</Text>
                    <Text style={styles.backText}>Queue</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {currentIndex + 1} / {currentBatch.totalQuestions}
                </Text>
                <View style={styles.navButtons}>
                    <TouchableOpacity onPress={handlePrev} disabled={isFirst} style={[styles.navBtn, isFirst && styles.disabledNav]}>
                        <Text style={styles.navBtnText}>←</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleNext} disabled={isLast} style={[styles.navBtn, isLast && styles.disabledNav]}>
                        <Text style={styles.navBtnText}>→</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.content}>
                {/* Clean Status & Type Only */}
                <View style={styles.tagsRow}>
                    <Tag label={question.type.toUpperCase()} color={colors.primary} />
                    {question.status !== 'pending' && (
                        <Tag
                            label={question.status.toUpperCase()}
                            color={question.status === 'approved' ? colors.success : question.status === 'rejected' ? colors.error : colors.warning}
                        />
                    )}
                </View>

                {/* RAG Context Section */}
                <TouchableOpacity onPress={toggleRAG} style={styles.ragHeader} activeOpacity={0.8}>
                    <Text style={styles.ragTitle}>Source Context (RAG)</Text>
                    <Text style={styles.ragChevron}>{isExpandedRAG ? '▼' : '▶'}</Text>
                </TouchableOpacity>

                {isExpandedRAG && (
                    <View style={styles.ragContent}>
                        {question.ragContext && question.ragContext.length > 0 ? (
                            question.ragContext.map((chunk, i) => (
                                <View key={i} style={styles.ragChunk}>
                                    <Text style={styles.ragText}>{chunk}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.ragEmpty}>No RAG context available</Text>
                        )}
                    </View>
                )}

                {/* Question */}
                <View style={styles.questionSection}>
                    <Text style={styles.questionText}>{question.questionText}</Text>
                </View>

                {/* Options (MCQ) */}
                {question.type === 'mcq' && question.options && (
                    <View style={styles.optionsSection}>
                        {(Array.isArray(question.options) ? question.options : Object.values(question.options)).map((option: string, index: number) => {
                            const cleanOption = option.replace(/^[A-Z][\.\)]\s*/, '');
                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.optionCard,
                                        option === question.correctAnswer && styles.correctOption,
                                    ]}
                                >
                                    <Text style={styles.optionLabel}>{String.fromCharCode(65 + index)}</Text>
                                    <Text style={styles.optionText}>{cleanOption}</Text>
                                    {option === question.correctAnswer && (
                                        <Text style={styles.correctMark}>✓</Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Topic Metadata (COs/LOs) */}
                <View style={styles.metaCard}>
                    <Text style={styles.metaTitle}>Topic Outcomes</Text>

                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>COs:</Text>
                        {question.topicCOs && question.topicCOs.length > 0 ? (
                            <View style={styles.chips}>
                                {question.topicCOs.map(co => (
                                    <Text key={co} style={styles.chip}>{co}</Text>
                                ))}
                            </View>
                        ) : <Text style={styles.metaValue}>None</Text>}
                    </View>

                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>LOs:</Text>
                        {question.topicLOs && question.topicLOs.length > 0 ? (
                            <View style={styles.chips}>
                                {question.topicLOs.map(lo => (
                                    <Text key={lo} style={styles.chip}>{lo}</Text>
                                ))}
                            </View>
                        ) : <Text style={styles.metaValue}>None</Text>}
                    </View>
                </View>

            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionBar}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => setShowRejectModal(true)}
                >
                    <Text style={styles.actionIcon}>✗</Text>
                    <Text style={styles.actionLabel}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.quarantineButton]}
                    onPress={() => setShowQuarantineModal(true)}
                >
                    <Text style={styles.actionIcon}>⚠️</Text>
                    <Text style={styles.actionLabel}>Flag</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => setShowApproveModal(true)}
                // onPress={() => handleApprove()} // Direct approve if no feedback needed
                >
                    <Text style={styles.actionIcon}>✓</Text>
                    <Text style={{ ...styles.actionLabel, color: 'white' }}>Approve</Text>
                </TouchableOpacity>
            </View>

            {/* Modals */}
            <RejectReasonModal
                visible={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                onConfirm={handleReject}
            />

            <QuarantineModal
                visible={showQuarantineModal}
                onClose={() => setShowQuarantineModal(false)}
                onConfirm={handleQuarantine}
            />

            <ApprovalFeedbackModal
                visible={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                onConfirm={handleApprove}
            />
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
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        backgroundColor: colors.surface,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 80,
    },
    backChevron: {
        fontSize: 28,
        color: colors.primary,
        marginRight: 4,
    },
    backText: {
        ...typography.body,
        color: colors.primary,
    },
    headerTitle: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    navButtons: {
        flexDirection: 'row',
        width: 80,
        justifyContent: 'flex-end',
        gap: 8,
    },
    navBtn: {
        padding: 8,
    },
    disabledNav: {
        opacity: 0.3,
    },
    navBtnText: {
        fontSize: 20,
        color: colors.primary,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    tagsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    ragHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xs,
    },
    ragTitle: {
        ...typography.captionBold,
        color: colors.textSecondary,
    },
    ragChevron: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    ragContent: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: -1,
        marginBottom: spacing.lg,
    },
    ragChunk: {
        marginBottom: spacing.sm,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    ragText: {
        ...typography.caption,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    ragEmpty: {
        ...typography.caption,
        color: colors.textTertiary,
        fontStyle: 'italic',
    },
    questionSection: {
        marginBottom: spacing.lg,
        marginTop: spacing.sm,
    },
    questionText: {
        ...typography.h3,
        color: colors.textPrimary,
        lineHeight: 28,
    },
    optionsSection: {
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
    },
    correctOption: {
        borderColor: colors.success,
        backgroundColor: colors.success + '10',
    },
    optionLabel: {
        ...typography.bodyBold,
        marginRight: spacing.md,
        color: colors.textPrimary,
    },
    optionText: {
        ...typography.body,
        flex: 1,
        color: colors.textPrimary,
    },
    correctMark: {
        color: colors.success,
        fontWeight: 'bold',
        marginLeft: spacing.sm,
    },
    metaCard: {
        backgroundColor: colors.primary + '10',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.xl,
    },
    metaTitle: {
        ...typography.captionBold,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    metaLabel: {
        ...typography.caption,
        width: 40,
        color: colors.textSecondary,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        flex: 1,
    },
    chip: {
        ...typography.caption,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    metaValue: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    actionBar: {
        flexDirection: 'row',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
        gap: spacing.md,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        gap: 8,
    },
    rejectButton: {
        backgroundColor: colors.error + '10',
        borderWidth: 1,
        borderColor: colors.error,
    },
    quarantineButton: {
        backgroundColor: colors.warning + '10',
        borderWidth: 1,
        borderColor: colors.warning,
    },
    approveButton: {
        backgroundColor: colors.success,
    },
    actionIcon: {
        fontSize: 16,
    },
    actionLabel: {
        ...typography.captionBold,
        color: colors.textPrimary,
    },
});
