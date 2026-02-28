import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthStore } from '../../store';
import { Input, SegmentedControl, ModernButton, ScreenBackground } from '../../components/common';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen = ({ navigation }: Props) => {
    const { login, isLoading, error, clearError } = useAuthStore();
    const [regNo, setRegNo] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);

    const roles = ['Faculty', 'Vetter'];
    const roleValues = ['faculty', 'vetter'] as const;

    useEffect(() => {
        // Clear any previous errors when component mounts
        clearError();
    }, []);

    const handleLogin = async () => {
        await login(regNo, password, roleValues[selectedRoleIndex]);
    };

    const isFormValid = regNo.trim() !== '' && password.trim() !== '';

    return (
        <ScreenBackground>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    {/* Branding */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.logoIcon}>📚</Text>
                        </View>
                        <Text style={styles.appName}>LM Trainer</Text>
                        <Text style={styles.subtitle}>Simats Engineering</Text>
                    </View>

                    {/* Role Selection */}
                    <View style={styles.roleContainer}>
                        <SegmentedControl
                            segments={roles}
                            selectedIndex={selectedRoleIndex}
                            onChange={setSelectedRoleIndex}
                        />
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        <Input
                            label="Register Number"
                            placeholder="Enter your register number"
                            value={regNo}
                            onChangeText={setRegNo}
                            keyboardType="number-pad"
                            autoCapitalize="none"
                            error={error || undefined}
                            variant="filled"
                        />

                        <Input
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            variant="filled"
                        />

                        <View style={styles.buttonContainer}>
                            <ModernButton
                                title={isLoading ? 'Signing In...' : 'Sign In'}
                                onPress={handleLogin}
                                disabled={!isFormValid || isLoading}
                                loading={isLoading}
                                variant="primary"
                                size="large"
                            />
                        </View>
                    </View>

                    {/* Helper text */}
                    <Text style={styles.helperText}>
                        Demo: Register No: 123456 | Password: demo123 | Role: Faculty
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: spacing.screenHorizontal,
        justifyContent: 'center',
        maxWidth: 500, // Limit width on tablets
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
        ...typography.h1,
        color: colors.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    roleContainer: {
        marginBottom: spacing.lg,
    },
    formContainer: {
        marginBottom: spacing.xl,
    },
    buttonContainer: {
        marginTop: spacing.md,
    },
    helperText: {
        ...typography.caption1,
        color: colors.textTertiary,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
});
