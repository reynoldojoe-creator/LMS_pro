import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

type Props = NativeStackScreenProps<any, 'EditCOLO'>;

export const EditCOLOScreen = ({ route, navigation }: Props) => {
    const { subjectId } = route.params as { subjectId: string };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Edit CO/LO Screen</Text>
                <Text style={styles.placeholderSubtext}>Coming soon...</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
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
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    placeholderText: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    placeholderSubtext: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    backButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: 10,
    },
    backButtonText: {
        ...typography.bodyBold,
        color: colors.textInverse,
    },
});
