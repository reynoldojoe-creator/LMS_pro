import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store';
import { ScreenBackground } from '../../components/common';
import { borderRadius } from '../../theme/spacing';

export const RoleSelectScreen = () => {
    const { setCurrentRole } = useAuthStore();

    const handleSelectRole = (role: 'faculty' | 'vetter') => {
        setCurrentRole(role);
    };

    return (
        <ScreenBackground>
            <View style={styles.content}>
                {/* Branding */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.logoIcon}>📚</Text>
                    </View>
                    <Text style={styles.appName}>LMS - SIMATS</Text>
                </View>

                {/* Role Selection */}
                <Text style={styles.prompt}>Select your role to continue</Text>

                <View style={styles.rolesContainer}>
                    <TouchableOpacity
                        style={styles.roleCard}
                        onPress={() => handleSelectRole('faculty')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.roleIconBg}>
                            <Text style={styles.roleIcon}>👨‍🏫</Text>
                        </View>
                        <View style={styles.roleTextContainer}>
                            <Text style={styles.roleTitle}>Faculty</Text>
                            <Text style={styles.roleDescription}>
                                Create rubrics, generate questions, and manage subjects.
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.roleCard}
                        onPress={() => handleSelectRole('vetter')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.roleIconBg, { backgroundColor: '#E8F5E9' }]}>
                            <Text style={styles.roleIcon}>✅</Text>
                        </View>
                        <View style={styles.roleTextContainer}>
                            <Text style={styles.roleTitle}>Vetter</Text>
                            <Text style={styles.roleDescription}>
                                Review, approve, or reject generated questions.
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    content: {
        flex: 1,
        padding: spacing.screenHorizontal,
        justifyContent: 'center',
        maxWidth: 500,
        alignSelf: 'center',
        width: '100%',
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: colors.systemGray6,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    logoIcon: {
        fontSize: 40,
    },
    appName: {
        ...typography.h2,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    prompt: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    rolesContainer: {
        gap: spacing.md,
    },
    roleCard: {
        backgroundColor: colors.card,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',

        // Shadow
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,

        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    roleIconBg: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    roleIcon: {
        fontSize: 24,
    },
    roleTextContainer: {
        flex: 1,
    },
    roleTitle: {
        ...typography.headline,
        color: colors.text,
        marginBottom: 2,
    },
    roleDescription: {
        ...typography.caption1,
        color: colors.textSecondary,
        lineHeight: 16,
    },
});
