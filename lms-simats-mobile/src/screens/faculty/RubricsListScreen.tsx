import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRubricStore } from '../../store';
import { useFacultyStore } from '../../store';
import { LoadingSpinner, ScreenBackground, ModernNavBar, ModernButton, Card, SegmentedControl } from '../../components/common';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
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
        const subject = subjects.find(s => String(s.id) === String(subjectId));
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
            <ScreenBackground>
                <ModernNavBar title="Rubrics" />
                <View style={styles.center}>
                    <LoadingSpinner />
                </View>
            </ScreenBackground>
        );
    }

    return (
        <ScreenBackground>
            <ModernNavBar
                title="Exam Rubrics"
                showBack
                onBack={() => navigation.goBack()}
                rightButton={
                    <TouchableOpacity onPress={handleAddRubric}>
                        <Ionicons name="add" size={24} color={colors.primary} />
                    </TouchableOpacity>
                }
            />

            <View style={styles.filterContainer}>
                <SegmentedControl
                    segments={STATUS_FILTERS}
                    selectedIndex={selectedFilter}
                    onChange={setSelectedFilter}
                />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {filteredRubrics.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No {STATUS_FILTERS[selectedFilter]} Rubrics</Text>
                        <ModernButton
                            title="Create New Rubric"
                            onPress={handleAddRubric}
                            variant="primary"
                            style={styles.createButton}
                        />
                    </View>
                ) : (
                    filteredRubrics.map((rubric) => (
                        <Card key={rubric.id} title={rubric.title} style={styles.card} onPress={() => handleRubricPress(rubric.id)}>
                            <TouchableOpacity
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
                                        <Text style={[
                                            styles.statusText,
                                            rubric.status === 'generated' ? { color: colors.success } : { color: colors.textSecondary }
                                        ]}>{rubric.status.toUpperCase()}</Text>
                                    </View>

                                    {rubric.status === 'created' && (
                                        <ModernButton
                                            title="Generate"
                                            onPress={() => navigation.navigate('RubricDetail', { rubricId: rubric.id })}
                                            size="small"
                                            variant="secondary"
                                        />
                                    )}
                                </View>
                            </TouchableOpacity>
                        </Card>
                    ))
                )}
            </ScrollView>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterContainer: {
        marginTop: spacing.md,
        paddingHorizontal: spacing.md,
    },
    scrollView: {
        flex: 1,
        marginTop: spacing.sm,
    },
    contentContainer: {
        paddingBottom: spacing.xl,
        paddingHorizontal: spacing.md,
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    createButton: {
        minWidth: 200,
    },
    card: {
        marginBottom: spacing.md,
    },
    subjectName: {
        ...typography.captionBold,
        color: colors.primary,
        marginBottom: 4,
    },
    metaText: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.divider,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    statusGenerated: {
        backgroundColor: colors.success + '20',
        borderWidth: 1,
        borderColor: colors.success + '50',
    },
    statusDraft: {
        backgroundColor: colors.systemGray5,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
});
