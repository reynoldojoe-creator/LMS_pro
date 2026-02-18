import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { typography, spacing} from '../../theme';
import { useAuthStore } from '../../store';
import { useAppTheme } from '../../hooks';
import { GroupedList } from '../../components/common';

type Props = NativeStackScreenProps<any, 'Settings'>;

export const SettingsScreen = ({ navigation }: Props) => {
    const { logout } = useAuthStore();
    const { isDarkMode, toggleTheme, colors } = useAppTheme();
    const styles = getStyles(colors);

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: () => logout()
                },
            ]
        );
    };
    const accountItems = [
        {
            icon: '👤',
            label: 'Profile',
            onPress: () => navigation.navigate('Profile'),
            showChevron: true,
        },
        {
            icon: '🔔',
            label: 'Notifications',
            onPress: () => {/* TODO */ },
            showChevron: true,
        },
    ];

    const dataItems = [
        {
            icon: '💾',
            label: 'Export Data',
            onPress: () => {/* TODO */ },
            showChevron: true,
        },
        {
            icon: '🗑️',
            label: 'Clear Cache',
            onPress: () => {
                Alert.alert('Clear Cache', 'Cache cleared successfully');
            },
            showChevron: true,
        },
    ];

    const aboutItems = [
        {
            icon: 'ℹ️',
            label: 'About LMS-SIMATS',
            onPress: () => {/* TODO */ },
            showChevron: true,
        },
        {
            icon: '📄',
            label: 'Terms of Service',
            onPress: () => {/* TODO */ },
            showChevron: true,
        },
        {
            icon: '🔒',
            label: 'Privacy Policy',
            onPress: () => {/* TODO */ },
            showChevron: true,
        },
    ];
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Account */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ACCOUNT</Text>
                    <GroupedList sections={[{ data: accountItems.map((item, i) => ({ ...item, id: String(i) })) }]} />
                </View>

                {/* Appearance */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>APPEARANCE</Text>
                    <View style={styles.groupedList}>
                        <View style={styles.listItem}>
                            <View style={styles.itemLeft}>
                                <Text style={styles.itemIcon}>🌙</Text>
                                <Text style={styles.itemLabel}>Dark Mode</Text>
                            </View>
                            <Switch
                                value={isDarkMode}
                                onValueChange={toggleTheme}
                                trackColor={{ false: colors.iosGray4, true: colors.primary }}
                                thumbColor={colors.surface}
                            />
                        </View>
                    </View>
                </View>

                {/* Data */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DATA</Text>
                    <GroupedList sections={[{ data: dataItems.map((item, i) => ({ ...item, id: String(i) })) }]} />
                </View>

                {/* About */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ABOUT</Text>
                    <GroupedList sections={[{ data: aboutItems.map((item, i) => ({ ...item, id: String(i) })) }]} />
                </View>

                {/* Sign Out */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>

                {/* Version */}
                <View style={styles.versionSection}>
                    <Text style={styles.versionText}>Version 1.0.0 (Build 1)</Text>
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
        paddingHorizontal: spacing.screenHorizontal,
        paddingVertical: spacing.md,
    },
    headerTitle: {
        ...typography.h2,
        color: colors.textPrimary,
    },
    scrollView: {
        flex: 1,
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
    groupedList: {
        backgroundColor: colors.surface,
        marginHorizontal: spacing.screenHorizontal,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.surface,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemIcon: {
        fontSize: 20,
        marginRight: spacing.md,
    },
    itemLabel: {
        ...typography.body,
        color: colors.textPrimary,
    },
    signOutButton: {
        backgroundColor: colors.surface,
        marginHorizontal: spacing.screenHorizontal,
        paddingVertical: spacing.md,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    signOutText: {
        ...typography.bodyBold,
        color: colors.error,
    },
    versionSection: {
        marginTop: spacing.xl,
        alignItems: 'center',
    },
    versionText: {
        ...typography.caption,
        color: colors.textTertiary,
    },
    bottomPadding: {
        height: spacing.xl,
    },
});
