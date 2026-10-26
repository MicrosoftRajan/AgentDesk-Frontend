export const colors = {
  background: "#080B14",
  surface: "#111625",
  surfaceElevated: "#171D2E",

  text: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",

  border: "#242B3D",

  primary: "#7C3AED",
  primaryPressed: "#6D28D9",
  primaryLight: "#A78BFA",

  accent: "#22D3EE",

  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Google Fonts, loaded once in the root layout (see `useAppFonts`).
 * Plus Jakarta Sans for headings, Inter for body text. Custom fonts
 * ship one family per weight, so pick a family instead of fontWeight.
 */
export const fonts = {
  display: "PlusJakartaSans_800ExtraBold",
  heading: "PlusJakartaSans_700Bold",
  semibold: "Inter_600SemiBold",
  medium: "Inter_500Medium",
  body: "Inter_400Regular",
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
} as const;
