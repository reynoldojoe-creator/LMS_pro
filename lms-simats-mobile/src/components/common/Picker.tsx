import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Modal } from './Modal';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface Option {
    label: string;
    value: any;
}

interface PickerProps {
    label?: string;
    value: any;
    options: Option[];
    onChange: (value: any) => void;
    placeholder?: string;
    disabled?: boolean;
}

export const Picker: React.FC<PickerProps> = ({
    label,
    value,
    options,
    onChange,
    placeholder = 'Select',
    disabled = false,
}) => {
    const [visible, setVisible] = useState(false);

    const selectedOption = options.find((opt) => opt.value === value);

    const handleSelect = (val: any) => {
        onChange(val);
        setVisible(false);
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TouchableOpacity
                style={[styles.trigger, disabled && styles.disabledTrigger]}
                onPress={() => !disabled && setVisible(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.valueText, !selectedOption && styles.placeholderText]}>
                    {selectedOption ? selectedOption.label : placeholder}
                </Text>
                <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>

            <Modal
                visible={visible}
                onClose={() => setVisible(false)}
                title={label || 'Select'}
            >
                <ScrollView style={styles.optionsList} contentContainerStyle={styles.optionsContent}>
                    {options.map((opt) => (
                        <TouchableOpacity
                            key={opt.value.toString()}
                            style={[
                                styles.option,
                                opt.value === value && styles.selectedOption
                            ]}
                            onPress={() => handleSelect(opt.value)}
                        >
                            <Text style={[
                                styles.optionText,
                                opt.value === value && styles.selectedOptionText
                            ]}>
                                {opt.label}
                            </Text>
                            {opt.value === value && <Text style={styles.checkmark}>✓</Text>}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.xs,
    },
    label: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    trigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        minHeight: 40,
    },
    disabledTrigger: {
        opacity: 0.6,
        backgroundColor: colors.iosGray6,
    },
    valueText: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
    },
    placeholderText: {
        color: colors.textTertiary,
    },
    chevron: {
        ...typography.caption,
        color: colors.textSecondary,
        marginLeft: spacing.sm,
    },
    optionsList: {
        maxHeight: 300,
    },
    optionsContent: {
        paddingBottom: spacing.xl,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    selectedOption: {
        backgroundColor: colors.primary + '10', // 10% opacity primary
        marginHorizontal: -spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    optionText: {
        ...typography.body,
        color: colors.textPrimary,
    },
    selectedOptionText: {
        ...typography.bodyBold,
        color: colors.primary,
    },
    checkmark: {
        color: colors.primary,
        fontWeight: 'bold',
    },
});
