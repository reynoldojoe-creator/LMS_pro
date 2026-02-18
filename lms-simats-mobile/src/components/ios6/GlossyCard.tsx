import React from 'react';
import { View, StyleSheet, ViewStyle, Text, TextStyle } from 'react-native';
import { colors, darkColors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useColorScheme } from 'react-native';

interface GlossyCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    title?: string;
    footer?: string;
}

export const GlossyCard: React.FC<GlossyCardProps> = ({ children, style, title, footer }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const themeColors = isDark ? darkColors : colors;

    return (
        <View style={[styles.wrapper, style]}>
            {title && (
                <Text style={styles.header}>
                    {title.toUpperCase()}
                </Text>
            )}

            <View style={[
                styles.container,
                {
                    backgroundColor: isDark ? themeColors.surface : '#FFFFFF',
                    borderColor: themeColors.ios.border,
                }
            ]}>
                {children}
            </View>

            {footer && (
                <Text style={styles.footer}>
                    {footer}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginVertical: 10,
        marginHorizontal: 10,
    },
    container: {
        borderRadius: 10,
        borderWidth: 1,
        overflow: 'hidden',
        // iOS 6 cards usually had a slight shadow
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: 1,
    },
    header: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4C566C', // Standard iOS 6 grouped header color
        marginBottom: 5,
        marginLeft: 10,
        textShadowColor: 'rgba(255,255,255,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 0,
    },
    footer: {
        fontSize: 13,
        color: '#4C566C',
        marginTop: 5,
        marginLeft: 10,
        textAlign: 'center'
    }
});
