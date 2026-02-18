import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { LoadingSpinner, Header } from '../../components/common';
import { SampleQuestionsUploadModal } from '../../components/SampleQuestionsUploadModal';
import { TrainModelModal } from '../../components/TrainModelModal';
import { useFacultyStore } from '../../store';

type Props = NativeStackScreenProps<any, 'TopicDetail'>;

export const TopicDetailScreen = ({ route, navigation }: Props) => {
    const { subjectId, topicId } = route.params as { subjectId: string; topicId: string };
    const { getSubjectById, uploadTopicNotes } = useFacultyStore();
    const subject = getSubjectById(subjectId);
    const topic = (subject?.topics || []).find(t => t.id === topicId) ||
        subject?.units.flatMap(u => u.topics || []).find(t => t.id === topicId);

    const [isGenerating, setIsGenerating] = useState(false);

    const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
    const [isTrainModalVisible, setIsTrainModalVisible] = useState(false);
    const [fileListKey, setFileListKey] = useState(0);

    if (!subject || !topic) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Topic not found</Text>
            </SafeAreaView>
        );
    }

    // Fetch details on mount
    React.useEffect(() => {
        if (subjectId && topicId) {
            useFacultyStore.getState().fetchTopicDetail(subjectId, topicId);
        }
    }, [subjectId, topicId]);

    const handleUploadNotes = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'text/plain',
                    'text/csv'
                ],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            await uploadTopicNotes(subjectId, topicId, {
                uri: file.uri,
                name: file.name,
                mimeType: file.mimeType
            });
            Alert.alert('Success', 'Notes uploaded. Processing in background.');
            // Refresh file list after background processing delay
            setTimeout(() => setFileListKey(k => k + 1), 3000);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to upload notes: ' + error.message);
        }
    };

    const handleGenerateQuestions = () => {
        navigation.navigate('QuickGenerate', {
            subjectId,
            topicId,
            // Pass simple counts/flags if needed, but store has detail now
        });
    };

    const handleUploadSampleQuestions = () => {
        setIsUploadModalVisible(true);
    };

    const handleTrainModel = () => {
        setIsTrainModalVisible(true);
    };

    const [isEditing, setIsEditing] = useState(false);
    const [selectedCos, setSelectedCos] = useState<string[]>([]);
    const [selectedLos, setSelectedLos] = useState<string[]>([]);

    React.useEffect(() => {
        if (topic) {
            setSelectedCos(topic.mappedCOs?.map(co => co.id) || []);
            setSelectedLos(topic.learningOutcomes?.map(lo => lo.id) || []);
        }
    }, [topic]);

    const handleSaveMappings = async () => {
        try {
            await useFacultyStore.getState().mapTopicOutcomes(subjectId, topicId, selectedCos, selectedLos);
            setIsEditing(false);
            Alert.alert('Success', 'Outcomes mapped successfully');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const toggleSelection = (id: string, list: string[], setList: (l: string[]) => void) => {
        if (list.includes(id)) {
            setList(list.filter(item => item !== id));
        } else {
            setList([...list, id]);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <Header
                title="Topic Details"
                onBack={() => navigation.goBack()}
                rightAction={
                    <TouchableOpacity onPress={() => isEditing ? handleSaveMappings() : setIsEditing(true)}>
                        <Text style={[styles.backText, { fontWeight: '600' }]}>
                            {isEditing ? 'Save' : 'Edit'}
                        </Text>
                    </TouchableOpacity>
                }
            />

            <ScrollView style={styles.content}>
                <View style={styles.topicCard}>
                    <Text style={styles.topicName}>{topic.name}</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>{topic.questionCount || 0} Questions</Text>
                        <Text style={styles.metaText}>•</Text>
                        <Text style={styles.metaText}>{(topic.mappedCOs || []).length} COs</Text>
                        <Text style={styles.metaText}>•</Text>
                        <Text style={styles.metaText}>{(topic.learningOutcomes || []).length} LOs</Text>
                        <Text style={styles.metaText}>•</Text>
                        <Text style={styles.metaText}>{(topic.sampleQuestions || []).length} Samples</Text>
                    </View>
                </View>

                {/* Generated Questions Section */}
                {!isEditing && (topic.questions && topic.questions.length > 0) && (
                    <View style={[styles.infoSection, { marginBottom: spacing.lg }]}>
                        <Text style={styles.sectionTitle}>Generated Questions ({topic.questions.length})</Text>
                        <View style={styles.cardList}>
                            {topic.questions.map((q: any, index: number) => (
                                <View key={index} style={styles.cardListItem}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.questionText}>{q.questionText}</Text>
                                        <View style={styles.questionMeta}>
                                            <Text style={styles.metaTag}>{q.questionType?.toUpperCase()}</Text>
                                            <Text style={styles.metaTag}>{q.difficulty?.toUpperCase()}</Text>
                                            <Text style={styles.metaTag}>{q.marks} Marks</Text>
                                            {q.CO && <Text style={styles.metaTag}>CO{q.CO}</Text>}
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Actions Grid - Hide when editing to focus on mapping */}
                {!isEditing && (
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity style={styles.actionCard} onPress={handleUploadNotes} activeOpacity={0.8}>
                            <View style={[styles.iconContainer, { backgroundColor: '#E0F2FF' }]}>
                                <Text style={styles.icon}>📄</Text>
                            </View>
                            <Text style={styles.actionTitle}>Upload Notes</Text>
                            <Text style={styles.actionDesc}>Add study materials</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={handleUploadSampleQuestions} activeOpacity={0.8}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FFF2E0' }]}>
                                <Text style={styles.icon}>📝</Text>
                            </View>
                            <Text style={styles.actionTitle}>Sample Questions</Text>
                            <Text style={styles.actionDesc}>Upload previous Qs</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>

                        {/* New Train Model Card */}
                        <TouchableOpacity style={styles.actionCardFull} onPress={handleTrainModel} activeOpacity={0.8}>
                            <View style={[styles.iconContainer, { backgroundColor: '#FFF5E0' }]}>
                                <Text style={styles.icon}>🤖</Text>
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>Train Model <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700' }}>BETA</Text></Text>
                                <Text style={styles.actionDesc}>Improve question generation for this topic</Text>
                            </View>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCardFull} onPress={handleGenerateQuestions} activeOpacity={0.8}>
                            <View style={[styles.iconContainer, { backgroundColor: '#E0FFE5' }]}>
                                <Text style={styles.icon}>⚡️</Text>
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>Generate Questions</Text>
                                <Text style={styles.actionDesc}>Create new questions for this topic</Text>
                            </View>
                            {isGenerating ? <LoadingSpinner /> : <Text style={styles.chevron}>›</Text>}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Outcomes Section */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Course Outcomes</Text>
                    {isEditing ? (
                        <View style={styles.cardList}>
                            {subject.courseOutcomes?.map(co => {
                                const isSelected = selectedCos.includes(co.id);
                                return (
                                    <TouchableOpacity
                                        key={co.id}
                                        style={[styles.cardListItem, isSelected && { backgroundColor: '#F0F9FF' }]}
                                        onPress={() => toggleSelection(co.id, selectedCos, setSelectedCos)}
                                    >
                                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                            {isSelected && <Text style={styles.checkmark}>✓</Text>}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.outcomeCode}>{co.code}</Text>
                                            <Text style={styles.outcomeDesc}>{co.description}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : (
                        (topic.mappedCOs && topic.mappedCOs.length > 0) ? (
                            <View style={styles.cardList}>
                                {topic.mappedCOs.map(co => (
                                    <View key={co.id} style={styles.cardListItem}>
                                        <Text style={styles.bulletPoint}>•</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.outcomeCode}>{co.code}</Text>
                                            <Text style={styles.outcomeDesc}>{co.description}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>No Course Outcomes mapped.</Text>
                        )
                    )}
                </View>

                <View style={[styles.infoSection, { marginBottom: spacing.xl }]}>
                    <Text style={styles.sectionTitle}>Learning Outcomes</Text>
                    {isEditing ? (
                        <View style={styles.cardList}>
                            {(subject.learningOutcomes || []).map(lo => {
                                const isSelected = selectedLos.includes(lo.id);
                                return (
                                    <TouchableOpacity
                                        key={lo.id}
                                        style={[styles.cardListItem, isSelected && { backgroundColor: '#F0F9FF' }]}
                                        onPress={() => toggleSelection(lo.id, selectedLos, setSelectedLos)}
                                    >
                                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                            {isSelected && <Text style={styles.checkmark}>✓</Text>}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.outcomeCode}>{lo.code}</Text>
                                            <Text style={styles.outcomeDesc}>{lo.description}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : (
                        (topic.learningOutcomes && topic.learningOutcomes.length > 0) ? (
                            <View style={styles.cardList}>
                                {topic.learningOutcomes.map(lo => (
                                    <View key={lo.id} style={styles.cardListItem}>
                                        <Text style={styles.bulletPoint}>•</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.outcomeCode}>{lo.code}</Text>
                                            <Text style={styles.outcomeDesc}>{lo.description}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>No Learning Outcomes mapped.</Text>
                        )
                    )}
                </View>

                {/* Uploaded Files Section */}
                <View style={[styles.infoSection, { marginBottom: spacing.xl }]}>
                    <Text style={styles.sectionTitle}>Uploaded Materials</Text>
                    <FileList topicId={topicId} subjectId={subjectId} key={fileListKey} />
                </View>
            </ScrollView>

            <SampleQuestionsUploadModal
                visible={isUploadModalVisible}
                onClose={() => {
                    setIsUploadModalVisible(false);
                    // Refresh file list after background processing delay
                    setTimeout(() => setFileListKey(k => k + 1), 3000);
                }}
                subjectId={subjectId}
                topicId={topicId}
                topicName={topic.name}
            />

            <TrainModelModal
                visible={isTrainModalVisible}
                onClose={() => setIsTrainModalVisible(false)}
                subjectId={subjectId}
                topicId={topicId}
                topicName={topic.name}
                onSuccess={() => {
                    // refresh topic
                    useFacultyStore.getState().fetchTopicDetail(subjectId, topicId);
                }}
            />
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    // Removed old header styles
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
        marginTop: -4,
    },
    backText: {
        ...typography.body,
        color: colors.primary,
        fontSize: 17,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    topicCard: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.lg,
        shadowColor: colors.shadowDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    unitLabel: {
        ...typography.caption,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.xs,
    },
    topicName: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    metaText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    actionCard: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        width: '48%', // Approx half width
        shadowColor: colors.shadowDark,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    actionCardFull: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: colors.shadowDark,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    icon: {
        fontSize: 20,
    },
    actionContent: {
        flex: 1,
        marginLeft: spacing.md,
    },
    actionTitle: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        fontSize: 15,
    },
    actionDesc: {
        ...typography.caption,
        color: colors.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    chevron: {
        fontSize: 20,
        color: colors.iosGray3,
        fontWeight: '600',
        position: 'absolute',
        right: spacing.md,
        top: '50%',
        marginTop: -12,
    },
    infoSection: {
        marginTop: spacing.md,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    loItem: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
    },
    loBadge: {
        backgroundColor: colors.iosGray6,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: spacing.md,
        height: 24,
        justifyContent: 'center',
    },
    loCode: {
        ...typography.caption,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    loDesc: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
        fontSize: 14,
    },
    // New Styles for CO/LO Cards
    cardList: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    cardListItem: {
        flexDirection: 'row',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    bulletPoint: {
        fontSize: 16,
        color: colors.primary,
        marginRight: spacing.sm,
        marginTop: -2,
    },
    outcomeCode: {
        ...typography.caption,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    outcomeDesc: {
        ...typography.body,
        color: colors.textSecondary,
        fontSize: 14,
    },
    emptyText: {
        ...typography.body,
        color: colors.textTertiary,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.textSecondary,
        marginRight: spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    checkboxSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    checkmark: {
        color: '#FFFFFF', // colors.white not in theme? using hardcoded white
        fontSize: 12,
        fontWeight: 'bold',
    },
    fileListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
    },
    fileIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    fileInfo: {
        flex: 1,
        marginRight: spacing.sm,
    },
    fileName: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        fontSize: 14,
    },
    fileMeta: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    // New styles for questions list
    questionText: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
        fontSize: 14,
    },
    questionMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginTop: 4,
    },
    metaTag: {
        fontSize: 10,
        color: colors.textSecondary,
        backgroundColor: colors.iosGray6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
});

const FileList = ({ subjectId, topicId }: { subjectId: string, topicId: string }) => {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        loadFiles();
    }, [subjectId, topicId]);

    // Listen for focus to refresh? Or valid refresh trigger?
    // For now, simple load.

    const loadFiles = async () => {
        setLoading(true);
        // Add error handling to prevent crash if fetch fails
        try {
            const data = await useFacultyStore.getState().fetchTopicFiles(subjectId, topicId);
            setFiles(data || []);
        } catch (e) {
            console.warn("Failed to load topic files", e);
            setFiles([]);
        }
        setLoading(false);
    };

    if (loading) return <Text style={{ padding: spacing.md, color: colors.textSecondary }}>Loading files...</Text>;

    if (files.length === 0) return <Text style={styles.emptyText}>No files uploaded yet.</Text>;

    const getIcon = (type: string) => {
        switch (type) {
            case 'syllabus': return '📄';
            case 'notes': return '📘';
            case 'samples': return '❓';
            default: return '📁';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'syllabus': return '#E3F2FD'; // Blue
            case 'notes': return '#FFF3E0';    // Orange
            case 'samples': return '❓';  // Green (Bug in original? 'samples' returns '❓' in icon switch? No, wait)
            // 'samples' case in getColor in original was '#E8F5E9'
            default: return '#F5F5F5';
        }
    };

    // Fix getColor based on original logic I might have misread?
    // Original:
    // case 'samples': return '#E8F5E9';

    const getColorCorrect = (type: string) => {
        switch (type) {
            case 'syllabus': return '#E3F2FD'; // Blue
            case 'notes': return '#FFF3E0';    // Orange
            case 'samples': return '#E8F5E9';  // Green
            default: return '#F5F5F5';
        }
    };

    return (
        <View style={styles.cardList}>
            {files.map((file, index) => (
                <View key={index} style={styles.fileListItem}>
                    <View style={[styles.fileIcon, { backgroundColor: getColorCorrect(file.type) }]}>
                        <Text style={{ fontSize: 16 }}>{getIcon(file.type)}</Text>
                    </View>
                    <View style={styles.fileInfo}>
                        <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                            {decodeURIComponent(file.name)}
                        </Text>
                        <Text style={styles.fileMeta}>
                            {file.details || `${file.type.toUpperCase()} • ${new Date(file.uploaded_at).toLocaleDateString()}`}
                        </Text>
                    </View>
                </View>
            ))}
        </View>
    );
};
