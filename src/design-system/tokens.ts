/**
 * Design System Tokens
 * Centralized design tokens for consistent theming across the application
 */

export const colors = {
  // Casino Brand Colors
  casino: {
    bg: "#0F0E11",
    bgSecondary: "#131216",
    bgTertiary: "#211F28",
    border: "#1E2938",
    borderSecondary: "#2A2E38",
    borderActive: "#343232",
    borderHover: "#5C41E1",
  },

  // Interactive Colors
  primary: {
    default: "#674AE5",
    hover: "#8B75F6",
  },

  // Text Colors
  text: {
    primary: "white",
    secondary: "#BEC6D1",
    tertiary: "#828998",
    muted: "rgba(255, 255, 255, 0.7)",
    mutedLow: "rgba(255, 255, 255, 0.6)",
    mutedVeryLow: "rgba(255, 255, 255, 0.5)",
  },

  // Status Colors
  status: {
    success: "#03BD6C",
    error: "#FF4757",
    warning: "#FFA726",
  },

  // Overlay Colors
  overlay: {
    light: "rgba(255, 255, 255, 0.2)",
    dark: "rgba(19, 18, 22, 0.6)",
  },
} as const;

export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "0.75rem", // 12px
  lg: "1rem", // 16px
  xl: "1.5rem", // 24px
  "2xl": "2rem", // 32px
  "3xl": "3rem", // 48px
  "4xl": "4rem", // 64px
} as const;

export const borderRadius = {
  none: "0",
  sm: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  full: "9999px",
} as const;

export const fontSize = {
  xs: "0.75rem", // 12px
  sm: "0.875rem", // 14px
  base: "1rem", // 16px
  lg: "1.125rem", // 18px
  xl: "1.25rem", // 20px
  "2xl": "1.5rem", // 24px
  "3xl": "1.875rem", // 30px
  "4xl": "2.25rem", // 36px
} as const;

export const fontWeight = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

// Component-specific tokens
export const components = {
  navbar: {
    height: "4.5rem", // h-18 = 72px
    background: colors.casino.bg,
    borderColor: colors.casino.border,
  },

  button: {
    height: {
      sm: "2rem", // 32px
      md: "2.5rem", // 40px
      lg: "3rem", // 48px
    },
    padding: {
      sm: "0.5rem 1rem",
      md: "0.75rem 1.5rem",
      lg: "1rem 2rem",
    },
  },

  card: {
    background: colors.casino.bgSecondary,
    border: colors.casino.borderSecondary,
    borderRadius: borderRadius.lg,
  },

  table: {
    rowHeight: "55px",
    headerBackground: "transparent",
    oddRowBackground: colors.overlay.dark,
  },
} as const;

// Type definitions for better TypeScript support
export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type BorderRadiusToken = keyof typeof borderRadius;
export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;
