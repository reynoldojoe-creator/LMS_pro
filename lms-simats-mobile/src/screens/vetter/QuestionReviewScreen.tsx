import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager, Modal, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useVetterStore } from '../../store';
import { Tag, LoadingSpinner } from '../../components/common';
import { LinenBackground, GlossyNavBar, GlossyCard, GlossyButton } from '../../components/ios6';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

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

    // Feedback Modal State
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [actionType, setActionType] = useState<'reject' | 'flag' | 'approve' | null>(null);
    const [feedbackText, setFeedbackText] = useState('');

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
        return (
            <LinenBackground>
                <GlossyNavBar title="Loading..." showBack onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <LoadingSpinner />
                </View>
            </LinenBackground>
        );
    }

    const question = currentBatch.questions[currentIndex];
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === currentBatch.questions.length - 1;

    if (!question) {
        return (
            <LinenBackground>
                <GlossyNavBar title="Review" showBack onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No questions found in this batch.</Text>
                </View>
            </LinenBackground>
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

    const handleActionParams = (type: 'reject' | 'flag' | 'approve') => {
        setActionType(type);
        setFeedbackText('');
        if (type === 'approve') {
            // For approve, maybe we don't need a modal unless there are adjustments?
            // Let's just approve directly for now to be simple, or show modal for optional notes.
            // Given the previous code had handleApprove taking feedback, let's just call it directly for now
            // unless user wants to add notes.
            // Actually, let's keep it simple: approve identifies as success.
            submitAction('approved', '');
        } else {
            setFeedbackModalVisible(true);
        }
    };

    const submitAction = async (status: string, notes: string) => {
        try {
            if (status === 'approved') {
                await approveQuestion(question.id); // Add notes/adjustments if needed
            } else if (status === 'rejected') {
                await rejectQuestion(question.id, notes);
            } else if (status === 'flagged') { // Mapping flag to quarantine
                await quarantineQuestion(question.id, notes);
            }

            setFeedbackModalVisible(false);
            if (!isLast) handleNext();
            else navigation.goBack();
        } catch (e) {
            console.error(e);
            // Show error toast?
        }
    };

    return (
        <LinenBackground>
            <GlossyNavBar
                title={`Question ${currentIndex + 1} of ${currentBatch.totalQuestions}`}
                showBack
                onBack={() => navigation.goBack()}
                rightButton={
                    (<View style={styles.navButtons}>
                        <TouchableOpacity onPress={handlePrev} disabled={isFirst} style={[styles.navBtn, isFirst && styles.disabledNav]}>
                            <Ionicons name="chevron-back" size={24} color={isFirst ? "rgba(255,255,255,0.3)" : "white"} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleNext} disabled={isLast} style={[styles.navBtn, isLast && styles.disabledNav]}>
                            <Ionicons name="chevron-forward" size={24} color={isLast ? "rgba(255,255,255,0.3)" : "white"} />
                        </TouchableOpacity>
                    </View>) as React.ReactNode
                }
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Status Tags */}
                <View style={styles.tagsRow}>
                    <Tag label={question.type.toUpperCase()} color={colors.primary} />
                    {question.status !== 'pending' && (
                        <Tag
                            label={question.status.toUpperCase()}
                            color={question.status === 'approved' ? colors.success : question.status === 'rejected' ? colors.error : colors.warning}
                        />
                    )}
                </View>

                {/* Status Banner */}
                {question.status !== 'pending' && (
                    <View style={[
                        styles.statusBanner,
                        question.status === 'approved' ? styles.statusSuccess :
                            question.status === 'rejected' ? styles.statusError : styles.statusWarning
                    ]}>
                        <Text style={styles.statusText}>
                            Status: {question.status.toUpperCase()}
                        </Text>
                    </View>
                )}

                <GlossyCard title="Question Text">
                    <Text style={styles.questionText}>{question.questionText}</Text>

                    <View style={styles.metaContainer}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{question.type}</Text>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{question.difficulty}</Text>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Bloom: {question.bloomLevel}</Text>
                        </View>
                    </View>
                </GlossyCard>

                {question.options && (
                    <GlossyCard title="Options">
                        {Array.isArray(question.options) ? question.options.map((opt: string, i: number) => {
                            const isCorrect = question.correctAnswer === opt || question.correctAnswer?.includes(opt);
                            return (
                                <View key={i} style={[
                                    styles.optionRow,
                                    i !== question.options.length - 1 && styles.optionBorder
                                ]}>
                                    <View style={styles.optionCircle}>
                                        <Text style={styles.optionLetter}>{String.fromCharCode(65 + i)}</Text>
                                    </View>
                                    <Text style={[
                                        styles.optionText,
                                        isCorrect && styles.correctOptionText
                                    ]}>{opt}</Text>
                                    {isCorrect && (
                                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                    )}
                                </View>
                            );
                        }) : null}
                    </GlossyCard>
                )}

                <GlossyCard title="Correct Answer">
                    <Text style={styles.answerValue}>{question.correctAnswer}</Text>
                </GlossyCard>

                {/* RAG Context - Collapsible */}
                <View style={styles.ragSection}>
                    <TouchableOpacity
                        style={styles.ragHeader}
                        onPress={toggleRAG}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.ragTitle}>Source Context (RAG)</Text>
                        <Ionicons
                            name={isExpandedRAG ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {isExpandedRAG && (
                        <GlossyCard>
                            {question.ragContext && question.ragContext.length > 0 ? (
                                question.ragContext.map((ctx, idx) => (
                                    <Text key={idx} style={styles.ragText}>{ctx}</Text>
                                ))
                            ) : (
                                <Text style={styles.ragText}>No context available.</Text>
                            )}
                        </GlossyCard>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.actionBar}>
                <View style={styles.actionButtonContainer}>
                    <GlossyButton
                        title="Reject"
                        // color="red" // gloss button might not support color prop directly, checks needed. Assuming it does or defaults.
                        onPress={() => handleActionParams('reject')}
                        style={{ backgroundColor: '#FF3B30' }}
                    />
                </View>
                <View style={styles.actionButtonContainer}>
                    <GlossyButton
                        title="Flag"
                        // color="orange"
                        onPress={() => handleActionParams('flag')}
                        style={{ backgroundColor: '#FF9500' }}
                    />
                </View>
                <View style={styles.actionButtonContainer}>
                    <GlossyButton
                        title="Approve"
                        // color="green"
                        onPress={() => handleActionParams('approve')}
                        style={{ backgroundColor: '#4CD964' }}
                    />
                </View>
            </View>

            {/* Feedback Modal */}
            <Modal
                transparent={true}
                visible={feedbackModalVisible}
                animationType="fade"
                onRequestClose={() => setFeedbackModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {actionType === 'reject' ? 'Reject Question' : 'Flag Question'}
                            </Text>
                        </View>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalLabel}>Reason (Optional):</Text>
                            <TextInput
                                style={styles.input}
                                multiline
                                numberOfLines={4}
                                placeholder="Enter feedback here..."
                                value={feedbackText}
                                onChangeText={setFeedbackText}
                            />

                            <View style={styles.modalButtons}>
                                <GlossyButton
                                    title="Cancel"
                                    onPress={() => setFeedbackModalVisible(false)}
                                    style={{ flex: 1, marginRight: 5, backgroundColor: '#8E8E93' }}
                                />
                                <GlossyButton
                                    title="Confirm"
                                    onPress={() => submitAction(actionType === 'reject' ? 'rejected' : 'flagged', feedbackText)}
                                    style={{ flex: 1, marginLeft: 5, backgroundColor: actionType === 'reject' ? '#FF3B30' : '#FF9500' }}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </LinenBackground>
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
    navButtons: {
        flexDirection: 'row',
        gap: 16,
    },
    navBtn: {
        padding: 4,
    },
    disabledNav: {
        opacity: 0.3,
    },
    scrollContent: {
        paddingBottom: 100,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: spacing.sm,
    },
    statusBanner: {
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        marginBottom: spacing.md,
    },
    statusSuccess: { backgroundColor: '#E0F8E0' },
    statusError: { backgroundColor: '#F8E0E0' },
    statusWarning: { backgroundColor: '#F8F0E0' },
    statusText: {
        fontWeight: 'bold',
        fontSize: 12,
        color: '#333'
    },
    questionText: {
        fontSize: 16,
        color: '#000',
        lineHeight: 24,
        marginBottom: 10,
    },
    metaContainer: {
        flexDirection: 'row',
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 10,
        flexWrap: 'wrap',
    },
    badge: {
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        marginRight: 8,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    badgeText: {
        fontSize: 11,
        color: '#666',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    optionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    optionCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#DDD',
    },
    optionLetter: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
    },
    optionText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    correctOptionText: {
        fontWeight: 'bold',
        color: colors.success,
    },
    answerValue: {
        fontSize: 14,
        color: colors.success,
        fontWeight: 'bold',
    },
    ragSection: {
        marginTop: 10,
    },
    ragHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 5,
        alignItems: 'center',
    },
    ragTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
    },
    ragText: {
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
        marginBottom: 4,
    },
    actionBar: {
        flexDirection: 'row',
        padding: spacing.md,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderTopWidth: 1,
        borderTopColor: '#CCC',
        gap: spacing.md,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    actionButtonContainer: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    modalHeader: {
        padding: spacing.md,
        backgroundColor: '#F0F0F0',
        borderBottomWidth: 1,
        borderBottomColor: '#DDD',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalContent: {
        padding: spacing.md,
    },
    modalLabel: {
        fontSize: 14,
        marginBottom: spacing.xs,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: spacing.md,
    },
    modalButtons: {
        flexDirection: 'row',
    },
});
