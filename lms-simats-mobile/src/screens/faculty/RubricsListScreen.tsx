import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useRubricStore } from '../../store';
import { useFacultyStore } from '../../store';
import { SegmentedControl, EmptyState, LoadingSpinner, Tag } from '../../components/common';

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
    const filteredRubrics = rubrics.filter(r => r.status === filterStatus);

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

    const getTotalQuestions = (rubric: any) => {
        const s = rubric.sections;
        if (!s) return 0;
        if (Array.isArray(s)) return s.reduce((sum: number, item: any) => sum + (item.count || 0), 0);
        if (typeof s === 'object') return Object.values(s).reduce((sum: number, item: any) => sum + (item?.count || 0), 0);
        return 0;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return colors.iosGray;
            case 'created': return colors.primary;
            case 'generated': return colors.success;
            default: return colors.textSecondary;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'draft': return 'Draft';
            case 'created': return 'Ready to Generate';
            case 'generated': return 'Generated';
            default: return status;
        }
    };

    if (isLoading && rubrics.length === 0) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Exam Rubrics</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddRubric}>
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            {/* Filter */}
            <View style={styles.filterContainer}>
                <SegmentedControl
                    segments={STATUS_FILTERS}
                    selectedIndex={selectedFilter}
                    onChange={setSelectedFilter}
                />
            </View>

            {/* Rubrics List */}
            <ScrollView style={styles.scrollView}>
                {filteredRubrics.length === 0 ? (
                    <EmptyState
                        icon="📋"
                        title={`No ${STATUS_FILTERS[selectedFilter]}`}
                        description="Create a new exam rubric to get started"
                        actionLabel="Create Rubric"
                        onAction={handleAddRubric}
                    />
                ) : (
                    <View style={styles.rubricsList}>
                        {filteredRubrics.map((rubric) => (
                            <TouchableOpacity
                                key={rubric.id}
                                style={styles.rubricCard}
                                onPress={() => handleRubricPress(rubric.id)}
                                onLongPress={() => handleDeleteRubric(rubric.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.rubricHeader}>
                                    <Text style={styles.rubricTitle}>{rubric.title}</Text>
                                </View>

                                <Text style={styles.rubricSubject}>{getSubjectName(rubric.subjectId)}</Text>

                                <View style={styles.rubricMeta}>
                                    <Text style={styles.metaText}>
                                        {rubric.totalMarks} marks • {rubric.duration} min • {getTotalQuestions(rubric)} Qs
                                    </Text>
                                </View>

                                <View style={styles.rubricFooter}>
                                    <View style={styles.statusRow}>
                                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(rubric.status) }]} />
                                        <Text style={styles.statusText}>{getStatusLabel(rubric.status)}</Text>
                                    </View>

                                    {rubric.status === 'created' && (
                                        <TouchableOpacity
                                            style={styles.generateButton}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                navigation.navigate('RubricDetail', { rubricId: rubric.id });
                                            }}
                                        >
                                            <Text style={styles.generateButtonText}>Generate ▶</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <Text style={styles.createdDate}>
                                    Created: {new Date(rubric.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
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
    },
    headerTitle: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.full,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 24,
        color: colors.textInverse,
        fontWeight: '300',
    },
    filterContainer: {
        paddingHorizontal: spacing.screenHorizontal,
        marginBottom: spacing.md,
    },
    scrollView: {
        flex: 1,
    },
    rubricsList: {
        padding: spacing.screenHorizontal,
    },
    rubricCard: {
        backgroundColor: colors.surface,
        padding: spacing.cardPadding,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    rubricHeader: {
        marginBottom: spacing.xs,
    },
    rubricTitle: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    rubricSubject: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    rubricMeta: {
        marginBottom: spacing.md,
    },
    metaText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    rubricFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: spacing.xs,
    },
    statusText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    generateButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    generateButtonText: {
        ...typography.captionBold,
        color: colors.textInverse,
    },
    createdDate: {
        ...typography.caption,
        color: colors.textTertiary,
    },
});
