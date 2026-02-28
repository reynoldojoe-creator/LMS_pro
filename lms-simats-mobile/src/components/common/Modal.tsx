import React from 'react';
import {
    View,
    Text,
    Modal as RNModal,
    TouchableOpacity,
    StyleSheet,
    TouchableWithoutFeedback,
    Dimensions,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface ModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
    visible,
    onClose,
    title,
    children,
}) => {
    return (
        <RNModal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.backdrop}>
                    <TouchableWithoutFeedback>
                        <View style={styles.content}>
                            {/* Drag Handle */}
                            <View style={styles.dragHandle} />

                            {/* Header */}
                            {title && (
                                <View style={styles.header}>
                                    <Text style={styles.title}>{title}</Text>
                                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                        <Text style={styles.closeText}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Body */}
                            <View style={styles.body}>{children}</View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </RNModal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: Dimensions.get('window').height * 0.9,
    },
    dragHandle: {
        width: 36,
        height: 5,
        backgroundColor: colors.iosGray4,
        borderRadius: 9999,
        alignSelf: 'center',
        marginTop: spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
    },
    title: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    closeButton: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    closeText: {
        ...typography.bodyBold,
        color: colors.primary,
    },
    body: {
        padding: spacing.lg,
    },
});
