import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAppTheme } from '../../../../hooks';
import { spacing, typography, borderRadius } from '../../../../theme';
import { Button, LoadingSkeleton } from '../../../../components/common';
import { subjectService } from '../../../../services/subjectService';

interface Props {
    subjectId: string;
    onNext: () => void;
    onBack: () => void;
}

export const Step4Syllabus = ({ subjectId, onNext, onBack }: Props) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    const [file, setFile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [extractedData, setExtractedData] = useState<any>(null);

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel'
                ],
            });

            if (result.canceled) return;

            if (result.assets && result.assets.length > 0) {
                setFile(result.assets[0]);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsLoading(true);
        try {
            const fileToUpload = {
                uri: file.uri,
                type: file.mimeType || 'application/pdf',
                name: file.name
            };

            const data = await subjectService.uploadSyllabus(subjectId, fileToUpload);
            setExtractedData(data);
            Alert.alert("Success", "Syllabus processed and topics extracted!");
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to upload syllabus');
        } finally {
            setIsLoading(false);
        }
    };

    const totalTopics = extractedData?.units?.reduce(
        (sum: number, u: any) => sum + (u.topics?.length || 0), 0
    ) || 0;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Upload Syllabus</Text>
                <Text style={styles.subtitle}>
                    Upload PDF/DOCX. We will extract Units and Topics automatically.
                </Text>

                <TouchableOpacity style={styles.uploadArea} onPress={pickDocument}>
                    <Text style={styles.uploadIcon}>📄</Text>
                    <Text style={styles.uploadText}>{file ? file.name : "Select File"}</Text>
                </TouchableOpacity>

                {file && !extractedData && (
                    <Button
                        title="Upload & Process"
                        onPress={handleUpload}
                        loading={isLoading}
                        style={{ marginTop: spacing.lg }}
                        fullWidth
                    />
                )}

                {isLoading && (
                    <View style={{ marginTop: spacing.lg }}>
                        <Text style={{ textAlign: 'center', marginBottom: spacing.md, color: colors.textSecondary }}>Processing syllabus...</Text>
                        <LoadingSkeleton variant="list" />
                    </View>
                )}

                {extractedData && (
                    <View style={styles.resultContainer}>
                        <Text style={styles.sectionTitle}>Extracted Structure</Text>

                        {/* Summary bar */}
                        <View style={styles.summaryBar}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>{extractedData.units?.length || 0}</Text>
                                <Text style={styles.summaryLabel}>Units</Text>
                            </View>
                            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryValue}>{totalTopics}</Text>
                                <Text style={styles.summaryLabel}>Topics</Text>
                            </View>
                            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryValue, {
                                    color: (extractedData.metadata?.extraction_confidence || 0) > 0.8 ? '#34C759' :
                                        (extractedData.metadata?.extraction_confidence || 0) > 0.5 ? '#FF9500' : '#FF3B30'
                                }]}>
                                    {Math.round((extractedData.metadata?.extraction_confidence || 0) * 100)}%
                                </Text>
                                <Text style={styles.summaryLabel}>Confidence</Text>
                            </View>
                        </View>

                        {extractedData.metadata?.extraction_confidence < 0.7 && (
                            <View style={styles.warningBox}>
                                <Text style={styles.warningText}>⚠️ Low confidence extraction. Please review and edit below.</Text>
                            </View>
                        )}

                        {extractedData.units?.map((unit: any, i: number) => (
                            <View key={i} style={[styles.unitCard, {
                                borderColor: (unit.confidence || 1) < 0.7 ? '#FF9500' : colors.border
                            }]}>
                                {/* Unit header */}
                                <View style={styles.unitHeader}>
                                    <View style={[styles.unitBadge, {
                                        backgroundColor: (unit.confidence || 1) < 0.7 ? '#FF9500' : colors.primary
                                    }]}>
                                        <Text style={styles.unitBadgeText}>{unit.number || i + 1}</Text>
                                    </View>
                                    <View style={styles.unitHeaderText}>
                                        <Text style={styles.unitLabel}>Unit {unit.number || i + 1}</Text>
                                        <TextInput
                                            style={styles.unitTitleInput}
                                            value={unit.title}
                                            onChangeText={(text) => {
                                                const newUnits = [...extractedData.units];
                                                newUnits[i].title = text;
                                                setExtractedData({ ...extractedData, units: newUnits });
                                            }}
                                        />
                                    </View>
                                    <View style={styles.topicCountBadge}>
                                        <Text style={styles.topicCountText}>
                                            {unit.topics?.length || 0}
                                        </Text>
                                    </View>
                                </View>

                                {/* Topics */}
                                <View style={styles.topicList}>
                                    {unit.topics?.map((topic: any, j: number) => (
                                        <View key={j} style={[
                                            styles.topicRow,
                                            j % 2 === 0 && { backgroundColor: colors.background + '80' }
                                        ]}>
                                            <Text style={styles.topicNumber}>{j + 1}</Text>
                                            <TextInput
                                                style={styles.topicInput}
                                                value={typeof topic === 'string' ? topic : topic.name}
                                                onChangeText={(text) => {
                                                    const newUnits = [...extractedData.units];
                                                    if (typeof newUnits[i].topics[j] === 'string') {
                                                        newUnits[i].topics[j] = text;
                                                    } else {
                                                        newUnits[i].topics[j].name = text;
                                                    }
                                                    setExtractedData({ ...extractedData, units: newUnits });
                                                }}
                                                multiline
                                            />
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}

                        <Button
                            title="Confirm & Continue"
                            onPress={onNext}
                            style={{ marginTop: spacing.xl }}
                            fullWidth
                        />
                    </View>
                )}
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
        paddingBottom: 100,
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
    uploadArea: {
        height: 150,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderColor: colors.primary,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadIcon: {
        fontSize: 40,
        marginBottom: spacing.sm,
    },
    uploadText: {
        ...typography.bodyBold,
        color: colors.primary,
    },
    resultContainer: {
        marginTop: spacing.xl,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },

    // Summary bar
    summaryBar: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.primary,
    },
    summaryLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    summaryDivider: {
        width: 1,
        height: 30,
    },

    // Unit cards
    unitCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    unitHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    unitBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    unitBadgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    unitHeaderText: {
        flex: 1,
    },
    unitLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontSize: 10,
    },
    unitTitle: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        marginTop: 1,
    },
    topicCountBadge: {
        backgroundColor: colors.primary + '18',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginLeft: spacing.sm,
    },
    topicCountText: {
        ...typography.caption,
        color: colors.primary,
        fontWeight: '600',
    },

    // Topics
    topicList: {
        paddingVertical: spacing.xs,
    },
    topicRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
    },
    topicNumber: {
        ...typography.caption,
        color: colors.textSecondary,
        width: 22,
        fontWeight: '600',
        marginTop: 1,
    },
    topicItem: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
        lineHeight: 20,
    },
    warningBox: {
        backgroundColor: '#FF9500' + '20',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: '#FF9500',
    },
    warningText: {
        ...typography.captionBold,
        color: '#FF9500',
        textAlign: 'center',
    },
    unitTitleInput: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        marginTop: 1,
        padding: 0,
        height: 24,
    },
    topicInput: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
        padding: 0,
        minHeight: 20,
    },
});
