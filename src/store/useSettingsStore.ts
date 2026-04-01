// src/store/useSettingsStore.ts
import { createContext, useContext, useState, type ReactNode } from "react";
import { PersistenceService } from "../services/persistenceService";
import { applyThemeToDOM } from "./useTheme";
import React from "react";

// MARK: - Types

type AppearanceMode = "system" | "light" | "dark";

interface SettingsState {
  userName: string;
  hasCompletedOnboarding: boolean;
  appearanceMode: AppearanceMode;
  setUserName: (name: string) => void;
  completeOnboarding: () => void;
  setAppearanceMode: (mode: AppearanceMode) => void;
  resetToNewUser: () => void;
}

// MARK: - Context

const SettingsContext = createContext<SettingsState | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [userName, setUserNameState] = useState<string>(
    () => localStorage.getItem("userName") ?? "",
  );
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(
    () => localStorage.getItem("hasCompletedOnboarding") === "true",
  );
  const [appearanceMode, setAppearanceModeState] = useState<AppearanceMode>(
    () => {
      const saved =
        (localStorage.getItem("appearanceMode") as AppearanceMode) ?? "system";
      // Apply synchronously during state initialization — BEFORE first paint.
      // This prevents a flash of wrong theme for users with a saved preference.
      applyThemeToDOM(saved);
      return saved;
    },
  );

  function setUserName(name: string) {
    localStorage.setItem("userName", name);
    setUserNameState(name);
  }

  function completeOnboarding() {
    localStorage.setItem("hasCompletedOnboarding", "true");
    setHasCompletedOnboarding(true);
  }

  function setAppearanceMode(mode: AppearanceMode) {
    localStorage.setItem("appearanceMode", mode);
    setAppearanceModeState(mode);
    applyThemeToDOM(mode);
  }

  function resetToNewUser() {
    PersistenceService.clear();
    localStorage.removeItem("userName");
    localStorage.removeItem("hasCompletedOnboarding");
    localStorage.removeItem("appearanceMode");
    setUserNameState("");
    setHasCompletedOnboarding(false);
    setAppearanceModeState("system");
    applyThemeToDOM("system");
  }

  return React.createElement(
    SettingsContext.Provider,
    {
      value: {
        userName,
        hasCompletedOnboarding,
        appearanceMode,
        setUserName,
        completeOnboarding,
        setAppearanceMode,
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
