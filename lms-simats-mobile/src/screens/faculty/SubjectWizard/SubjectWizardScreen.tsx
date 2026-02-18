import React, { useState } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../hooks';
import { spacing, typography } from '../../../theme';
import { Step1Metadata } from './steps/Step1Metadata';
import { Step2CourseOutcomes } from './steps/Step2CourseOutcomes';
import { Step3LearningOutcomes } from './steps/Step3LearningOutcomes';

export const SubjectWizardScreen = ({ navigation }: any) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    const [currentStep, setCurrentStep] = useState(1);
    const [subjectId, setSubjectId] = useState<string | null>(null);
    const [subjectName, setSubjectName] = useState<string>("");

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        } else {
            // Finish
            Alert.alert("Success", "Subject created successfully!", [
                { text: "OK", onPress: () => navigation.navigate('SubjectsList') }
            ]);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            navigation.goBack();
        }
    };

    // Callback when Step 1 is done
    const onMetadataCreated = (id: string, name: string) => {
        setSubjectId(id);
        setSubjectName(name);
        handleNext();
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <Step1Metadata onNext={onMetadataCreated} />;
            case 2:
                return <Step2CourseOutcomes subjectId={subjectId!} onNext={handleNext} onBack={handleBack} />;
            case 3:
                return <Step3LearningOutcomes subjectId={subjectId!} onNext={handleNext} onBack={handleBack} />;
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {subjectName ? `Setup: ${subjectName}` : 'Create New Subject'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Stepper Indicator */}
            <View style={styles.stepperContainer}>
                {[1, 2, 3].map((step) => (
                    <View key={step} style={styles.stepItem}>
                        <View style={[
                            styles.stepCircle,
                            currentStep === step && styles.activeStepCircle,
                            currentStep > step && styles.completedStepCircle,
                        ]}>
                            <Text style={[
                                styles.stepText,
                                currentStep === step && styles.activeStepText,
                                currentStep > step && styles.completedStepText,
                            ]}>
                                {step}
                            </Text>
                        </View>
                        {step < 3 && (
                            <View style={[
                                styles.stepLine,
                                currentStep > step && styles.completedStepLine
                            ]} />
                        )}
                    </View>
                ))}
            </View>
            <View style={styles.stepLabels}>
                <Text style={[styles.stepLabel, currentStep >= 1 && styles.activeLabel]}>Info</Text>
                <Text style={[styles.stepLabel, currentStep >= 2 && styles.activeLabel]}>COs</Text>
                <Text style={[styles.stepLabel, currentStep >= 3 && styles.activeLabel]}>LOs</Text>
            </View>

            <View style={styles.content}>
                {renderStep()}
            </View>
        </SafeAreaView>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.screenHorizontal,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    backButton: {
        padding: spacing.xs,
    },
    backButtonText: {
        fontSize: 24,
        color: colors.textPrimary,
    },
    headerTitle: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    stepperContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    activeStepCircle: {
        borderColor: colors.primary,
        backgroundColor: colors.primary,
    },
    completedStepCircle: {
        borderColor: colors.primary,
        backgroundColor: colors.primary,
    },
    stepText: {
        ...typography.caption,
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    activeStepText: {
        color: colors.surface,
    },
    completedStepText: {
        color: colors.surface,
    },
    stepLine: {
        width: 30, // Adjust based on screen width dynamically if needed
        height: 2,
        backgroundColor: colors.border,
        marginHorizontal: -2, // pull circles closer
    },
    completedStepLine: {
        backgroundColor: colors.primary,
    },
    stepLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    stepLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        fontSize: 10,
        width: 50,
        textAlign: 'center',
    },
    activeLabel: {
        color: colors.primary,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    }
});
