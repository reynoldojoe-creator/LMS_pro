import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Button } from 'react-native-elements';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing} from '../theme';
import { useFacultyStore } from '../store/facultyStore';

interface Props {
    visible: boolean;
    onClose: () => void;
    subjectId: string;
    topicId: string;
    topicName: string;
}

type QuestionType = 'MCQ' | 'Essay' | 'Short';

interface QuestionTypeOption {
    type: QuestionType;
    title: string;
    description: string;
    icon: string;
}

const QUESTION_TYPES: QuestionTypeOption[] = [
    {
        type: 'MCQ',
        title: 'Multiple Choice Questions',
        description: 'Upload CSV with question, options, answer, and outcome mapping.',
        icon: 'list-circle-outline'
    },
    {
        type: 'Essay',
        title: 'Essay / Long Answer',
        description: 'Upload CSV/PDF with descriptive questions and evaluation criteria.',
        icon: 'document-text-outline'
    },
    {
        type: 'Short',
        title: 'Short Notes',
        description: 'Upload CSV/PDF with brief questions and key points.',
        icon: 'create-outline'
    }
];

export const SampleQuestionsUploadModal: React.FC<Props> = ({
    visible,
    onClose,
    subjectId,
    topicId,
    topicName
}) => {
    const { uploadSampleQuestions, isUploading, downloadSampleTemplate } = useFacultyStore();
    const [selectedType, setSelectedType] = useState<QuestionType | null>(null);
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

    const handleSelectType = (type: QuestionType) => {
        if (selectedType === type) {
            setSelectedType(null); // Toggle off
        } else {
            setSelectedType(type);
            setSelectedFile(null); // Reset file when changing type
        }
    };

    const handlePickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'text/csv',
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                ],
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedFile(result.assets[0]);
            }
        } catch (err) {
            console.error('File picker error:', err);
            Alert.alert('Error', 'Failed to pick file');
        }
    };

    const handleUpload = async () => {
        if (!selectedType || !selectedFile) return;

        try {
            await uploadSampleQuestions(subjectId, topicId, selectedType, selectedFile);
            Alert.alert('Success', `${selectedType} questions uploaded successfully!`);
            onClose();
            setSelectedType(null);
            setSelectedFile(null);
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'Failed to upload questions. Please try again.');
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Upload Sample Questions</Text>
                            <Text style={styles.subtitle}>{topicName}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Warning Banner */}
                    <View style={styles.warningBanner}>
                        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                        <Text style={styles.warningText}>
                            OBE Question Upload - Upload questions by type with CO mapping and Learning Outcomes.
                        </Text>
                    </View>

                    <ScrollView style={styles.content}>
                        {QUESTION_TYPES.map((option) => {
                            const isExpanded = selectedType === option.type;
                            return (
                                <View key={option.type} style={[styles.card, isExpanded && styles.cardExpanded]}>
                                    <TouchableOpacity
                                        style={styles.cardHeader}
                                        onPress={() => handleSelectType(option.type)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.cardIconContainer}>
                                            <Ionicons name={option.icon as any} size={24} color={isExpanded ? colors.primary : colors.textSecondary} />
                                        </View>
                                        <View style={styles.cardHeaderContent}>
                                            <Text style={[styles.cardTitle, isExpanded && styles.activeText]}>{option.title}</Text>
                                            <Text style={styles.cardDesc}>{option.description}</Text>
                                        </View>
                                        <Ionicons
                                            name={isExpanded ? "chevron-up" : "chevron-down"}
                                            size={20}
                                            color={colors.textTertiary}
                                        />
                                    </TouchableOpacity>

                                    {isExpanded && (
                                        <View style={styles.cardBody}>
                                            <Button
                                                title={`Download ${option.type} Template`}
                                                type="outline"
                                                icon={<Ionicons name="download-outline" size={18} color={colors.success} style={{ marginRight: 8 }} />}
                                                buttonStyle={styles.templateButton}
                                                titleStyle={styles.templateButtonText}
                                                onPress={async () => {
                                                    try {
                                                        const url = await downloadSampleTemplate(option.type);
                                                        // In a real app with Expo, we'd use FileSystem.downloadAsync or Linking.openURL
                                                        // For now, simple alert or Linking
                                                        import('react-native').then(({ Linking }) => {
                                                            Linking.openURL(url).catch(err => Alert.alert('Error', 'Could not open link'));
                                                        });
                                                    } catch (e) {
                                                        Alert.alert('Error', 'Failed to get template');
                                                    }
                                                }}
                                            />

                                            <TouchableOpacity
                                                style={[styles.dropzone, selectedFile && styles.dropzoneActive]}
                                                onPress={handlePickFile}
                                            >
                                                {selectedFile ? (
                                                    <View style={styles.fileInfo}>
                                                        <Ionicons name="document-attach" size={24} color={colors.primary} />
                                                        <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                                                        <Text style={styles.fileSize}>{(selectedFile.size! / 1024).toFixed(1)} KB</Text>
                                                    </View>
                                                ) : (
                                                    <>
                                                        <Ionicons name="cloud-upload-outline" size={32} color={colors.textTertiary} />
                                                        <Text style={styles.dropzoneText}>Tap to select file</Text>
                                                        <Text style={styles.dropzoneSubtext}>CSV, PDF, DOCX supported</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>

                                            <Button
                                                title={isUploading ? "Uploading..." : `Upload ${option.type} Questions`}
                                                disabled={!selectedFile || isUploading}
                                                onPress={handleUpload}
                                                buttonStyle={styles.uploadButton}
                                                disabledStyle={styles.uploadButtonDisabled}
                                            />
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '90%',
        paddingBottom: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: 2,
    },
    closeButton: {
        padding: spacing.xs,
    },
    warningBanner: {
        flexDirection: 'row',
        backgroundColor: colors.primary + '15', // 15% opacity
        padding: spacing.md,
        alignItems: 'center',
    },
    warningText: {
        ...typography.caption,
        color: colors.primary,
        marginLeft: spacing.sm,
        flex: 1,
    },
    content: {
        padding: spacing.md,
    },
    card: {
        backgroundColor: colors.surface,
: 16,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    cardExpanded: {
        borderColor: colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    cardIconContainer: {
        width: 40,
        height: 40,
: 20,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    cardHeaderContent: {
        flex: 1,
    },
    cardTitle: {
        ...typography.h3,
        fontSize: 16,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    activeText: {
        color: colors.primary,
        fontWeight: '600',
    },
    cardDesc: {
        ...typography.caption,
        color: colors.textTertiary,
    },
    cardBody: {
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
    },
    templateButton: {
        borderColor: colors.success,
        borderWidth: 1,
        backgroundColor: 'transparent',
        marginBottom: spacing.md,
: 12,
    },
    templateButtonText: {
        color: colors.success,
        fontSize: 14,
    },
    dropzone: {
        borderWidth: 2,
        borderColor: colors.border,
        borderStyle: 'dashed',
: 12,
        padding: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        backgroundColor: colors.surface,
    },
    dropzoneActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '05',
        borderStyle: 'solid',
    },
    dropzoneText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.sm,
        fontWeight: '500',
    },
    dropzoneSubtext: {
        ...typography.caption,
        color: colors.textTertiary,
        marginTop: 2,
    },
    fileInfo: {
        alignItems: 'center',
    },
    fileName: {
        ...typography.body,
        color: colors.textPrimary,
        marginTop: spacing.sm,
        fontWeight: '500',
    },
    fileSize: {
        ...typography.caption,
        color: colors.textTertiary,
    },
    uploadButton: {
        backgroundColor: colors.primary,
: 12,
        height: 48,
    },
    uploadButtonDisabled: {
        backgroundColor: colors.disabled,
    }
});
