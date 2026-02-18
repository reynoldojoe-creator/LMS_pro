import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, spacing } from '../../theme';
import { useAppTheme } from '../../hooks';

interface HeaderProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    rightAction?: React.ReactNode;
    showBackButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    title,
    subtitle,
    onBack,
    rightAction,
    showBackButton = true,
}) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);

    return (
        <SafeAreaView edges={['top']} style={styles.safeArea}>
            <View style={styles.container}>
                {/* Center: Title (Absolute Positioning) */}
                <View style={styles.center} pointerEvents="box-none">
                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text style={styles.subtitle} numberOfLines={1}>
                            {subtitle}
                        </Text>
                    )}
                </View>

                {/* Left: Back Button */}
                <View style={styles.left}>
                    {showBackButton && onBack && (
                        <TouchableOpacity
                            onPress={onBack}
                            style={styles.backButton}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.chevron}>‹</Text>
                            <Text style={styles.backText}>Back</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Right: Action */}
                <View style={styles.right}>{rightAction}</View>
            </View>
        </SafeAreaView>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    safeArea: {
        backgroundColor: '#F8F8F9', // Classic iOS nav bar gray
        borderBottomWidth: 1,
        borderBottomColor: '#B2B2B2',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
        paddingHorizontal: spacing.md,
    },
    left: {
        flex: 1,
        alignItems: 'flex-start',
        zIndex: 1, // Ensure buttons are clickable
    },
    center: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0, // Behind buttons
        paddingHorizontal: 80, // Prevent overlap with buttons (approx width of back/edit)
    },
    right: {
        flex: 1,
        alignItems: 'flex-end',
        zIndex: 1, // Ensure buttons are clickable
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 0, // Reduced padding to align better
    },
    chevron: {
        fontSize: 34,
        color: colors.primary,
        fontWeight: '300',
        marginRight: -4,
        marginTop: -4,
    },
    backText: {
        ...typography.body,
        color: colors.primary,
        fontSize: 17,
    },
    title: {
        ...typography.navTitle,
        color: colors.textPrimary,
        textShadowColor: 'rgba(255,255,255,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textAlign: 'center',
    },
    subtitle: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: -2,
        textAlign: 'center',
    },
});
