import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRubricStore } from '../../store';
import { useFacultyStore } from '../../store';
import { LoadingSpinner } from '../../components/common';
import { LinenBackground, GlossyNavBar, GlossyCard, GlossyButton } from '../../components/ios6';
import { colors, spacing } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<any, 'RubricsList'>;

const STATUS_FILTERS = ['Drafts', 'Created', 'Generated'];

export const RubricsListScreen = ({ navigation }: Props) => {
    const { rubrics, fetchRubrics, deleteRubric, isLoading } = useRubricStore();
    const { subjects, fetchSubjects } = useFacultyStore();
    const [selectedFilter, setSelectedFilter] = useState(0);

    useEffect(() => {
        fetchRubrics();
        fetchSubjects();
    }, []);

    const filterStatus = STATUS_FILTERS[selectedFilter].toLowerCase();
    const filteredRubrics = rubrics.filter(r => r.status === filterStatus || (filterStatus === 'drafts' && r.status === 'draft'));

    const handleAddRubric = () => {
        navigation.navigate('RubricSubjectSelection');
    };

    const handleRubricPress = (rubricId: string) => {
        navigation.navigate('RubricDetail', { rubricId });
    };

    const handleDeleteRubric = (rubricId: string) => {
        Alert.alert(
            'Delete Rubric',
            'Are you sure you want to delete this rubric?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteRubric(rubricId)
                },
            ]
        );
    };

    const getSubjectName = (subjectId: string) => {
        const subject = subjects.find(s => s.id === subjectId);
        return subject ? `${subject.code} - ${subject.name}` : 'Unknown Subject';
    };

    // Helper to calculate total questions if sections structure varies
    const getTotalQuestions = (rubric: any) => {
        const s = rubric.sections;
        if (!s) return 0;
        if (Array.isArray(s)) return s.reduce((sum: number, item: any) => sum + (item.count || 0), 0);
        if (typeof s === 'object') return Object.values(s).reduce((sum: number, item: any) => sum + (item?.count || 0), 0);
        return 0;
    };

    if (isLoading && rubrics.length === 0) {
        return (
            <LinenBackground>
                <GlossyNavBar title="Rubrics" />
                <View style={styles.center}>
                    <LoadingSpinner />
                </View>
            </LinenBackground>
        );
    }

    return (
        <LinenBackground>
            <GlossyNavBar
                title="Exam Rubrics"
                showBack
                onBack={() => navigation.goBack()}
                rightButton={
                    <TouchableOpacity onPress={handleAddRubric}>
                        <Ionicons name="add" size={28} color="white" style={styles.navIcon} />
                    </TouchableOpacity>
                }
            />

            {/* Filter Segmented Control Replacement - Custom Tab Bar */}
            <View style={styles.filterContainer}>
                {STATUS_FILTERS.map((filter, index) => (
                    <TouchableOpacity
                        key={filter}
                        style={[styles.filterTab, selectedFilter === index && styles.filterTabSelected]}
                        onPress={() => setSelectedFilter(index)}
                    >
                        <Text style={[styles.filterText, selectedFilter === index && styles.filterTextSelected]}>
                            {filter}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {filteredRubrics.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No {STATUS_FILTERS[selectedFilter]} Rubrics</Text>
                        <GlossyButton title="Create New Rubric" onPress={handleAddRubric} style={styles.createButton} />
                    </View>
                ) : (
                    filteredRubrics.map((rubric) => (
                        <GlossyCard key={rubric.id} title={rubric.title}>
                            <TouchableOpacity
                                onPress={() => handleRubricPress(rubric.id)}
                                onLongPress={() => handleDeleteRubric(rubric.id)}
                            >
                                <Text style={styles.subjectName}>{getSubjectName(rubric.subjectId)}</Text>
                                <Text style={styles.metaText}>
                                    {rubric.totalMarks} Marks • {rubric.duration} Mins • {getTotalQuestions(rubric)} Qs
                                </Text>

                                <View style={styles.footer}>
                                    <View style={[
                                        styles.statusBadge,
                                        rubric.status === 'generated' ? styles.statusGenerated : styles.statusDraft
                                    ]}>
                                        <Text style={styles.statusText}>{rubric.status.toUpperCase()}</Text>
                                    </View>

                                    {rubric.status === 'created' && (
                                        <GlossyButton
                                            title="Generate"
                                            onPress={() => navigation.navigate('RubricDetail', { rubricId: rubric.id })}
                                            size="small"
                                        />
                                    )}
                                </View>
                            </TouchableOpacity>
                        </GlossyCard>
                    ))
                )}
            </ScrollView>
        </LinenBackground>
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navIcon: {
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: -1 },
        textShadowRadius: 0,
    },
    filterContainer: {
        flexDirection: 'row',
        padding: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: 'white',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 0,
    },
    filterTab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 6,
        borderRadius: borderRadius.sm,
    },
    filterTabSelected: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2, // inner shadow simulation? no, drop shadow
        // To simulate inner shadow in RN is hard, just use darker bg
    },
    filterText: {
        color: '#4C566C',
        fontWeight: 'bold',
        fontSize: 13,
        textShadowColor: 'rgba(255,255,255,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 0,
    },
    filterTextSelected: {
        color: 'white',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: -1 },
        textShadowRadius: 0,
    },
    scrollView: {
        flex: 1,
        marginTop: spacing.sm,
    },
    contentContainer: {
        paddingBottom: spacing.xl,
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
        marginBottom: spacing.lg,
        fontStyle: 'italic',
        textShadowColor: 'white',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 0,
    },
    createButton: {
        minWidth: 200,
    },
    subjectName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    metaText: {
        fontSize: 13,
        color: '#666',
        marginBottom: spacing.md,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: spacing.sm,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: '#DDD',
    },
    statusGenerated: {
        backgroundColor: '#E0F8E0',
        borderWidth: 1,
        borderColor: '#B0E0B0',
    },
    statusDraft: {
        backgroundColor: '#F0F0F0',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#555',
    },
});
