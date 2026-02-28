// fontFamily is left undefined to use the platform default (SF Pro on iOS, Roboto on Android).
// This avoids depending on Platform.select() which requires the RN runtime to be ready.

// Apple HIG Typography
export const typography = {
    // Large Title (34pt)
    h1: {
        fontSize: 34,
        fontWeight: '700' as const,
        letterSpacing: 0.37,
        lineHeight: 41,
    },
    // Title 1 (28pt)
    h2: {
        fontSize: 28,
        fontWeight: '700' as const,
        letterSpacing: 0.36,
        lineHeight: 34,
    },
    // Title 2 (22pt)
    h3: {
        fontSize: 22,
        fontWeight: '600' as const,
        letterSpacing: 0.35,
        lineHeight: 28,
    },
    // Title 3 (20pt)
    h4: {
        fontSize: 20,
        fontWeight: '600' as const,
        letterSpacing: 0.38,
        lineHeight: 25,
    },
    // Headline (17pt Semibold)
    headline: {
        fontSize: 17,
        fontWeight: '600' as const,
        letterSpacing: -0.41,
        lineHeight: 22,
    },
    // Body (17pt Regular)
    body: {
        fontSize: 17,
        fontWeight: '400' as const,
        letterSpacing: -0.41,
        lineHeight: 22,
    },
    // Callout (16pt Regular)
    callout: {
        fontSize: 16,
        fontWeight: '400' as const,
        letterSpacing: -0.32,
        lineHeight: 21,
    },
    // Subhead (15pt Regular)
    subhead: {
        fontSize: 15,
        fontWeight: '400' as const,
        letterSpacing: -0.24,
        lineHeight: 20,
    },
    // Footnote (13pt Regular)
    footnote: {
        fontSize: 13,
        fontWeight: '400' as const,
        letterSpacing: -0.08,
        lineHeight: 18,
    },
    // Caption 1 (12pt Regular)
    caption1: {
        fontSize: 12,
        fontWeight: '400' as const,
        letterSpacing: 0,
        lineHeight: 16,
    },
    // Caption 2 (11pt Regular)
    caption2: {
        fontSize: 11,
        fontWeight: '400' as const,
        letterSpacing: 0.07,
        lineHeight: 13,
    },

    // Legacy Mappings (to prevent breaking immediate changes)
    bodyBold: {
        fontSize: 17,
        fontWeight: '600' as const,
        letterSpacing: -0.41,
        lineHeight: 22,
    },
    caption: {
        fontSize: 12, // mapped to caption1 size roughly
        fontWeight: '400' as const,
        letterSpacing: 0,
    },
    captionBold: {
        fontSize: 12,
        fontWeight: '600' as const,
        letterSpacing: 0,
    },
    navTitle: {
        fontSize: 17,
        fontWeight: '600' as const,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '500' as const,
    },
};
