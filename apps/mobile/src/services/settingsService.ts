// src/services/settingsService.ts
// Singleton service for reading and writing user settings via AsyncStorage.
// Uses an in-memory mirror for synchronous reads; writes flush asynchronously.
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  TextSize,
  SortOrder,
  ColorTheme,
  AppearanceMode,
} from "@/models/types";

const HAS_COMPLETED_ONBOARDING_KEY = "hasCompletedOnboarding";
const APPEARANCE_MODE_KEY = "appearanceMode";
const TEXT_SIZE_KEY = "textSize";
const SORT_ORDER_KEY = "sortOrder";
const SYNC_CODE_KEY = "syncCode";
const IS_SYNC_ENABLED_KEY = "isSyncEnabled";
const COLOR_THEME_KEY = "colorTheme";

const VALID_TEXT_SIZES: readonly TextSize[] = ["xs", "s", "m", "l", "xl"];
const VALID_SORT_ORDERS: readonly SortOrder[] = ["date", "alpha"];
const VALID_APPEARANCE_MODES: readonly AppearanceMode[] = [
  "system",
  "light",
  "dark",
];
const VALID_COLOR_THEMES: readonly ColorTheme[] = ["green", "blue", "orange"];

// In-memory mirror for synchronous reads.
const cache: Record<string, string> = {};

/** Keys that must be hydrated at startup. */
const SETTINGS_KEYS = [
  HAS_COMPLETED_ONBOARDING_KEY,
  APPEARANCE_MODE_KEY,
  TEXT_SIZE_KEY,
  SORT_ORDER_KEY,
  SYNC_CODE_KEY,
  IS_SYNC_ENABLED_KEY,
  COLOR_THEME_KEY,
];

/** Hydrate the in-memory settings cache from AsyncStorage. Call once at app startup. */
export async function hydrateSettingsCache(): Promise<void> {
  try {
    const pairs = await AsyncStorage.multiGet(SETTINGS_KEYS);
    for (const [key, value] of pairs) {
      if (value !== null) cache[key] = value;
    }
  } catch {
    // Proceed with defaults
  }
}

function get(key: string): string | null {
  return cache[key] ?? null;
}

function set(key: string, value: string): void {
  cache[key] = value;
  void AsyncStorage.setItem(key, value);
}

function remove(key: string): void {
  delete cache[key];
  void AsyncStorage.removeItem(key);
}

/** Reads and writes all user settings. The only file that accesses settings keys. */
export const SettingsService = {
  getHasCompletedOnboarding(): boolean {
    return get(HAS_COMPLETED_ONBOARDING_KEY) === "true";
  },
  setHasCompletedOnboarding(completed: boolean): void {
    set(HAS_COMPLETED_ONBOARDING_KEY, completed ? "true" : "false");
  },
  clearHasCompletedOnboarding(): void {
    remove(HAS_COMPLETED_ONBOARDING_KEY);
  },

  getAppearanceMode(): AppearanceMode {
    const saved = get(APPEARANCE_MODE_KEY) as AppearanceMode;
    return VALID_APPEARANCE_MODES.includes(saved) ? saved : "system";
  },
  setAppearanceMode(mode: AppearanceMode): void {
    if (!VALID_APPEARANCE_MODES.includes(mode))
      throw new Error(`Invalid appearance mode: ${mode}`);
    set(APPEARANCE_MODE_KEY, mode);
  },
  clearAppearanceMode(): void {
    remove(APPEARANCE_MODE_KEY);
  },

  getTextSize(): TextSize {
    const saved = get(TEXT_SIZE_KEY) as TextSize;
    return VALID_TEXT_SIZES.includes(saved) ? saved : "m";
  },
  setTextSize(size: TextSize): void {
    if (!VALID_TEXT_SIZES.includes(size))
      throw new Error(`Invalid text size: ${size}`);
    set(TEXT_SIZE_KEY, size);
  },
  clearTextSize(): void {
    remove(TEXT_SIZE_KEY);
  },

  getSortOrder(): SortOrder {
    const saved = get(SORT_ORDER_KEY) as SortOrder;
    return VALID_SORT_ORDERS.includes(saved) ? saved : "date";
  },
  setSortOrder(order: SortOrder): void {
    if (!VALID_SORT_ORDERS.includes(order))
      throw new Error(`Invalid sort order: ${order}`);
    set(SORT_ORDER_KEY, order);
  },
  clearSortOrder(): void {
    remove(SORT_ORDER_KEY);
  },

  getSyncCode(): string {
    return get(SYNC_CODE_KEY) ?? "";
  },
  setSyncCode(code: string): void {
    set(SYNC_CODE_KEY, code);
  },
  clearSyncCode(): void {
    remove(SYNC_CODE_KEY);
  },

  getIsSyncEnabled(): boolean {
    return get(IS_SYNC_ENABLED_KEY) === "true";
  },
  setIsSyncEnabled(value: boolean): void {
    set(IS_SYNC_ENABLED_KEY, String(value));
  },
  clearIsSyncEnabled(): void {
    remove(IS_SYNC_ENABLED_KEY);
  },

  getColorTheme(): ColorTheme {
    const saved = get(COLOR_THEME_KEY) as ColorTheme;
    return VALID_COLOR_THEMES.includes(saved) ? saved : "green";
  },
  setColorTheme(theme: ColorTheme): void {
    if (!VALID_COLOR_THEMES.includes(theme))
      throw new Error(`Invalid color theme: ${theme}`);
    set(COLOR_THEME_KEY, theme);
  },
  clearColorTheme(): void {
    remove(COLOR_THEME_KEY);
  },

  clearAll(): void {
    this.clearHasCompletedOnboarding();
    this.clearAppearanceMode();
    this.clearTextSize();
    this.clearSortOrder();
    this.clearSyncCode();
    this.clearIsSyncEnabled();
    this.clearColorTheme();
  },
};
