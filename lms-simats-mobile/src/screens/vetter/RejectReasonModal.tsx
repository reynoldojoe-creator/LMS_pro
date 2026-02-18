import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { colors, typography, spacing} from '../../theme';
import { Modal, Button } from '../../components/common';

interface Props {
    visible: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

const PRESET_REASONS = [
    'Out of syllabus',
    'Incorrect Bloom\'s level',
    'Ambiguous question',
    'Multiple correct answers',
    'Too similar to existing question',
    'Factually incorrect',
];

export const RejectReasonModal = ({ visible, onClose, onConfirm }: Props) => {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [customReason, setCustomReason] = useState('');

    const handleSubmit = () => {
        const reason = selectedReason || customReason;
        if (reason.trim()) {
            onConfirm(reason);
            setSelectedReason(null);
            setCustomReason('');
        }
    };

    return (
        <Modal visible={visible} onClose={onClose} title="Reject Question">
            <ScrollView style={styles.content}>
                <Text style={styles.label}>Select a reason:</Text>

                <View style={styles.reasonsList}>
                    {PRESET_REASONS.map((reason) => (
                        <TouchableOpacity
                            key={reason}
                            style={[
                                styles.reasonOption,
                                selectedReason === reason && styles.reasonOptionSelected,
                            ]}
                            onPress={() => {
                                setSelectedReason(reason);
                                setCustomReason('');
                            }}
                        >
                            <View style={styles.radio}>
                                {selectedReason === reason && <View style={styles.radioSelected} />}
                            </View>
                            <Text style={styles.reasonText}>{reason}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Or enter custom reason:</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="Enter custom reason..."
                    placeholderTextColor={colors.iosGray3}
                    value={customReason}
                    onChangeText={(text) => {
                        setCustomReason(text);
                        setSelectedReason(null);
                    }}
                    multiline
                    numberOfLines={3}
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
                        title="Submit"
                        onPress={handleSubmit}
                        variant="primary"
                        fullWidth={false}
                        style={styles.button}
                        disabled={!selectedReason && !customReason.trim()}
                    />
                </View>
            </ScrollView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    content: {
        marginTop: spacing.md,
    },
    label: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    reasonsList: {
        marginBottom: spacing.lg,
    },
    reasonOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.sm,
    },
    reasonOptionSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '10',
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.primary,
        marginRight: spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioSelected: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
    },
    reasonText: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
    },
    textInput: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: spacing.md,
        ...typography.body,
        color: colors.textPrimary,
        minHeight: 80,
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
