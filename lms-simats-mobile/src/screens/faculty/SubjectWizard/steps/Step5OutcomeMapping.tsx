import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal } from 'react-native';
import { useAppTheme } from '../../../../hooks';
import { spacing, typography} from '../../../../theme';
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
    const [selectedCOs, setSelectedCOs] = useState<number[]>([]);
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

    const toggleCO = (id: number) => {
        if (selectedCOs.includes(id)) {
            setSelectedCOs(selectedCOs.filter(c => c !== id));
        } else {
            setSelectedCOs([...selectedCOs, id]);
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
                                {subject.courseOutcomes?.map((co: any) => (
                                    <TouchableOpacity
                                        key={co.id}
                                        style={[
                                            styles.optionRow,
                                            selectedCOs.includes(co.id) && styles.selectedOption
                                        ]}
                                        onPress={() => toggleCO(co.id)}
                                    >
                                        <Text style={{ color: colors.textPrimary }}>{co.code}: {co.description?.substring(0, 30)}...</Text>
                                        {selectedCOs.includes(co.id) && <Text style={{ color: colors.primary }}>✓</Text>}
                                    </TouchableOpacity>
                                ))}

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
: 8,
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
: 16,
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
: 8,
        marginBottom: spacing.xs,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedOption: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '10', // hex with opacity approximation
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
: 12,
        paddingHorizontal: spacing.xl,
    }
});
