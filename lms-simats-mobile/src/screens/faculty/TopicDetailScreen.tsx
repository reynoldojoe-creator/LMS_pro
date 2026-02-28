import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { LoadingSpinner, ScreenBackground, ModernNavBar, Card, ModernButton } from '../../components/common';
import { SampleQuestionsUploadModal } from '../../components/SampleQuestionsUploadModal';
import { TrainModelModal } from '../../components/TrainModelModal';
import { useFacultyStore } from '../../store';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<any, 'TopicDetail'>;

export const TopicDetailScreen = ({ route, navigation }: Props) => {
    const { subjectId, topicId } = route.params as { subjectId: string; topicId: string };
    const { getSubjectById, uploadTopicNotes, isUploading } = useFacultyStore();
    const subject = getSubjectById(subjectId);
    const topic = (subject?.topics || []).find(t => t.id === topicId) ||
        subject?.units.flatMap(u => u.topics || []).find(t => t.id === topicId);

    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
    const [isTrainModalVisible, setIsTrainModalVisible] = useState(false);
    const [fileListKey, setFileListKey] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedCos, setSelectedCos] = useState<{ co_id: number; weight: string }[]>([]);
    const [selectedLos, setSelectedLos] = useState<string[]>([]);
    const [showAllQuestions, setShowAllQuestions] = useState(false);

    React.useEffect(() => {
        if (subjectId && topicId) {
            useFacultyStore.getState().fetchTopicDetail(subjectId, topicId);
        }
    }, [subjectId, topicId]);

    React.useEffect(() => {
        if (topic) {
            setSelectedCos(topic.mappedCOs?.map((co: any) => ({ co_id: parseInt(co.id) || co.id, weight: co.weight || 'Moderate' })) || []);
            setSelectedLos(topic.learningOutcomes?.map(lo => lo.id) || []);
        }
    }, [topic]);

    if (!subject || !topic) {
        return (
            <ScreenBackground>
                <ModernNavBar title="Topic Details" showBack onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <Text>Topic not found</Text>
                </View>
            </ScreenBackground>
        );
    }

    const handleUploadNotes = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
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
            setTimeout(() => setFileListKey(k => k + 1), 3000);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to upload notes: ' + error.message);
        }
    };

    const handleGenerateQuestions = () => {
        navigation.navigate('QuickGenerate', { subjectId, topicId });
    };

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
        if (list.includes(id)) setList(list.filter(item => item !== id));
        else setList([...list, id]);
    };

    const setCOWeight = (id: number, weight: string) => {
        if (weight === 'None') {
            setSelectedCos(selectedCos.filter(c => c.co_id !== id));
        } else {
            const existing = selectedCos.find(c => c.co_id === id);
            if (existing) {
                setSelectedCos(selectedCos.map(c => c.co_id === id ? { ...c, weight } : c));
            } else {
                setSelectedCos([...selectedCos, { co_id: id, weight }]);
            }
        }
    };

    const getWeightColor = (weight: string) => {
        switch (weight) {
            case 'High': return '#E53935'; // Red
            case 'Moderate': return '#F5A623'; // Orange
            case 'Low': return '#4A90E2'; // Blue
            default: return colors.textSecondary;
        }
    };

    return (
        <ScreenBackground>
            <ModernNavBar
                title="Topic Details"
                showBack
                onBack={() => navigation.goBack()}
                rightButton={
                    <TouchableOpacity onPress={() => isEditing ? handleSaveMappings() : setIsEditing(true)}>
                        <Text style={styles.navText}>{isEditing ? 'Save' : 'Edit'}</Text>
                    </TouchableOpacity>
                }
            />

            <ScrollView contentContainerStyle={styles.content}>
                <Card title="Overview" style={styles.card}>
                    <Text style={styles.topicName}>{topic.name}</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>{topic.questionCount || 0} Qs • {topic.mappedCOs?.length || 0} COs • {topic.learningOutcomes?.length || 0} LOs</Text>
                    </View>
                </Card>

                {/* Actions Grid */}
                {!isEditing && (
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity style={styles.actionCard} onPress={handleUploadNotes}>
                            <Ionicons name="document-text" size={32} color="#4A90E2" />
                            <Text style={styles.actionTitle}>Upload Notes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={() => setIsUploadModalVisible(true)}>
                            <Ionicons name="albums" size={32} color="#F5A623" />
                            <Text style={styles.actionTitle}>Samples</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={() => setIsTrainModalVisible(true)}>
                            <Ionicons name="construct" size={32} color="#9013FE" />
                            <Text style={styles.actionTitle}>Train Model</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={handleGenerateQuestions}>
                            <Ionicons name="flash" size={32} color="#50E3C2" />
                            <Text style={styles.actionTitle}>Generate</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Generated Questions Section */}
                {!isEditing && (topic.questions && topic.questions.length > 0) && (
                    <Card title={`Generated Questions (${topic.questions.length})`} style={styles.card}>
                        {(showAllQuestions ? topic.questions : topic.questions.slice(0, 5)).map((q: any, index: number) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.questionItem}
                                onPress={() => navigation.navigate('QuestionPreview', {
                                    question: q,
                                    subjectId: subjectId,
                                    topicId: topicId,
                                    questionId: q.id
                                })}
                            >
                                <Text style={styles.questionText} numberOfLines={4}>{q.questionText}</Text>
                                <View style={styles.questionMeta}>
                                    <Text style={styles.metaTag}>{q.questionType?.toUpperCase()}</Text>
                                    <Text style={styles.metaTag}>{q.marks} Marks</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                        {topic.questions.length > 5 && (
                            <TouchableOpacity onPress={() => setShowAllQuestions(!showAllQuestions)}>
                                <Text style={styles.moreText}>
                                    {showAllQuestions ? 'Show less' : `+${topic.questions.length - 5} more questions...`}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </Card>
                )}

                {/* Outcomes Section */}
                <Card title="Course Outcomes" style={styles.card}>
                    {isEditing ? (
                        subject.courseOutcomes?.map((co: any) => {
                            const selectedWeight = selectedCos.find(c => c.co_id === co.id)?.weight || 'None';
                            return (
                                <View key={co.id} style={styles.coMappingContainer}>
                                    <View style={styles.listItemContent}>
                                        <Text style={styles.outcomeCode}>{co.code}</Text>
                                        <Text style={styles.outcomeDesc}>{co.description}</Text>
                                    </View>
                                    <View style={styles.weightSelector}>
                                        {['None', 'Low', 'Moderate', 'High'].map(weight => (
                                            <TouchableOpacity
                                                key={weight}
                                                style={[
                                                    styles.weightOption,
                                                    selectedWeight === weight && styles.weightSelected
                                                ]}
                                                onPress={() => setCOWeight(co.id, weight)}
                                            >
                                                <Text style={{
                                                    fontSize: 12,
                                                    color: selectedWeight === weight ? 'white' : colors.textSecondary,
                                                    fontWeight: selectedWeight === weight ? 'bold' : 'normal'
                                                }}>{weight}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        topic.mappedCOs?.map((co: any) => (
                            <View key={co.id} style={styles.listItem}>
                                <View style={[styles.bullet, { backgroundColor: getWeightColor(co.weight) }]} />
                                <View style={styles.listItemContent}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={styles.outcomeCode}>{co.code}</Text>
                                        <View style={{ backgroundColor: getWeightColor(co.weight) + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                            <Text style={{ fontSize: 10, color: getWeightColor(co.weight), fontWeight: 'bold' }}>{co.weight || 'Moderate'}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.outcomeDesc}>{co.description}</Text>
                                </View>
                            </View>
                        ))
                    )}
                    {!isEditing && (!topic.mappedCOs || topic.mappedCOs.length === 0) && <Text style={styles.emptyText}>No mapped COs</Text>}
                </Card>

                <Card title="Learning Outcomes" style={styles.card}>
                    {isEditing ? (
                        (subject.learningOutcomes || []).map(lo => {
                            const isSelected = selectedLos.includes(lo.id);
                            return (
                                <TouchableOpacity key={lo.id} style={styles.listItem} onPress={() => toggleSelection(lo.id, selectedLos, setSelectedLos)}>
                                    <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={24} color={colors.primary} />
                                    <View style={styles.listItemContent}>
                                        <Text style={styles.outcomeCode}>{lo.code}</Text>
                                        <Text style={styles.outcomeDesc}>{lo.description}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        topic.learningOutcomes?.map(lo => (
                            <View key={lo.id} style={styles.listItem}>
                                <View style={styles.bullet} />
                                <View style={styles.listItemContent}>
                                    <Text style={styles.outcomeCode}>{lo.code}</Text>
                                    <Text style={styles.outcomeDesc}>{lo.description}</Text>
                                </View>
                            </View>
                        ))
                    )}
                    {!isEditing && (!topic.learningOutcomes || topic.learningOutcomes.length === 0) && <Text style={styles.emptyText}>No mapped LOs</Text>}
                </Card>

                {/* Uploaded Files */}
                <Card title="Uploaded Materials" style={styles.card}>
                    <FileList topicId={topicId} subjectId={subjectId} key={fileListKey} />
                </Card>

                <View style={{ height: 40 }} />
            </ScrollView>

            <SampleQuestionsUploadModal
                visible={isUploadModalVisible}
                onClose={() => {
                    setIsUploadModalVisible(false);
                    // Refresh immediately
                    setFileListKey(k => k + 1);
                    // Background processing takes time — poll again after 5s and 10s
                    setTimeout(() => setFileListKey(k => k + 1), 5000);
                    setTimeout(() => setFileListKey(k => k + 1), 10000);
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
                onSuccess={() => useFacultyStore.getState().fetchTopicDetail(subjectId, topicId)}
            />

            {/* Uploading Overlay Modal */}
            <Modal transparent visible={isUploading} animationType="fade">
                <View style={[styles.center, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <View style={{ backgroundColor: colors.surface, padding: 30, borderRadius: 16, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 15 }} />
                        <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                            Uploading & Processing...
                        </Text>
                        <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 5, textAlign: 'center' }}>
                            Please wait while we index the file for RAG.
                        </Text>
                    </View>
                </View>
            </Modal>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    coMappingContainer: {
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.separator,
        borderRadius: 8,
        marginBottom: spacing.xs,
        backgroundColor: colors.surface,
    },
    coDescription: {
        ...typography.body,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    weightSelector: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: 8,
        padding: 4,
        justifyContent: 'space-between',
    },
    weightOption: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignItems: 'center',
        flex: 1,
    },
    weightSelected: {
        backgroundColor: colors.primary,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { paddingBottom: spacing.xl },
    navText: { color: colors.primary, fontWeight: '600', fontSize: 17 },
    topicName: { ...typography.h3, color: colors.textPrimary, textAlign: 'center', marginBottom: 5 },
    metaRow: { flexDirection: 'row', justifyContent: 'center', alignSelf: 'center', marginBottom: 10 },
    metaText: { color: colors.textSecondary, fontSize: 13 },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, justifyContent: 'space-between' },
    actionCard: { width: '48%', backgroundColor: colors.surface, padding: 15, borderRadius: 16, alignItems: 'center', marginBottom: 10, shadowColor: 'black', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, borderWidth: 1, borderColor: colors.border },
    actionTitle: { marginTop: 8, fontWeight: '600', color: colors.textPrimary, fontSize: 13 },
    listItem: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider, alignItems: 'center' },
    listItemContent: { flex: 1, marginLeft: 10 },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textSecondary, marginTop: 6 },
    outcomeCode: { fontWeight: '600', fontSize: 12, color: colors.textPrimary },
    outcomeDesc: { fontSize: 13, color: colors.textSecondary },
    emptyText: { fontStyle: 'italic', color: colors.textSecondary, textAlign: 'center', marginTop: 10 },
    questionItem: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
    questionText: { fontSize: 14, color: colors.textPrimary, marginBottom: 4 },
    questionMeta: { flexDirection: 'row', gap: 5 },
    metaTag: { fontSize: 10, color: colors.textSecondary, backgroundColor: colors.systemGray6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    moreText: { textAlign: 'center', color: colors.primary, marginTop: 10, fontSize: 12 },
    fileListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
    fileIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    fileName: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
    fileMeta: { fontSize: 11, color: colors.textSecondary },
    card: { marginBottom: spacing.md },
});

const FileList = ({ subjectId, topicId }: { subjectId: string, topicId: string }) => {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        loadFiles();
    }, [subjectId, topicId]);

    const loadFiles = async () => {
        setLoading(true);
        try {
            // Fetch both general files and individual sample files in parallel
            const [generalFiles, sampleFiles] = await Promise.all([
                useFacultyStore.getState().fetchTopicFiles(subjectId, topicId),
                useFacultyStore.getState().fetchTopicSampleFiles(subjectId, topicId),
            ]);

            // Filter out the aggregated "samples" entry from general files
            const nonSampleFiles = (generalFiles || []).filter((f: any) => f.type !== 'samples');

            // Convert individual sample files into the same format as other files
            const individualSampleFiles = (sampleFiles || []).map((sf: any) => ({
                name: sf.name || 'Sample Questions',
                type: 'samples',
                size: 0,
                uploaded_at: sf.uploaded_at || new Date().toISOString(),
                details: `${sf.count} questions indexed`,
                sampleFileId: sf.id, // Keep the ID for training selection
            }));

            setFiles([...nonSampleFiles, ...individualSampleFiles]);
        } catch (e) {
            console.warn("Failed to load topic files", e);
            setFiles([]);
        }
        setLoading(false);
    };

    if (loading) return <Text style={{ padding: 10, color: '#888' }}>Loading files...</Text>;
    if (files.length === 0) return <Text style={{ padding: 10, color: '#888', fontStyle: 'italic', textAlign: 'center' }}>No files uploaded yet.</Text>;

    const getIcon = (type: string) => {
        switch (type) {
            case 'syllabus': return '📄';
            case 'notes': return '📘';
            case 'samples': return '📝';
            default: return '📁';
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'syllabus': return '#E3F2FD';
            case 'notes': return '#FFF3E0';
            case 'samples': return '#E8F5E9';
            default: return '#F5F5F5';
        }
    };

    const handleDelete = (file: any) => {
        Alert.alert(
            "Delete File",
            `Are you sure you want to delete ${decodeURIComponent(file.name)}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        try {
                            const fileNameToPass = file.type === 'samples' ? (file.sampleFileId || file.name) : file.name;
                            await useFacultyStore.getState().deleteTopicFile(subjectId, topicId, file.type, fileNameToPass);
                            loadFiles(); // Refresh list
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete file.");
                        }
                    }
                }
            ]
        );
    };

    const handleView = (file: any) => {
        Alert.alert("View File", `Viewing for ${file.type} files is coming soon.`);
    };

    return (
        <View>
            {files.map((file, index) => (
                <View key={index} style={styles.fileListItem}>
                    <View style={[styles.fileIcon, { backgroundColor: getColor(file.type) }]}>
                        <Text style={{ fontSize: 16 }}>{getIcon(file.type)}</Text>
                    </View>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.fileName} numberOfLines={1}>{decodeURIComponent(file.name)}</Text>
                        <Text style={styles.fileMeta}>
                            {file.details || `${file.type.toUpperCase()} • ${new Date(file.uploaded_at).toLocaleDateString()}`}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 15 }}>
                        <TouchableOpacity onPress={() => handleView(file)}>
                            <Ionicons name="eye-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(file)}>
                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </View>
    );
};
