import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAppTheme } from '../../../../hooks';
import { spacing } from '../../../../theme/spacing';
import { typography } from '../../../../theme/typography';
import { Button } from '../../../../components/common';
import { subjectService } from '../../../../services/subjectService';

interface Props {
    onNext: (id: string, name: string) => void;
}

export const Step1Metadata = ({ onNext }: Props) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [department, setDepartment] = useState('');
    const [credits, setCredits] = useState('4');
    const [paperType, setPaperType] = useState<'core' | 'elective'>('core');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name || !code || !department) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        setIsLoading(true);
        try {
            const subject = await subjectService.createMetadata({
                name,
                code,
                department,
                credits: parseInt(credits),
                paper_type: paperType
            });
            onNext(subject.id.toString(), subject.name);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create subject');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Subject Details</Text>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Subject Name *</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Software Engineering"
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Subject Code *</Text>
                <TextInput
                    style={styles.input}
                    value={code}
                    onChangeText={setCode}
                    placeholder="e.g. CS101"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="characters"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Department *</Text>
                <TextInput
                    style={styles.input}
                    value={department}
                    onChangeText={setDepartment}
                    placeholder="e.g. CSE"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="characters"
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: spacing.md }]}>
                    <Text style={styles.label}>Credits</Text>
                    <TextInput
                        style={styles.input}
                        value={credits}
                        onChangeText={setCredits}
                        keyboardType="numeric"
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Paper Type</Text>
                    <View style={styles.typeSelector}>
                        <Text
                            style={[
                                styles.typeOption,
                                paperType === 'core' && styles.activeTypeOption
                            ]}
                            onPress={() => setPaperType('core')}
                        >
                            Core
                        </Text>
                        <Text
                            style={[
                                styles.typeOption,
                                paperType === 'elective' && styles.activeTypeOption
                            ]}
                            onPress={() => setPaperType('elective')}
                        >
                            Elective
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <Button
                    title="Next"
                    onPress={handleSubmit}
                    loading={isLoading}
                />
            </View>
        </ScrollView>
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
        marginBottom: spacing.lg,
    },
    formGroup: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.bodyBold,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.itemBorder,
        borderRadius: 12,
        padding: spacing.md,
        color: colors.textPrimary,
        ...typography.body,
    },
    row: {
        flexDirection: 'row',
    },
    typeSelector: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.itemBorder,
        overflow: 'hidden',
    },
    typeOption: {
        flex: 1,
        padding: spacing.md,
        textAlign: 'center',
        color: colors.textSecondary,
    },
    activeTypeOption: {
        backgroundColor: colors.primary,
        color: colors.surface,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: spacing.xl,
    }
});
