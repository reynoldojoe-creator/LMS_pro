import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, darkColors } from '../../theme/colors';
import { useColorScheme } from 'react-native';

interface LinenBackgroundProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export const LinenBackground: React.FC<LinenBackgroundProps> = ({ children, style }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const themeColors = isDark ? darkColors : colors;

    return (
        <View style={[styles.container, { backgroundColor: themeColors.ios.linen }, style]}>
            {/* 
               In a real iOS 6 app, this would be a tiled image. 
               For now, we use the solid color approximation from colors.ts 
               We could add a pattern overlay here if we had an asset.
            */}
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});
