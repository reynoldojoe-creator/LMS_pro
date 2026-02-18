import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../theme';
import { StatBox, HorizontalBarChart, CoverageWarning } from '../../components/charts';
import { reportService } from '../../services/reportService';
import { subjectService } from '../../services/subjectService';
import type { OverviewStats, COCoverageItem, TopicCoverageItem } from '../../services/reportService';
import type { Subject } from '../../types';

export const ReportsScreen = () => {
    // ── State ──
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectIdx, setSelectedSubjectIdx] = useState(0); // 0 = "All Subjects"
    const [showSubjectPicker, setShowSubjectPicker] = useState(false);

    const [overview, setOverview] = useState<OverviewStats | null>(null);
    const [bloomsData, setBloomsData] = useState<Record<string, number>>({});
    const [coCoverage, setCoCoverage] = useState<COCoverageItem[]>([]);
    const [topicCoverage, setTopicCoverage] = useState<TopicCoverageItem[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Build display list: ["All Subjects", "CS301 - Data Structures", ...]
    const subjectOptions = ['All Subjects', ...subjects.map(s => `${s.code} - ${s.name}`)];

    // ── Fetch subjects on mount ──
    useEffect(() => {
        const loadSubjects = async () => {
            try {
                const data = await subjectService.getAll();
                setSubjects(data);
            } catch (err) {
                console.warn('Failed to load subjects for report filter', err);
            }
        };
        loadSubjects();
    }, []);

    // ── Fetch report data when subject changes ──
    const fetchReports = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Determine subject ID (undefined = all)
            const subjectId = selectedSubjectIdx > 0
                ? subjects[selectedSubjectIdx - 1]?.id
                : undefined;

            // Always fetch overview
            const overviewData = await reportService.getOverview(
                subjectId ? parseInt(subjectId, 10) : undefined
            );
            setOverview(overviewData);

            // Per-subject data only if a subject is selected
            if (subjectId) {
                const [blooms, cos, topics] = await Promise.all([
                    reportService.getBloomsDistribution(subjectId),
                    reportService.getCOCoverage(subjectId),
                    reportService.getTopicCoverage(subjectId),
                ]);
                setBloomsData(blooms);
                setCoCoverage(cos);
                setTopicCoverage(topics);
            } else {
                // Clear per-subject data when "All Subjects"
                setBloomsData({});
                setCoCoverage([]);
                setTopicCoverage([]);
            }
        } catch (err: any) {
            console.error('Reports fetch error:', err);
            setError(err.message || 'Failed to load reports');
        } finally {
            setIsLoading(false);
        }
    }, [selectedSubjectIdx, subjects]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    // ── Helpers ──
    const selectSubject = (index: number) => {
        setSelectedSubjectIdx(index);
        setShowSubjectPicker(false);
    };

    const maxBloomValue = Math.max(...Object.values(bloomsData), 1);

    // Detect under-represented COs (< 10%)
    const underRepresentedCOs = coCoverage.filter(c => c.question_count === 0);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Reports & Analytics</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Subject Filter */}
                <View style={styles.filtersSection}>
                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>Subject:</Text>
                        <TouchableOpacity
                            style={styles.picker}
                            onPress={() => setShowSubjectPicker(!showSubjectPicker)}
                        >
                            <Text style={styles.pickerText} numberOfLines={1}>
                                {subjectOptions[selectedSubjectIdx]}
                            </Text>
                            <Text style={styles.pickerChevron}>▼</Text>
                        </TouchableOpacity>
                    </View>

                    {showSubjectPicker && (
                        <View style={styles.pickerDropdown}>
                            {subjectOptions.map((label, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.pickerOption,
                                        index === selectedSubjectIdx && styles.pickerOptionActive,
                                    ]}
                                    onPress={() => selectSubject(index)}
                                >
                                    <Text
                                        style={[
                                            styles.pickerOptionText,
                                            index === selectedSubjectIdx && styles.pickerOptionTextActive,
                                        ]}
                                    >
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Loading / Error */}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Loading reports…</Text>
                    </View>
                )}

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={fetchReports}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!isLoading && !error && overview && (
                    <>
                        {/* Overview Stats */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Question Generation</Text>
                            <View style={styles.statsRow}>
                                <StatBox value={overview.total_questions} label="Generated" />
                                <StatBox value={overview.approved} label="Approved" color={colors.success} />
                                <StatBox value={`${overview.approval_rate}%`} label="Rate" color={colors.primary} />
                            </View>
                        </View>

                        {/* Pending / Rejected mini stats */}
                        <View style={styles.section}>
                            <View style={styles.statsRow}>
                                <StatBox value={overview.pending} label="Pending" color={colors.warning} />
                                <StatBox value={overview.rejected} label="Rejected" color={colors.error} />
                            </View>
                        </View>

                        {/* Bloom's Levels (per-subject only) */}
                        {Object.keys(bloomsData).length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Bloom's Level Coverage</Text>
                                <View style={styles.card}>
                                    {Object.entries(bloomsData).map(([level, count]) => (
                                        <HorizontalBarChart
                                            key={level}
                                            label={level}
                                            value={count}
                                            maxValue={maxBloomValue}
                                            color={colors.iosPurple}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* CO Coverage (per-subject only) */}
                        {coCoverage.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>
                                    CO Coverage ({subjectOptions[selectedSubjectIdx]})
                                </Text>
                                <View style={styles.card}>
                                    {coCoverage.map((item) => (
                                        <HorizontalBarChart
                                            key={item.co_code}
                                            label={item.co_code}
                                            value={item.question_count}
                                            maxValue={Math.max(...coCoverage.map(c => c.question_count), 1)}
                                            color={item.question_count === 0 ? colors.warning : colors.success}
                                        />
                                    ))}
                                    {underRepresentedCOs.length > 0 && (
                                        <CoverageWarning
                                            message={`${underRepresentedCOs.map(c => c.co_code).join(', ')} under-represented`}
                                            type="warning"
                                        />
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Topic Coverage (per-subject only) */}
                        {topicCoverage.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Topic Coverage</Text>
                                <View style={styles.card}>
                                    {topicCoverage.map((item) => (
                                        <HorizontalBarChart
                                            key={String(item.topic_id)}
                                            label={item.topic_name}
                                            value={item.count}
                                            maxValue={Math.max(...topicCoverage.map(t => t.count), 1)}
                                            color={colors.iosBlue}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Prompt to select a subject */}
                        {selectedSubjectIdx === 0 && (
                            <View style={styles.section}>
                                <CoverageWarning
                                    message="Select a subject to see Bloom's, CO, and Topic breakdowns"
                                    type="info"
                                />
                            </View>
                        )}
                    </>
                )}

                <View style={styles.bottomPadding} />
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
        paddingHorizontal: spacing.screenHorizontal,
        paddingVertical: spacing.md,
    },
    headerTitle: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    scrollView: {
        flex: 1,
    },
    filtersSection: {
        paddingHorizontal: spacing.screenHorizontal,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterLabel: {
        ...typography.body,
        color: colors.textPrimary,
        width: 80,
    },
    picker: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: spacing.sm,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    pickerText: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
    },
    pickerChevron: {
        ...typography.caption,
        color: colors.iosGray3,
        marginLeft: spacing.xs,
    },
    pickerDropdown: {
        marginTop: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    pickerOption: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    pickerOptionActive: {
        backgroundColor: colors.primary + '15',
    },
    pickerOptionText: {
        ...typography.body,
        color: colors.textPrimary,
    },
    pickerOptionTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    section: {
        marginTop: spacing.lg,
        marginHorizontal: spacing.screenHorizontal,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    card: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    loadingContainer: {
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    errorContainer: {
        margin: spacing.screenHorizontal,
        padding: spacing.lg,
        backgroundColor: colors.error + '10',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.error + '30',
        alignItems: 'center',
    },
    errorText: {
        ...typography.body,
        color: colors.error,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: 8,
    },
    retryButtonText: {
        ...typography.bodyBold,
        color: '#fff',
    },
    bottomPadding: {
        height: spacing.xl,
    },
});
