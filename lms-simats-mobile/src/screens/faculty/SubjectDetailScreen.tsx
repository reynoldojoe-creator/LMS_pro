import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useFacultyStore } from '../../store';
import { SegmentedControl, GroupedList, Button, Tag, Modal, Input } from '../../components/common';
import type { GroupedListSection } from '../../components/common';
import { Ionicons } from '@expo/vector-icons';

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

    // Fetch details on mount to ensure we have units/COs
    React.useEffect(() => {
        fetchSubjectDetail(subjectId);
    }, [subjectId, fetchSubjectDetail]);

    const handleEditPress = () => {
        navigation.navigate('EditCOLO', { subjectId });
    };

    // Helper functions for mapping
    const handleAutoSuggest = async (co: any) => {
        if (isSuggesting) return;
        setIsSuggesting(true);
        try {
            const result = await autoSuggestCOTopics(subjectId, co.id);
            if (result && result.topic_ids) {
                // If modal not open, open it with suggestions
                setSelectedCO(co);
                // Convert IDs to strings
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
            prev.includes(topicId)
                ? prev.filter(id => id !== topicId)
                : [...prev, topicId]
        );
    };

    // Flatten all topics for selection list (use subject.topics directly)
    const allTopics = subject?.topics || [];

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

    // LO Mapping Handlers
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
            prev.includes(topicId)
                ? prev.filter(id => id !== topicId)
                : [...prev, topicId]
        );
    };

    if (!subject) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Subject not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backChevron}>‹</Text>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.headerCode}>{subject.code}</Text>

                <TouchableOpacity onPress={handleEditPress} style={styles.editButton}>
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView>
                {/* Subject Info */}
                <View style={styles.subjectInfo}>
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
                </View>

                {/* Course Outcomes Section */}
                <View style={[styles.contentSection, { paddingHorizontal: spacing.screenHorizontal }]}>
                    <Text style={styles.sectionTitle}>Course Outcomes</Text>

                    {(subject.courseOutcomes || []).map((co: any) => (
                        <View key={co.id} style={styles.coCard}>
                            <View style={styles.coHeader}>
                                <Tag label={co.code} variant="default" color={colors.primary} size="sm" />
                                <Text style={styles.coDescription} numberOfLines={2}>{co.description}</Text>
                            </View>

                            {/* Mapped Topics */}
                            <View style={styles.mappedTopicsContainer}>
                                <Text style={styles.metaLabel}>Mapped Topics:</Text>
                                <View style={styles.topicChips}>
                                    {(co.topics || []).length > 0 ? (
                                        (co.topics || []).slice(0, 5).map((t: any) => ( // Show first 5
                                            <View key={t.id} style={styles.topicChip}>
                                                <Text style={styles.topicChipText}>{t.name}</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.emptyText}>No topics mapped</Text>
                                    )}
                                    {(co.topics || []).length > 5 && (
                                        <Text style={styles.moreText}>
                                            +{(co.topics || []).length - 5} more
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.coActions}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => {
                                        setSelectedCO(co);
                                        // Pre-select existing topics
                                        setSelectedTopicIds((co.topics || []).map((t: any) => t.id.toString()));
                                        setIsMapperVisible(true);
                                    }}
                                >
                                    <Text style={styles.actionButtonText}>+ Map Topics</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.ghostButton]}
                                    onPress={() => handleAutoSuggest(co)}
                                >
                                    <Text style={[styles.actionButtonText, styles.ghostButtonText]}>✨ Auto-suggest</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Learning Outcomes Section */}
                <View style={[styles.contentSection, { paddingHorizontal: spacing.screenHorizontal }]}>
                    <Text style={styles.sectionTitle}>Learning Outcomes</Text>

                    {(subject.learningOutcomes || []).map((lo: any) => (
                        <View key={lo.id} style={styles.coCard}>
                            <View style={styles.coHeader}>
                                <Tag label={lo.code} variant="default" color={colors.success} size="sm" />
                                <Text style={styles.coDescription} numberOfLines={2}>{lo.description}</Text>
                            </View>

                            {/* Mapped Topics */}
                            <View style={styles.mappedTopicsContainer}>
                                <Text style={styles.metaLabel}>Mapped Topics:</Text>
                                <View style={styles.topicChips}>
                                    {(lo.topics || []).length > 0 ? (
                                        (lo.topics || []).slice(0, 5).map((t: any) => (
                                            <View key={t.id} style={styles.topicChip}>
                                                <Text style={styles.topicChipText}>{t.name}</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.emptyText}>No topics mapped</Text>
                                    )}
                                    {(lo.topics || []).length > 5 && (
                                        <Text style={styles.moreText}>
                                            +{(lo.topics || []).length - 5} more
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.coActions}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => {
                                        setSelectedLO(lo);
                                        setSelectedLOTopicIds((lo.topics || []).map((t: any) => t.id.toString()));
                                        setIsLOMapperVisible(true);
                                    }}
                                >
                                    <Text style={styles.actionButtonText}>+ Map Topics</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.ghostButton]}
                                    onPress={() => handleLOAutoSuggest(lo)}
                                >
                                    <Text style={[styles.actionButtonText, styles.ghostButtonText]}>✨ Auto-suggest</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    {(subject.learningOutcomes || []).length === 0 && (
                        <View style={styles.emptySection}>
                            <Text style={styles.emptyText}>No learning outcomes added yet</Text>
                        </View>
                    )}
                </View>

                {/* Topics Section */}
                <View style={[styles.contentSection, { paddingHorizontal: spacing.screenHorizontal }]}>
                    <Text style={styles.sectionTitle}>Topics</Text>

                    {/* Add Topic Input */}
                    <View style={styles.addTopicRow}>
                        <TextInput
                            style={styles.addTopicInput}
                            placeholder="Enter topic name..."
                            placeholderTextColor={colors.textSecondary}
                            value={newTopicName}
                            onChangeText={setNewTopicName}
                            onSubmitEditing={handleAddTopic}
                            returnKeyType="done"
                        />
                        <TouchableOpacity
                            style={[styles.addTopicButton, isAddingTopic && { opacity: 0.5 }]}
                            onPress={handleAddTopic}
                            disabled={isAddingTopic}
                        >
                            {isAddingTopic ? (
                                <ActivityIndicator size="small" color={colors.surface} />
                            ) : (
                                <Ionicons name="add" size={20} color={colors.surface} />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Topic List */}
                    {(subject.topics || []).length > 0 ? (
                        (subject.topics || []).map((topic: any) => (
                            <TouchableOpacity
                                key={topic.id}
                                style={styles.topicCard}
                                onPress={() => navigation.navigate('TopicDetail', { subjectId, topicId: topic.id })}
                                activeOpacity={0.7}
                            >
                                <View style={styles.topicCardContent}>
                                    <Text style={styles.topicCardName}>{topic.name}</Text>
                                    <Text style={styles.topicCardMeta}>
                                        {(topic.learningOutcomes || []).length} LOs mapped
                                    </Text>
                                </View>
                                <Text style={styles.chevron}>›</Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptySection}>
                            <Text style={styles.emptyText}>No topics added yet. Use the input above to add topics.</Text>
                        </View>
                    )}
                </View>

                {/* Bulk Mapper Modal */}
                <Modal
                    visible={isMapperVisible}
                    onClose={() => setIsMapperVisible(false)}
                    title={`Map Topics to ${selectedCO?.code || 'CO'}`}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalSubtitle}>{selectedCO?.description}</Text>

                        <Text style={styles.label}>Mapping Weight</Text>
                        <View style={styles.weightSelector}>
                            {(['low', 'moderate', 'high'] as const).map(w => (
                                <TouchableOpacity
                                    key={w}
                                    style={[
                                        styles.weightOption,
                                        mappingWeight === w && styles.weightOptionSelected
                                    ]}
                                    onPress={() => setMappingWeight(w)}
                                >
                                    <Text style={[
                                        styles.weightText,
                                        mappingWeight === w && styles.weightTextSelected
                                    ]}>{w.charAt(0).toUpperCase() + w.slice(1)}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Select Topics ({selectedTopicIds.length})</Text>
                        <ScrollView style={styles.topicSelectorList} nestedScrollEnabled>
                            {allTopics.map(topic => (
                                <TouchableOpacity
                                    key={topic.id}
                                    style={[
                                        styles.topicSelectRow,
                                        selectedTopicIds.includes(topic.id.toString()) && styles.topicSelectRowSelected
                                    ]}
                                    onPress={() => toggleTopic(topic.id.toString())}
                                >
                                    <View style={[
                                        styles.checkbox,
                                        selectedTopicIds.includes(topic.id.toString()) && styles.checkboxSelected
                                    ]} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.topicSelectName}>{topic.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Button
                            title={isMapping ? "Saving..." : `Map ${selectedTopicIds.length} Topics`}
                            onPress={handleBulkMap}
                            variant="primary"
                            disabled={isMapping}
                            fullWidth
                            style={{ marginTop: spacing.md }}
                        />
                    </View>
                </Modal>

                {/* LO Bulk Mapper Modal */}
                <Modal
                    visible={isLOMapperVisible}
                    onClose={() => setIsLOMapperVisible(false)}
                    title={`Map Topics to ${selectedLO?.code || 'LO'}`}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalSubtitle}>{selectedLO?.description}</Text>

                        <Text style={styles.label}>Select Topics ({selectedLOTopicIds.length})</Text>
                        <ScrollView style={styles.topicSelectorList} nestedScrollEnabled>
                            {allTopics.map(topic => (
                                <TouchableOpacity
                                    key={topic.id}
                                    style={[
                                        styles.topicSelectRow,
                                        selectedLOTopicIds.includes(topic.id.toString()) && styles.topicSelectRowSelected
                                    ]}
                                    onPress={() => toggleLOTopic(topic.id.toString())}
                                >
                                    <View style={[
                                        styles.checkbox,
                                        selectedLOTopicIds.includes(topic.id.toString()) && styles.checkboxSelected
                                    ]} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.topicSelectName}>{topic.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Button
                            title={isLOMapping ? "Saving..." : `Map ${selectedLOTopicIds.length} Topics`}
                            onPress={handleLOBulkMap}
                            variant="primary"
                            disabled={isLOMapping}
                            fullWidth
                            style={{ marginTop: spacing.md }}
                        />
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.screenHorizontal,
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
        backgroundColor: colors.surface,
    },
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
    },
    backText: {
        ...typography.body,
        color: colors.primary,
    },
    headerCode: {
        ...typography.navTitle,
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    editButton: {
        flex: 1,
        alignItems: 'flex-end',
    },
    editText: {
        ...typography.body,
        color: colors.primary,
    },
    subjectInfo: {
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    subjectName: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: colors.iosGray6,
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        ...typography.h2,
        color: colors.primary,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    statDivider: {
        width: 1,
        backgroundColor: colors.divider,
        marginHorizontal: spacing.sm,
    },
    segmentedContainer: {
        padding: spacing.screenHorizontal,
        paddingTop: spacing.md,
    },
    contentSection: {
        marginTop: spacing.md,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    coCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    coHeader: {
        marginBottom: spacing.sm,
    },
    coDescription: {
        ...typography.body,
        color: colors.textPrimary,
        marginTop: spacing.xs,
    },
    mappedTopicsContainer: {
        marginTop: spacing.xs,
        paddingTop: spacing.xs,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.divider,
    },
    metaLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    topicChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    topicChip: {
        backgroundColor: colors.iosGray6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    topicChipText: {
        ...typography.caption,
        color: colors.textPrimary,
    },
    moreText: {
        ...typography.caption,
        color: colors.textSecondary,
        alignSelf: 'center',
    },
    emptyText: {
        ...typography.caption,
        color: colors.textSecondary,
        fontStyle: 'italic',
    },
    coActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    actionButton: {
        backgroundColor: colors.primary + '10',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: borderRadius.sm,
    },
    actionButtonText: {
        ...typography.captionBold,
        color: colors.primary,
    },
    ghostButton: {
        backgroundColor: 'transparent',
    },
    ghostButtonText: {
        color: colors.primary,
    },

    // Modal Styles
    modalContent: {
        maxHeight: '80%',
    },
    modalSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    label: {
        ...typography.bodyBold,
        marginBottom: spacing.xs,
        marginTop: spacing.sm,
    },
    weightSelector: {
        flexDirection: 'row',
        backgroundColor: colors.iosGray6,
        borderRadius: borderRadius.md,
        padding: 4,
    },
    weightOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: borderRadius.sm - 2,
    },
    weightOptionSelected: {
        backgroundColor: colors.surface,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    weightText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    weightTextSelected: {
        color: colors.primary,
        fontWeight: '600',
    },
    topicSelectorList: {
        maxHeight: 300,
        backgroundColor: colors.iosGray6,
        borderRadius: borderRadius.md,
        marginTop: spacing.xs,
    },
    topicSelectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    topicSelectRowSelected: {
        backgroundColor: colors.primary + '10',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: colors.textSecondary,
        marginRight: spacing.sm,
    },
    checkboxSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    topicSelectName: {
        ...typography.caption,
        color: colors.textPrimary,
    },

    unitSection: {
        marginBottom: spacing.md,
        marginHorizontal: spacing.screenHorizontal,
    },
    unitHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadowDark,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    unitContent: {
        flex: 1,
    },
    unitTitle: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    unitSubtitle: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    topicsList: {
        marginTop: spacing.xs,
        marginLeft: spacing.lg,
    },
    topicItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xs,
    },
    topicContent: {
        flex: 1,
    },
    topicName: {
        ...typography.body,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    topicMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    topicMetaText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    chevron: {
        ...typography.h2,
        color: colors.iosGray3,
        fontWeight: '300',
    },
    actionSection: {
        padding: spacing.lg,
    },
    // LO Section Styles
    loCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.xs,
        borderWidth: 1,
        borderColor: colors.border,
    },
    loDescription: {
        ...typography.body,
        color: colors.textPrimary,
        marginTop: spacing.xs,
    },
    emptySection: {
        paddingVertical: spacing.lg,
        alignItems: 'center',
    },
    // Topic Section Styles
    addTopicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    addTopicInput: {
        flex: 1,
        ...typography.body,
        color: colors.textPrimary,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
    },
    addTopicButton: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topicCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xs,
    },
    topicCardContent: {
        flex: 1,
    },
    topicCardName: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    topicCardMeta: {
        ...typography.caption,
        color: colors.textSecondary,
    },
});
