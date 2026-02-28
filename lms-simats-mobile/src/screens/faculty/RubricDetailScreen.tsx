import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useRubricStore, useFacultyStore } from '../../store';
import { ScreenBackground, ModernNavBar, Card, ModernButton } from '../../components/common';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<any, 'RubricDetail'>;

export const RubricDetailScreen = ({ route, navigation }: Props) => {
    const { rubricId } = route.params as { rubricId: string };
    const { getRubricById, generateFromRubric } = useRubricStore();
    const { subjects } = useFacultyStore();
    const [isGenerating, setIsGenerating] = useState(false);

    const rubric = getRubricById(rubricId);

    if (!rubric) {
        return (
            <ScreenBackground>
                <ModernNavBar title="Rubric Detail" showBack onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <Text>Rubric not found</Text>
                </View>
            </ScreenBackground>
        );
    }

    // Find subject data
    const subject = subjects.find(s => String(s.id) === String(rubric.subjectId));

    // Fix: Use subjectName from rubric if available (backend sends it), or fallback to store lookup
    const subjectDisplayName = (rubric as any).subjectName
        || (subject ? `${subject.code} - ${subject.name}` : null)
        || 'Unknown Subject';

    // Fetch subjects if not loaded (fixes issue where subject is unknown if navigated directly)
    React.useEffect(() => {
        if (subjects.length === 0) {
            useFacultyStore.getState().fetchSubjects();
        }
    }, []);

    const s = rubric.sections;
    const totalQuestions = !s ? 0
        : Array.isArray(s) ? s.reduce((sum, item) => sum + (item.count || 0), 0)
            : typeof s === 'object' ? Object.values(s).reduce((sum: number, item: any) => sum + (item?.count || 0), 0)
                : 0;

    const handleEdit = () => {
        // TODO: Navigate to edit screen
    };

    const handleGenerate = async () => {
        console.log('[DEBUG] handleGenerate clicked, isGenerating:', isGenerating);
        if (isGenerating) return;

        setIsGenerating(true);
        try {
            console.log(`[DEBUG] Calling generateFromRubric for rubricId: ${rubric.id}`);
            const questions = await generateFromRubric(rubric.id);
            console.log(`[DEBUG] generateFromRubric succeeded, got ${questions.length} questions`);
            setIsGenerating(false);
            navigation.navigate('GenerationResults', { generatedQuestions: questions, rubricId: rubric.id });
        } catch (error: any) {
            setIsGenerating(false);
            Alert.alert(
                'Generation Failed',
                error?.message || 'Failed to generate questions. Please try again.',
                [{ text: 'OK' }]
            );
        }
    };

    const handleViewResults = () => {
        navigation.navigate('GenerationResults', { rubricId: rubric.id });
    };

    // Normalize sections to array format
    const sec = rubric.sections;
    const sectionsArr = !sec ? []
        : Array.isArray(sec) ? sec
            : typeof sec === 'object'
                ? Object.entries(sec).map(([type, val]: [string, any]) => ({ type, ...val, id: type }))
                : [];

    return (
        <ScreenBackground>
            <ModernNavBar
                title="Rubric Details"
                showBack
                onBack={() => navigation.goBack()}
                rightButton={
                    <TouchableOpacity onPress={handleEdit}>
                        <Text style={styles.navText}>Edit</Text>
                    </TouchableOpacity>
                }
            />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Rubric Info */}
                <Card title="Overview" style={styles.card}>
                    <Text style={styles.title}>{rubric.title}</Text>
                    <Text style={styles.subject}>
                        {subjectDisplayName}
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
                </Card>

                {/* Sections */}
                <Text style={styles.sectionHeader}>QUESTION DISTRIBUTION</Text>
                {sectionsArr.map((section: any, index: number) => (
                    <Card key={section.id || section.type || index} style={styles.card}>
                        <View style={styles.sectionHeaderRow}>
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
                    </Card>
                ))}

                {/* Actions */}
                <View style={styles.actionSection}>
                    {rubric.status === 'created' && (
                        <>
                            {isGenerating ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={styles.loadingText}>Generating questions...</Text>
                                </View>
                            ) : (
                                <ModernButton
                                    title="Generate Questions"
                                    onPress={handleGenerate}
                                    variant="primary"
                                    style={{ marginBottom: 20 }}
                                />
                            )}
                        </>
                    )}
                    {rubric.status === 'generated' && (
                        <>
                            <Text style={styles.generatedText}>
                                ✓ Generated on {rubric.generatedAt ? new Date(rubric.generatedAt).toLocaleDateString() : 'Unknown Date'}
                            </Text>
                            <ModernButton
                                title="View Generated Questions"
                                onPress={handleViewResults}
                                variant="secondary"
                                style={{ marginTop: 10 }}
                            />
                        </>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: {
        paddingBottom: spacing.xl,
        paddingTop: spacing.md,
    },
    navText: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 17,
    },
    title: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    subject: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.iosGray4,
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
        height: 30,
        backgroundColor: colors.divider,
        marginHorizontal: spacing.sm,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4C566C',
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
        marginLeft: spacing.lg,
        textShadowColor: 'rgba(255,255,255,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 0,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    sectionName: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333',
    },
    sectionMarks: {
        fontWeight: 'bold',
        color: colors.primary,
    },
    sectionDetail: {
        fontSize: 14,
        color: '#666',
    },
    sectionChoice: {
        fontSize: 13,
        color: '#888',
        fontStyle: 'italic',
        marginTop: 4,
    },
    actionSection: {
        padding: spacing.lg,
        marginTop: spacing.md,
    },
    generatedText: {
        textAlign: 'center',
        color: colors.success,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    loadingText: {
        marginLeft: 10,
        color: '#555',
    },
    card: {
        marginBottom: spacing.md,
    }
});
