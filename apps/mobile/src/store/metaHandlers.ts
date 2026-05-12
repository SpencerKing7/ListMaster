// src/store/metaHandlers.ts
// Reducer handlers for meta actions — RELOAD, RESET_CATEGORIES, SYNC_LOAD.
// These are kept separate because they own their own PersistenceService calls
// and return directly from the reducer (bypassing the auto-save path).

import type { StoreState, Category, CategoryGroup } from "@/models/types";
import { PersistenceService } from "@/services/persistenceService";
import { sanitizeOrphanedGroupIDs } from "./reducerHelpers";

// MARK: - Handlers

/**
 * RELOAD — re-reads the store state from localStorage without re-saving.
 * Returns the current state unchanged if there is nothing to reload.
 */
export function handleReload(state: StoreState): StoreState {
  const saved = PersistenceService.load();
  if (!saved || saved.categories.length === 0) return state;
  const reloadedGroups = saved.groups ?? [];
  const savedGroupID = saved.selectedGroupID;
  const isValidGroupID =
    savedGroupID === null || reloadedGroups.some((g) => g.id === savedGroupID);
  return {
    categories: sanitizeOrphanedGroupIDs(saved.categories, reloadedGroups),
    selectedCategoryID: saved.selectedCategoryID ?? saved.categories[0].id,
    groups: reloadedGroups,
    selectedGroupID: isValidGroupID ? savedGroupID : null,
  };
}

/**
 * RESET_CATEGORIES — clears all categories, groups, and selection, then persists.
 */
export function handleResetCategories(): StoreState {
  const reset: StoreState = {
    categories: [],
    selectedCategoryID: "",
    groups: [],
    selectedGroupID: null,
  };
  PersistenceService.save(
    reset.categories,
    reset.selectedCategoryID,
    reset.groups,
    reset.selectedGroupID,
  );
  return reset;
}

/**
 * SYNC_LOAD — merges a cloud-synced payload into the store, then persists.
 * Preserves the local category selection if it still exists in the incoming set.
 */
export function handleSyncLoad(
  state: StoreState,
  action: {
    categories: Category[];
    selectedCategoryID?: string | null;
    groups?: CategoryGroup[];
  },
): StoreState {
  const syncGroups = action.groups ?? [];
  const syncGroupStillExists =
    state.selectedGroupID === null ||
    syncGroups.some((g) => g.id === state.selectedGroupID);
  const syncGroupID = syncGroupStillExists
    ? state.selectedGroupID
    : syncGroups.length > 0
      ? syncGroups[0].id
      : null;

  // Always prefer the local selection if it still exists in the incoming
  // categories — syncing the selection causes cross-device interference and
  // overwrites the user's last-seen state on reload.
  let resolvedSelectedID: string;
  const localStillExists = action.categories.some(
    (c) => c.id === state.selectedCategoryID,
  );
  if (localStillExists) {
    resolvedSelectedID = state.selectedCategoryID;
  } else if (action.selectedCategoryID !== undefined) {
    resolvedSelectedID =
      action.selectedCategoryID ?? action.categories[0]?.id ?? "";
  } else {
    resolvedSelectedID = action.categories[0]?.id ?? "";
  }

  const syncNext: StoreState = {
    categories: sanitizeOrphanedGroupIDs(action.categories, syncGroups),
    selectedCategoryID: resolvedSelectedID,
    groups: syncGroups,
    selectedGroupID: syncGroupID,
  };
  PersistenceService.save(
    syncNext.categories,
    syncNext.selectedCategoryID,
    syncNext.groups,
    syncNext.selectedGroupID,
  );
  return syncNext;
}
