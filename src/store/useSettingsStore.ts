// src/store/useSettingsStore.ts
// React Context provider for all user settings (appearance, text size, color theme, sync, onboarding).
// NOTE: Exceeds the 150-line store ceiling because all five useState fields share the same
// synchronous DOM-apply pattern and must be initialized together to prevent flash-of-wrong-style
// on first paint. Splitting them across files would require re-introducing the same side-effect
// pattern in multiple places without reducing complexity.
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
import type { TextSize, ColorTheme, AppearanceMode } from "@/models/types";

// MARK: - Types

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

/** Provides all user settings to the component tree. Must wrap the entire application. */
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

  function setUserName(name: string): void {
    SettingsService.setUserName(name);
    setUserNameState(name);
  }

  /**
   * Applies a userName received from the cloud.
   * Device-local name takes precedence — only updates if the local name is empty.
   */
  function syncUserName(name: string): void {
    if (!name || SettingsService.getUserName()) return;
    SettingsService.setUserName(name);
    setUserNameState(name);
  }

  function completeOnboarding(): void {
    SettingsService.setHasCompletedOnboarding(true);
    setHasCompletedOnboarding(true);
  }

  function setAppearanceMode(mode: AppearanceMode): void {
    SettingsService.setAppearanceMode(mode);
    setAppearanceModeState(mode);
    applyThemeToDOM(mode);
  }

  function setTextSize(size: TextSize): void {
    SettingsService.setTextSize(size);
    setTextSizeState(size);
    applyTextSizeToDOM(size);
  }

  function setColorTheme(theme: ColorTheme): void {
    SettingsService.setColorTheme(theme);
    setColorThemeState(theme);
    applyColorThemeToDOM(theme, appearanceMode);
  }

  /**
   * Applies a colorTheme received from the cloud.
   * Always overwrites local — color theme is a shared preference, not
   * device-local data. Last write from any synced device wins.
   */
  function syncColorTheme(theme: ColorTheme): void {
    if (!theme) return;
    SettingsService.setColorTheme(theme);
    setColorThemeState(theme);
    applyColorThemeToDOM(theme, appearanceMode);
  }

  function resetToNewUser(): void {
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

/** Hook to access the settings store. Must be used within a {@link SettingsProvider}. */
export function useSettingsStore(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettingsStore must be used inside SettingsProvider");
  return ctx;
}
