import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../../../hooks';
import { spacing } from '../../../../theme/spacing';
import { typography } from '../../../../theme/typography';
import { Button } from '../../../../components/common';
import { subjectService } from '../../../../services/subjectService';

interface Props {
    subjectId: string;
    onNext: () => void;
    onBack: () => void;
}

export const Step3LearningOutcomes = ({ subjectId, onNext, onBack }: Props) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    const [los, setLos] = useState([{ code: 'LO1', description: '' }]);
    const [isLoading, setIsLoading] = useState(false);

    const addLO = () => {
        const nextNum = los.length + 1;
        setLos([...los, { code: `LO${nextNum}`, description: '' }]);
    };

    const removeLO = (index: number) => {
        if (los.length > 1) {
            const newLos = [...los];
            newLos.splice(index, 1);
            const renumbered = newLos.map((lo, i) => ({ ...lo, code: `LO${i + 1}` }));
            setLos(renumbered);
        }
    };

    const updateLO = (index: number, field: string, value: string) => {
        const newLos = [...los];
        (newLos[index] as any)[field] = value;
        setLos(newLos);
    };

    const handleSubmit = async () => {
        if (los.some(lo => !lo.description.trim())) {
            Alert.alert('Error', 'Please provide descriptions for all Learning Outcomes');
            return;
        }

        setIsLoading(true);
        try {
            await subjectService.addLearningOutcomes(subjectId, los);
            onNext();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save LOs');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Define Learning Outcomes</Text>
                <Text style={styles.subtitle}>
                    List the learning outcomes. Each typically corresponds to a topic or unit.
                </Text>

                {los.map((lo, index) => (
                    <View key={index} style={styles.row}>
                        <View style={styles.header}>
                            <Text style={styles.code}>{lo.code}</Text>
                            {los.length > 1 && (
                                <TouchableOpacity onPress={() => removeLO(index)}>
                                    <Text style={styles.removeText}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <TextInput
                            style={styles.input}
                            value={lo.description}
                            onChangeText={(text) => updateLO(index, 'description', text)}
                            placeholder={`Description for ${lo.code}`}
                            placeholderTextColor={colors.textSecondary}
                            multiline
                        />

                    </View>
                ))}

                <TouchableOpacity style={styles.addButton} onPress={addLO}>
                    <Text style={styles.addButtonText}>+ Add Learning Outcome</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Button
                        title="Save & Continue"
                        onPress={handleSubmit}
                        loading={isLoading}
                        fullWidth
                    />
                </View>
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
    row: {
        marginBottom: spacing.md,
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.itemBorder,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    code: {
        ...typography.bodyBold,
        color: colors.primary,
    },
    removeText: {
        fontSize: 18,
        color: colors.error,
    },
    input: {
        color: colors.textPrimary,
        ...typography.body,
        minHeight: 60,
        textAlignVertical: 'top',
        backgroundColor: colors.background,
        borderRadius: 8,
        padding: spacing.sm,
    },
    addButton: {
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 12,
        alignItems: 'center',
        borderStyle: 'dashed',
        marginBottom: spacing.xl,
    },
    addButtonText: {
        color: colors.primary,
        fontWeight: '600',
    },
    footer: {
        marginTop: spacing.md,
    }
});
