// src/services/persistenceService.ts
import type { Category } from "../models/types";

const STORAGE_KEY = "grocery-lists-state";

interface PersistedState {
  lists: Category[]; // mirrors CodingKeys alias in Swift
  selectedListID: string | null;
}

export const PersistenceService = {
  save(categories: Category[], selectedCategoryID: string): void {
    const state: PersistedState = {
      lists: categories,
      selectedListID: selectedCategoryID,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  load(): { categories: Category[]; selectedCategoryID: string | null } | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const state: PersistedState = JSON.parse(raw);
      return {
        categories: state.lists ?? [],
        selectedCategoryID: state.selectedListID ?? null,
      };
    } catch {
      return null;
    }
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
