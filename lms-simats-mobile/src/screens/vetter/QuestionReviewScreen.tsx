import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager, Modal, TextInput, Animated, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useVetterStore } from '../../store';
import { Tag, LoadingSpinner, ScreenBackground, ModernNavBar, Card, ModernButton } from '../../components/common';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Ionicons } from '@expo/vector-icons';

// Safe import — expo-speech-recognition requires a dev build, not available in Expo Go
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = (_event: string, _cb: any) => { }; // no-op stub
let speechAvailable = false;
try {
    const speechModule = require('expo-speech-recognition');
    ExpoSpeechRecognitionModule = speechModule.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = speechModule.useSpeechRecognitionEvent;
    speechAvailable = !!ExpoSpeechRecognitionModule;
} catch {
    // Module not available in Expo Go — voice input gracefully disabled
}

const REJECT_REASONS = [
    'Out of Syllabus',
    'Illogical',
    'Wrong CO/LO Mapping',
    'Wrong Question Format',
];

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

type Props = NativeStackScreenProps<any, 'QuestionReview'>;

export const QuestionReviewScreen = ({ route, navigation }: Props) => {
    const { batchId, questionId: initialQuestionId } = route.params as { batchId: string; questionId?: string };
    const { currentBatch, startReview, approveQuestion, rejectQuestion, quarantineQuestion, isLoading } = useVetterStore();
    const insets = useSafeAreaInsets();
    const TAB_BAR_HEIGHT = 60; // Approximate height of the tab bar

    // Local state for index navigation
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isExpandedRAG, setIsExpandedRAG] = useState(false);

    // CO/LO Intensity Mapping State
    const [coAdjustments, setCoAdjustments] = useState<Record<string, any[]>>({});
    const [loAdjustments, setLoAdjustments] = useState<Record<string, any[]>>({});

    // Feedback Modal State
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [actionType, setActionType] = useState<'reject' | 'flag' | 'approve' | null>(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [isListening, setIsListening] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Speech recognition events
    useSpeechRecognitionEvent('result', (event) => {
        const transcript = event.results[0]?.transcript || '';
        if (transcript) {
            setFeedbackText(prev => prev ? prev + ' ' + transcript : transcript);
        }
    });

    useSpeechRecognitionEvent('end', () => {
        setIsListening(false);
    });

    useSpeechRecognitionEvent('error', (event) => {
        console.log('Speech error:', event.error);
        setIsListening(false);
    });

    // Pulse animation for mic button
    useEffect(() => {
        if (isListening) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isListening]);

    const toggleReason = (reason: string) => {
        setSelectedReasons(prev =>
            prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
        );
    };

    const toggleVoiceInput = async () => {
        if (!speechAvailable) {
            Alert.alert(
                'Voice Input Unavailable',
                'Speech recognition requires a development build. It is not available in Expo Go.\n\nRun: npx expo prebuild && npx expo run:android',
                [{ text: 'OK' }]
            );
            return;
        }
        if (isListening) {
            await ExpoSpeechRecognitionModule.stop();
            setIsListening(false);
        } else {
            const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (result.granted) {
                await ExpoSpeechRecognitionModule.start({
                    lang: 'en-US',
                    interimResults: false,
                    continuous: false,
                });
                setIsListening(true);
            }
        }
    };

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
            <ScreenBackground>
                <ModernNavBar title="Loading..." showBack onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <LoadingSpinner />
                </View>
            </ScreenBackground>
        );
    }

    const question = currentBatch.questions[currentIndex];
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === currentBatch.questions.length - 1;

    if (!question) {
        return (
            <ScreenBackground>
                <ModernNavBar title="Review" showBack onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No questions found in this batch.</Text>
                </View>
            </ScreenBackground>
        );
    }

    const handleNext = () => {
        if (!isLast) setCurrentIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (!isFirst) setCurrentIndex(prev => prev - 1);
    };

    // ... (toggleRAG and handleActionParams remain same)

    const toggleRAG = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpandedRAG(!isExpandedRAG);
    };

    // CO/LO intensity helpers
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

    const getIntensityColor = (level: number) => {
        switch (level) {
            case 0: return colors.textSecondary;
            case 1: return colors.success;
            case 2: return colors.warning;
            case 3: return colors.error;
            default: return colors.textSecondary;
        }
    };

    const getIntensityLabel = (level: number) => {
        switch (level) {
            case 0: return 'Nil';
            case 1: return 'Mild';
            case 2: return 'Moderate';
            case 3: return 'Good';
            default: return String(level);
        }
    };

    // Extract CO codes mapped to the current question from its metadata
    const getQuestionCOCodes = (): string[] => {
        if (!question) return [];

        // Primary: use the specifically mapped COs for this question (from model)
        const raw = question.coId;
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map((item: any) => typeof item === 'string' ? item : (item.co_code || ''));
                }
            } catch {
                // Plain string like "CO1" or "CO1, CO2"
                const split = raw.split(',').map((s: string) => s.trim()).filter(Boolean);
                if (split.length > 0) return split;
            }
        }

        // Fallback: use all COs mapped to the topic
        if (question.topicCOs && question.topicCOs.length > 0) {
            return question.topicCOs;
        }

        return [];
    };

    // Extract LO codes mapped to the current question from its metadata
    const getQuestionLOCodes = (): string[] => {
        if (!question) return [];

        // Primary: use the specifically mapped LOs for this question
        const raw = question.loId;
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map((item: any) => typeof item === 'string' ? item : (item.lo_code || ''));
                }
            } catch {
                const split = raw.split(',').map((s: string) => s.trim()).filter(Boolean);
                if (split.length > 0) return split;
            }
        }

        // Fallback: use all LOs mapped to the topic
        if (question.topicLOs && question.topicLOs.length > 0) {
            return question.topicLOs;
        }

        return [];
    };

    const toggleCOMapping = (coCode: string, intensity: 0 | 1 | 2 | 3) => {
        if (!question) return;
        const qId = question.id;
        const currentMappings = coAdjustments[qId] || parseMappings(question.coId);
        let newMappings = [...currentMappings];
        const existingIndex = newMappings.findIndex((m: any) => m.co_code === coCode);
        if (existingIndex >= 0) {
            newMappings[existingIndex] = { ...newMappings[existingIndex], intensity };
        } else {
            newMappings.push({ co_code: coCode, intensity });
        }
        setCoAdjustments({ ...coAdjustments, [qId]: newMappings });
    };

    const toggleLOMapping = (loCode: string, intensity: 0 | 1 | 2 | 3) => {
        if (!question) return;
        const qId = question.id;
        const currentMappings = loAdjustments[qId] || parseMappings(question.loId);
        let newMappings = [...currentMappings];
        const existingIndex = newMappings.findIndex((m: any) => m.lo_code === loCode);
        if (existingIndex >= 0) {
            newMappings[existingIndex] = { ...newMappings[existingIndex], intensity };
        } else {
            newMappings.push({ lo_code: loCode, intensity });
        }
        setLoAdjustments({ ...loAdjustments, [qId]: newMappings });
    };

    const handleActionParams = (type: 'reject' | 'flag' | 'approve') => {
        setActionType(type);
        if (type === 'approve') {
            const coMappings = coAdjustments[question.id];
            const loMappings = loAdjustments[question.id];
            submitAction('approved', '', coMappings, loMappings);
        } else {
            setFeedbackText('');
            setFeedbackModalVisible(true);
        }
    };

    const submitAction = async (status: string, notes: string, coMappings?: any[], loMappings?: any[]) => {
        try {
            if (status === 'approved') {
                await approveQuestion(question.id, coMappings, loMappings);
            } else if (status === 'rejected') {
                await rejectQuestion(question.id, notes);
            } else if (status === 'flagged') {
                await quarantineQuestion(question.id, notes);
            }

            setFeedbackModalVisible(false);
            if (!isLast) handleNext();
            else navigation.goBack();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <ScreenBackground>
            <ModernNavBar
                title={`Question ${currentIndex + 1} of ${currentBatch.totalQuestions}`}
                showBack
                onBack={() => navigation.goBack()}
                rightButton={
                    <View style={styles.navButtons}>
                        <TouchableOpacity onPress={handlePrev} disabled={isFirst} style={[styles.navBtn, isFirst && styles.disabledNav]}>
                            <Ionicons name="chevron-back" size={24} color={isFirst ? colors.textSecondary : colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleNext} disabled={isLast} style={[styles.navBtn, isLast && styles.disabledNav]}>
                            <Ionicons name="chevron-forward" size={24} color={isLast ? colors.textSecondary : colors.primary} />
                        </TouchableOpacity>
                    </View>
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

                <Card title="Question Text" style={styles.card}>
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
                </Card>

                {question.options && (
                    <Card title="Options" style={styles.card}>
                        {(() => {
                            let optionsToRender: string[] = [];
                            // Handle if options is an array of strings
                            if (Array.isArray(question.options)) {
                                optionsToRender = question.options.map(o => typeof o === 'string' ? o : JSON.stringify(o));
                            }
                            // Handle if options is an object/dict (e.g. {A: "...", B: "..."})
                            else if (typeof question.options === 'object' && question.options !== null) {
                                optionsToRender = Object.values(question.options).map(o => typeof o === 'string' ? o : JSON.stringify(o));
                            }

                            return optionsToRender.map((opt: string, i: number) => {
                                const optionLetter = String.fromCharCode(65 + i); // 'A', 'B', 'C', 'D'
                                const isCorrect = (typeof question.correctAnswer === 'string' && (question.correctAnswer === optionLetter || question.correctAnswer.includes(optionLetter))) ||
                                    (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(optionLetter));
                                return (
                                    <View key={i} style={[
                                        styles.optionBox,
                                        isCorrect && styles.optionBoxCorrect
                                    ]}>
                                        <View style={[styles.optionCircle, isCorrect && styles.optionCircleCorrect]}>
                                            <Text style={[styles.optionLetter, isCorrect && styles.optionLetterCorrect]}>{String.fromCharCode(65 + i)}</Text>
                                        </View>
                                        <Text style={[
                                            styles.optionText,
                                            isCorrect && styles.correctOptionText
                                        ]}>{opt}</Text>
                                        {isCorrect && (
                                            <Ionicons name="checkmark-circle" size={24} color={colors.success} style={{ marginLeft: 8 }} />
                                        )}
                                    </View>
                                );
                            });
                        })()}
                    </Card>
                )}

                {/* CO Intensity Mapping */}
                {(() => {
                    const questionCOCodes = getQuestionCOCodes();
                    const filteredCOs = (currentBatch?.subjectCOs || []).filter(
                        (co: any) => questionCOCodes.includes(co.code)
                    );
                    if (filteredCOs.length === 0) return null;
                    return (
                        <Card title="CO Intensity Mapping" style={styles.card}>
                            {filteredCOs.map((co: any) => {
                                const qId = question.id;
                                const currentMappings = coAdjustments[qId] || parseMappings(question.coId);
                                const existingMapping = currentMappings.find((m: any) => m.co_code === co.code);
                                const currentIntensity = existingMapping ? existingMapping.intensity : null;
                                return (
                                    <View key={co.id} style={styles.coRow}>
                                        <View style={styles.coRowHeader}>
                                            <Text style={styles.coCode}>{co.code}</Text>
                                            <View style={styles.intensityButtons}>
                                                {[0, 1, 2, 3].map((level) => (
                                                    <TouchableOpacity
                                                        key={level}
                                                        style={[
                                                            styles.intensityButton,
                                                            currentIntensity === level && { backgroundColor: getIntensityColor(level) }
                                                        ]}
                                                        onPress={() => toggleCOMapping(co.code, level as 0 | 1 | 2 | 3)}
                                                    >
                                                        <Text style={[
                                                            styles.intensityButtonText,
                                                            currentIntensity === level && styles.intensityButtonTextActive
                                                        ]}>{getIntensityLabel(level)}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                        <Text style={styles.coDescriptionFull}>{co.description}</Text>
                                    </View>
                                );
                            })}
                        </Card>
                    );
                })()}

                {/* LO Intensity Mapping */}
                {(() => {
                    const questionLOCodes = getQuestionLOCodes();
                    const filteredLOs = (currentBatch?.subjectLOs || []).filter(
                        (lo: any) => questionLOCodes.includes(lo.code)
                    );
                    if (filteredLOs.length === 0) return null;
                    return (
                        <Card title="LO Intensity Mapping" style={styles.card}>
                            {filteredLOs.map((lo: any) => {
                                const qId = question.id;
                                const currentMappings = loAdjustments[qId] || parseMappings(question.loId);
                                const existingMapping = currentMappings.find((m: any) => m.lo_code === lo.code);
                                const currentIntensity = existingMapping ? existingMapping.intensity : null;
                                return (
                                    <View key={lo.id} style={styles.coRow}>
                                        <View style={styles.coRowHeader}>
                                            <Text style={styles.coCode}>{lo.code}</Text>
                                            <View style={styles.intensityButtons}>
                                                {[0, 1, 2, 3].map((level) => (
                                                    <TouchableOpacity
                                                        key={level}
                                                        style={[
                                                            styles.intensityButton,
                                                            currentIntensity === level && { backgroundColor: getIntensityColor(level) }
                                                        ]}
                                                        onPress={() => toggleLOMapping(lo.code, level as 0 | 1 | 2 | 3)}
                                                    >
                                                        <Text style={[
                                                            styles.intensityButtonText,
                                                            currentIntensity === level && styles.intensityButtonTextActive
                                                        ]}>{getIntensityLabel(level)}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                        <Text style={styles.coDescriptionFull}>{lo.description}</Text>
                                    </View>
                                );
                            })}
                        </Card>
                    );
                })()}

                {/* Question Context - Collapsible */}
                <View style={styles.ragSection}>
                    <TouchableOpacity
                        style={styles.ragHeader}
                        onPress={toggleRAG}
                        activeOpacity={0.7}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="bulb-outline" size={18} color={colors.primary} style={{ marginRight: spacing.xs }} />
                            <Text style={styles.ragTitle}>Question Context</Text>
                        </View>
                        <Ionicons
                            name={isExpandedRAG ? "chevron-up" : "chevron-down"}
                            size={20}
                            color={colors.textSecondary}
                        />
                    </TouchableOpacity>

                    {isExpandedRAG && (
                        <View style={styles.contextContainer}>
                            {(() => {
                                const ragData = question.ragContext;
                                if (!ragData) {
                                    return (
                                        <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
                                            <Ionicons name="information-circle-outline" size={24} color={colors.textSecondary} />
                                            <Text style={[styles.ragText, { marginTop: spacing.xs, textAlign: 'center' }]}>No context available for this question.{"\n"}Re-index documents to enable provenance.</Text>
                                        </View>
                                    );
                                }

                                // Check if it's the new structured format
                                const isStructured = typeof ragData === 'object' && !Array.isArray(ragData) && (ragData.context || ragData.reasoning);

                                if (isStructured) {
                                    const ext = ragData;
                                    const hasReasoning = ext.reasoning && ext.reasoning !== 'No reasoning provided by model.';
                                    const hasContext = ext.context && Array.isArray(ext.context) && ext.context.length > 0;

                                    if (!hasReasoning && !hasContext) {
                                        return (
                                            <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
                                                <Text style={styles.ragText}>Context was recorded but no details available.</Text>
                                            </View>
                                        );
                                    }

                                    return (
                                        <>
                                            {/* Model Reasoning */}
                                            {hasReasoning && (
                                                <View style={styles.reasoningSection}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                                                        <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.primary} />
                                                        <Text style={[styles.contextSubheader, { marginLeft: 6, marginBottom: 0 }]}>Model Reasoning</Text>
                                                    </View>
                                                    <Text style={styles.reasoningText}>{ext.reasoning}</Text>
                                                </View>
                                            )}

                                            {/* Source References */}
                                            {hasContext && (
                                                <View style={styles.referencesSection}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                                                        <Ionicons name="documents-outline" size={14} color={colors.primary} />
                                                        <Text style={[styles.contextSubheader, { marginLeft: 6, marginBottom: 0 }]}>Source References ({ext.context.length})</Text>
                                                    </View>
                                                    {ext.context.map((ctx: any, idx: number) => {
                                                        // Handle both object and string items in context array
                                                        const text = typeof ctx === 'string' ? ctx : (ctx.text || JSON.stringify(ctx));
                                                        const pageNum = typeof ctx === 'object' ? ctx.page_number : null;
                                                        // Prefer filename over source; hide if source is just 'notes'
                                                        let source = typeof ctx === 'object' ? (ctx.filename || ctx.source) : null;
                                                        if (source === 'notes' || source === 'Unknown Source') source = null;

                                                        return (
                                                            <View key={idx} style={styles.referenceCard}>
                                                                {(pageNum || source) && (
                                                                    <View style={styles.referenceBadge}>
                                                                        <Ionicons name="document-text-outline" size={13} color={colors.primary} />
                                                                        <Text style={styles.referenceBadgeText}>
                                                                            {pageNum ? `Page ${pageNum}` : ''}{pageNum && source ? ' · ' : ''}{source || ''}
                                                                        </Text>
                                                                    </View>
                                                                )}
                                                                <Text style={styles.ragText} numberOfLines={6}>{text}</Text>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            )}
                                        </>
                                    );
                                }

                                // Legacy flat array format
                                if (Array.isArray(ragData) && ragData.length > 0) {
                                    return (
                                        <View style={styles.referencesSection}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                                                <Ionicons name="documents-outline" size={14} color={colors.textSecondary} />
                                                <Text style={[styles.contextSubheader, { marginLeft: 6, marginBottom: 0 }]}>Source References</Text>
                                            </View>
                                            {ragData.map((ctx: any, idx: number) => (
                                                <View key={idx} style={styles.referenceCard}>
                                                    <Text style={styles.ragText} numberOfLines={6}>{typeof ctx === 'string' ? ctx : JSON.stringify(ctx)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    );
                                }

                                return (
                                    <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
                                        <Text style={styles.ragText}>No context available.</Text>
                                    </View>
                                );
                            })()}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={[styles.actionBar, { bottom: insets.bottom }]}>
                <View style={[styles.actionButtonContainer, { paddingHorizontal: 2 }]}>
                    <ModernButton
                        title="Reject"
                        onPress={() => handleActionParams('reject')}
                        variant="ghost"
                        style={{ backgroundColor: colors.error, paddingHorizontal: 4 }}
                        textStyle={{ color: 'white', fontSize: 13 }}
                    />
                </View>
                <View style={[styles.actionButtonContainer, { paddingHorizontal: 2 }]}>
                    <ModernButton
                        title="Flag"
                        onPress={() => handleActionParams('flag')}
                        variant="ghost"
                        style={{ backgroundColor: colors.warning, paddingHorizontal: 4 }}
                        textStyle={{ color: 'white', fontSize: 13 }}
                    />
                </View>
                <View style={[styles.actionButtonContainer, { flex: 1.1, paddingHorizontal: 2 }]}>
                    <ModernButton
                        title="Approve"
                        onPress={() => handleActionParams('approve')}
                        variant="primary"
                        style={{ backgroundColor: colors.success, paddingHorizontal: 4 }}
                        textStyle={{ fontSize: 13 }}
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
                            <TouchableOpacity onPress={() => setFeedbackModalVisible(false)}>
                                <Ionicons name="close" size={22} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalContent}>
                            {/* Predefined Reason Chips */}
                            {actionType === 'reject' && (
                                <View style={styles.reasonChipsContainer}>
                                    <Text style={styles.modalLabel}>Select Reason(s):</Text>
                                    <View style={styles.reasonChips}>
                                        {REJECT_REASONS.map((reason) => {
                                            const isSelected = selectedReasons.includes(reason);
                                            return (
                                                <TouchableOpacity
                                                    key={reason}
                                                    style={[
                                                        styles.reasonChip,
                                                        isSelected && styles.reasonChipSelected,
                                                    ]}
                                                    onPress={() => toggleReason(reason)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Ionicons
                                                        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                                                        size={16}
                                                        color={isSelected ? 'white' : colors.error}
                                                        style={{ marginRight: 5 }}
                                                    />
                                                    <Text style={[
                                                        styles.reasonChipText,
                                                        isSelected && styles.reasonChipTextSelected,
                                                    ]}>{reason}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* Feedback Text Input with Voice */}
                            <Text style={styles.modalLabel}>Additional Feedback (Optional):</Text>
                            <View style={styles.inputRow}>
                                <TextInput
                                    style={styles.inputWithMic}
                                    multiline
                                    numberOfLines={4}
                                    placeholder="Type or use voice input..."
                                    value={feedbackText}
                                    onChangeText={setFeedbackText}
                                    placeholderTextColor={colors.textSecondary}
                                />
                                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                    <TouchableOpacity
                                        style={[
                                            styles.micButton,
                                            isListening && styles.micButtonActive,
                                        ]}
                                        onPress={toggleVoiceInput}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={isListening ? 'mic' : 'mic-outline'}
                                            size={22}
                                            color={isListening ? 'white' : colors.primary}
                                        />
                                    </TouchableOpacity>
                                </Animated.View>
                            </View>
                            {isListening && (
                                <Text style={styles.listeningText}>🎙 Listening...</Text>
                            )}

                            <View style={styles.modalButtons}>
                                <ModernButton
                                    title="Cancel"
                                    onPress={() => {
                                        setFeedbackModalVisible(false);
                                        setSelectedReasons([]);
                                        setFeedbackText('');
                                    }}
                                    variant="secondary"
                                    style={{ flex: 1, marginRight: 5 }}
                                />
                                <ModernButton
                                    title="Confirm"
                                    onPress={() => {
                                        // Combine selected reasons + freeform text
                                        const reasonsPrefix = selectedReasons.length > 0
                                            ? `[${selectedReasons.join(', ')}] `
                                            : '';
                                        const combinedFeedback = reasonsPrefix + feedbackText;
                                        submitAction(
                                            actionType === 'reject' ? 'rejected' : 'flagged',
                                            combinedFeedback.trim()
                                        );
                                        setSelectedReasons([]);
                                        setFeedbackText('');
                                    }}
                                    style={{ flex: 1, marginLeft: 5, backgroundColor: actionType === 'reject' ? colors.error : colors.warning }}
                                    textStyle={{ color: 'white' }}
                                    variant="primary"
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScreenBackground >
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { ...typography.body, color: colors.textSecondary },
    navButtons: { flexDirection: 'row', gap: 16 },
    navBtn: { padding: 4 },
    disabledNav: { opacity: 0.3 },
    scrollContent: { paddingBottom: 180, paddingHorizontal: spacing.md, paddingTop: spacing.md },
    tagsRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
    statusBanner: {
        padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, marginBottom: spacing.md,
    },
    statusSuccess: { backgroundColor: colors.success + '20', borderColor: colors.success + '40' },
    statusError: { backgroundColor: colors.error + '20', borderColor: colors.error + '40' },
    statusWarning: { backgroundColor: colors.warning + '20', borderColor: colors.warning + '40' },
    statusText: { ...typography.captionBold, color: colors.textPrimary },
    card: { marginBottom: spacing.lg }, // Increased margin
    questionText: { ...typography.body, color: colors.textPrimary, lineHeight: 24, marginBottom: 10 },
    metaContainer: { flexDirection: 'row', marginTop: 10, borderTopWidth: 1, borderTopColor: colors.separator, paddingTop: 10, flexWrap: 'wrap' },
    badge: {
        backgroundColor: colors.systemGray6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
        marginRight: 8, marginBottom: 4,
    },
    badgeText: { ...typography.caption, color: colors.textSecondary },
    optionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.background,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.separator,
    },
    optionBoxCorrect: {
        backgroundColor: colors.success + '10',
        borderColor: colors.success,
    },
    optionCircle: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: colors.systemGray6, alignItems: 'center',
        justifyContent: 'center', marginRight: 12,
        borderWidth: 1, borderColor: colors.separator
    },
    optionCircleCorrect: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    optionLetter: { ...typography.captionBold, color: colors.textSecondary },
    optionLetterCorrect: { color: 'white' },
    optionText: { flex: 1, ...typography.body, color: colors.textPrimary },
    correctOptionText: { ...typography.bodyBold, color: colors.successDark },
    answerValue: { ...typography.bodyBold, color: colors.success },
    ragSection: { marginTop: 10 },
    ragHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 5, alignItems: 'center' },
    ragTitle: { ...typography.captionBold, color: colors.textSecondary },
    ragText: { ...typography.caption, color: colors.textSecondary, lineHeight: 18, marginBottom: 4 },
    // CO/LO Mapping styles
    coRow: {
        paddingVertical: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.systemGray5,
    },
    coRowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    coInfo: {
        flex: 1,
        marginRight: spacing.md,
    },
    coCode: {
        ...typography.bodyBold,
        color: colors.primary,
        minWidth: 40,
    },
    coDescription: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    coDescriptionFull: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 4,
        lineHeight: 18,
    },
    intensityButtons: {
        flexDirection: 'row',
        backgroundColor: colors.systemGray6,
        borderRadius: 8,
        padding: 2,
    },
    intensityButton: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
    },
    intensityButtonText: {
        fontSize: 11,
        fontWeight: '600' as const,
        color: colors.textSecondary,
    },
    intensityButtonTextActive: {
        color: 'white',
    },
    emptyMappingText: {
        ...typography.caption,
        fontStyle: 'italic',
        color: colors.textSecondary,
        textAlign: 'center',
        paddingVertical: spacing.sm,
    },
    actionBar: {
        flexDirection: 'row', padding: 8, backgroundColor: colors.surface,
        borderTopWidth: 1, borderTopColor: colors.separator, gap: 8,
        position: 'absolute', bottom: 0, left: 0, right: 0,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4 },
            android: { elevation: 8 }
        })
    },
    actionButtonContainer: { flex: 1 },
    // Styles for Context Dropdown
    contextContainer: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.separator,
        marginTop: spacing.xs,
    },
    reasoningSection: {
        marginBottom: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.separator,
    },
    contextSubheader: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        fontSize: 13,
    },
    reasoningText: {
        ...typography.body,
        color: colors.textSecondary,
        fontStyle: 'italic',
        lineHeight: 20,
        fontSize: 13,
        marginTop: 4,
    },
    referencesSection: {
        marginTop: spacing.xs,
    },
    referenceCard: {
        backgroundColor: colors.background,
        borderRadius: 10,
        padding: spacing.sm,
        marginTop: spacing.sm,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
    },
    referenceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    referenceBadgeText: {
        ...typography.caption,
        color: colors.primary,
        marginLeft: 4,
        fontWeight: '600',
        fontSize: 11,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
    modalContainer: { backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: colors.systemGray6, borderBottomWidth: 1, borderBottomColor: colors.separator },
    modalTitle: { ...typography.h3, textAlign: 'center', color: colors.textPrimary },
    modalContent: { padding: spacing.md },
    modalLabel: { ...typography.body, marginBottom: spacing.xs, color: colors.textPrimary },
    input: {
        borderWidth: 1, borderColor: colors.separator, borderRadius: 12, padding: spacing.sm, height: 100,
        textAlignVertical: 'top', marginBottom: spacing.md, color: colors.textPrimary, backgroundColor: colors.background
    },
    modalButtons: { flexDirection: 'row', marginTop: spacing.sm },
    // Reject reason chips
    reasonChipsContainer: {
        marginBottom: spacing.md,
    },
    reasonChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 6,
    },
    reasonChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.error,
        backgroundColor: colors.error + '08',
    },
    reasonChipSelected: {
        backgroundColor: colors.error,
        borderColor: colors.error,
    },
    reasonChipText: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: colors.error,
    },
    reasonChipTextSelected: {
        color: 'white',
    },
    // Voice input
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: spacing.md,
    },
    inputWithMic: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.separator,
        borderRadius: 12,
        padding: spacing.sm,
        height: 100,
        textAlignVertical: 'top',
        color: colors.textPrimary,
        backgroundColor: colors.background,
    },
    micButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.primary + '40',
    },
    micButtonActive: {
        backgroundColor: colors.error,
        borderColor: colors.error,
    },
    listeningText: {
        ...typography.caption,
        color: colors.error,
        textAlign: 'center',
        marginBottom: spacing.sm,
        fontWeight: '600' as const,
    },
});
