import React from 'react';
import { View, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { useAppTheme } from '../../hooks';

interface ScreenBackgroundProps {
    children: React.ReactNode;
    style?: ViewStyle;
    type?: 'default' | 'grouped' | 'tertiary';
}

export const ScreenBackground: React.FC<ScreenBackgroundProps> = ({
    children,
    style,
    type = 'default'
}) => {
    const { colors, isDarkMode } = useAppTheme();

    const getBackgroundColor = () => {
        switch (type) {
            case 'grouped': return colors.secondaryBackground;
            case 'tertiary': return colors.tertiaryBackground;
            default: return colors.background;
        }
    };

    return (
        <View style={[
            styles.container,
            { backgroundColor: getBackgroundColor() },
            style
        ]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
