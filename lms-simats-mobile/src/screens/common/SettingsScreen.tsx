import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { spacing } from '../../theme/spacing';
import { useAuthStore } from '../../store';
import { useAppTheme } from '../../hooks';
import { GroupedList, ScreenBackground, ModernNavBar } from '../../components/common';

type Props = NativeStackScreenProps<any, 'Settings'>;

export const SettingsScreen = ({ navigation }: Props) => {
    const { logout } = useAuthStore();
    const { isDarkMode, toggleTheme, colors, typography } = useAppTheme();
    const styles = getStyles(colors, typography);

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
            id: 'profile',
            icon: '👤',
            label: 'Profile',
            onPress: () => navigation.navigate('Profile'),
            showChevron: true,
        },
        {
            id: 'notifications',
            icon: '🔔',
            label: 'Notifications',
            onPress: () => {/* TODO */ },
            showChevron: true,
        },
    ];

    const appearanceItems = [
        {
            id: 'darkMode',
            icon: isDarkMode ? '☀️' : '🌙',
            label: 'Dark Mode',
            showSwitch: true,
            switchValue: isDarkMode,
            onSwitchChange: () => toggleTheme(),
        },
    ];

    const dataItems = [
        {
            id: 'export',
            icon: '💾',
            label: 'Export Data',
            onPress: () => {/* TODO */ },
            showChevron: true,
        },
        {
            id: 'cache',
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
            id: 'about',
            icon: 'ℹ️',
            label: 'About LMS-SIMATS',
            onPress: () => {/* TODO */ },
            showChevron: true,
        },
        {
            id: 'terms',
            icon: '📄',
            label: 'Terms of Service',
            onPress: () => {/* TODO */ },
            showChevron: true,
        },
        {
            id: 'privacy',
            icon: '🔒',
            label: 'Privacy Policy',
            onPress: () => {/* TODO */ },
            showChevron: true,
        },
    ];

    return (
        <ScreenBackground type="grouped">
            <ModernNavBar
                title="Settings"
                showBack
                onBack={() => navigation.goBack()}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Account */}
                <GroupedList
                    sections={[
                        { title: 'ACCOUNT', data: accountItems },
                    ]}
                />

                {/* Appearance */}
                <GroupedList
                    sections={[
                        { title: 'APPEARANCE', data: appearanceItems },
                    ]}
                />

                {/* Data */}
                <GroupedList
                    sections={[
                        { title: 'DATA', data: dataItems },
                    ]}
                />

                {/* About */}
                <GroupedList
                    sections={[
                        { title: 'ABOUT', data: aboutItems },
                    ]}
                />

                {/* Sign Out */}
                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                {/* Version */}
                <View style={styles.versionSection}>
                    <Text style={styles.versionText}>Version 1.0.0 (Build 1)</Text>
                </View>

                <View style={{ height: spacing.xl }} />
            </ScrollView>
        </ScreenBackground>
    );
};

const getStyles = (colors: any, typography: any) => StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: spacing.md,
        gap: spacing.lg,
    },
    signOutButton: {
        backgroundColor: colors.surface,
        marginHorizontal: spacing.screenHorizontal,
        paddingVertical: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    signOutText: {
        ...typography.bodyBold,
        color: colors.error,
    },
    versionSection: {
        alignItems: 'center',
    },
    versionText: {
        ...typography.caption,
        color: colors.textTertiary,
    },
});
