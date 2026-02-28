import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Platform, StatusBar } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

export interface ModernNavBarProps {
    title: string;
    showBack?: boolean;
    backText?: string;
    onBack?: () => void;
    rightButton?: ReactNode;
    style?: ViewStyle;
    largeTitle?: boolean;
    transparent?: boolean;
}

export const ModernNavBar: React.FC<ModernNavBarProps> = ({
    title,
    showBack = false,
    backText = "Back",
    onBack,
    rightButton,
    style,
    largeTitle = false,
    transparent = false,
}) => {
    const navigation = useNavigation();

    const handleBack = () => {
        if (onBack) onBack();
        else navigation.goBack();
    };

    const Container = transparent ? View : (Platform.OS === 'ios' ? BlurView : View);
    const containerStyle = transparent ? styles.transparentContainer : styles.blurContainer;
    const intensity = transparent ? 0 : 80;

    return (
        <View style={[styles.wrapper, style]}>
            <Container
                intensity={intensity}
                tint="light"
                style={[containerStyle, largeTitle && styles.largeTitleContainer]}
            >
                <View style={styles.statusBarPlaceholder} />

                <View style={styles.content}>
                    {/* Left Action (Back) */}
                    <View style={styles.leftContainer}>
                        {showBack && (
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleBack}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-back" size={28} color={colors.blue} />
                                <Text style={styles.backText}>{backText}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Title (Standard) */}
                    {!largeTitle && (
                        <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    )}

                    {/* Right Action */}
                    <View style={styles.rightContainer}>
                        {rightButton}
                    </View>
                </View>

                {/* Large Title (Optional) */}
                {largeTitle && (
                    <View style={styles.largeTitleWrapper}>
                        <Text style={styles.largeTitle} numberOfLines={1}>{title}</Text>
                    </View>
                )}

                {/* Bottom Border */}
                {!transparent && !largeTitle && <View style={styles.bottomBorder} />}
            </Container>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        zIndex: 100,
        backgroundColor: 'transparent',
    },
    transparentContainer: {
        backgroundColor: 'transparent',
    },
    blurContainer: {
        backgroundColor: Platform.OS === 'android' ? colors.background : undefined,
    },
    largeTitleContainer: {
        paddingBottom: 8,
    },
    statusBarPlaceholder: {
        height: spacing.iosHeaderPaddingTop,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: spacing.iosHeaderHeight,
        paddingHorizontal: spacing.screenHorizontal,
    },
    title: {
        ...typography.navTitle,
        color: colors.text,
        textAlign: 'center',
        flex: 1,
    },
    largeTitleWrapper: {
        paddingHorizontal: spacing.screenHorizontal,
        paddingBottom: 8,
    },
    largeTitle: {
        ...typography.h1,
        color: colors.text,
    },
    leftContainer: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    rightContainer: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: -8, // Compensate for icon padding
    },
    backText: {
        ...typography.body,
        fontSize: 17,
        color: colors.blue,
        marginLeft: -2,
    },
    bottomBorder: {
        height: 0.5,
        backgroundColor: colors.separator,
    }
});
