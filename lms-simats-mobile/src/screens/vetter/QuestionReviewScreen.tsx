import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useVetterStore } from '../../store';
import { Button, Tag, Modal } from '../../components/common';
import { RejectReasonModal } from './RejectReasonModal';
import { QuarantineModal } from './QuarantineModal';

type Props = NativeStackScreenProps<any, 'QuestionReview'>;

export const QuestionReviewScreen = ({ route, navigation }: Props) => {
    const { batchId, questionId } = route.params as { batchId: string; questionId: string };
    const { currentBatch, approveQuestion, rejectQuestion, quarantineQuestion } = useVetterStore();
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showQuarantineModal, setShowQuarantineModal] = useState(false);

    const question = currentBatch?.questions.find(q => q.id === questionId);
    const questionIndex = currentBatch?.questions.findIndex(q => q.id === questionId) || 0;

    if (!question || !currentBatch) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Question not found</Text>
            </SafeAreaView>
        );
    }

    const handleApprove = async () => {
        await approveQuestion(questionId);
        navigation.goBack();
    };

    const handleReject = async (reason: string) => {
        await rejectQuestion(questionId, reason);
        setShowRejectModal(false);
        navigation.goBack();
    };

    const handleQuarantine = async (notes: string) => {
        await quarantineQuestion(questionId, notes);
        setShowQuarantineModal(false);
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backChevron}>‹</Text>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    Question {questionIndex + 1} of {currentBatch.totalQuestions}
                </Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.content}>
                {/* Question Type Tags */}
                <View style={styles.tagsRow}>
                    <Tag label={question.type.toUpperCase()} color={colors.iosBlue} />
                    <Tag
                        label={question.bloomLevel.charAt(0).toUpperCase() + question.bloomLevel.slice(1)}
                        color={colors.iosPurple}
                    />
                    <Tag
                        label={question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                        color={colors.iosOrange}
                    />
                </View>

                {/* CO Mapping */}
                <View style={styles.coCard}>
                    <Text style={styles.coTitle}>CO Mapping</Text>
                    <Text style={styles.coDescription}>CO2: Implement linear data structures</Text>
                    <View style={styles.intensityRow}>
                        <Text style={styles.intensityLabel}>Intensity:</Text>
                        <View style={styles.intensityDots}>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.intensityDot,
                                        i <= 3 ? styles.intensityDotFilled : styles.intensityDotEmpty,
                                    ]}
                                />
                            ))}
                        </View>
                        <Text style={styles.intensityValue}>High</Text>
                    </View>
                </View>

                {/* Question */}
                <View style={styles.questionSection}>
                    <Text style={styles.sectionLabel}>Question:</Text>
                    <Text style={styles.questionText}>{question.questionText}</Text>
                </View>

                {/* Options (for MCQ) */}
                {question.type === 'mcq' && question.options && (
                    <View style={styles.optionsSection}>
                        {question.options.map((option, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.optionCard,
                                    option === question.correctAnswer && styles.correctOption,
                                ]}
                            >
                                <Text style={styles.optionLabel}>{String.fromCharCode(65 + index)})</Text>
                                <Text style={styles.optionText}>{option}</Text>
                                {option === question.correctAnswer && (
                                    <Text style={styles.correctMark}>← Correct</Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* Explanation */}
                <View style={styles.explanationSection}>
                    <Text style={styles.sectionLabel}>Explanation:</Text>
                    <Text style={styles.explanationText}>
                        In a balanced BST, the height is log(n), so search takes O(log n) time complexity.
                    </Text>
                </View>

                {/* Validation Score */}
                <View style={styles.validationCard}>
                    <Text style={styles.validationScore}>Validation Score: 78/100</Text>
                    <View style={styles.warningBox}>
                        <Text style={styles.warningIcon}>⚠️</Text>
                        <Text style={styles.warningText}>
                            Bloom's level might be "Remember" not "Understand"
                        </Text>
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
                    <Text style={styles.actionLabel}>Quarantine</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={handleApprove}
                >
                    <Text style={styles.actionIcon}>✓</Text>
                    <Text style={styles.actionLabel}>Approve</Text>
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
        flex: 2,
        textAlign: 'center',
    },
    headerRight: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    coCard: {
        backgroundColor: colors.primary + '10',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.primary + '30',
        marginBottom: spacing.lg,
    },
    coTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    coDescription: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    intensityRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    intensityLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginRight: spacing.sm,
    },
    intensityDots: {
        flexDirection: 'row',
        gap: spacing.xs,
        marginRight: spacing.sm,
    },
    intensityDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    intensityDotFilled: {
        backgroundColor: colors.primary,
    },
    intensityDotEmpty: {
        backgroundColor: colors.iosGray5,
    },
    intensityValue: {
        ...typography.captionBold,
        color: colors.primary,
    },
    questionSection: {
        marginBottom: spacing.lg,
    },
    sectionLabel: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    questionText: {
        ...typography.body,
        color: colors.textPrimary,
        lineHeight: 24,
    },
    optionsSection: {
        marginBottom: spacing.lg,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.sm,
    },
    correctOption: {
        borderColor: colors.success,
        backgroundColor: colors.success + '10',
    },
    optionLabel: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        marginRight: spacing.sm,
    },
    optionText: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
    },
    correctMark: {
        ...typography.caption,
        color: colors.success,
    },
    explanationSection: {
        marginBottom: spacing.lg,
    },
    explanationText: {
        ...typography.body,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    validationCard: {
        backgroundColor: colors.warning + '10',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.warning + '30',
    },
    validationScore: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    warningIcon: {
        fontSize: 16,
        marginRight: spacing.xs,
    },
    warningText: {
        ...typography.caption,
        color: colors.textSecondary,
        flex: 1,
    },
    actionBar: {
        flexDirection: 'row',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.divider,
        gap: spacing.sm,
    },
    actionButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rejectButton: {
        backgroundColor: colors.error + '15',
        borderWidth: 1,
        borderColor: colors.error,
    },
    quarantineButton: {
        backgroundColor: colors.warning + '15',
        borderWidth: 1,
        borderColor: colors.warning,
    },
    approveButton: {
        backgroundColor: colors.success,
    },
    actionIcon: {
        fontSize: 20,
        marginBottom: spacing.xs,
    },
    actionLabel: {
        ...typography.captionBold,
        color: colors.textPrimary,
    },
});
