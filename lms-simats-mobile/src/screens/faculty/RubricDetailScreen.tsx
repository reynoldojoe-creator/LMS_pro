import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useRubricStore, useFacultyStore } from '../../store';
import { Button, Tag, Header } from '../../components/common';

type Props = NativeStackScreenProps<any, 'RubricDetail'>;

export const RubricDetailScreen = ({ route, navigation }: Props) => {
    const { rubricId } = route.params as { rubricId: string };
    const { getRubricById, generateFromRubric } = useRubricStore();
    const { subjects } = useFacultyStore();
    const [isGenerating, setIsGenerating] = useState(false);

    const rubric = getRubricById(rubricId);

    if (!rubric) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Rubric not found</Text>
            </SafeAreaView>
        );
    }

    const subject = subjects.find(s => s.id === rubric.subjectId);
    const s = rubric.sections;
    const totalQuestions = !s ? 0
        : Array.isArray(s) ? s.reduce((sum, item) => sum + (item.count || 0), 0)
            : typeof s === 'object' ? Object.values(s).reduce((sum: number, item: any) => sum + (item?.count || 0), 0)
                : 0;

    const handleEdit = () => {
        // TODO: Navigate to edit screen
    };

    const handleGenerate = async () => {
        if (isGenerating) return; // Prevent double-clicks

        setIsGenerating(true);
        try {
            console.log('Starting question generation for rubric:', rubric.id);
            const questions = await generateFromRubric(rubric.id);
            console.log('Generation complete, questions:', questions.length);
            setIsGenerating(false);
            navigation.navigate('GenerationResults', { generatedQuestions: questions });
        } catch (error: any) {
            console.error('Generation error:', error);
            setIsGenerating(false);
            Alert.alert(
                'Generation Failed',
                error?.message || 'Failed to generate questions. Please try again.',
                [{ text: 'OK' }]
            );
        }
    };

    const handleViewResults = () => {
        // Pass rubricId to let Results screen fetch if needed
        navigation.navigate('GenerationResults', { rubricId: rubric.id });
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            <Header
                title="Rubric Details"
                onBack={() => navigation.goBack()}
                rightAction={
                    <TouchableOpacity onPress={handleEdit}>
                        <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                }
            />

            <ScrollView>
                {/* Rubric Info */}
                <View style={styles.infoSection}>
                    <Text style={styles.title}>{rubric.title}</Text>
                    <Text style={styles.subject}>
                        {subject ? `${subject.code} - ${subject.name}` : 'Unknown Subject'}
                    </Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{rubric.totalMarks}</Text>
                            <Text style={styles.statLabel}>Marks</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{rubric.duration}</Text>
                            <Text style={styles.statLabel}>Minutes</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{String(totalQuestions)}</Text>
                            <Text style={styles.statLabel}>Questions</Text>
                        </View>
                    </View>
                </View>

                {/* Sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Question Distribution</Text>
                    {(() => {
                        // Normalize sections to array format
                        const sec = rubric.sections;
                        const sectionsArr = !sec ? []
                            : Array.isArray(sec) ? sec
                                : typeof sec === 'object'
                                    ? Object.entries(sec).map(([type, val]: [string, any]) => ({ type, ...val, id: type }))
                                    : [];
                        return sectionsArr.map((section: any, index: number) => (
                            <View key={section.id || section.type || index} style={styles.sectionCard}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionName}>
                                        Section {String.fromCharCode(65 + index)}: {(section.type || '').toUpperCase()}
                                    </Text>
                                    <Text style={styles.sectionMarks}>
                                        {(section.count || 0) * (section.marksEach || section.marks_each || 0)} marks
                                    </Text>
                                </View>
                                <Text style={styles.sectionDetail}>
                                    {section.count || 0} questions × {section.marksEach || section.marks_each || 0} marks each
                                </Text>
                                {section.choice && (
                                    <Text style={styles.sectionChoice}>
                                        Choice: {section.choice.replace('_', ' ')}
                                    </Text>
                                )}
                            </View>
                        ));
                    })()}
                </View>

                {/* Bloom's Distribution */}


                {/* Actions */}
                <View style={styles.actionSection}>
                    {rubric.status === 'created' && (
                        <>
                            {isGenerating ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={styles.loadingText}>Generating questions... This may take 30-60 seconds</Text>
                                </View>
                            ) : (
                                <Button
                                    title="Generate Questions"
                                    onPress={handleGenerate}
                                    variant="primary"
                                    fullWidth
                                    size="lg"
                                />
                            )}
                        </>
                    )}
                    {rubric.status === 'generated' && (
                        <>
                            <Text style={styles.generatedText}>
                                ✓ Questions generated on {new Date(rubric.generatedAt!).toLocaleDateString()}
                            </Text>
                            <View style={styles.actionGap} />
                            <Button
                                title="View Generated Questions"
                                onPress={handleViewResults}
                                variant="outline"
                                fullWidth
                                size="lg"
                            />
                        </>
                    )}
                </View>
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
    headerTitle: {
        ...typography.navTitle,
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    editText: {
        ...typography.body,
        color: colors.primary,
        flex: 1,
        textAlign: 'right',
    },
    infoSection: {
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    title: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    subject: {
        ...typography.body,
        color: colors.textSecondary,
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
    section: {
        marginTop: spacing.lg,
        marginHorizontal: spacing.screenHorizontal,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    sectionCard: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    sectionName: {
        ...typography.bodyBold,
        color: colors.textPrimary,
    },
    sectionMarks: {
        ...typography.bodyBold,
        color: colors.primary,
    },
    sectionDetail: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    sectionChoice: {
        ...typography.caption,
        color: colors.textSecondary,
        fontStyle: 'italic',
        marginTop: spacing.xs,
    },
    card: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    distributionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    distributionLabel: {
        ...typography.body,
        color: colors.textPrimary,
        width: 100,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: colors.iosGray5,
        borderRadius: borderRadius.full,
        overflow: 'hidden',
        marginHorizontal: spacing.sm,
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
    },
    distributionValue: {
        ...typography.caption,
        color: colors.textSecondary,
        width: 40,
        textAlign: 'right',
    },
    actionSection: {
        padding: spacing.lg,
        marginTop: spacing.lg,
    },
    generatedText: {
        ...typography.body,
        color: colors.success,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    actionGap: {
        height: spacing.md,
    },
    loadingContainer: {
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    loadingText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.md,
    },
});
