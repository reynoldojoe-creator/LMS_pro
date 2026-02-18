import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useFacultyStore } from '../../store';
import { EmptyState } from '../../components/common';

type Props = NativeStackScreenProps<any, 'UnitDetail'>;

export const UnitDetailScreen = ({ route, navigation }: Props) => {
    const { subjectId, unitId } = route.params as { subjectId: string; unitId: string };
    const { getSubjectById } = useFacultyStore();
    const subject = getSubjectById(subjectId);
    const unit = (subject?.units || []).find(u => u.id === unitId);

    if (!subject || !unit) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Unit not found</Text>
            </SafeAreaView>
        );
    }

    const handleTopicPress = (topicId: string) => {
        navigation.navigate('TopicDetail', { subjectId, unitId, topicId });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backChevron}>‹</Text>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Unit {unit.number}</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.unitInfo}>
                    <Text style={styles.unitTitle}>{unit.title}</Text>
                    <Text style={styles.unitDesc}>{unit.description || 'No description available'}</Text>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>TOPICS</Text>
                </View>

                <View style={styles.topicsList}>
                    {(unit.topics || []).length === 0 ? (
                        <EmptyState
                            icon="📝"
                            title="No Topics Found"
                            description="No topics have been added to this unit yet."
                        />
                    ) : (
                        (unit.topics || []).map((topic, index) => (
                            <TouchableOpacity
                                key={topic.id}
                                style={[
                                    styles.topicItem,
                                    index === 0 && styles.topicItemFirst,
                                    index === (unit.topics || []).length - 1 && styles.topicItemLast
                                ]}
                                onPress={() => handleTopicPress(topic.id)}
                            >
                                <View style={styles.topicContent}>
                                    <Text style={styles.topicName}>{topic.name}</Text>
                                    <View style={styles.topicMeta}>
                                        <Text style={styles.topicMetaText}>
                                            {topic.questionCount || 0} Questions Generated
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.chevron}>›</Text>
                            </TouchableOpacity>
                        ))
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
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        shadowColor: colors.shadowDark,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
        zIndex: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 80,
    },
    backChevron: {
        fontSize: 32,
        color: colors.primary,
        fontWeight: '300',
        marginRight: -4,
        marginTop: -4,
    },
    backText: {
        ...typography.body,
        color: colors.primary,
        fontSize: 17,
    },
    headerTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    placeholder: {
        width: 80,
    },
    scrollView: {
        flex: 1,
    },
    unitInfo: {
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginBottom: spacing.lg,
    },
    unitTitle: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    unitDesc: {
        ...typography.body,
        color: colors.textSecondary,
    },
    sectionHeader: {
        paddingHorizontal: spacing.screenHorizontal,
        marginBottom: spacing.xs,
    },
    sectionTitle: {
        ...typography.caption,
        color: colors.textTertiary,
        textShadowColor: colors.textShadow,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 0,
    },
    topicsList: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        marginHorizontal: spacing.screenHorizontal,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadowDark,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    topicItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    topicItemFirst: {
        borderTopLeftRadius: borderRadius.lg,
        borderTopRightRadius: borderRadius.lg,
    },
    topicItemLast: {
        borderBottomLeftRadius: borderRadius.lg,
        borderBottomRightRadius: borderRadius.lg,
        borderBottomWidth: 0,
    },
    topicContent: {
        flex: 1,
    },
    topicName: {
        ...typography.bodyBold,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    topicMeta: {
        flexDirection: 'row',
    },
    topicMetaText: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    chevron: {
        fontSize: 20,
        color: colors.iosGray3,
        fontWeight: '600',
        marginLeft: spacing.sm,
    },
});
