// src/services/persistenceService.ts
import type { Category, CategoryGroup } from "@/models/types";

const STORAGE_KEY = "grocery-lists-state";
const LAST_EDITED_AT_KEY = "grocery-lists-last-edited-at";

interface PersistedState {
  lists: Category[]; // mirrors CodingKeys alias in Swift
  selectedListID: string | null;
  groups?: CategoryGroup[]; // optional for backwards compatibility
  selectedGroupID?: string | null; // optional for backwards compatibility
}

export const PersistenceService = {
  save(
    categories: Category[],
    selectedCategoryID: string,
    groups: CategoryGroup[],
    selectedGroupID: string | null = null,
  ): void {
    const state: PersistedState = {
      lists: categories,
      selectedListID: selectedCategoryID,
      groups,
      selectedGroupID,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(LAST_EDITED_AT_KEY, String(Date.now()));
  },

  load(): {
    categories: Category[];
    selectedCategoryID: string | null;
    groups: CategoryGroup[];
    selectedGroupID: string | null;
  } | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const state: PersistedState = JSON.parse(raw);
      return {
        categories: state.lists ?? [],
        selectedCategoryID: state.selectedListID ?? null,
        groups: state.groups ?? [],
        selectedGroupID: state.selectedGroupID ?? null,
      };
    } catch {
      return null;
    }
  },

  /**
   * Returns the Unix ms timestamp of the last local save, or 0 if never saved.
   * Used for conflict resolution when connecting to cloud sync.
   */
  loadLastEditedAt(): number {
    const raw = localStorage.getItem(LAST_EDITED_AT_KEY);
    if (!raw) return 0;
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_EDITED_AT_KEY);
  },
};
