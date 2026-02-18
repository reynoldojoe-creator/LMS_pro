import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing } from '../../theme';
import { useRubricStore, useFacultyStore } from '../../store';
import { LinenBackground, GlossyNavBar, GlossyCard, GlossyButton } from '../../components/ios6';
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
            <LinenBackground>
                <GlossyNavBar title="Rubric Detail" showBack onBack={() => navigation.goBack()} />
                <View style={styles.center}>
                    <Text>Rubric not found</Text>
                </View>
            </LinenBackground>
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
        if (isGenerating) return;

        setIsGenerating(true);
        try {
            const questions = await generateFromRubric(rubric.id);
            setIsGenerating(false);
            navigation.navigate('GenerationResults', { generatedQuestions: questions });
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
        <LinenBackground>
            <GlossyNavBar
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
                <GlossyCard title="Overview">
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
                </GlossyCard>

                {/* Sections */}
                <Text style={styles.sectionHeader}>QUESTION DISTRIBUTION</Text>
                {sectionsArr.map((section: any, index: number) => (
                    <GlossyCard key={section.id || section.type || index}>
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
                    </GlossyCard>
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
                                <GlossyButton
                                    title="Generate Questions"
                                    onPress={handleGenerate}
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
                            <GlossyButton
                                title="View Generated Questions"
                                onPress={handleViewResults}
                                style={{ marginTop: 10 }}
                            />
                        </>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </LinenBackground>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: {
        paddingBottom: spacing.xl,
        paddingTop: spacing.md,
    },
    navText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: -1 },
        textShadowRadius: 0,
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
    }
});
