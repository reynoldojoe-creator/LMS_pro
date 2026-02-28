import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal as RNModal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFacultyStore } from '../../store/facultyStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBackground, ModernNavBar, Card, ModernButton, InsetGroupedList, Tag } from '../../components/common';

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
    // Per-topic intensity weights: { topicId: 'High' | 'Moderate' | 'Low' | 'None' }
    const [topicWeights, setTopicWeights] = useState<Record<string, string>>({});
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
            <ScreenBackground>
                <ModernNavBar title="Loading..." showBack onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            </ScreenBackground>
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
            // Build coMappings array from topicWeights
            const coMappings = Object.entries(topicWeights)
                .filter(([_, weight]) => weight !== 'None')
                .map(([topicId, weight]) => ({ topic_id: parseInt(topicId), weight }));
            await bulkMapCOTopics(subjectId, selectedCO.id, coMappings);
            setIsMapperVisible(false);
            Alert.alert("Success", `Mapped ${coMappings.length} topics to ${selectedCO.code}`);
        } catch (e) {
            Alert.alert("Error", "Failed to map topics");
        } finally {
            setIsMapping(false);
        }
    };

    const toggleTopic = (topicId: string) => {
        setTopicWeights(prev => {
            const current = prev[topicId] || 'None';
            const cycle = ['None', 'Low', 'Moderate', 'High'];
            const nextIdx = (cycle.indexOf(current) + 1) % cycle.length;
            return { ...prev, [topicId]: cycle[nextIdx] };
        });
    };

    const setTopicWeight = (topicId: string, weight: string) => {
        setTopicWeights(prev => ({ ...prev, [topicId]: weight }));
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
    const topicItems = allTopics.map(topic => ({
        id: topic.id.toString(),
        title: topic.name,
        subtitle: `${(topic.learningOutcomes || []).length} LOs mapped`,
        onPress: () => navigation.navigate('TopicDetail', { subjectId, topicId: topic.id }),
        showChevron: true,
        icon: 'document-text-outline' as any
    }));

    // Render Modal Content
    const renderMappingModal = (
        visible: boolean,
        onClose: () => void,
        title: string,
        subtitle: string,
        items: typeof allTopics,
        selectedIds: string[],
        onToggle: (id: string) => void,
        onSave: () => void,
        isSaving: boolean
    ) => (
        <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.modalSubtitle}>{subtitle}</Text>

                    <ScrollView style={styles.modalScroll}>
                        {items.map(item => {
                            const isSelected = selectedIds.includes(item.id.toString());
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.topicRow, isSelected && styles.topicRowSelected]}
                                    onPress={() => onToggle(item.id.toString())}
                                >
                                    <Text style={[styles.topicRowText, isSelected && styles.topicRowTextSelected]}>
                                        {item.name}
                                    </Text>
                                    {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <ModernButton
                            title={isSaving ? "Saving..." : "Save Mapping"}
                            onPress={onSave}
                            disabled={isSaving}
                            variant="primary"
                            style={{ width: '100%' }}
                        />
                    </View>
                </View>
            </View>
        </RNModal>
    );

    return (
        <ScreenBackground>
            <ModernNavBar
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

                {/* Overview Card */}
                <Card title="Overview">
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
                </Card>

                {/* Course Outcomes */}
                <Text style={styles.sectionHeader}>Course Outcomes</Text>
                {(subject.courseOutcomes || []).map((co: any) => (
                    <Card key={co.id} title={co.code}>
                        <Text style={styles.description}>{co.description}</Text>

                        <View style={styles.mappedInfo}>
                            <Text style={styles.label}>Mapped Topics: {(co.topics || []).length}</Text>
                            <View style={styles.chips}>
                                {(co.topics || []).slice(0, 5).map((t: any) => (
                                    <Tag key={t.id} label={t.name} variant="default" size="sm" />
                                ))}
                                {(co.topics || []).length > 5 && <Text style={styles.moreText}>+{co.topics.length - 5} more</Text>}
                            </View>
                        </View>

                        <View style={styles.actions}>
                            <ModernButton
                                title="Map"
                                onPress={() => {
                                    setSelectedCO(co);
                                    // Initialize per-topic weights from existing mapped topics
                                    const weights: Record<string, string> = {};
                                    allTopics.forEach(t => { weights[t.id.toString()] = 'None'; });
                                    (co.topics || []).forEach((t: any) => {
                                        weights[t.id.toString()] = t.weight || 'Moderate';
                                    });
                                    setTopicWeights(weights);
                                    setIsMapperVisible(true);
                                }}
                                variant="outline"
                                size="small"
                                style={{ flex: 1, marginRight: 5 }}
                            />
                            <ModernButton
                                title="AI Suggest"
                                onPress={() => handleAutoSuggest(co)}
                                variant="secondary"
                                size="small"
                                style={{ flex: 1, marginLeft: 5 }}
                                loading={isSuggesting && selectedCO?.id === co.id}
                            />
                        </View>
                    </Card>
                ))}

                {/* Learning Outcomes */}
                <Text style={styles.sectionHeader}>Learning Outcomes</Text>
                {(subject.learningOutcomes || []).map((lo: any) => (
                    <Card key={lo.id} title={lo.code}>
                        <Text style={styles.description}>{lo.description}</Text>

                        <View style={styles.mappedInfo}>
                            <Text style={styles.label}>Mapped Topics: {(lo.topics || []).length}</Text>
                            <View style={styles.chips}>
                                {(lo.topics || []).slice(0, 5).map((t: any) => (
                                    <Tag key={t.id} label={t.name} variant="default" size="sm" />
                                ))}
                                {(lo.topics || []).length > 5 && <Text style={styles.moreText}>+{lo.topics.length - 5} more</Text>}
                            </View>
                        </View>

                        <View style={styles.actions}>
                            <ModernButton
                                title="Map"
                                onPress={() => {
                                    setSelectedLO(lo);
                                    setSelectedLOTopicIds((lo.topics || []).map((t: any) => t.id.toString()));
                                    setIsLOMapperVisible(true);
                                }}
                                variant="outline"
                                size="small"
                                style={{ flex: 1, marginRight: 5 }}
                            />
                            <ModernButton
                                title="AI Suggest"
                                onPress={() => handleLOAutoSuggest(lo)}
                                variant="secondary"
                                size="small"
                                style={{ flex: 1, marginLeft: 5 }}
                                loading={isLOSuggesting && selectedLO?.id === lo.id}
                            />
                        </View>
                    </Card>
                ))}

                {/* Topics */}
                <Text style={styles.sectionHeader}>Topics</Text>
                <Card>
                    <View style={styles.addTopicRow}>
                        <TextInput
                            style={styles.input}
                            placeholder="New Topic Name"
                            placeholderTextColor={colors.textTertiary}
                            value={newTopicName}
                            onChangeText={setNewTopicName}
                        />
                        <ModernButton
                            title="Add"
                            onPress={handleAddTopic}
                            disabled={isAddingTopic}
                            loading={isAddingTopic}
                            size="small"
                        />
                    </View>
                </Card>

                {topicItems.length > 0 ? (
                    <InsetGroupedList
                        items={topicItems}
                    />
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No topics added yet.</Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Modals */}
            {/* CO Mapping Modal with Intensity */}
            <RNModal visible={isMapperVisible} transparent animationType="slide" onRequestClose={() => setIsMapperVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Map to {selectedCO?.code}</Text>
                            <TouchableOpacity onPress={() => setIsMapperVisible(false)} style={styles.closeButton}>
                                <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>{selectedCO?.description}</Text>
                        <View style={styles.intensityLegend}>
                            <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} /><Text style={styles.legendLabel}>High</Text>
                            <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} /><Text style={styles.legendLabel}>Moderate</Text>
                            <View style={[styles.legendDot, { backgroundColor: '#FFCC00' }]} /><Text style={styles.legendLabel}>Low</Text>
                            <View style={[styles.legendDot, { backgroundColor: colors.systemGray4 }]} /><Text style={styles.legendLabel}>None</Text>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            {allTopics.map(item => {
                                const weight = topicWeights[item.id.toString()] || 'None';
                                return (
                                    <View key={item.id} style={styles.intensityRow}>
                                        <Text style={styles.intensityTopicName} numberOfLines={2}>{item.name}</Text>
                                        <View style={styles.intensityButtons}>
                                            {['None', 'Low', 'Moderate', 'High'].map(level => {
                                                const isActive = weight === level;
                                                const bgColor = level === 'High' ? '#34C759' : level === 'Moderate' ? '#FF9500' : level === 'Low' ? '#FFCC00' : colors.systemGray5;
                                                return (
                                                    <TouchableOpacity
                                                        key={level}
                                                        style={[
                                                            styles.intensityBtn,
                                                            isActive && { backgroundColor: bgColor, borderColor: bgColor }
                                                        ]}
                                                        onPress={() => setTopicWeight(item.id.toString(), level)}
                                                    >
                                                        <Text style={[
                                                            styles.intensityBtnText,
                                                            isActive && { color: level === 'None' ? colors.text : '#fff', fontWeight: '700' }
                                                        ]}>
                                                            {level === 'None' ? '—' : level.charAt(0)}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <ModernButton
                                title={isMapping ? "Saving..." : "Save Mapping"}
                                onPress={handleBulkMap}
                                disabled={isMapping}
                                variant="primary"
                                style={{ width: '100%' }}
                            />
                        </View>
                    </View>
                </View>
            </RNModal>

            {renderMappingModal(
                isLOMapperVisible,
                () => setIsLOMapperVisible(false),
                `Map to ${selectedLO?.code}`,
                selectedLO?.description,
                allTopics,
                selectedLOTopicIds,
                toggleLOTopic,
                handleLOBulkMap,
                isLOMapping
            )}

        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 40, paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.md },
    navText: { ...typography.body, color: colors.primary },
    subjectName: { ...typography.h3, color: colors.text, textAlign: 'center', marginBottom: spacing.md },
    statsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.sm },
    statBox: { alignItems: 'center', minWidth: 60 },
    statValue: { ...typography.h2, color: colors.text },
    statLabel: { ...typography.caption1, color: colors.textSecondary },
    statDivider: { width: 1, height: 30, backgroundColor: colors.separator, marginHorizontal: spacing.md },
    sectionHeader: { ...typography.headline, color: colors.textSecondary, marginTop: spacing.xl, marginBottom: spacing.xs, marginLeft: 4 },
    description: { ...typography.body, color: colors.text, marginBottom: spacing.sm },
    mappedInfo: { marginBottom: spacing.md },
    label: { ...typography.caption1, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    moreText: { ...typography.caption1, color: colors.textTertiary, alignSelf: 'center' },
    actions: { flexDirection: 'row', marginTop: spacing.xs },
    addTopicRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    input: { flex: 1, height: 36, backgroundColor: colors.systemGray6, borderRadius: 8, paddingHorizontal: 12, ...typography.body, color: colors.text },
    emptyState: { padding: spacing.xl, alignItems: 'center' },
    emptyText: { ...typography.body, color: colors.textTertiary, fontStyle: 'italic' },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContainer: { height: '85%', backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.separator },
    modalTitle: { ...typography.headline, color: colors.text },
    closeButton: {},
    modalSubtitle: { ...typography.caption1, color: colors.textSecondary, padding: spacing.md, paddingBottom: 0 },
    modalScroll: { flex: 1 },
    topicRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.separator, alignItems: 'center', backgroundColor: colors.card },
    topicRowSelected: { backgroundColor: colors.systemGray6 },
    topicRowText: { ...typography.body, color: colors.text },
    topicRowTextSelected: { fontWeight: '600', color: colors.primary },
    modalFooter: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.separator, backgroundColor: colors.background },

    // Intensity Legend
    intensityLegend: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, gap: 4, borderBottomWidth: 0.5, borderBottomColor: colors.separator },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
    legendLabel: { ...typography.caption2, color: colors.textSecondary },

    // Intensity Row
    intensityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.separator, backgroundColor: colors.card },
    intensityTopicName: { ...typography.body, color: colors.text, flex: 1, marginRight: spacing.sm },
    intensityButtons: { flexDirection: 'row', gap: 4 },
    intensityBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1.5, borderColor: colors.systemGray4, justifyContent: 'center', alignItems: 'center' },
    intensityBtnText: { ...typography.caption1, color: colors.textSecondary, fontWeight: '500' },
});
