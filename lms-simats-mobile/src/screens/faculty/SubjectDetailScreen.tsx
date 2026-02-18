import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal as RNModal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFacultyStore } from '../../store/facultyStore';
import { LinenBackground, GlossyNavBar, GlossyCard, GlossyButton, GroupedTableView } from '../../components/ios6';
import { colors } from '../../theme/colors';
import { spacing, typography } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { Tag } from '../../components/common'; // Keep Tag for now or refactor to gloss

type Props = NativeStackScreenProps<any, 'SubjectDetail'>;

export const SubjectDetailScreen = ({ route, navigation }: Props) => {
    const { subjectId } = route.params as { subjectId: string };
    const {
        getSubjectById,
        fetchSubjectDetail,
        bulkMapCOTopics,
        autoSuggestCOTopics,
        bulkMapLOTopics,
        autoSuggestLOTopics,
        createTopic
    } = useFacultyStore();
    const subject = getSubjectById(subjectId);

    // Bulk Mapping State
    const [selectedCO, setSelectedCO] = useState<any>(null);
    const [isMapperVisible, setIsMapperVisible] = useState(false);
    const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
    const [mappingWeight, setMappingWeight] = useState<'low' | 'moderate' | 'high'>('moderate');
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isMapping, setIsMapping] = useState(false);

    // Add Topic State
    const [newTopicName, setNewTopicName] = useState('');
    const [isAddingTopic, setIsAddingTopic] = useState(false);

    // LO Mapping State
    const [selectedLO, setSelectedLO] = useState<any>(null);
    const [isLOMapperVisible, setIsLOMapperVisible] = useState(false);
    const [selectedLOTopicIds, setSelectedLOTopicIds] = useState<string[]>([]);
    const [loMappingWeight, setLOMappingWeight] = useState<'low' | 'moderate' | 'high'>('moderate');
    const [isLOSuggesting, setIsLOSuggesting] = useState(false);
    const [isLOMapping, setIsLOMapping] = useState(false);

    React.useEffect(() => {
        fetchSubjectDetail(subjectId);
    }, [subjectId, fetchSubjectDetail]);

    if (!subject) {
        return (
            <LinenBackground>
                <GlossyNavBar title="Loading..." showBack onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <ActivityIndicator color="#4C566C" />
                </View>
            </LinenBackground>
        );
    }

    const allTopics = subject.topics || [];

    // Helper functions
    const handleAutoSuggest = async (co: any) => {
        if (isSuggesting) return;
        setIsSuggesting(true);
        try {
            const result = await autoSuggestCOTopics(subjectId, co.id);
            if (result && result.topic_ids) {
                setSelectedCO(co);
                setSelectedTopicIds(result.topic_ids.map((id: number) => id.toString()));
                setIsMapperVisible(true);
                Alert.alert("AI Suggestion", result.reasoning || "Topics suggested based on CO description.");
            }
        } catch (e) {
            Alert.alert("Error", "Failed to get suggestions");
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleBulkMap = async () => {
        if (!selectedCO) return;
        setIsMapping(true);
        try {
            await bulkMapCOTopics(subjectId, selectedCO.id, selectedTopicIds, mappingWeight);
            setIsMapperVisible(false);
            Alert.alert("Success", `Mapped ${selectedTopicIds.length} topics to ${selectedCO.code}`);
        } catch (e) {
            Alert.alert("Error", "Failed to map topics");
        } finally {
            setIsMapping(false);
        }
    };

    const toggleTopic = (topicId: string) => {
        setSelectedTopicIds(prev =>
            prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
        );
    };

    const handleAddTopic = async () => {
        if (!newTopicName.trim()) {
            Alert.alert('Error', 'Please enter a topic name');
            return;
        }
        setIsAddingTopic(true);
        try {
            await createTopic(subjectId, newTopicName.trim());
            setNewTopicName('');
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to add topic');
        } finally {
            setIsAddingTopic(false);
        }
    };

    const handleLOAutoSuggest = async (lo: any) => {
        if (isLOSuggesting) return;
        setIsLOSuggesting(true);
        try {
            const result = await autoSuggestLOTopics(subjectId, lo.id);
            if (result && result.topic_ids) {
                setSelectedLO(lo);
                setSelectedLOTopicIds(result.topic_ids.map((id: number) => id.toString()));
                setIsLOMapperVisible(true);
                Alert.alert("AI Suggestion", result.reasoning || "Topics suggested based on LO description.");
            }
        } catch (e) {
            Alert.alert("Error", "Failed to get suggestions");
        } finally {
            setIsLOSuggesting(false);
        }
    };

    const handleLOBulkMap = async () => {
        if (!selectedLO) return;
        setIsLOMapping(true);
        try {
            await bulkMapLOTopics(subjectId, selectedLO.id, selectedLOTopicIds, loMappingWeight);
            setIsLOMapperVisible(false);
            Alert.alert("Success", `Mapped ${selectedLOTopicIds.length} topics to ${selectedLO.code}`);
        } catch (e) {
            Alert.alert("Error", "Failed to map topics");
        } finally {
            setIsLOMapping(false);
        }
    };

    const toggleLOTopic = (topicId: string) => {
        setSelectedLOTopicIds(prev =>
            prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
        );
    };

    // Prepare sections for GroupedTableView (Topics)
    const topicSectionData = allTopics.map(topic => ({
        title: topic.name,
        subtitle: `${(topic.learningOutcomes || []).length} LOs mapped`, // Placeholder for subtitle, maybe LO count?
        onPress: () => navigation.navigate('TopicDetail', { subjectId, topicId: topic.id }),
        chevron: true
    }));

    return (
        <LinenBackground>
            <GlossyNavBar
                title={subject.code}
                showBack
                onBack={() => navigation.goBack()}
                rightButton={
                    <TouchableOpacity onPress={() => navigation.navigate('EditCOLO', { subjectId })}>
                        <Text style={styles.navText}>Edit</Text>
                    </TouchableOpacity>
                }
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Overview */}
                <GlossyCard title="Overview">
                    <Text style={styles.subjectName}>{subject.name}</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{(subject.courseOutcomes || []).length}</Text>
                            <Text style={styles.statLabel}>COs</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{(subject.topics || []).length}</Text>
                            <Text style={styles.statLabel}>Topics</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{(subject.learningOutcomes || []).length}</Text>
                            <Text style={styles.statLabel}>LOs</Text>
                        </View>
                    </View>
                </GlossyCard>

                {/* Course Outcomes */}
                <Text style={styles.sectionHeader}>COURSE OUTCOMES</Text>
                {(subject.courseOutcomes || []).map((co: any) => (
                    <GlossyCard key={co.id} title={co.code}>
                        <Text style={styles.description}>{co.description}</Text>

                        <View style={styles.mappedInfo}>
                            <Text style={styles.label}>Mapped Topics: {(co.topics || []).length}</Text>
                            <View style={styles.chips}>
                                {(co.topics || []).slice(0, 5).map((t: any) => (
                                    <View key={t.id} style={styles.chip}><Text style={styles.chipText}>{t.name}</Text></View>
                                ))}
                                {(co.topics || []).length > 5 && <Text style={styles.moreText}>+{co.topics.length - 5} more</Text>}
                            </View>
                        </View>

                        <View style={styles.actions}>
                            <GlossyButton title="Map Topics" onPress={() => {
                                setSelectedCO(co);
                                setSelectedTopicIds((co.topics || []).map((t: any) => t.id.toString()));
                                setIsMapperVisible(true);
                            }} size="small" style={{ flex: 1, marginRight: 5 }} />
                            <GlossyButton title="Auto-Suggest" onPress={() => handleAutoSuggest(co)} size="small" style={{ flex: 1, marginLeft: 5 }} />
                        </View>
                    </GlossyCard>
                ))}

                {/* Learning Outcomes */}
                <Text style={styles.sectionHeader}>LEARNING OUTCOMES</Text>
                {(subject.learningOutcomes || []).map((lo: any) => (
                    <GlossyCard key={lo.id} title={lo.code}>
                        <Text style={styles.description}>{lo.description}</Text>

                        <View style={styles.mappedInfo}>
                            <Text style={styles.label}>Mapped Topics: {(lo.topics || []).length}</Text>
                            <View style={styles.chips}>
                                {(lo.topics || []).slice(0, 5).map((t: any) => (
                                    <View key={t.id} style={styles.chip}><Text style={styles.chipText}>{t.name}</Text></View>
                                ))}
                                {(lo.topics || []).length > 5 && <Text style={styles.moreText}>+{lo.topics.length - 5} more</Text>}
                            </View>
                        </View>

                        <View style={styles.actions}>
                            <GlossyButton title="Map Topics" onPress={() => {
                                setSelectedLO(lo);
                                setSelectedLOTopicIds((lo.topics || []).map((t: any) => t.id.toString()));
                                setIsLOMapperVisible(true);
                            }} size="small" style={{ flex: 1, marginRight: 5 }} />
                            <GlossyButton title="Auto-Suggest" onPress={() => handleLOAutoSuggest(lo)} size="small" style={{ flex: 1, marginLeft: 5 }} />
                        </View>
                    </GlossyCard>
                ))}

                {/* Topics */}
                <Text style={styles.sectionHeader}>TOPICS</Text>
                <GlossyCard>
                    <View style={styles.addTopicRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="New Topic Name"
                            value={newTopicName}
                            onChangeText={setNewTopicName}
                        />
                        <GlossyButton title="Add" onPress={handleAddTopic} disabled={isAddingTopic} size="small" />
                    </View>
                </GlossyCard>

                {topicSectionData.length > 0 ? (
                    <GroupedTableView
                        sections={[{ data: topicSectionData }]} // Correct structure for SectionList: [{ data: [...] }]
                        scrollEnabled={false} // Nested in ScrollView
                    />
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No topics added yet.</Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* CO Mapper Modal */}
            <RNModal visible={isMapperVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <GlossyNavBar title={`Map to ${selectedCO?.code || 'CO'}`} rightButton={<TouchableOpacity onPress={() => setIsMapperVisible(false)}><Text style={styles.navText}>Close</Text></TouchableOpacity>} />
                        <View style={styles.modalBody}>
                            <Text style={styles.modalSubtitle}>{selectedCO?.description}</Text>
                            <ScrollView style={styles.topicList}>
                                {allTopics.map(topic => (
                                    <TouchableOpacity
                                        key={topic.id}
                                        style={[styles.topicRow, selectedTopicIds.includes(topic.id.toString()) && styles.topicRowSelected]}
                                        onPress={() => toggleTopic(topic.id.toString())}
                                    >
                                        <Text style={styles.topicRowText}>{topic.name}</Text>
                                        {selectedTopicIds.includes(topic.id.toString()) && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <GlossyButton title={isMapping ? "Saving..." : "Save Mapping"} onPress={handleBulkMap} disabled={isMapping} style={{ marginTop: 10 }} />
                        </View>
                    </View>
                </View>
            </RNModal>

            {/* LO Mapper Modal */}
            <RNModal visible={isLOMapperVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <GlossyNavBar title={`Map to ${selectedLO?.code || 'LO'}`} rightButton={<TouchableOpacity onPress={() => setIsLOMapperVisible(false)}><Text style={styles.navText}>Close</Text></TouchableOpacity>} />
                        <View style={styles.modalBody}>
                            <Text style={styles.modalSubtitle}>{selectedLO?.description}</Text>
                            <ScrollView style={styles.topicList}>
                                {allTopics.map(topic => (
                                    <TouchableOpacity
                                        key={topic.id}
                                        style={[styles.topicRow, selectedLOTopicIds.includes(topic.id.toString()) && styles.topicRowSelected]}
                                        onPress={() => toggleLOTopic(topic.id.toString())}
                                    >
                                        <Text style={styles.topicRowText}>{topic.name}</Text>
                                        {selectedLOTopicIds.includes(topic.id.toString()) && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <GlossyButton title={isLOMapping ? "Saving..." : "Save Mapping"} onPress={handleLOBulkMap} disabled={isLOMapping} style={{ marginTop: 10 }} />
                        </View>
                    </View>
                </View>
            </RNModal>

        </LinenBackground>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 40, paddingHorizontal: 10 },
    navText: { color: 'white', fontWeight: 'bold', fontSize: 16, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: -1 }, textShadowRadius: 0 },
    subjectName: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 15, textShadowColor: 'white', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 0 },
    statsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    statBox: { alignItems: 'center', minWidth: 60 },
    statValue: { fontSize: 20, fontWeight: 'bold', color: '#4C566C' },
    statLabel: { fontSize: 12, color: '#888' },
    statDivider: { width: 1, height: 30, backgroundColor: '#CCC', marginHorizontal: 10 },
    sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#4C566C', marginTop: 20, marginBottom: 5, marginLeft: 10, textShadowColor: 'rgba(255,255,255,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 0 },
    description: { fontSize: 14, color: '#333', marginBottom: 10 },
    mappedInfo: { marginBottom: 10 },
    label: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 5 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    chip: { backgroundColor: '#E0E0E0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    chipText: { fontSize: 11, color: '#333' },
    moreText: { fontSize: 11, color: '#888', alignSelf: 'center' },
    actions: { flexDirection: 'row', marginTop: 5 },
    addTopicRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    input: { flex: 1, borderWidth: 1, borderColor: '#CCC', borderRadius: 5, padding: 8, backgroundColor: 'white', height: 40 },
    emptyState: { padding: 20, alignItems: 'center' },
    emptyText: { color: '#888', fontStyle: 'italic' },
    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContainer: { height: '80%', backgroundColor: '#E0E0E0', borderTopLeftRadius: 10, borderTopRightRadius: 10, overflow: 'hidden' },
    modalBody: { flex: 1, padding: 15 },
    modalSubtitle: { fontSize: 14, color: '#555', marginBottom: 10, fontStyle: 'italic' },
    topicList: { flex: 1, backgroundColor: 'white', borderRadius: 5, borderWidth: 1, borderColor: '#CCC', marginBottom: 10 },
    topicRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE', alignItems: 'center' },
    topicRowSelected: { backgroundColor: '#F0F8FF' },
    topicRowText: { fontSize: 14, color: '#333' }
});
