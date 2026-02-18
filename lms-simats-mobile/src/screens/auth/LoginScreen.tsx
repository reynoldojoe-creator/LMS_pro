import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing} from '../../theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthStore } from '../../store';
import { useAppTheme } from '../../hooks';
import { Button, Input, SegmentedControl } from '../../components/common';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen = ({ navigation }: Props) => {
    const { login, isLoading, error, clearError } = useAuthStore();
    const [regNo, setRegNo] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);

    const { colors } = useAppTheme();
    const styles = getStyles(colors);

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
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.linenBackground} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    {/* Branding */}
                    <View style={styles.header}>
                        <View style={styles.logoPlaceholder}>
                            <Text style={styles.logoText}>📚</Text>
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
                            tintColor={selectedRoleIndex === 0 ? colors.primary : colors.success}
                        />
                    </View>

                    {/* Form */}
                    <View style={styles.formCard}>
                        <View style={styles.inputContainer}>
                            <Input
                                label="Register No"
                                placeholder="Enter your register number"
                                value={regNo}
                                onChangeText={setRegNo}
                                keyboardType="number-pad"
                                autoCapitalize="none"
                                autoCorrect={false}
                                error={error || undefined}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Input
                                label="Password"
                                placeholder="Enter your password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.buttonContainer}>
                            <Button
                                title={isLoading ? 'Signing In...' : 'Sign In'}
                                onPress={handleLogin}
                                disabled={!isFormValid || isLoading}
                                loading={isLoading}
                                fullWidth
                                variant="primary"
                                size="lg"
                            />
                        </View>
                    </View>

                    {/* Helper text */}
                    <Text style={styles.helperText}>
                        Demo: Register No: 123456 | Password: demo123 | Role: Faculty
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background, // iOS system gray / linen base
    },
    linenBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.background,
        // In a real implementation, we'd use an ImageBackground with a linen texture
        // For now, the color from colors.ts simulates it
    },
    keyboardView: {
        flex: 1,
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
        textShadowColor: colors.textShadow,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 0,
    },
    subtitle: {
        ...typography.body,
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        textShadowColor: colors.textShadow,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 0,
    },
    roleContainer: {
        marginBottom: spacing.md,
    },
    formCard: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.shadowDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inputContainer: {
        marginBottom: spacing.md,
    },
    buttonContainer: {
        marginTop: spacing.md,
    },
    helperText: {
        ...typography.caption,
        color: colors.textTertiary,
        textAlign: 'center',
        marginTop: spacing.lg,
        textShadowColor: colors.textShadow,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 0,
    },
});
