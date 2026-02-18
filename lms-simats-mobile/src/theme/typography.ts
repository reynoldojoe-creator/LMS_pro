import { Platform } from 'react-native';

const fontFamily = Platform.select({
    ios: 'System',
    android: 'Roboto',
});

export const typography = {
    // Headers
    h1: {
        fontFamily,
        fontSize: 34,
        fontWeight: '700' as const,
        letterSpacing: 0.37,
    },
    h2: {
        fontFamily,
        fontSize: 28,
        fontWeight: '700' as const,
        letterSpacing: 0.36,
    },
    h3: {
        fontFamily,
        fontSize: 22,
        fontWeight: '600' as const,
        letterSpacing: 0.35,
    },

    // Body
    body: {
        fontFamily,
        fontSize: 17,
        fontWeight: '400' as const,
        letterSpacing: -0.41,
    },
    bodyBold: {
        fontFamily,
        fontSize: 17,
        fontWeight: '600' as const,
        letterSpacing: -0.41,
    },

    // Small
    caption: {
        fontFamily,
        fontSize: 13,
        fontWeight: '400' as const,
        letterSpacing: -0.08,
    },
    captionBold: {
        fontFamily,
        fontSize: 13,
        fontWeight: '600' as const,
        letterSpacing: -0.08,
    },

    // Navigation
    navTitle: {
        fontFamily,
        fontSize: 17,
        fontWeight: '600' as const,
    },
    tabLabel: {
        fontFamily,
        fontSize: 10,
        fontWeight: '500' as const,
    },
};
