import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GlossyButton } from './GlossyButton';

export interface GlossyNavBarProps {
    title: string;
    showBack?: boolean;
    backText?: string;
    onBack?: () => void;
    rightButton?: {
        title: string;
        onPress: () => void;
        variant?: 'blue' | 'red' | 'gray';
    } | ReactNode;
    style?: ViewStyle;
}

export const GlossyNavBar: React.FC<GlossyNavBarProps> = ({
    title,
    showBack = false,
    backText = "Back",
    onBack,
    rightButton,
    style
}) => {
    const navigation = useNavigation();

    const handleBack = () => {
        if (onBack) onBack();
        else navigation.goBack();
    };

    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={colors.ios.blueGradient as any}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                {/* Status Bar divider mockup (optional) */}
                <View style={styles.statusBarSeparator} />

                <View style={styles.content}>
                    {/* Left Action (Back) */}
                    <View style={styles.leftContainer}>
                        {showBack && (
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={handleBack}
                            >
                                <Ionicons name="chevron-back" size={24} color="white" style={styles.backIcon} />
                                <Text style={styles.backText}>{backText}</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Title */}
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>

                    {/* Right Action */}
                    <View style={styles.rightContainer}>
                        {rightButton && (
                            React.isValidElement(rightButton)
                                ? rightButton
                                : <GlossyButton
                                    title={(rightButton as any).title}
                                    onPress={(rightButton as any).onPress}
                                    variant={(rightButton as any).variant || 'blue'}
                                    size="small"
                                    style={styles.rightBtn}
                                />
                        )}
                    </View>
                </View>

                {/* Bottom Border */}
                <View style={styles.bottomBorder} />
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 44, // Standard iOS nav height (excluding status bar)
        zIndex: 100,
        width: '100%',
    },
    gradient: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    statusBarSeparator: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
        paddingHorizontal: 8,
    },
    title: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: -1 },
        textShadowRadius: 0,
        textAlign: 'center',
        flex: 1,
    },
    leftContainer: {
        flex: 1,
        alignItems: 'flex-start',
    },
    rightContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 5,
        // In real iOS 6, back buttons were a special shape (arrow). 
        // We'll simulate with just text for now or custom shape later.
    },
    backIcon: {
        marginTop: 1,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.5,
        shadowRadius: 0,
    },
    backText: {
        color: 'white',
        fontSize: 12, // iOS 6 back button text was small
        fontWeight: 'bold',
        marginLeft: -4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: -1 },
        textShadowRadius: 0,
    },
    rightBtn: {
        minWidth: 60,
        height: 30, // Smaller for navbar
    },
    bottomBorder: {
        height: 1,
        backgroundColor: '#2D3038', // Dark border at bottom of nav bar
    }
});
