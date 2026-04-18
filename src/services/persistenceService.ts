// src/services/persistenceService.ts
import type { Category, CategoryGroup } from "@/models/types";

const STORAGE_KEY = "grocery-lists-state";

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

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
