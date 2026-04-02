// src/store/useSettingsStore.ts
import { createContext, useContext, useState, type ReactNode } from "react";
import { PersistenceService } from "../services/persistenceService";
import { applyThemeToDOM, applyTextSizeToDOM } from "./useTheme";
import type { TextSize, SortOrder } from "@/models/types";
import React from "react";

// MARK: - Types

type AppearanceMode = "system" | "light" | "dark";

export type { TextSize, SortOrder };

interface SettingsState {
  userName: string;
  hasCompletedOnboarding: boolean;
  appearanceMode: AppearanceMode;
  textSize: TextSize;
  sortOrder: SortOrder;
  setUserName: (name: string) => void;
  completeOnboarding: () => void;
  setAppearanceMode: (mode: AppearanceMode) => void;
  setTextSize: (size: TextSize) => void;
  setSortOrder: (order: SortOrder) => void;
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
  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    const saved = (localStorage.getItem("textSize") as TextSize) ?? "m";
    // Apply synchronously during state initialization to prevent layout shift.
    applyTextSizeToDOM(saved);
    return saved;
  });
  const [sortOrder, setSortOrderState] = useState<SortOrder>(
    () => (localStorage.getItem("sortOrder") as SortOrder) ?? "date",
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

  function setTextSize(size: TextSize) {
    localStorage.setItem("textSize", size);
    setTextSizeState(size);
    applyTextSizeToDOM(size);
  }

  function setSortOrder(order: SortOrder) {
    localStorage.setItem("sortOrder", order);
    setSortOrderState(order);
  }

  function resetToNewUser() {
    PersistenceService.clear();
    localStorage.removeItem("userName");
    localStorage.removeItem("hasCompletedOnboarding");
    localStorage.removeItem("appearanceMode");
    localStorage.removeItem("textSize");
    localStorage.removeItem("sortOrder");
    setUserNameState("");
    setHasCompletedOnboarding(false);
    setAppearanceModeState("system");
    applyThemeToDOM("system");
    setTextSizeState("m");
    applyTextSizeToDOM("m");
    setSortOrderState("date");
  }

  return React.createElement(
    SettingsContext.Provider,
    {
      value: {
        userName,
        hasCompletedOnboarding,
        appearanceMode,
        textSize,
        sortOrder,
        setUserName,
        completeOnboarding,
        setAppearanceMode,
        setTextSize,
        setSortOrder,
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
