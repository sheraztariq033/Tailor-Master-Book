// Define font families, sizes, and weights
// In a real React Native app, you'd link custom fonts.
// For now, we'll assume system defaults or a common font like 'Inter'.

const fontFamilies = {
  // Example: If 'Inter' font family is linked in the project
  // primary: 'Inter-Regular',
  // primaryBold: 'Inter-Bold',
  // primaryMedium: 'Inter-Medium',
  // primaryLight: 'Inter-Light',
  // For now, rely on system defaults or specify common system fonts
  primary: 'System', // Will default to San Francisco on iOS, Roboto on Android
  primaryBold: 'System',
  primaryMedium: 'System',
  primaryLight: 'System',
  // You can add more specific font families if needed, e.g., for headings or body text
  // heading: 'Georgia', // Example, if available
  // body: 'Helvetica', // Example, if available
};

const fontSizes = {
  xs: 12,    // Extra small
  sm: 14,    // Small
  base: 16,  // Default/Medium
  lg: 18,    // Large
  xl: 20,    // Extra large
  h1: 32,    // Heading 1
  h2: 28,    // Heading 2
  h3: 24,    // Heading 3
  h4: 20,    // Heading 4 (same as xl for this example)
  h5: 18,    // Heading 5 (same as lg for this example)
  h6: 16,    // Heading 6 (same as base for this example)
};

const fontWeights = {
  thin: '100' as '100',
  extralight: '200' as '200',
  light: '300' as '300',
  normal: '400' as '400',
  medium: '500' as '500',
  semibold: '600' as '600',
  bold: '700' as '700',
  extrabold: '800' as '800',
  black: '900' as '900',
};

// Combine into typography styles for easier use
export const typography = {
  fontFamilies,
  fontSizes,
  fontWeights,

  // Predefined text styles
  h1: {
    fontFamily: fontFamilies.primaryBold, // Or specific heading font
    fontSize: fontSizes.h1,
    fontWeight: fontWeights.bold,
  },
  h2: {
    fontFamily: fontFamilies.primaryBold,
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.bold,
  },
  h3: {
    fontFamily: fontFamilies.primaryBold,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.semibold,
  },
  h4: {
    fontFamily: fontFamilies.primaryBold,
    fontSize: fontSizes.h4,
    fontWeight: fontWeights.semibold,
  },
  body: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
  },
  bodySmall: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
  },
  caption: {
    fontFamily: fontFamilies.primaryLight, // Or specific caption font
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.light,
  },
  button: {
    fontFamily: fontFamilies.primaryMedium,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
  },
  label: {
    fontFamily: fontFamilies.primaryMedium,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  }
};

export type Typography = typeof typography;
