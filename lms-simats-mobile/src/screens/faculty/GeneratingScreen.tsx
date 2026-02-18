import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, typography, spacing } from '../../theme';
import { useFacultyStore } from '../../store';

type Props = NativeStackScreenProps<any, 'Generating'>;

export const GeneratingScreen = ({ navigation, route }: Props) => {
    const { count, questionType, subjectId, topicId, difficulty, bloomLevel } = route.params as any;
    const [progress, setProgress] = useState(0);
    const { quickGenerate } = useFacultyStore();

    useEffect(() => {
        let isMounted = true;

        const generate = async () => {
            try {
                // Start progress animation
                const progressInterval = setInterval(() => {
                    setProgress(prev => {
                        if (prev >= 90) return prev;
                        return prev + 5;
                    });
                }, 500);

                // Call API
                const result = await quickGenerate({
                    subjectId,
                    topicId,
                    questionType,
                    count,
                    difficulty: difficulty || 'medium',
                    bloomLevel: bloomLevel || 'understand'
                });

                clearInterval(progressInterval);
                if (isMounted) setProgress(100);

                // Navigate to results
                setTimeout(() => {
                    if (isMounted) {
                        navigation.replace('GenerationResults', {
                            ...route.params,
                            generatedQuestions: result.questions || result, // Handle result structure
                        });
                    }
                }, 500);

            } catch (error) {
                console.error("Generation failed", error);
                if (isMounted) {
                    Alert.alert("Generation Failed", "Could not generate questions.");
                    navigation.goBack();
                }
            }
        };

        generate();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleCancel = () => {
        navigation.goBack();
    };

    const typeLabel = questionType === 'mcq' ? 'MCQs' : questionType === 'short' ? 'Short Answer Questions' : 'Essay Questions';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>⚡</Text>
                </View>

                <Text style={styles.title}>Generating Questions...</Text>
                <Text style={styles.subtitle}>
                    Creating {count} {typeLabel}
                </Text>

                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{progress}%</Text>
                </View>

                <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />

                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    iconContainer: {
        marginBottom: spacing.lg,
    },
    icon: {
        fontSize: 64,
    },
    title: {
        ...typography.h1,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.xxl,
        textAlign: 'center',
    },
    progressContainer: {
        width: '100%',
        marginBottom: spacing.xl,
    },
    progressBar: {
        height: 8,
        backgroundColor: colors.iosGray5,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: spacing.sm,
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
    },
    progressText: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    spinner: {
        marginVertical: spacing.xl,
    },
    cancelButton: {
        marginTop: spacing.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
    },
    cancelText: {
        ...typography.bodyBold,
        color: colors.error,
    },
});
