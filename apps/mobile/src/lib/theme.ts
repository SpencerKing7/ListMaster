// src/lib/theme.ts — Design token object for React Native, mirroring tokens.css.
// Used by useSettingsStore to expose typed theme values to the component tree.
import type { AppearanceMode, ColorTheme, TextSize } from "@/models/types";

// MARK: - Surface and text tokens per appearance

interface AppearanceTokens {
  surfaceBackground: string;
  surfaceCard: string;
  surfaceInput: string;
  surfaceChrome: string;
  surfaceOverlay: string;
  textPrimary: string;
  textSecondary: string;
  textPlaceholder: string;
  textOnBrand: string;
  borderSubtle: string;
  borderDialog: string;
  danger: string;
}

// MARK: - Brand tokens per color theme × appearance

interface BrandTokens {
  brandGreen: string;
  brandTeal: string;
  brandBlue: string;
  brandDeepGreen: string;
  surfaceGreenTint: string;
}

export interface ThemeTokens extends AppearanceTokens, BrandTokens {}

// MARK: - Appearance lookups

const LIGHT_APPEARANCE: AppearanceTokens = {
  surfaceBackground: "#f2f2f7",
  surfaceCard: "#ffffff",
  surfaceInput: "#e9e9ef",
  surfaceChrome: "#f2f2f7",
  surfaceOverlay: "rgba(0,0,0,0.45)",
  textPrimary: "#1a1a1a",
  textSecondary: "rgba(0,0,0,0.5)",
  textPlaceholder: "rgba(0,0,0,0.35)",
  textOnBrand: "#ffffff",
  borderSubtle: "rgba(0,0,0,0.08)",
  borderDialog: "rgba(0,0,0,0.1)",
  danger: "#d44b4a",
};

const DARK_APPEARANCE: AppearanceTokens = {
  surfaceBackground: "#0a0a0a",
  surfaceCard: "#1a1a1a",
  surfaceInput: "#252525",
  surfaceChrome: "#111111",
  surfaceOverlay: "rgba(0,0,0,0.7)",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.63)",
  textPlaceholder: "rgba(255,255,255,0.35)",
  textOnBrand: "#ffffff",
  borderSubtle: "rgba(255,255,255,0.1)",
  borderDialog: "rgba(255,255,255,0.16)",
  danger: "#e76560",
};

// MARK: - Brand lookups

type BrandByTheme = Record<ColorTheme, { light: BrandTokens; dark: BrandTokens }>;

const BRAND_TOKENS: BrandByTheme = {
  green: {
    light: {
      brandGreen: "#39b385",
      brandTeal: "#2c9096",
      brandBlue: "#3275b5",
      brandDeepGreen: "#1a5e4b",
      surfaceGreenTint: "rgba(57,179,133,0.06)",
    },
    dark: {
      brandGreen: "#49cb9a",
      brandTeal: "#3daab0",
      brandBlue: "#4c8dcb",
      brandDeepGreen: "#277862",
      surfaceGreenTint: "rgba(73,203,154,0.1)",
    },
  },
  blue: {
    light: {
      brandGreen: "#3b82f6",
      brandTeal: "#2563eb",
      brandBlue: "#1d4ed8",
      brandDeepGreen: "#1e3a8a",
      surfaceGreenTint: "rgba(59,130,246,0.06)",
    },
    dark: {
      brandGreen: "#60a5fa",
      brandTeal: "#4b8ef5",
      brandBlue: "#3b82f6",
      brandDeepGreen: "#1e40af",
      surfaceGreenTint: "rgba(96,165,250,0.1)",
    },
  },
  orange: {
    light: {
      brandGreen: "#f97316",
      brandTeal: "#ea6c0a",
      brandBlue: "#c2510a",
      brandDeepGreen: "#7c2d12",
      surfaceGreenTint: "rgba(249,115,22,0.06)",
    },
    dark: {
      brandGreen: "#fb923c",
      brandTeal: "#f0821c",
      brandBlue: "#e07318",
      brandDeepGreen: "#9a3412",
      surfaceGreenTint: "rgba(251,146,60,0.1)",
    },
  },
};

// MARK: - Text size

/** Maps TextSize tokens to numeric sp values. */
export const TEXT_SIZE_SP: Record<TextSize, number> = {
  xs: 11,
  s: 13,
  m: 16,
  l: 18,
  xl: 21,
};

/** Maps TextSize tokens to vertical row padding values (px). */
export const ROW_PADDING_Y: Record<TextSize, number> = {
  xs: 7,
  s: 10,
  m: 14,
  l: 16,
  xl: 20,
};

// MARK: - Resolver

/**
 * Resolves a full set of theme tokens from the current appearance mode,
 * color theme, and system color scheme.
 */
export function resolveThemeTokens(
  appearanceMode: AppearanceMode,
  colorTheme: ColorTheme,
  systemIsDark: boolean,
): ThemeTokens {
  const isDark =
    appearanceMode === "dark" ||
    (appearanceMode === "system" && systemIsDark);

  const appearance = isDark ? DARK_APPEARANCE : LIGHT_APPEARANCE;
  const brand = isDark
    ? BRAND_TOKENS[colorTheme].dark
    : BRAND_TOKENS[colorTheme].light;

  return { ...appearance, ...brand };
}
