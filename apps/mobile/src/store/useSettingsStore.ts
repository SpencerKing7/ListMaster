// src/store/useSettingsStore.ts
// React Context provider for all user settings (appearance, text size, color theme, sync, onboarding).
// All DOM-application calls are replaced by resolveThemeTokens — consumers read tokens directly.
import {
  createContext,
  useContext,
  useState,
  createElement,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import { PersistenceService } from "@/services/persistenceService";
import { SettingsService } from "@/services/settingsService";
import { resolveThemeTokens, TEXT_SIZE_SP, ROW_PADDING_Y } from "@/lib/theme";
import type { ThemeTokens } from "@/lib/theme";
import type { TextSize, ColorTheme, AppearanceMode } from "@/models/types";

// MARK: - Types

export type { TextSize };

interface SettingsState {
  hasCompletedOnboarding: boolean;
  appearanceMode: AppearanceMode;
  textSize: TextSize;
  colorTheme: ColorTheme;
  /** Resolved design tokens for the current appearance + color theme + system scheme. */
  theme: ThemeTokens;
  /** Resolved text size in sp. */
  textSizeSp: number;
  /** Resolved vertical row padding in px. */
  rowPaddingY: number;
  completeOnboarding: () => void;
  setAppearanceMode: (mode: AppearanceMode) => void;
  setTextSize: (size: TextSize) => void;
  setColorTheme: (theme: ColorTheme) => void;
  /** Applies a colorTheme from the cloud only if the local theme is the default "green". */
  syncColorTheme: (theme: ColorTheme) => void;
  resetToNewUser: () => void;
}

// MARK: - Context

const SettingsContext = createContext<SettingsState | undefined>(undefined);

// MARK: - Provider

/** Provides all user settings to the component tree. Must wrap the entire application. */
export function SettingsProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const systemColorScheme = useColorScheme();
  const systemIsDark = systemColorScheme === "dark";

  const [hasCompletedOnboarding, setHasCompletedOnboarding] =
    useState<boolean>(() => SettingsService.getHasCompletedOnboarding());
  const [appearanceMode, setAppearanceModeState] = useState<AppearanceMode>(
    () => SettingsService.getAppearanceMode(),
  );
  const [textSize, setTextSizeState] = useState<TextSize>(() =>
    SettingsService.getTextSize(),
  );
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() =>
    SettingsService.getColorTheme(),
  );

  // Resolve tokens on every render when relevant state changes.
  const theme = resolveThemeTokens(appearanceMode, colorTheme, systemIsDark);
  const textSizeSp = TEXT_SIZE_SP[textSize] ?? TEXT_SIZE_SP["m"];
  const rowPaddingY = ROW_PADDING_Y[textSize] ?? ROW_PADDING_Y["m"];

  function completeOnboarding(): void {
    SettingsService.setHasCompletedOnboarding(true);
    setHasCompletedOnboarding(true);
  }

  function setAppearanceMode(mode: AppearanceMode): void {
    SettingsService.setAppearanceMode(mode);
    setAppearanceModeState(mode);
  }

  function setTextSize(size: TextSize): void {
    SettingsService.setTextSize(size);
    setTextSizeState(size);
  }

  function setColorTheme(theme: ColorTheme): void {
    SettingsService.setColorTheme(theme);
    setColorThemeState(theme);
  }

  function syncColorTheme(theme: ColorTheme): void {
    if (!theme) return;
    SettingsService.setColorTheme(theme);
    setColorThemeState(theme);
  }

  function resetToNewUser(): void {
    PersistenceService.clear();
    SettingsService.clearAll();
    setHasCompletedOnboarding(false);
    setAppearanceModeState("system");
    setTextSizeState("m");
    setColorThemeState("green");
  }

  return createElement(
    SettingsContext.Provider,
    {
      value: {
        hasCompletedOnboarding,
        appearanceMode,
        textSize,
        colorTheme,
        theme,
        textSizeSp,
        rowPaddingY,
        completeOnboarding,
        setAppearanceMode,
        setTextSize,
        setColorTheme,
        syncColorTheme,
        resetToNewUser,
      },
    },
    children,
  );
}

/** Hook to access the settings store. Must be used within a {@link SettingsProvider}. */
export function useSettingsStore(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettingsStore must be used inside SettingsProvider");
  return ctx;
}
