import { fonts } from "../../theme";

export const desk = {
  primary: "#0F766E",
  primaryPressed: "#115E59",
  primarySoft: "#F0FDFA",
  secondary: "#2563EB",
  secondaryPressed: "#1D4ED8",
  secondarySoft: "#EFF6FF",
  bg: "#F7F9FC",
  surface: "#FFFFFF",
  text: "#172033",
  muted: "#64748B",
  border: "#E2E8F0",
  success: "#15803D",
  successSoft: "#F0FDF4",
  warning: "#B45309",
  warningSoft: "#FFFBEB",
  danger: "#B91C1C",
  dangerSoft: "#FEF2F2",
  info: "#1D4ED8",
  infoSoft: "#EFF6FF",
  slate: "#334155",
  slateSoft: "#F1F5F9",
  shadow: "rgba(23, 32, 51, 0.06)",
} as const;

export const type = {
  display: fonts.heading,
  title: fonts.heading,
  semibold: fonts.semibold,
  medium: fonts.medium,
  body: fonts.body,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 16,
  pill: 999,
} as const;
