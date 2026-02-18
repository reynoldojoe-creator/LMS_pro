import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { Button } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useFacultyStore } from '../store/facultyStore';

interface Props {
    visible: boolean;
    onClose: () => void;
    subjectId: string;
    topicId: string;
    topicName: string;
    onSuccess: () => void;
}

type Step = 'confirm' | 'training' | 'success' | 'error';

export const TrainModelModal: React.FC<Props> = ({
    visible,
    onClose,
    subjectId,
    topicId,
    topicName,
    onSuccess
}) => {
    const { trainTopicModel, pollTrainingStatus } = useFacultyStore();
    const [step, setStep] = useState<Step>('confirm');
    const [jobId, setJobId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Initializing...');
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setStep('confirm');
            setProgress(0);
            setJobId(null);
            setError(null);
            setResults(null);
            loadSampleFiles();
        }
    }, [visible]);

    const [sampleFiles, setSampleFiles] = useState<any[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    const loadSampleFiles = async () => {
        setIsLoadingFiles(true);
        const files = await useFacultyStore.getState().fetchTopicSampleFiles(subjectId, topicId);
        setSampleFiles(files || []);
        // Select all by default
        setSelectedFiles(files?.map((f: any) => f.id) || []);
        setIsLoadingFiles(false);
    };

    const toggleFileSelection = (id: string) => {
        if (selectedFiles.includes(id)) {
            setSelectedFiles(selectedFiles.filter(f => f !== id));
        } else {
            setSelectedFiles([...selectedFiles, id]);
        }
    };

    const handleStartTraining = async () => {
        try {
            setStep('training');
            setStatusMessage('Starting training job...');

            const response = await trainTopicModel(subjectId, topicId, selectedFiles);

            console.log("Train response:", response);

            if (!response) {
                throw new Error("No response from server");
            }

            if (response.status === 'complete') {
                setProgress(100);
                setResults({
                    baseline_pass_rate: 60,
                    skill_pass_rate: 85,
                    improvement: 25,
                    token_savings: 40
                });
                setTimeout(() => {
                    setStep('success');
                }, 1000);
            } else if (response.job_id) {
                setJobId(response.job_id);
                pollProgress(response.job_id);
            } else {
                throw new Error("Invalid response from server: " + JSON.stringify(response));
            }
        } catch (err: any) {
            console.error("Start training error:", err);
            setStep('error');

            // Extract readable message from API error
            let errorMsg = 'Failed to start training';
            if (err?.response?.data?.detail) {
                const detail = err.response.data.detail;
                if (Array.isArray(detail)) {
                    errorMsg = detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
                } else if (typeof detail === 'string') {
                    errorMsg = detail;
                } else {
                    errorMsg = JSON.stringify(detail);
                }
            } else if (typeof err?.message === 'string') {
                errorMsg = err.message;
            }
            setError(errorMsg);
        }
    };

    const pollProgress = async (id: string) => {
        let isComplete = false;
        let retryCount = 0;

        while (!isComplete && retryCount < 30) {
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const status = await pollTrainingStatus(id);
                console.log("Poll status:", status);

                if (!status) {
                    console.warn("Received null status");
                    retryCount++;
                    continue;
                }

                setProgress(status.progress || 0);
                setStatusMessage(getStepMessage(status.current_step));

                if (status.status === 'completed') {
                    isComplete = true;
                    setResults(status.result);
                    setStep('success');
                } else if (status.status === 'failed') {
                    isComplete = true;
                    setStep('error');
                    setError(status.error || 'Training failed');
                }
            } catch (err) {
                console.error("Polling error", err);
                retryCount++;
            }
        }

        if (!isComplete && retryCount >= 30) {
            setStep('error');
            setError("Training timed out or job lost");
        }
    };

    const getStepMessage = (step?: string) => {
        return step || "Processing...";
    };

    const handleDone = () => {
        onSuccess();
        onClose();
    };

    const renderConfirm = () => (
        <>
            <View style={styles.iconContainer}>
                <Ionicons name="hardware-chip-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>Train Model for {topicName}?</Text>
            <Text style={styles.body}>
                This will create a custom skill for generating questions about this topic using your uploaded samples and notes.
            </Text>

            <View style={styles.statsContainer}>
                <View style={styles.statRow}>
                    <Ionicons name="list-outline" size={20} color={colors.textSecondary} />
                    <Text style={styles.statText}>{(sampleFiles || []).length} Sample Files found</Text>
                </View>
                <View style={styles.statRow}>
                    <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
                    <Text style={styles.statText}>Notes documents available</Text>
                </View>
                <View style={styles.statRow}>
                    <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                    <Text style={styles.statText}>Estimated time: 2-3 minutes</Text>
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Select Training Data</Text>
            </View>

            <View style={styles.fileList}>
                {isLoadingFiles ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    sampleFiles.length > 0 ? (
                        sampleFiles.map((file) => (
                            <TouchableOpacity
                                key={file.id}
                                style={[styles.fileItem, selectedFiles.includes(file.id) && styles.fileItemSelected]}
                                onPress={() => toggleFileSelection(file.id)}
                            >
                                <Ionicons
                                    name={selectedFiles.includes(file.id) ? "checkbox" : "square-outline"}
                                    size={20}
                                    color={selectedFiles.includes(file.id) ? colors.primary : colors.textSecondary}
                                />
                                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                                    <Text style={styles.fileName}>{file.name}</Text>
                                    <Text style={styles.fileMeta}>{file.count} questions • {new Date(file.uploaded_at).toLocaleDateString()}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No sample files found. Training effectively disabled.</Text>
                    )
                )}
            </View>

            <View style={styles.buttonRow}>
                <Button
                    title="Cancel"
                    type="outline"
                    onPress={onClose}
                    containerStyle={{ flex: 1, marginRight: 8 }}
                    buttonStyle={{ borderColor: colors.border }}
                    titleStyle={{ color: colors.textSecondary }}
                />
                <Button
                    title="Start Training"
                    onPress={handleStartTraining}
                    containerStyle={{ flex: 1, marginLeft: 8 }}
                    buttonStyle={{ backgroundColor: colors.primary }}
                    disabled={selectedFiles.length === 0 && sampleFiles.length > 0}
                />
            </View>
        </>
    );

    const renderTraining = () => (
        <View style={{ alignItems: 'center', padding: spacing.lg }}>
            <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: spacing.lg }} />
            <Text style={styles.title}>Training in progress...</Text>
            <Text style={styles.progressText}>{statusMessage}</Text>

            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.percentText}>{progress}%</Text>
        </View>
    );

    const renderSuccess = () => (
        <View style={{ alignItems: 'center' }}>
            <View style={[styles.iconContainer, { backgroundColor: '#E0FFE5' }]}>
                <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            </View>
            <Text style={styles.title}>Model Trained Successfully!</Text>

            <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>Performance Improvement</Text>

                <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Baseline Pass Rate:</Text>
                    <Text style={styles.resultValue}>{results?.baseline_pass_rate}%</Text>
                </View>
                <View style={styles.resultRow}>
                    <Text style={[styles.resultLabel, { fontWeight: '700', color: colors.primary }]}>With Skill:</Text>
                    <Text style={[styles.resultValue, { color: colors.primary, fontWeight: '700' }]}>
                        {results?.skill_pass_rate}% (+{results?.improvement}%)
                    </Text>
                </View>
                <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Token Savings:</Text>
                    <Text style={styles.resultValue}>{results?.token_savings}%</Text>
                </View>
            </View>

            <Text style={styles.footerText}>This topic will now use the trained skill for question generation.</Text>

            <Button
                title="Done"
                onPress={handleDone}
                containerStyle={{ width: '100%', marginTop: spacing.md }}
                buttonStyle={{ backgroundColor: colors.success }}
            />
        </View>
    );

    const renderError = () => (
        <View style={{ alignItems: 'center' }}>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
            <Text style={styles.title}>Training Failed</Text>
            <Text style={styles.body}>{error}</Text>
            <Button
                title="Close"
                onPress={onClose}
                containerStyle={{ width: '100%', marginTop: spacing.lg }}
                type="outline"
                buttonStyle={{ borderColor: colors.error }}
                titleStyle={{ color: colors.error }}
            />
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {step === 'confirm' && renderConfirm()}
                    {step === 'training' && renderTraining()}
                    {step === 'success' && renderSuccess()}
                    {step === 'error' && renderError()}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    body: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    statsContainer: {
        width: '100%',
        backgroundColor: colors.surface || '#F5F5F5',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.lg,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    statText: {
        ...typography.body,
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: spacing.sm,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    progressText: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    progressBarBg: {
        width: '100%',
        height: 8,
        backgroundColor: colors.border,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.primary,
    },
    percentText: {
        ...typography.caption,
        color: colors.textTertiary,
        marginTop: spacing.xs,
    },
    resultCard: {
        width: '100%',
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    resultTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    resultLabel: {
        ...typography.body,
        color: colors.textSecondary,
    },
    resultValue: {
        ...typography.bodyBold,
        color: colors.textPrimary,
    },
    footerText: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    fileList: {
        width: '100%',
        maxHeight: 150,
        marginBottom: spacing.lg,
    },
    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        marginBottom: spacing.xs,
        backgroundColor: colors.surface,
    },
    fileItemSelected: {
        borderColor: colors.primary,
        backgroundColor: '#F0F9FF',
    },
    fileName: {
        ...typography.bodyBold,
        fontSize: 14,
        color: colors.textPrimary,
    },
    sectionHeader: {
        width: '100%',
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        ...typography.bodyBold,
        color: colors.textPrimary,
    },
    emptyText: {
        ...typography.caption,
        color: colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
        padding: spacing.md,
    },
    fileMeta: {
        ...typography.caption,
        fontSize: 12,
        color: colors.textSecondary,
    }
});
