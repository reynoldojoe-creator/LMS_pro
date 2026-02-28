import React, { useState } from 'react';
// Force IDE refresh
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/common';

interface Props {
    visible: boolean;
    onClose: () => void;
    onConfirm: (feedback: { notes?: string }) => void;
}

export const ApprovalFeedbackModal = ({ visible, onClose, onConfirm }: Props) => {
    const [notes, setNotes] = useState('');

    const handleConfirm = () => {
        onConfirm({ notes: notes.trim() || undefined });
        setNotes('');
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>Approve Question</Text>
                    <Text style={styles.description}>
                        You are about to approve this question.
                        Optional: Provide positive feedback or notes for model training.
                    </Text>

                    <Text style={styles.label}>Feedback (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Good context usage, well-structured..."
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        textAlignVertical="top"
                        value={notes}
                        onChangeText={setNotes}
                    />

                    <View style={styles.buttons}>
                        <Button
                            title="Cancel"
                            variant="outline"
                            onPress={onClose}
                            style={styles.button}
                        />
                        <Button
                            title="Approve"
                            variant="primary"
                            onPress={handleConfirm}
                            style={styles.button}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modalContainer: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: spacing.xl,
    },
    title: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    description: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    label: {
        ...typography.captionBold,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: spacing.md,
        height: 100,
        marginBottom: spacing.lg,
        ...typography.body,
        color: colors.textPrimary,
        backgroundColor: colors.background,
    },
    buttons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    button: {
        flex: 1,
    },
});
