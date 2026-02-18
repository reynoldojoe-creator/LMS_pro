import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { typography, spacing, borderRadius } from '../../theme';
import { useFacultyStore } from '../../store/facultyStore';
import { useAppTheme } from '../../hooks';
import { Header, Card, Input, EmptyState, LoadingSkeleton, ErrorState } from '../../components/common';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<any, 'Subjects'>;

export const SubjectsListScreen = ({ navigation }: Props) => {
    const { subjects, isLoadingSubjects, error, fetchSubjects } = useFacultyStore();
    const { colors } = useAppTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const styles = getStyles(colors);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const onRefresh = useCallback(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    const filteredSubjects = useMemo(() => {
        if (!searchQuery) return subjects;
        const query = searchQuery.toLowerCase();
        return subjects.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.code.toLowerCase().includes(query)
        );
    }, [subjects, searchQuery]);

    const renderContent = () => {
        if (isLoadingSubjects && subjects.length === 0) {
            return (
                <View style={styles.listContainer}>
                    {[1, 2, 3, 4].map(i => (
                        <LoadingSkeleton key={i} variant="card" height={100} style={{ marginBottom: 12 }} />
                    ))}
                </View>
            );
        }

        if (error && subjects.length === 0) {
            return <ErrorState message={error} onRetry={fetchSubjects} />;
        }

        if (subjects.length === 0) {
            return (
                <EmptyState
                    title="No Subjects"
                    description="You haven't created any subjects yet."
                    actionLabel="Create Subject"
                    onAction={() => navigation.navigate('AddSubject')}
                    icon="📚"
                />
            );
        }

        if (filteredSubjects.length === 0) {
            return (
                <View style={styles.emptySearch}>
                    <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                    <Text style={styles.emptySearchText}>No subjects found matching "{searchQuery}"</Text>
                </View>
            );
        }

        return (
            <ScrollView
                style={styles.scroller}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={isLoadingSubjects} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {filteredSubjects.map(subject => (
                    <TouchableOpacity
                        key={subject.id}
                        style={styles.card}
                        onPress={() => navigation.navigate('SubjectDetail', { subjectId: subject.id })}
                    >
                        <Card
                            title={subject.name}
                        // subtitle={`${subject.code} • ${subject.department}`}
                        >
                            <View style={styles.statsRow}>
                                <View style={styles.stat}>
                                    <Ionicons name="layers-outline" size={16} color={colors.textSecondary} />
                                    <Text style={styles.statText}>{subject.units?.length || 0} Units</Text>
                                </View>
                                <View style={styles.stat}>
                                    <Ionicons name="help-circle-outline" size={16} color={colors.textSecondary} />
                                    <Text style={styles.statText}>{subject.totalQuestions || 0} Questions</Text>
                                </View>
                            </View>
                            <View style={styles.chevron}>
                                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                            </View>
                        </Card>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header
                title="Subjects"
                showBackButton={false}
                rightAction={
                    <TouchableOpacity onPress={() => navigation.navigate('AddSubject')}>
                        <Ionicons name="add-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                }
            />
            {subjects.length > 0 && (
                <View style={styles.searchContainer}>
                    <Input
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search subjects..."
                    // leftIcon="search-outline"
                    />
                </View>
            )}
            <View style={styles.content}>
                {renderContent()}
            </View>
        </SafeAreaView>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    searchContainer: {
        paddingHorizontal: spacing.screenHorizontal,
        paddingBottom: spacing.sm,
    },
    content: {
        flex: 1,
    },
    scroller: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.screenHorizontal,
        paddingBottom: spacing.xl,
    },
    listContainer: {
        padding: spacing.screenHorizontal,
    },
    card: {
        marginBottom: spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: spacing.sm,
        gap: spacing.lg,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    chevron: {
        position: 'absolute',
        right: spacing.md,
        top: '50%',
        marginTop: -10,
    },
    emptySearch: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptySearchText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
        textAlign: 'center',
    },
});
