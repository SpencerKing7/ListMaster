// src/services/persistenceService.ts
// The only file that reads/writes category list data to AsyncStorage.
// Uses an in-memory mirror for synchronous reads; writes flush asynchronously.
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Category, CategoryGroup } from "@/models/types";

const STORAGE_KEY = "grocery-lists-state";
const LAST_EDITED_AT_KEY = "grocery-lists-last-edited-at";

interface PersistedState {
  lists: Category[]; // mirrors CodingKeys alias in Swift
  selectedListID: string | null;
  groups?: CategoryGroup[];
  selectedGroupID?: string | null;
}

// In-memory mirror — keeps reads synchronous while writes flush to AsyncStorage.
let mirror: { state: PersistedState | null; lastEditedAt: number } = {
  state: null,
  lastEditedAt: 0,
};

/** Hydrate the in-memory mirror from AsyncStorage. Call once at app startup. */
export async function hydratePersistenceCache(): Promise<void> {
  try {
    const [raw, editedAtRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(LAST_EDITED_AT_KEY),
    ]);
    if (raw) {
      mirror.state = JSON.parse(raw) as PersistedState;
    }
    if (editedAtRaw) {
      const value = Number(editedAtRaw);
      mirror.lastEditedAt = Number.isFinite(value) ? value : 0;
    }
  } catch {
    // Corrupt storage — start fresh
  }
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
    // Update mirror synchronously so the next load() call sees fresh data.
    mirror.state = state;
    mirror.lastEditedAt = Date.now();
    // Flush to AsyncStorage in the background.
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    void AsyncStorage.setItem(LAST_EDITED_AT_KEY, String(mirror.lastEditedAt));
  },

  load(): {
    categories: Category[];
    selectedCategoryID: string | null;
    groups: CategoryGroup[];
    selectedGroupID: string | null;
  } | null {
    const state = mirror.state;
    if (!state) return null;
    try {
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
    return mirror.lastEditedAt;
  },

  clear(): void {
    mirror.state = null;
    mirror.lastEditedAt = 0;
    void AsyncStorage.removeItem(STORAGE_KEY);
    void AsyncStorage.removeItem(LAST_EDITED_AT_KEY);
  },
};
