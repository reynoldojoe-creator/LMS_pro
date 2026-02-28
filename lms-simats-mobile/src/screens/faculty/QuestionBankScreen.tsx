import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenBackground, ModernNavBar, Card, ModernButton, Input, Tag } from '../../components/common';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useFacultyStore } from '../../store/facultyStore';
import { Ionicons } from '@expo/vector-icons';
import { Question } from '../../types';

type Props = NativeStackScreenProps<any, 'QuestionBank'>;

export const QuestionBankScreen = ({ navigation }: Props) => {
    const { questions, fetchQuestions, isLoadingQuestions, subjects } = useFacultyStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string | null>(null);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = (q.questionText || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType ? q.type === selectedType : true;
        return matchesSearch && matchesType;
    });

    const renderQuestionItem = ({ item }: { item: Question }) => (
        <Card style={styles.card} onPress={() => navigation.navigate('QuestionPreview', { question: item })}>
            <View style={styles.headerRow}>
                <Tag
                    label={item.type === 'mcq' ? 'MCQ' : item.type === 'short' ? 'Short' : 'Essay'}
                    size="sm"
                    variant="default"
                    color={colors.systemGray5}
                />
                <Tag
                    label={item.difficulty}
                    size="sm"
                    variant="difficulty"
                    difficulty={item.difficulty}
                />
            </View>
            <Text style={styles.questionText} numberOfLines={3}>{item.questionText}</Text>
            <View style={styles.footerRow}>
                <Text style={styles.metaText}>Subject ID: {item.subjectId}</Text>
                <Tag
                    label={item.status}
                    size="sm"
                    variant="status"
                    status={item.status}
                />
            </View>
        </Card>
    );

    return (
        <ScreenBackground>
            <ModernNavBar
                title="Question Bank"
                showBack
                onBack={() => navigation.goBack()}
            />

            <View style={styles.filterContainer}>
                <Input
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    variant="filled"
                    leftIcon="search"
                />
                <View style={styles.chipsRow}>
                    {['mcq', 'short', 'essay'].map(type => (
                        <TouchableOpacity
                            key={type}
                            onPress={() => setSelectedType(selectedType === type ? null : type)}
                            style={[
                                styles.chip,
                                selectedType === type && styles.chipSelected
                            ]}
                        >
                            <Text style={[
                                styles.chipText,
                                selectedType === type && styles.chipTextSelected
                            ]}>
                                {type.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {isLoadingQuestions && questions.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredQuestions}
                    renderItem={renderQuestionItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No questions found.</Text>
                        </View>
                    }
                />
            )}
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    filterContainer: {
        padding: spacing.md,
        backgroundColor: colors.background,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.separator,
    },
    chipsRow: {
        flexDirection: 'row',
        marginTop: spacing.sm,
        gap: spacing.sm,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: colors.systemGray6,
    },
    chipSelected: {
        backgroundColor: colors.primary,
    },
    chipText: {
        ...typography.caption1,
        color: colors.text,
    },
    chipTextSelected: {
        color: colors.textInverse,
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: 80, // Tab bar inset
    },
    card: {
        marginBottom: spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    questionText: {
        ...typography.body,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    metaText: {
        ...typography.caption2,
        color: colors.textTertiary,
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
    },
});
