import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../../../hooks';
import { spacing, typography, borderRadius } from '../../../../theme';
import { Button } from '../../../../components/common';
import { subjectService } from '../../../../services/subjectService';

interface Props {
    subjectId: string;
    onNext: () => void;
    onBack: () => void;
}

export const Step2CourseOutcomes = ({ subjectId, onNext, onBack }: Props) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    const [cos, setCos] = useState([{ code: 'CO1', description: '' }]);
    const [isLoading, setIsLoading] = useState(false);

    const addCO = () => {
        const nextNum = cos.length + 1;
        setCos([...cos, { code: `CO${nextNum}`, description: '' }]);
    };

    const removeCO = (index: number) => {
        if (cos.length > 1) {
            const newCos = [...cos];
            newCos.splice(index, 1);
            const renumbered = newCos.map((co, i) => ({ ...co, code: `CO${i + 1}` }));
            setCos(renumbered);
        }
    };

    const updateCO = (index: number, text: string) => {
        const newCos = [...cos];
        newCos[index].description = text;
        setCos(newCos);
    };

    const handleSubmit = async () => {
        if (cos.some(co => !co.description.trim())) {
            Alert.alert('Error', 'Please provide descriptions for all Course Outcomes');
            return;
        }

        setIsLoading(true);
        try {
            await subjectService.addCourseOutcomes(subjectId, cos);
            onNext();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save COs');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Define Course Outcomes</Text>
                <Text style={styles.subtitle}>
                    List the course outcomes for this subject. These will be mapped to Topics later.
                </Text>

                {cos.map((co, index) => (
                    <View key={index} style={styles.coRow}>
                        <View style={styles.coHeader}>
                            <Text style={styles.coCode}>{co.code}</Text>
                            {cos.length > 1 && (
                                <TouchableOpacity onPress={() => removeCO(index)}>
                                    <Text style={styles.removeText}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <TextInput
                            style={styles.input}
                            value={co.description}
                            onChangeText={(text) => updateCO(index, text)}
                            placeholder={`Description for ${co.code}`}
                            placeholderTextColor={colors.textSecondary}
                            multiline
                        />
                    </View>
                ))}

                <TouchableOpacity style={styles.addButton} onPress={addCO}>
                    <Text style={styles.addButtonText}>+ Add Course Outcome</Text>
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
    coRow: {
        marginBottom: spacing.md,
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.itemBorder,
    },
    coHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    coCode: {
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
    },
    addButton: {
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        borderStyle: 'dashed',
        marginBottom: spacing.xl,
    },
    addButtonText: {
        color: colors.primary,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        marginTop: spacing.md,
    }
});
