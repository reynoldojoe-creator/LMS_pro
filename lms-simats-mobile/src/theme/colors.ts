// Light Theme (iOS 6 Style)
export const colors = {
    // iOS 6 Classic Palette
    // iOS 6 Palette
    ios: {
        // Backgrounds
        linen: '#C5BDB4', // Classic linen texture base
        linenDark: '#3A3A3A', // Notification center / folder style

        // Gradients (Start -> End)
        blueGradient: ['#B0C8E8', '#6D9DD1'], // Standard nav bar
        darkBlueGradient: ['#3E6FA7', '#204060'], // Active states
        redGradient: ['#E8A0A0', '#C04040'], // Destructive actions
        greenGradient: ['#A0E8A0', '#40C040'], // Success actions
        grayGradient: ['#F0F0F0', '#D0D0D0'], // Standard buttons
        orangeGradient: ['#FFCC80', '#FFA726'], // Warning/Reports

        // Shadows
        textShadow: 'rgba(255, 255, 255, 0.5)', // Embossed effect
        textShadowDark: 'rgba(0, 0, 0, 0.4)', // Nav bar title

        // Borders
        border: '#C8C7CC', // Grouped table separator
        borderLight: 'rgba(255,255,255,0.6)',
        borderDark: '#999',

        // Text
        headerText: '#4C566C', // Grouped table headers
        bodyText: '#000000',
        detailText: '#8E8E93',
        blueText: '#3E6FA7'
    },

    // Legacy aliases (mapped to new style where possible or kept for compatibility)
    primary: '#3E6FA7', // Reduced saturation blue
    background: '#C5BDB4', // Linen
    text: '#000000',
    border: '#C8C7CC',
    notification: '#FF3B30',

    // Semantic
    success: '#4CD964',
    error: '#FF3B30',
    warning: '#FF9500',
    info: '#5AC8FA',

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
