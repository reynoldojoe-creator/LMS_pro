// Modern iOS System Colors (accessible via PlatformColor usually, but hardcoded here for expo compatibility)
// Based on Apple Human Interface Guidelines

const baseColors = {
    // System Colors
    red: '#FF3B30',
    orange: '#FF9500',
    yellow: '#FFCC00',
    green: '#34C759',
    mint: '#00C7BE',
    teal: '#30B0C7',
    cyan: '#32ADE6',
    blue: '#007AFF',
    indigo: '#5856D6',
    purple: '#AF52DE',
    pink: '#FF2D55',
    brown: '#A2845E',

    // Grays
    systemGray: '#8E8E93',
    systemGray2: '#AEAEB2',
    systemGray3: '#C7C7CC',
    systemGray4: '#D1D1D6',
    systemGray5: '#E5E5EA',
    systemGray6: '#F2F2F7',

    // Dark Mode Grays (for reference)
    // systemGrayDark: '#8E8E93',
    // systemGray2Dark: '#636366',
    // systemGray3Dark: '#48484A',
    // systemGray4Dark: '#3A3A3C',
    // systemGray5Dark: '#2C2C2E',
    // systemGray6Dark: '#1C1C1E',
};

export const colors = {
    ...baseColors,

    // Semantic Colors
    background: '#FFFFFF', // systemBackground
    secondaryBackground: '#F2F2F7', // systemGroupedBackground
    tertiaryBackground: '#FFFFFF', // secondarySystemGroupedBackground

    text: '#000000', // label
    textSecondary: '#3C3C4399', // secondaryLabel (60% opacity)
    textTertiary: '#3C3C434D', // tertiaryLabel (30% opacity)
    textQuarter: '#3C3C432E', // quaternaryLabel (18% opacity)
    textInverse: '#FFFFFF',

    separator: '#3C3C435C', // separator (opaque: #C6C6C8)
    opaqueSeparator: '#C6C6C8',

    link: baseColors.blue,

    // Feedback
    success: baseColors.green,
    warning: baseColors.orange,
    error: baseColors.red,
    successDark: '#248A3D', // Darker green for text on light backgrounds
    info: baseColors.blue,

    // Component Specific
    card: '#FFFFFF',
    border: '#C6C6C8',
    shadow: '#000000',

    // Bloom's Taxonomy (Modernized)
    bloomRemember: baseColors.orange,
    bloomUnderstand: baseColors.yellow,
    bloomApply: baseColors.green,
    bloomAnalyze: baseColors.blue,
    bloomEvaluate: baseColors.indigo,
    bloomCreate: baseColors.pink,

    // Difficulty
    difficultyEasy: baseColors.green,
    difficultyMedium: baseColors.orange,
    difficultyHard: baseColors.red,

    // Legacy/Backwards Compatibility (Map to new tokens where possible)
    primary: baseColors.blue,
    primaryLight: '#5AC8FA', // cyan-ish
    primaryDark: '#0040DD',
    surface: '#FFFFFF',

    // Legacy Aliases (for backward compatibility)
    textPrimary: '#000000', // mapped to text
    divider: '#3C3C435C', // mapped to separator
    disabled: baseColors.systemGray4,
    iosBlue: baseColors.blue,
    iosPurple: baseColors.purple,
    iosGray6: baseColors.systemGray6,
    iosGray5: baseColors.systemGray5,
    iosGray4: baseColors.systemGray4,
    iosGray3: baseColors.systemGray3,
    iosGray2: baseColors.systemGray2,
    iosGray: baseColors.systemGray,

    ios: {
        // Keeping structure but pointing to modern colors to prevent crashes before refactor
        linen: '#F2F2F7', // mapped to systemGroupedBackground
        linenDark: '#000000',
        blueGradient: [baseColors.blue, baseColors.blue], // No gradients
        darkBlueGradient: [baseColors.indigo, baseColors.indigo],
        redGradient: [baseColors.red, baseColors.red],
        greenGradient: [baseColors.green, baseColors.green],
        grayGradient: [baseColors.systemGray6, baseColors.systemGray6],
        orangeGradient: [baseColors.orange, baseColors.orange],
        textShadow: 'transparent',
        textShadowDark: 'transparent',
        border: '#C6C6C8',
        borderLight: '#E5E5EA',
        borderDark: '#8E8E93',
        headerText: '#000000',
        bodyText: '#000000',
        detailText: '#3C3C4399',
        blueText: baseColors.blue,
        iosGray: baseColors.systemGray,
    }
};

export const darkColors = {
    ...colors,
    ...baseColors,

    background: '#000000', // systemBackground
    secondaryBackground: '#1C1C1E', // systemGroupedBackground
    tertiaryBackground: '#2C2C2E', // secondarySystemGroupedBackground

    text: '#FFFFFF',
    textSecondary: '#EBEBF599', // 60%
    textTertiary: '#EBEBF54D', // 30%
    textQuarter: '#EBEBF52E', // 18%
    textInverse: '#000000',

    // Legacy Aliases (Dark)
    textPrimary: '#FFFFFF',
    divider: '#54545899',
    disabled: '#3A3A3C', // systemGray4Dark
    iosBlue: baseColors.blue, // usually lighter in dark mode but keeping simple
    iosPurple: baseColors.purple,
    iosGray6: '#1C1C1E', // systemGray6Dark
    iosGray5: '#2C2C2E',
    iosGray: '#8E8E93',

    separator: '#54545899', // 60%
    opaqueSeparator: '#38383A',

    card: '#1C1C1E',
    border: '#38383A',
    surface: '#1C1C1E',
    primary: baseColors.blue,
    primaryLight: '#5AC8FA',
    primaryDark: '#0A84FF',

    ios: {
        ...colors.ios,
        linen: '#000000',
        linenDark: '#1C1C1E',
        headerText: '#FFFFFF',
        bodyText: '#FFFFFF',
        detailText: '#EBEBF599',
    }
};