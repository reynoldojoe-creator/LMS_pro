import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { useAppTheme } from '../../hooks';

interface LoadingSpinnerProps {
    size?: 'small' | 'large';
    fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'large',
    fullScreen = false,
}) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    if (fullScreen) {
        return (
            <Modal transparent visible animationType="fade">
                <View style={styles.fullScreenContainer}>
                    <View style={styles.fullScreenContent}>
                        <ActivityIndicator size={size} color={colors.primary} />
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <View style={styles.inline}>
            <ActivityIndicator size={size} color={colors.primary} />
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    inline: {
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Keep as semi-transparent overlay
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenContent: {
        backgroundColor: colors.surface,
        padding: 30,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
});
