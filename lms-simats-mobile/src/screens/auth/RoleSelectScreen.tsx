import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing} from '../../theme';
import { useAuthStore } from '../../store';
import { useAppTheme } from '../../hooks';

export const RoleSelectScreen = () => {
    const { setCurrentRole } = useAuthStore();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    const handleSelectRole = (role: 'faculty' | 'vetter') => {
        setCurrentRole(role);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.content}>
                {/* Branding */}
                <View style={styles.header}>
                    <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoText}>📚</Text>
                    </View>
                    <Text style={styles.appName}>LMS - SIMATS</Text>
                </View>

                {/* Role Selection */}
                <Text style={styles.prompt}>Select your role to continue</Text>

                <View style={styles.rolesContainer}>
                    <TouchableOpacity
                        style={styles.roleCard}
                        onPress={() => handleSelectRole('faculty')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.roleIcon}>👨‍🏫</Text>
                        <Text style={styles.roleTitle}>Faculty</Text>
                        <Text style={styles.roleDescription}>
                            Create rubrics, generate questions, and manage subjects
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.roleCard}
                        onPress={() => handleSelectRole('vetter')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.roleIcon}>✅</Text>
                        <Text style={styles.roleTitle}>Vetter</Text>
                        <Text style={styles.roleDescription}>
                            Review, approve, or reject generated questions
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logoPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 20,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        shadowColor: colors.shadowDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
        borderWidth: 1,
        borderColor: colors.border,
    },
    logoText: {
        fontSize: 56,
    },
    appName: {
        ...typography.h1,
        fontSize: 28,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    prompt: {
        ...typography.body,
        fontSize: 17,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    rolesContainer: {
        gap: spacing.md,
    },
    roleCard: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        shadowColor: colors.shadowDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    roleIcon: {
        fontSize: 40,
        marginBottom: spacing.sm,
    },
    roleTitle: {
        ...typography.h2,
        fontSize: 20,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    roleDescription: {
        ...typography.caption,
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
