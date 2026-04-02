// src/services/settingsService.ts
import type { TextSize, SortOrder } from "@/models/types";

const USER_NAME_KEY = "userName";
const HAS_COMPLETED_ONBOARDING_KEY = "hasCompletedOnboarding";
const APPEARANCE_MODE_KEY = "appearanceMode";
const TEXT_SIZE_KEY = "textSize";
const SORT_ORDER_KEY = "sortOrder";

type AppearanceMode = "system" | "light" | "dark";

const VALID_TEXT_SIZES: readonly TextSize[] = ["xs", "s", "m", "l", "xl"];
const VALID_SORT_ORDERS: readonly SortOrder[] = ["date", "alpha"];
const VALID_APPEARANCE_MODES: readonly AppearanceMode[] = [
  "system",
  "light",
  "dark",
];

export const SettingsService = {
  // User Name
  getUserName(): string {
    return localStorage.getItem(USER_NAME_KEY) ?? "";
  },

  setUserName(name: string): void {
    localStorage.setItem(USER_NAME_KEY, name);
  },

  clearUserName(): void {
    localStorage.removeItem(USER_NAME_KEY);
  },

  // Onboarding
  getHasCompletedOnboarding(): boolean {
    return localStorage.getItem(HAS_COMPLETED_ONBOARDING_KEY) === "true";
  },

  setHasCompletedOnboarding(completed: boolean): void {
    localStorage.setItem(
      HAS_COMPLETED_ONBOARDING_KEY,
      completed ? "true" : "false",
    );
  },

  clearHasCompletedOnboarding(): void {
    localStorage.removeItem(HAS_COMPLETED_ONBOARDING_KEY);
  },

  // Appearance Mode
  getAppearanceMode(): AppearanceMode {
    const saved = localStorage.getItem(APPEARANCE_MODE_KEY) as AppearanceMode;
    return VALID_APPEARANCE_MODES.includes(saved) ? saved : "system";
  },

  setAppearanceMode(mode: AppearanceMode): void {
    if (!VALID_APPEARANCE_MODES.includes(mode)) {
      throw new Error(`Invalid appearance mode: ${mode}`);
    }
    localStorage.setItem(APPEARANCE_MODE_KEY, mode);
  },

  clearAppearanceMode(): void {
    localStorage.removeItem(APPEARANCE_MODE_KEY);
  },

  // Text Size
  getTextSize(): TextSize {
    const saved = localStorage.getItem(TEXT_SIZE_KEY) as TextSize;
    return VALID_TEXT_SIZES.includes(saved) ? saved : "m";
  },

  setTextSize(size: TextSize): void {
    if (!VALID_TEXT_SIZES.includes(size)) {
      throw new Error(`Invalid text size: ${size}`);
    }
    localStorage.setItem(TEXT_SIZE_KEY, size);
  },

  clearTextSize(): void {
    localStorage.removeItem(TEXT_SIZE_KEY);
  },

  // Sort Order
  getSortOrder(): SortOrder {
    const saved = localStorage.getItem(SORT_ORDER_KEY) as SortOrder;
    return VALID_SORT_ORDERS.includes(saved) ? saved : "date";
  },

  setSortOrder(order: SortOrder): void {
    if (!VALID_SORT_ORDERS.includes(order)) {
      throw new Error(`Invalid sort order: ${order}`);
    }
    localStorage.setItem(SORT_ORDER_KEY, order);
  },

  clearSortOrder(): void {
    localStorage.removeItem(SORT_ORDER_KEY);
  },

  // Clear all settings
  clearAll(): void {
    this.clearUserName();
    this.clearHasCompletedOnboarding();
    this.clearAppearanceMode();
    this.clearTextSize();
    this.clearSortOrder();
  },
};
