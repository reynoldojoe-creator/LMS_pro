import React, { useState } from 'react';
// Re-saving to fix potential resolution issue
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Card } from '../common/Card'; // Assuming Card exists in common
import { Tag } from '../common/Tag'; // Assuming Tag exists in common
import { typography, spacing} from '../../theme';
import { useAppTheme } from '../../hooks';
import { Question } from '../../types'; // Assuming Question type exists

interface QuestionCardProps {
    question: Question;
    index: number;
    onApprove?: () => void;
    onReject?: () => void;
    onQuarantine?: () => void;
    readOnly?: boolean;
}

export const QuestionCard = ({
    question,
    index,
    onApprove,
    onReject,
    onQuarantine,
    readOnly = false,
}: QuestionCardProps) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'success';
            case 'rejected': return 'error';
            case 'quarantined': return 'warning';
            default: return 'info'; // or primary
        }
    };

    return (
        <Card style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.questionNumber}>Q{index}</Text>
                <Tag
                    label={question.status.toUpperCase()}
                    variant={getStatusColor(question.status) as any}
                    size="sm"
                />
            </View>

            <Text style={styles.questionText}>{question.questionText}</Text>

            <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Type:</Text>
                    <Text style={styles.metaValue}>{question.type}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Bloom:</Text>
                    <Text style={styles.metaValue}>{question.bloomLevel}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Difficulty:</Text>
                    <Text style={styles.metaValue}>{question.difficulty}</Text>
                </View>
            </View>

            {question.options && (
                <View style={styles.optionsContainer}>
                    {/* Render options if MCQ */}
                    {(() => {
                        let optionsToRender = question.options;

                        // Safety parsing if still a string
                        if (typeof optionsToRender === 'string') {
                            try {
                                optionsToRender = JSON.parse(optionsToRender);
                            } catch {
                                return <Text style={{ color: colors.error }}>Invalid options format</Text>;
                            }
                        }

                        if (Array.isArray(optionsToRender)) {
                            return optionsToRender.map((opt, idx) => (
                                <View key={idx} style={{ flexDirection: 'row', marginBottom: 4 }}>
                                    <Text style={{ fontWeight: 'bold', marginRight: 8 }}>{String.fromCharCode(65 + idx)}.</Text>
                                    <Text style={{ flex: 1, color: colors.textPrimary }}>{opt}</Text>
                                </View>
                            ));
                        } else if (typeof optionsToRender === 'object' && optionsToRender !== null) {
                            return Object.entries(optionsToRender).map(([key, value]) => {
                                // Clean up prefixes like "A) ", "A. "
                                const valStr = String(value);
                                const cleanText = valStr.replace(new RegExp(`^${key}[).]\\s*`, 'i'), '');
                                return (
                                    <View key={key} style={{ flexDirection: 'row', marginBottom: 4 }}>
                                        <Text style={{ fontWeight: 'bold', marginRight: 8 }}>{key}.</Text>
                                        <Text style={{ flex: 1, color: colors.textPrimary }}>{cleanText}</Text>
                                    </View>
                                );
                            });
                        }
                        return <Text>No options available</Text>;
                    })()}
                </View>
            )}

            {!readOnly && (
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={onApprove}>
                        <Text style={styles.actionText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={onReject}>
                        <Text style={styles.actionText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.quarantineButton]} onPress={onQuarantine}>
                        <Text style={styles.actionText}>Quarantine</Text>
                    </TouchableOpacity>
                </View>
            )}
        </Card>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    card: {
        marginBottom: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    questionNumber: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    questionText: {
        ...typography.body,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    metaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: spacing.md,
        backgroundColor: colors.background, // Slight contrast
        padding: spacing.sm,
        borderRadius: 8,
    },
    metaItem: {
        marginRight: spacing.lg,
        marginBottom: spacing.xs,
    },
    metaLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    metaValue: {
        ...typography.caption,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    optionsContainer: {
        marginTop: spacing.sm,
        padding: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderRadius: 8,
        marginHorizontal: spacing.xs,
    },
    approveButton: {
        backgroundColor: colors.success + '20', // Light opacity
    },
    rejectButton: {
        backgroundColor: colors.error + '20',
    },
    quarantineButton: {
        backgroundColor: colors.warning + '20',
    },
    actionText: {
        ...typography.captionBold,
        fontSize: 12,
        color: colors.textPrimary,
    },
    reasonContainer: {
        marginTop: spacing.sm,
        padding: spacing.sm,
        backgroundColor: colors.error + '10',
        borderRadius: 8,
    },
    reasonLabel: {
        ...typography.caption,
        color: colors.error,
        fontWeight: 'bold',
    },
    reasonText: {
        ...typography.caption,
        color: colors.error,
    }
});
