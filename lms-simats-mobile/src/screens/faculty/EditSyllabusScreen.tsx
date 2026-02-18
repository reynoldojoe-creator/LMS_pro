import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useFacultyStore } from '../../store';
import { LoadingSpinner, Button } from '../../components/common';

type Props = NativeStackScreenProps<any, 'EditSyllabus'>;

export const EditSyllabusScreen = ({ route, navigation }: Props) => {
    const { subjectId } = route.params as { subjectId: string };
    const { getSubjectById, fetchSubjectDetail, updateUnit, updateTopic, isLoadingSubjects } = useFacultyStore();

    // Local state for editing to avoid constant store updates/re-renders on every keystroke
    const [units, setUnits] = useState<any[]>([]);
    const [originalSubject, setOriginalSubject] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (!subjectId) return;
            // Fetch fresh data
            await fetchSubjectDetail(subjectId);
            const sub = getSubjectById(subjectId);
            if (sub) {
                setOriginalSubject(sub);
                // Deep copy to allow editing
                setUnits(JSON.parse(JSON.stringify(sub.units || [])));
            }
        };
        load();
    }, [subjectId]);

    const handleUnitChange = (unitId: string, text: string) => {
        setUnits(prev => prev.map(u => u.id === unitId ? { ...u, title: text } : u));
        setDirty(true);
    };

    const handleTopicChange = (unitId: string, topicId: string, text: string) => {
        setUnits(prev => prev.map(u => {
            if (u.id === unitId) {
                return {
                    ...u,
                    topics: u.topics.map((t: any) => t.id === topicId ? { ...t, name: text } : t)
                };
            }
            return u;
        }));
        setDirty(true);
    };

    const handleSave = async () => {
        if (!dirty) {
            navigation.goBack();
            return;
        }

        setIsSaving(true);
        try {
            // We save changes individually. In a real app, a bulk update API implies less traffic.
            // But we only have individual endpoints.
            // Identify changes
            const promises = [];

            // Check Units
            for (const unit of units) {
                const originalUnit = originalSubject.units.find((u: any) => u.id === unit.id);
                if (originalUnit && originalUnit.title !== unit.title) {
                    promises.push(updateUnit(subjectId, unit.id, unit.title));
                }

                // Check Topics
                for (const topic of unit.topics) {
                    const originalTopic = originalUnit?.topics.find((t: any) => t.id === topic.id);
                    if (originalTopic && originalTopic.name !== topic.name) {
                        promises.push(updateTopic(subjectId, topic.id, topic.name));
                    }
                }
            }

            await Promise.all(promises);

            Alert.alert("Success", "Syllabus updated successfully", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert("Error", "Failed to save changes: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!originalSubject && isLoadingSubjects) {
        return (
            <SafeAreaView style={styles.container}>
                <LoadingSpinner />
            </SafeAreaView>
        );
    }

    if (!originalSubject) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Subject not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Syllabus</Text>
                    <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isSaving}>
                        {isSaving ? <LoadingSpinner size="small" /> : <Text style={styles.saveText}>Save</Text>}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                    <Text style={styles.hint}>Tap on any unit or topic name to edit.</Text>

                    {units.map((unit) => (
                        <View key={unit.id} style={styles.unitSection}>
                            <View style={styles.unitHeader}>
                                <Text style={styles.unitLabel}>Unit {unit.number}</Text>
                                <TextInput
                                    style={styles.unitInput}
                                    value={unit.title}
                                    onChangeText={(text) => handleUnitChange(unit.id, text)}
                                    placeholder="Unit Title"
                                />
                            </View>

                            <View style={styles.topicsList}>
                                {unit.topics.map((topic: any) => (
                                    <View key={topic.id} style={styles.topicRow}>
                                        <Text style={styles.bullet}>•</Text>
                                        <TextInput
                                            style={styles.topicInput}
                                            value={topic.name}
                                            onChangeText={(text) => handleTopicChange(unit.id, topic.id, text)}
                                            placeholder="Topic Name"
                                            multiline
                                        />
                                    </View>
                                ))}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </KeyboardAvoidingView>
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
        padding: spacing.sm,
    },
    backText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    headerTitle: {
        ...typography.navTitle,
        color: colors.textPrimary,
    },
    saveButton: {
        padding: spacing.sm,
    },
    saveText: {
        ...typography.bodyBold,
        color: colors.primary,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    hint: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    unitSection: {
        marginBottom: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    unitHeader: {
        marginBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.iosGray6,
        paddingBottom: spacing.sm,
    },
    unitLabel: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: '700',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    unitInput: {
        ...typography.h3,
        color: colors.textPrimary,
        padding: 0,
    },
    topicsList: {
        gap: spacing.sm,
    },
    topicRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    bullet: {
        fontSize: 16,
        color: colors.textTertiary,
        marginRight: spacing.sm,
        marginTop: 2,
    },
    topicInput: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
        padding: 0,
        minHeight: 24,
    },
});
