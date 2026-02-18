import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { typography, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store';
import { useAppTheme } from '../../hooks';
import { Tag, GroupedList } from '../../components/common';

type Props = NativeStackScreenProps<any, 'Profile'>;

export const ProfileScreen = ({ navigation }: Props) => {
    const { user } = useAuthStore();
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    if (!user) {
        return null;
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const stats = [
        { label: 'Questions Generated', value: '156' },
        { label: 'Approval Rate', value: '91%' },
        { label: 'Subjects', value: '4' },
    ];

    const profileItems = [
        {
            label: 'Register No',
            value: user.regNo,
        },
        {
            label: 'Department',
            value: 'Computer Science',
        },
        {
            label: 'Employee ID',
            value: 'FAC-2024-001',
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backChevron}>‹</Text>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity onPress={() => {/* TODO: Edit */ }}>
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Avatar and Name */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
                    </View>
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.regNo}>Reg No: {user.regNo}</Text>

                    {/* Role Badges */}
                    <View style={styles.rolesContainer}>
                        {user.roles.map((role) => (
                            <Tag
                                key={role}
                                label={role.charAt(0).toUpperCase() + role.slice(1)}
                                color={role === 'faculty' ? colors.primary : colors.iosPurple}
                            />
                        ))}
                    </View>
                </View>

                {/* Statistics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>STATISTICS</Text>
                    <View style={styles.statsGrid}>
                        {stats.map((stat) => (
                            <View key={stat.label} style={styles.statCard}>
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Profile Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>INFORMATION</Text>
                    <View style={styles.infoCard}>
                        {profileItems.map((item, index) => (
                            <View
                                key={item.label}
                                style={[
                                    styles.infoRow,
                                    index < profileItems.length - 1 && styles.infoRowBorder,
                                ]}
                            >
                                <Text style={styles.infoLabel}>{item.label}</Text>
                                <Text style={styles.infoValue}>{item.value}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.screenHorizontal,
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
        backgroundColor: colors.surface,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backChevron: {
        fontSize: 32,
        color: colors.primary,
        fontWeight: '300',
        marginRight: -4,
    },
    backText: {
        ...typography.body,
        color: colors.primary,
    },
    headerTitle: {
        ...typography.navTitle,
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    editText: {
        ...typography.body,
        color: colors.primary,
        flex: 1,
        textAlign: 'right',
    },
    scrollView: {
        flex: 1,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        backgroundColor: colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatarText: {
        ...typography.h1,
        color: colors.textInverse,
        fontSize: 36,
    },
    name: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    regNo: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    rolesContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    section: {
        marginTop: spacing.lg,
    },
    sectionTitle: {
        ...typography.caption,
        color: colors.textTertiary,
        paddingHorizontal: spacing.screenHorizontal,
        marginBottom: spacing.sm,
        letterSpacing: 0.5,
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: spacing.screenHorizontal,
        gap: spacing.sm,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    statValue: {
        ...typography.h2,
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    infoCard: {
        backgroundColor: colors.surface,
        marginHorizontal: spacing.screenHorizontal,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
    },
    infoRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    infoLabel: {
        ...typography.body,
        color: colors.textSecondary,
    },
    infoValue: {
        ...typography.body,
        color: colors.textPrimary,
    },
    bottomPadding: {
        height: spacing.xl,
    },
});
