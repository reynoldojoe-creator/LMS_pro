import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal } from 'react-native';
import { useAppTheme } from '../../../../hooks';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { Button, LoadingSpinner } from '../../../../components/common';
import { subjectService } from '../../../../services/subjectService';

interface Props {
    subjectId: string;
    onFinish: () => void;
    onBack: () => void;
}

export const Step5OutcomeMapping = ({ subjectId, onFinish, onBack }: Props) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    const [subject, setSubject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
    const [selectedCOs, setSelectedCOs] = useState<{ co_id: number; weight: string }[]>([]);
    const [selectedLOs, setSelectedLOs] = useState<number[]>([]);

    useEffect(() => {
        loadSubject();
    }, []);

    const loadSubject = async () => {
        try {
            const data = await subjectService.getById(subjectId);
            setSubject(data);
        } catch (error) {
            Alert.alert("Error", "Failed to load subject data");
        } finally {
            setLoading(false);
        }
    };

    const openMapping = (topicId: string) => {
        setCurrentTopicId(topicId);
        setSelectedCOs([]);
        setSelectedLOs([]);
        setModalVisible(true);
    };

    const setCOWeight = (id: number, weight: string) => {
        if (weight === 'None') {
            setSelectedCOs(selectedCOs.filter(c => c.co_id !== id));
        } else {
            const existing = selectedCOs.find(c => c.co_id === id);
            if (existing) {
                setSelectedCOs(selectedCOs.map(c => c.co_id === id ? { ...c, weight } : c));
            } else {
                setSelectedCOs([...selectedCOs, { co_id: id, weight }]);
            }
        }
    };

    const toggleLO = (id: number) => {
        if (selectedLOs.includes(id)) {
            setSelectedLOs(selectedLOs.filter(l => l !== id));
        } else {
            setSelectedLOs([...selectedLOs, id]);
        }
    };

    const saveMapping = async () => {
        if (!currentTopicId) return;
        try {
            await subjectService.mapTopicOutcomes(subjectId, currentTopicId, selectedCOs, selectedLOs);
            setModalVisible(false);
            Alert.alert("Success", "Mapping saved");
        } catch (error) {
            Alert.alert("Error", "Failed to save mapping");
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!subject) return <Text>Error loading subject</Text>;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Map Outcomes to Topics</Text>
                <Text style={styles.subtitle}>
                    Select each topic to map relevant COs and LOs.
                </Text>

                {subject.units?.map((unit: any) => (
                    <View key={unit.id || unit.unit_number} style={styles.unitSection}>
                        <Text style={styles.unitHeader}>Unit {unit.number || unit.unit_number}: {unit.title || unit.unit_title}</Text>
                        {unit.topics?.map((topic: any) => (
                            <TouchableOpacity
                                key={topic.id}
                                style={styles.topicRow}
                                onPress={() => openMapping(topic.id)}
                            >
                                <Text style={styles.topicTitle}>{topic.name}</Text>
                                <Text style={styles.mapAction}>Map ›</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                <Button
                    title="Finish Setup"
                    onPress={onFinish}
                    style={{ marginTop: spacing.xl }}
                    fullWidth
                />

                <Modal
                    visible={modalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Select Outcomes</Text>
                            <ScrollView style={{ maxHeight: 400 }}>
                                <Text style={styles.sectionHeader}>Course Outcomes</Text>
                                {subject.courseOutcomes?.map((co: any) => {
                                    const selectedWeight = selectedCOs.find(c => c.co_id === co.id)?.weight || 'None';
                                    return (
                                        <View key={co.id} style={styles.coMappingContainer}>
                                            <Text style={styles.coDescription}>{co.code}: {co.description?.substring(0, 50)}...</Text>
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
                                })}

                                <Text style={styles.sectionHeader}>Learning Outcomes</Text>
                                {subject.learningOutcomes?.map((lo: any) => (
                                    <TouchableOpacity
                                        key={lo.id}
                                        style={[
                                            styles.optionRow,
                                            selectedLOs.includes(lo.id) && styles.selectedOption
                                        ]}
                                        onPress={() => toggleLO(lo.id)}
                                    >
                                        <Text style={{ color: colors.textPrimary }}>{lo.code}: {lo.description?.substring(0, 30)}...</Text>
                                        {selectedLOs.includes(lo.id) && <Text style={{ color: colors.primary }}>✓</Text>}
                                    </TouchableOpacity>
                                ))}
                                {(!subject.learningOutcomes || subject.learningOutcomes.length === 0) && (
                                    <Text style={{ fontStyle: 'italic', color: colors.textSecondary }}>No Learning Outcomes found.</Text>
                                )}
                            </ScrollView>
                            <View style={styles.modalButtons}>
                                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                                    <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={saveMapping} style={styles.saveButton}>
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Save Mapping</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
    },
    title: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    unitSection: {
        marginBottom: spacing.lg,
    },
    unitHeader: {
        ...typography.h3,
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    topicRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.itemBorder,
        borderRadius: 8,
        marginBottom: 2,
    },
    topicTitle: {
        flex: 1,
        ...typography.body,
        color: colors.textPrimary,
    },
    mapAction: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.lg,
        maxHeight: '80%',
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    sectionHeader: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    optionRow: {
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.itemBorder,
        borderRadius: 8,
        marginBottom: spacing.xs,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedOption: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '10', // hex with opacity approximation
    },
    coMappingContainer: {
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.itemBorder,
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
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: spacing.lg,
        gap: spacing.md,
    },
    cancelButton: {
        padding: spacing.md,
    },
    saveButton: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: 12,
        paddingHorizontal: spacing.xl,
    }
});
