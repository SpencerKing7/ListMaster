// src/store/useSettingsStore.ts
import {
  createContext,
  useContext,
  useState,
  createElement,
  type ReactNode,
} from "react";
import { PersistenceService } from "@/services/persistenceService";
import { SettingsService } from "@/services/settingsService";
import { InstallPromptService } from "@/services/installPromptService";
import {
  applyThemeToDOM,
  applyTextSizeToDOM,
  applyColorThemeToDOM,
} from "./useTheme";
import type { TextSize, ColorTheme } from "@/models/types";

// MARK: - Types

type AppearanceMode = "system" | "light" | "dark";

export type { TextSize };

interface SettingsState {
  userName: string;
  hasCompletedOnboarding: boolean;
  appearanceMode: AppearanceMode;
  textSize: TextSize;
  colorTheme: ColorTheme;
  setUserName: (name: string) => void;
  /** Applies a userName from the cloud only if the local name is empty. */
  syncUserName: (name: string) => void;
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

export function SettingsProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const [userName, setUserNameState] = useState<string>(() =>
    SettingsService.getUserName(),
  );
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(
    () => SettingsService.getHasCompletedOnboarding(),
  );
  const [appearanceMode, setAppearanceModeState] = useState<AppearanceMode>(
    () => {
      const saved = SettingsService.getAppearanceMode();
      // Apply synchronously during state initialization — BEFORE first paint.
      // This prevents a flash of wrong theme for users with a saved preference.
      applyThemeToDOM(saved);
      return saved;
    },
  );
  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    const saved = SettingsService.getTextSize();
    // Apply synchronously during state initialization to prevent layout shift.
    applyTextSizeToDOM(saved);
    return saved;
  });
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    const saved = SettingsService.getColorTheme();
    // Apply synchronously to avoid a flash of wrong color theme on load.
    applyColorThemeToDOM(saved, SettingsService.getAppearanceMode());
    return saved;
  });

  function setUserName(name: string) {
    SettingsService.setUserName(name);
    setUserNameState(name);
  }

  /**
   * Applies a userName received from the cloud.
   * Device-local name takes precedence — only updates if the local name is empty.
   */
  function syncUserName(name: string) {
    if (!name || SettingsService.getUserName()) return;
    SettingsService.setUserName(name);
    setUserNameState(name);
  }

  function completeOnboarding() {
    SettingsService.setHasCompletedOnboarding(true);
    setHasCompletedOnboarding(true);
  }

  function setAppearanceMode(mode: AppearanceMode) {
    SettingsService.setAppearanceMode(mode);
    setAppearanceModeState(mode);
    applyThemeToDOM(mode);
  }

  function setTextSize(size: TextSize) {
    SettingsService.setTextSize(size);
    setTextSizeState(size);
    applyTextSizeToDOM(size);
  }

  function setColorTheme(theme: ColorTheme) {
    SettingsService.setColorTheme(theme);
    setColorThemeState(theme);
    applyColorThemeToDOM(theme, appearanceMode);
  }

  /**
   * Applies a colorTheme received from the cloud.
   * Only updates if the local theme is still the default "green" — preserves
   * deliberate local customisation.
   */
  function syncColorTheme(theme: ColorTheme) {
    if (!theme || SettingsService.getColorTheme() !== "green") return;
    SettingsService.setColorTheme(theme);
    setColorThemeState(theme);
    applyColorThemeToDOM(theme, appearanceMode);
  }

  function resetToNewUser() {
    PersistenceService.clear();
    SettingsService.clearAll();
    InstallPromptService.clearAll();
    setUserNameState("");
    setHasCompletedOnboarding(false);
    setAppearanceModeState("system");
    applyThemeToDOM("system");
    setTextSizeState("m");
    applyTextSizeToDOM("m");
    setColorThemeState("green");
    applyColorThemeToDOM("green", "system");
  }

  return createElement(
    SettingsContext.Provider,
    {
      value: {
        userName,
        hasCompletedOnboarding,
        appearanceMode,
        textSize,
        colorTheme,
        setUserName,
        syncUserName,
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

export function useSettingsStore(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettingsStore must be used inside SettingsProvider");
  return ctx;
}
