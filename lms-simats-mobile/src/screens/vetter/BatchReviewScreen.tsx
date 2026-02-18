import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { typography, spacing, borderRadius } from '../../theme';
import { useVetterStore } from '../../store/vetterStore';
import { useAppTheme } from '../../hooks';
import { Header, LoadingSkeleton, ErrorState, Tag } from '../../components/common';
import { QuestionCard } from '../../components/vetter';
import { RejectReasonModal } from './RejectReasonModal';
import { QuarantineModal } from './QuarantineModal';

type Props = NativeStackScreenProps<any, 'BatchReview'>;

export const BatchReviewScreen = ({ navigation, route }: Props) => {
    const { batchId } = route.params;
    const { colors } = useAppTheme();
    const {
        currentBatch,
        startReview,
        approveQuestion,
        rejectQuestion,
        quarantineQuestion,
        isLoading,
        error
    } = useVetterStore();

    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [quarantineModalVisible, setQuarantineModalVisible] = useState(false);
    const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

    useEffect(() => {
        if (batchId) {
            startReview(batchId);
        }
    }, [batchId]);

    const handleApprove = async (id: string) => {
        try {
            await approveQuestion(id);
        } catch (error) {
            Alert.alert('Error', 'Failed to approve question');
        }
    };

    const handleRejectPress = (id: string) => {
        setSelectedQuestionId(id);
        setRejectModalVisible(true);
    };

    const handleConfirmReject = async (reason: string) => {
        if (selectedQuestionId) {
            try {
                await rejectQuestion(selectedQuestionId, reason);
                setRejectModalVisible(false);
                setSelectedQuestionId(null);
            } catch (error) {
                Alert.alert('Error', 'Failed to reject question');
            }
        }
    };

    const handleQuarantinePress = (id: string) => {
        setSelectedQuestionId(id);
        setQuarantineModalVisible(true);
    };

    const handleConfirmQuarantine = async (notes: string) => {
        if (selectedQuestionId) {
            try {
                await quarantineQuestion(selectedQuestionId, notes);
                setQuarantineModalVisible(false);
                setSelectedQuestionId(null);
            } catch (error) {
                Alert.alert('Error', 'Failed to quarantine question');
            }
        }
    };

    const styles = getStyles(colors);

    if (isLoading && !currentBatch) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <Header title="Review Batch" onBack={() => navigation.goBack()} />
                <View style={styles.loadingContainer}>
                    <LoadingSkeleton variant="card" height={150} style={{ marginBottom: 16 }} />
                    <LoadingSkeleton variant="card" height={150} style={{ marginBottom: 16 }} />
                    <LoadingSkeleton variant="card" height={150} />
                </View>
            </SafeAreaView>
        );
    }

    if (error && !currentBatch) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <Header title="Review Batch" onBack={() => navigation.goBack()} />
                <ErrorState message={error} onRetry={() => startReview(batchId)} />
            </SafeAreaView>
        );
    }

    if (!currentBatch) return null;

    const pendingQuestions = currentBatch.questions.filter(q => q.status === 'pending');
    const reviewedQuestions = currentBatch.questions.filter(q => q.status !== 'pending');

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header
                title={currentBatch.title || 'Review Batch'}
                subtitle={`${pendingQuestions.length} pending`}
                onBack={() => navigation.goBack()}
            />

            <ScrollView contentContainerStyle={styles.content}>
                {currentBatch.questions.length === 0 ? (
                    <Text style={styles.emptyText}>No questions in this batch.</Text>
                ) : (
                    <>
                        {pendingQuestions.map((question, index) => (
                            <QuestionCard
                                key={question.id}
                                question={question}
                                index={index + 1}
                                onApprove={() => handleApprove(question.id)}
                                onReject={() => handleRejectPress(question.id)}
                                onQuarantine={() => handleQuarantinePress(question.id)}
                            />
                        ))}

                        {reviewedQuestions.length > 0 && (
                            <View style={styles.reviewedSection}>
                                <Text style={styles.sectionHeader}>Reviewed Questions</Text>
                                {reviewedQuestions.map((question, index) => (
                                    <QuestionCard
                                        key={question.id}
                                        question={question}
                                        index={index + 1}
                                        readOnly={true}
                                    />
                                ))}
                            </View>
                        )}

                        {pendingQuestions.length === 0 && reviewedQuestions.length > 0 && (
                            <View style={styles.completionState}>
                                <Text style={styles.completionText}>All questions reviewed!</Text>
                                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.finishButton}>
                                    <Text style={styles.finishButtonText}>Finish Review</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            <RejectReasonModal
                visible={rejectModalVisible}
                onClose={() => setRejectModalVisible(false)}
                onConfirm={handleConfirmReject}
            />

            <QuarantineModal
                visible={quarantineModalVisible}
                onClose={() => setQuarantineModalVisible(false)}
                onConfirm={handleConfirmQuarantine}
            />
        </SafeAreaView>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.screenHorizontal,
        paddingBottom: spacing.xl,
    },
    loadingContainer: {
        padding: spacing.screenHorizontal,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xl,
    },
    reviewedSection: {
        marginTop: spacing.xl,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    sectionHeader: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    completionState: {
        padding: spacing.lg,
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        marginTop: spacing.lg,
        borderWidth: 1,
        borderColor: colors.success,
    },
    completionText: {
        ...typography.h3,
        color: colors.success,
        marginBottom: spacing.md,
    },
    finishButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
    },
    finishButtonText: {
        ...typography.captionBold,
        color: colors.textInverse,
    },
});
