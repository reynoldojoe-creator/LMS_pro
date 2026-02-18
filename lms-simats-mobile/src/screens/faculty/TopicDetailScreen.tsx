import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { LoadingSpinner } from '../../components/common';
import { LinenBackground, GlossyNavBar, GlossyCard, GlossyButton } from '../../components/ios6';
import { SampleQuestionsUploadModal } from '../../components/SampleQuestionsUploadModal';
import { TrainModelModal } from '../../components/TrainModelModal';
import { useFacultyStore } from '../../store';
import { Ionicons } from '@expo/vector-icons';

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
    const [isEditing, setIsEditing] = useState(false);
    const [selectedCos, setSelectedCos] = useState<string[]>([]);
    const [selectedLos, setSelectedLos] = useState<string[]>([]);

    React.useEffect(() => {
        if (subjectId && topicId) {
            useFacultyStore.getState().fetchTopicDetail(subjectId, topicId);
        }
    }, [subjectId, topicId]);

    React.useEffect(() => {
        if (topic) {
            setSelectedCos(topic.mappedCOs?.map(co => co.id) || []);
            setSelectedLos(topic.learningOutcomes?.map(lo => lo.id) || []);
        }
    }, [topic]);

    if (!subject || !topic) {
        return (
            <LinenBackground>
                <GlossyNavBar title="Topic Details" showBack onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <Text>Topic not found</Text>
                </View>
            </LinenBackground>
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

    return (
        <LinenBackground>
            <GlossyNavBar
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
                <GlossyCard title="Overview">
                    <Text style={styles.topicName}>{topic.name}</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>{topic.questionCount || 0} Qs • {topic.mappedCOs?.length || 0} COs • {topic.learningOutcomes?.length || 0} LOs</Text>
                    </View>
                </GlossyCard>

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
                    <GlossyCard title={`Generated Questions (${topic.questions.length})`}>
                        {topic.questions.slice(0, 5).map((q: any, index: number) => (
                            <View key={index} style={styles.questionItem}>
                                <Text style={styles.questionText} numberOfLines={2}>{q.questionText}</Text>
                                <View style={styles.questionMeta}>
                                    <Text style={styles.metaTag}>{q.questionType?.toUpperCase()}</Text>
                                    <Text style={styles.metaTag}>{q.marks} Marks</Text>
                                </View>
                            </View>
                        ))}
                        {topic.questions.length > 5 && <Text style={styles.moreText}>+{topic.questions.length - 5} more questions...</Text>}
                    </GlossyCard>
                )}

                {/* Outcomes Section */}
                <GlossyCard title="Course Outcomes">
                    {isEditing ? (
                        subject.courseOutcomes?.map(co => {
                            const isSelected = selectedCos.includes(co.id);
                            return (
                                <TouchableOpacity key={co.id} style={styles.listItem} onPress={() => toggleSelection(co.id, selectedCos, setSelectedCos)}>
                                    <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={24} color={colors.primary} />
                                    <View style={styles.listItemContent}>
                                        <Text style={styles.outcomeCode}>{co.code}</Text>
                                        <Text style={styles.outcomeDesc}>{co.description}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        topic.mappedCOs?.map(co => (
                            <View key={co.id} style={styles.listItem}>
                                <View style={styles.bullet} />
                                <View style={styles.listItemContent}>
                                    <Text style={styles.outcomeCode}>{co.code}</Text>
                                    <Text style={styles.outcomeDesc}>{co.description}</Text>
                                </View>
                            </View>
                        ))
                    )}
                    {!isEditing && (!topic.mappedCOs || topic.mappedCOs.length === 0) && <Text style={styles.emptyText}>No mapped COs</Text>}
                </GlossyCard>

                <GlossyCard title="Learning Outcomes">
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
                </GlossyCard>

                {/* Uploaded Files */}
                <GlossyCard title="Uploaded Materials">
                    <FileList topicId={topicId} subjectId={subjectId} key={fileListKey} />
                </GlossyCard>

                <View style={{ height: 40 }} />
            </ScrollView>

            <SampleQuestionsUploadModal
                visible={isUploadModalVisible}
                onClose={() => {
                    setIsUploadModalVisible(false);
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
                onSuccess={() => useFacultyStore.getState().fetchTopicDetail(subjectId, topicId)}
            />
        </LinenBackground>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { paddingBottom: spacing.xl },
    navText: { color: 'white', fontWeight: 'bold', fontSize: 16, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: -1 }, textShadowRadius: 0 },
    topicName: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 5 },
    metaRow: { flexDirection: 'row', justifySelf: 'center', alignSelf: 'center', marginBottom: 10 },
    metaText: { color: '#666', fontSize: 13 },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, justifyContent: 'space-between' },
    actionCard: { width: '48%', backgroundColor: 'rgba(255,255,255,0.9)', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10, shadowColor: 'black', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
    actionTitle: { marginTop: 8, fontWeight: 'bold', color: '#333', fontSize: 13 },
    listItem: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE', alignItems: 'center' },
    listItemContent: { flex: 1, marginLeft: 10 },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#666', marginTop: 6 },
    outcomeCode: { fontWeight: 'bold', fontSize: 12, color: '#444' },
    outcomeDesc: { fontSize: 13, color: '#666' },
    emptyText: { fontStyle: 'italic', color: '#999', textAlign: 'center', marginTop: 10 },
    questionItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    questionText: { fontSize: 14, color: '#333', marginBottom: 4 },
    questionMeta: { flexDirection: 'row', gap: 5 },
    metaTag: { fontSize: 10, color: '#666', backgroundColor: '#EEE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    moreText: { textAlign: 'center', color: colors.primary, marginTop: 10, fontSize: 12 },
    fileListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    fileIcon: { width: 30, height: 30, borderRadius: 5, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    fileName: { fontSize: 14, color: '#333', fontWeight: 'bold' },
    fileMeta: { fontSize: 11, color: '#888' },
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
            const data = await useFacultyStore.getState().fetchTopicFiles(subjectId, topicId);
            setFiles(data || []);
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

    return (
        <View>
            {files.map((file, index) => (
                <View key={index} style={styles.fileListItem}>
                    <View style={[styles.fileIcon, { backgroundColor: getColor(file.type) }]}>
                        <Text style={{ fontSize: 16 }}>{getIcon(file.type)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.fileName} numberOfLines={1}>{decodeURIComponent(file.name)}</Text>
                        <Text style={styles.fileMeta}>
                            {file.details || `${file.type.toUpperCase()} • ${new Date(file.uploaded_at).toLocaleDateString()}`}
                        </Text>
                    </View>
                </View>
            ))}
        </View>
    );
};
