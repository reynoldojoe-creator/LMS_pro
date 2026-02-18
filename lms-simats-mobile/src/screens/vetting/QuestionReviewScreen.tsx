import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { Button, Modal, Card } from '../../components/common';
import { Ionicons } from '@expo/vector-icons';
import { useVetterStore } from '../../store/vetterStore';

import { Question, Subject } from '../../types';
import { subjectService } from '../../services/subjectService';

// Define types for UI state
interface COMapping {
    co_code: string;
    co_description?: string;
    intensity: 1 | 2 | 3;
}

interface LOMapping {
    lo_code: string;
    lo_description?: string;
    intensity: 1 | 2 | 3;
}

interface RejectionCategory {
    id: string;
    label: string;
}

type Props = NativeStackScreenProps<any, 'QuestionReview'>;

export const QuestionReviewScreen = ({ route, navigation }: Props) => {
    const { batchId } = route.params || {};

    const {
        currentBatch,
        startReview,
        approveQuestion,
        rejectQuestion,
        isLoading: storeLoading
    } = useVetterStore();

    const [currentIndex, setCurrentIndex] = useState(0);
    // Local state for adjustments before saving
    const [coAdjustments, setCoAdjustments] = useState<Record<string, COMapping[]>>({});
    const [loAdjustments, setLoAdjustments] = useState<Record<string, LOMapping[]>>({});
    const [subject, setSubject] = useState<Subject | null>(null);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectCategory, setRejectCategory] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [rejectionCategories, setRejectionCategories] = useState<RejectionCategory[]>([]);

    useEffect(() => {
        if (batchId) {
            startReview(batchId).catch(err => {
                Alert.alert("Error", "Failed to load batch: " + err.message);
                navigation.goBack();
            });
        }
        setRejectionCategories([
            { id: "out_of_syllabus", label: "Out of Syllabus" },
            { id: "ambiguous", label: "Ambiguous Question" },
            { id: "multiple_correct", label: "Multiple Correct Answers" },
            { id: "factually_incorrect", label: "Factually Incorrect" },
            { id: "other", label: "Other" }
        ]);
    }, [batchId]);

    // Fetch Subject Details
    useEffect(() => {
        const fetchSubject = async () => {
            const questions = currentBatch?.questions || [];
            if (questions.length > 0) {
                const firstQ = questions[0];
                try {
                    const data = await subjectService.getById(firstQ.subjectId);
                    setSubject(data);
                } catch (e) {
                    console.error("Failed to fetch subject details", e);
                }
            }
        };
        if (currentBatch && !subject) {
            fetchSubject();
        }
    }, [currentBatch]);

    const questions = currentBatch?.questions || [];
    const currentQuestion = questions[currentIndex];

    // Helper to parse mappings from string or array
    const parseMappings = (data: string | any[] | undefined): any[] => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    };

    // Initialize logs when question changes
    useEffect(() => {
        if (currentQuestion) {
            if (!coAdjustments[currentQuestion.id]) {
                const mappings = parseMappings(currentQuestion.coId); // coId stores JSON string
                setCoAdjustments(prev => ({ ...prev, [currentQuestion.id]: mappings }));
            }
            if (!loAdjustments[currentQuestion.id]) {
                const mappings = parseMappings(currentQuestion.loId); // loId stores JSON string
                setLoAdjustments(prev => ({ ...prev, [currentQuestion.id]: mappings }));
            }
        }
    }, [currentIndex, currentQuestion]);

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            Alert.alert("Completed", "You have reviewed all questions in this batch.", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleCOIntensityChange = (coIndex: number, newIntensity: 1 | 2 | 3) => {
        if (!currentQuestion) return;
        const qId = currentQuestion.id;
        const currentMappings = coAdjustments[qId] || parseMappings(currentQuestion.coId);
        // We need to match the structure expected by backend
        // Use a copy
        let updatedMappings = [...currentMappings];

        // Check if we are updating an existing one or adding new?
        // Since we are iterating over subject.courseOutcomes, we might be adding a new mapping for a CO that wasn't there
        // But here I am passed index? No, in my new UI logic I passed index from mappings array.
        // Wait, the new UI logic I wrote in Step 332 iterates subject.courseOutcomes.
        // So I should change this handler to accept (coCode, intensity) instead of index.
    };

    // New handler for Subject-based CO mapping
    const toggleCOMapping = (coCode: string, intensity: 1 | 2 | 3) => {
        if (!currentQuestion) return;
        const qId = currentQuestion.id;
        const currentMappings = coAdjustments[qId] || parseMappings(currentQuestion.coId);
        let newMappings = [...currentMappings];

        const existingIndex = newMappings.findIndex((m: any) => m.co_code === coCode);

        if (existingIndex >= 0) {
            if (newMappings[existingIndex].intensity === intensity) {
                // If clicking same intensity, maybe toggle off? Or do nothing? 
                // Let's assume valid intensity is always required if mapped.
                // If we want to remove mapping, we might need a way. 
                // For now, just update intensity.
            }
            newMappings[existingIndex] = { ...newMappings[existingIndex], intensity };
        } else {
            // Add new
            newMappings.push({ co_code: coCode, intensity });
        }

        setCoAdjustments({ ...coAdjustments, [qId]: newMappings });
    };

    const handleLOIntensityChange = (loIndex: number, newIntensity: 1 | 3) => {
        if (!currentQuestion) return;
        const qId = currentQuestion.id;
        const currentMappings = loAdjustments[qId] || parseMappings(currentQuestion.loId);
        const updatedMappings = [...currentMappings];
        updatedMappings[loIndex] = { ...updatedMappings[loIndex], intensity: newIntensity };
        setLoAdjustments({ ...loAdjustments, [qId]: updatedMappings });
    };

    const handleApprove = async () => {
        if (!currentQuestion) return;
        const coMappings = coAdjustments[currentQuestion.id];
        const loMappings = loAdjustments[currentQuestion.id];

        try {
            await approveQuestion(currentQuestion.id, coMappings, loMappings);
            Alert.alert("Success", "Question Approved");
            handleNext();
        } catch (e: any) {
            Alert.alert("Error", "Failed to approve: " + e.message);
        }
    };

    const handleReject = async () => {
        if (!currentQuestion) return;
        if (!rejectCategory) {
            Alert.alert("Error", "Please select a rejection category");
            return;
        }

        try {
            await rejectQuestion(currentQuestion.id, `${rejectCategory}: ${rejectReason}`);
            Alert.alert("Success", "Question Rejected");
            setShowRejectModal(false);
            setRejectCategory('');
            setRejectReason('');
            handleNext();
        } catch (e: any) {
            Alert.alert("Error", "Failed to reject: " + e.message);
        }
    };

    if (storeLoading || !currentQuestion) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.loadingText}>Loading Batch...</Text>
            </SafeAreaView>
        );
    }

    // @ts-ignore
    const activeCOMappings = coAdjustments[currentQuestion.id] || parseMappings(currentQuestion.coId);
    // @ts-ignore
    const activeLOMappings = loAdjustments[currentQuestion.id] || parseMappings(currentQuestion.loId);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header with Progress */}
            <View style={styles.headerContainer}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Vetting {currentIndex + 1} of {questions.length}</Text>
                    <View style={styles.reviewBatchBadge}>
                        <Ionicons name="documents-outline" size={16} color={colors.textSecondary} />
                    </View>
                </View>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
                </View>
            </View>

            <ScrollView style={styles.content}>
                {/* Question Type Badge */}
                <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{currentQuestion.type}</Text>
                    </View>
                </View>

                {/* Question Text */}
                <View style={styles.questionSection}>
                    <Text style={styles.questionText}>{currentQuestion.questionText}</Text>

                    {currentQuestion.type?.toLowerCase().includes('mcq') && currentQuestion.options && (
                        <View style={styles.optionsContainer}>
                            {/* @ts-ignore: handling both array and object formats from backend */}
                            {Array.isArray(currentQuestion.options) ? currentQuestion.options.map((opt, idx) => {
                                const label = String.fromCharCode(65 + idx);
                                return (
                                    <View key={idx} style={[
                                        styles.optionRow,
                                        currentQuestion.correctAnswer === label && styles.correctOption
                                    ]}>
                                        <View style={styles.optionKey}>
                                            <Text style={styles.optionKeyText}>{label}</Text>
                                        </View>
                                        <Text style={styles.optionText}>{opt}</Text>
                                        {currentQuestion.correctAnswer === label && (
                                            <Ionicons name="checkmark-circle" size={20} color={colors.success} style={{ marginLeft: 'auto' }} />
                                        )}
                                    </View>
                                );
                            }) : Object.entries(currentQuestion.options).map(([key, value]) => (
                                <View key={key} style={[
                                    styles.optionRow,
                                    currentQuestion.correctAnswer === key && styles.correctOption
                                ]}>
                                    <View style={styles.optionKey}>
                                        <Text style={styles.optionKeyText}>{key}</Text>
                                    </View>
                                    <Text style={styles.optionText}>{String(value)}</Text>
                                    {currentQuestion.correctAnswer === key && (
                                        <Ionicons name="checkmark-circle" size={20} color={colors.success} style={{ marginLeft: 'auto' }} />
                                    )}
                                </View>
                            ))}
                        </View>
                    )}

                    {currentQuestion.type.toLowerCase() !== 'mcq' && (
                        <View style={styles.answerBox}>
                            <Text style={styles.answerLabel}>Expected Answer:</Text>
                            <Text style={styles.answerText}>{currentQuestion.correctAnswer}</Text>
                        </View>
                    )}
                </View>

                {/* CO Mapping Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Course Outcome Mapping</Text>
                </View>
                <Card style={styles.coCard}>
                    {subject?.courseOutcomes && subject.courseOutcomes.length > 0 ? (
                        subject.courseOutcomes.map((co, index) => {
                            const qId = currentQuestion.id;
                            const currentMappings = coAdjustments[qId] || parseMappings(currentQuestion.coId);
                            const existingMapping = currentMappings.find((m: any) => m.co_code === co.code);
                            const currentIntensity = existingMapping ? existingMapping.intensity : null;

                            return (
                                <View key={co.id} style={styles.coRow}>
                                    <View style={styles.coInfo}>
                                        <Text style={styles.coCode}>{co.code}</Text>
                                        <Text style={styles.coDescription} numberOfLines={2}>{co.description}</Text>
                                    </View>
                                    <View style={styles.intensityWrapper}>
                                        <View style={styles.intensityButtons}>
                                            {[1, 2, 3].map((level) => (
                                                <TouchableOpacity
                                                    key={level}
                                                    style={[
                                                        styles.intensityButton,
                                                        currentIntensity === level && styles.intensityButtonActive,
                                                        currentIntensity === level && { backgroundColor: getIntensityColor(level) }
                                                    ]}
                                                    onPress={() => toggleCOMapping(co.code, level as 1 | 2 | 3)}
                                                >
                                                    <Text style={[
                                                        styles.intensityButtonText,
                                                        currentIntensity === level && styles.intensityButtonTextActive
                                                    ]}>{level}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <Text style={styles.emptyText}>Loading Course Outcomes...</Text>
                    )}
                </Card>

                {/* LO Mapping Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Learning Outcome Mapping</Text>
                </View>
                <Card style={styles.coCard}>
                    {activeLOMappings.length > 0 ? activeLOMappings.map((mapping, index) => (
                        <View key={index} style={styles.coRow}>
                            <Text style={styles.coCode}>{mapping.lo_code}</Text>
                            <View style={styles.intensityContainer}>
                                <Text style={styles.intensityLabel}>Intensity:</Text>
                                <View style={styles.intensityButtons}>
                                    {[1, 2, 3].map((level) => (
                                        <TouchableOpacity
                                            key={level}
                                            style={[
                                                styles.intensityButton,
                                                mapping.intensity === level && styles.intensityButtonActive,
                                                mapping.intensity === level && { backgroundColor: getIntensityColor(level) }
                                            ]}
                                            onPress={() => handleLOIntensityChange(index, level as 1 | 3)}
                                        >
                                            <Text style={[
                                                styles.intensityButtonText,
                                                mapping.intensity === level && styles.intensityButtonTextActive
                                            ]}>{level}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    )) : <Text style={styles.emptyText}>No LOs Mapped</Text>}
                </Card>

            </ScrollView>

            {/* Action Footer */}
            <View style={styles.footer}>
                <View style={styles.actionRow}>
                    <Button
                        title="Reject"
                        onPress={() => setShowRejectModal(true)}
                        variant="outline"
                        style={styles.actionBtn}
                        textStyle={{ color: colors.error }}
                        icon={<Ionicons name="close" size={18} color={colors.error} />}
                    />
                    <Button
                        title="Edit"
                        onPress={() => Alert.alert("Coming Soon", "Edit functionality will be added here.")}
                        variant="outline"
                        style={styles.actionBtn}
                        textStyle={{ color: colors.textSecondary }}
                        icon={<Ionicons name="pencil" size={18} color={colors.textSecondary} />}
                    />
                    <Button
                        title="Approve"
                        onPress={handleApprove}
                        variant="primary"
                        style={[styles.actionBtn, { backgroundColor: colors.success, borderColor: colors.success }]}
                        icon={<Ionicons name="checkmark" size={18} color="white" />}
                    />
                </View>

                <Button
                    title="Submit & Next"
                    onPress={handleNext}
                    variant="primary"
                    style={styles.submitBtn}
                    fullWidth
                    rightIcon={<Ionicons name="arrow-forward" size={20} color="white" />}
                />
            </View>

            {/* Rejection Modal */}
            <Modal
                visible={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                title="Reject Question"
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalLabel}>Select Reason:</Text>
                    {rejectionCategories.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[
                                styles.categoryOption,
                                rejectCategory === cat.id && styles.categoryOptionSelected
                            ]}
                            onPress={() => setRejectCategory(cat.id)}
                        >
                            <Text style={styles.categoryText}>{cat.label}</Text>
                            {rejectCategory === cat.id && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                        </TouchableOpacity>
                    ))}

                    <Text style={[styles.modalLabel, { marginTop: spacing.md }]}>Additional Notes (Optional):</Text>
                    <TextInput
                        style={styles.reasonInput}
                        value={rejectReason}
                        onChangeText={setRejectReason}
                        placeholder="Why is this question being rejected?"
                        multiline
                        numberOfLines={3}
                    />

                    <Button
                        title="Confirm Rejection"
                        onPress={handleReject}
                        variant="primary"
                        style={{ marginTop: spacing.lg, backgroundColor: colors.error }}
                    />
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const getIntensityColor = (level: number) => {
    switch (level) {
        case 1: return '#FFD700'; // Low - Yellow
        case 2: return '#FFA500'; // Medium - Orange
        case 3: return '#FF4500'; // High - Red
        default: return colors.primary;
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerContainer: {
        backgroundColor: colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
        paddingTop: spacing.md,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.screenHorizontal,
        marginBottom: spacing.sm,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: colors.iosGray5,
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.primary,
    },
    reviewBatchBadge: {
        backgroundColor: colors.iosGray6,
        padding: 4,
        borderRadius: 4,
    },
    headerTitle: {
        ...typography.navTitle,
        color: colors.textPrimary,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    loadingText: {
        ...typography.body,
        textAlign: 'center',
        marginTop: spacing.xl,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    badge: {
        backgroundColor: colors.primary + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: spacing.sm,
    },
    badgeText: {
        ...typography.captionBold,
        color: colors.primary,
    },
    bloomBadge: {
        backgroundColor: colors.primaryLight + '20',
    },
    bloomText: {
        color: colors.primaryDark,
    },
    questionSection: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.lg,
    },
    questionText: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.md,
        lineHeight: 24,
    },
    optionsContainer: {
        marginTop: spacing.sm,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        backgroundColor: colors.iosGray6,
        borderRadius: borderRadius.sm,
        marginBottom: spacing.xs,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    correctOption: {
        borderColor: colors.success,
        backgroundColor: colors.success + '10',
    },
    optionKey: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.textSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    optionKeyText: {
        color: colors.surface,
        fontSize: 12,
        fontWeight: 'bold',
    },
    optionText: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
    },
    answerBox: {
        marginTop: spacing.sm,
        padding: spacing.sm,
        backgroundColor: colors.iosGray6,
        borderRadius: borderRadius.sm,
    },
    answerLabel: {
        ...typography.captionBold,
        color: colors.success,
        marginBottom: 2,
    },
    answerText: {
        ...typography.body,
        color: colors.textPrimary,
    },
    sectionHeader: {
        marginVertical: spacing.sm,
    },
    sectionTitle: {
        ...typography.bodyBold,
        color: colors.textSecondary,
        textTransform: 'uppercase',
    },
    coCard: {
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    coRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
        paddingBottom: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    coCode: {
        ...typography.h3,
        color: colors.primary,
        width: 50,
        textAlign: 'center',
    },
    coInfo: {
        flex: 1,
        marginRight: spacing.md,
    },
    coDescription: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    intensityWrapper: {
        justifyContent: 'center',
    },
    intensityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    intensityLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginRight: spacing.sm,
    },
    intensityButtons: {
        flexDirection: 'row',
        backgroundColor: colors.iosGray6,
        borderRadius: borderRadius.sm,
        padding: 2,
    },
    intensityButton: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: borderRadius.sm - 2,
    },
    intensityButtonActive: {
        // Background color set dynamically
    },
    intensityButtonText: {
        ...typography.captionBold,
        color: colors.textSecondary,
    },
    intensityButtonTextActive: {
        color: colors.textInverse,
    },
    emptyText: {
        fontStyle: 'italic',
        color: colors.textTertiary,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    footer: {
        backgroundColor: colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.divider,
        padding: spacing.md,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    actionBtn: {
        flex: 1,
        paddingHorizontal: spacing.xs,
    },
    submitBtn: {
        // height: 50,
    },
    modalContent: {
        padding: spacing.md,
    },
    modalLabel: {
        ...typography.bodyBold,
        marginBottom: spacing.sm,
        color: colors.textPrimary,
    },
    categoryOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.sm,
    },
    categoryOptionSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '10',
    },
    categoryText: {
        ...typography.body,
        color: colors.textPrimary,
    },
    reasonInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        height: 100,
        textAlignVertical: 'top',
        marginTop: spacing.sm,
        color: colors.textPrimary,
    },
});
