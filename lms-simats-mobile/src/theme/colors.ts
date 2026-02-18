// Light Theme (iOS 6 Style)
export const colors = {
    // iOS 6 Classic Palette
    primary: '#4A90D9', // Soft iOS 6 Blue
    primaryLight: '#73B4FF',
    primaryDark: '#3570B0',

    // Backgrounds
    background: '#F0F0F5', // Light gray-white (Linen base)
    surface: '#FFFFFF',    // Pure white
    card: '#FFFFFF',

    // Text
    textPrimary: '#333333',
    textSecondary: '#8E8E93',
    textTertiary: '#B2B2B2',
    textInverse: '#FFFFFF',
    textShadow: 'rgba(255, 255, 255, 0.7)', // Etched text effect

    // Status
    success: '#4CD964',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#5AC8FA',

    // UI Elements
    divider: '#C8C7CC', // Classic iOS divider
    border: '#C8C7CC',
    disabled: '#EFEFF4',

    // Gradients & Textures (Simulated)
    headerGradientTop: '#F8F8F9',
    headerGradientBottom: '#E3E3E8',
    buttonGradientTop: 'rgba(255, 255, 255, 0.3)',
    buttonGradientBottom: 'rgba(0, 0, 0, 0.05)',

    // Shadows
    shadowLight: 'rgba(255, 255, 255, 1.0)',
    shadowDark: 'rgba(0, 0, 0, 0.3)',

    // Gloss & Texture Tokens
    glossHighlight: 'rgba(255, 255, 255, 0.6)',
    glossShadow: 'rgba(0, 0, 0, 0.15)',
    linen: '#E5E5EA',
    linenDark: '#3A3A3C',

    // iOS Specific
    iosGray: '#8E8E93',
    iosGray2: '#AEAEB2',
    iosGray3: '#C7C7CC',
    iosGray4: '#D1D1D6',
    iosGray5: '#E5E5EA',
    iosGray6: '#F2F2F7',
    iosBlue: '#4A90D9',
    iosPurple: '#5856D6',
    iosOrange: '#FF9500',

    // Bloom's Level Colors
    bloomRemember: '#FF9500',
    bloomUnderstand: '#FFCC00',
    bloomApply: '#4CD964',
    bloomAnalyze: '#5AC8FA',
    bloomEvaluate: '#5856D6',
    bloomCreate: '#FF2D55',

    // Difficulty Colors
    difficultyEasy: '#4CD964',
    difficultyMedium: '#FF9500',
    difficultyHard: '#FF3B30',
};

// Dark Theme (Dark Linen / Graphite)
export const darkColors = {
    ...colors,
    // Backgrounds
    background: '#2C2C2E', // Dark graphite / dark linen base
    surface: '#1C1C1E',    // Dark panel
    card: '#1C1C1E',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#EBEBF5', // System Gray 6 equivalent for text on dark
    textTertiary: '#8E8E93', // System Gray
    textInverse: '#000000',
    textShadow: 'rgba(0, 0, 0, 0.8)', // Dark shadow for etched text

    // UI Elements
    divider: '#38383A',
    border: '#38383A',
    disabled: '#3A3A3C',

    // Gradients & Textures
    headerGradientTop: '#444446',
    headerGradientBottom: '#1C1C1E',
    buttonGradientTop: '#636366',
    buttonGradientBottom: '#2C2C2E',

    // Shadows
    shadowLight: 'rgba(255, 255, 255, 0.1)',
    shadowDark: 'rgba(0, 0, 0, 0.8)',

    // Gloss & Texture Tokens
    glossHighlight: 'rgba(255, 255, 255, 0.1)', // Subtle highlight on dark
    glossShadow: 'rgba(0, 0, 0, 0.5)', // Strong shadow

    // iOS Grays (may need adjustment for dark mode, keeping standard for now)
    iosGray: '#8E8E93',
    iosGray2: '#636366',
    iosGray3: '#48484A',
    iosGray4: '#3A3A3C',
    iosGray5: '#2C2C2E',
    iosGray6: '#1C1C1E',
};
