import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Modal, Button } from '../../components/common';

interface Props {
    visible: boolean;
    onClose: () => void;
    onConfirm: (notes: string) => void;
}

export const QuarantineModal = ({ visible, onClose, onConfirm }: Props) => {
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
        if (notes.trim()) {
            onConfirm(notes);
            setNotes('');
        }
    };

    return (
        <Modal visible={visible} onClose={onClose} title="Quarantine Question">
            <View style={styles.content}>
                <Text style={styles.description}>
                    This question will be sent back to the faculty for revision. Please provide notes on what needs to be edited.
                </Text>

                <Text style={styles.label}>Notes for Faculty:</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="Describe what needs to be changed..."
                    placeholderTextColor={colors.iosGray3}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={5}
                    autoFocus
                />

                <View style={styles.actions}>
                    <Button
                        title="Cancel"
                        onPress={onClose}
                        variant="outline"
                        fullWidth={false}
                        style={styles.button}
                    />
                    <Button
                        title="Quarantine"
                        onPress={handleSubmit}
                        variant="primary"
                        fullWidth={false}
                        style={styles.button}
                        disabled={!notes.trim()}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    content: {
        marginTop: spacing.md,
    },
    description: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
        lineHeight: 22,
    },
    label: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    textInput: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: spacing.md,
        ...typography.body,
        color: colors.textPrimary,
        minHeight: 120,
        textAlignVertical: 'top',
        marginBottom: spacing.lg,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.sm,
    },
    button: {
        minWidth: 100,
    },
});
