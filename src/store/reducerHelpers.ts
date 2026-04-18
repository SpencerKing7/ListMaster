// src/store/reducerHelpers.ts
// Shared helper functions used by reducer handler modules.

import type { StoreState } from "@/models/types";
import { PersistenceService } from "@/services/persistenceService";

// MARK: - Name helpers

/** Trim whitespace from a name value. */
export function normalizedName(value: string): string {
  return value.trim();
}

/**
 * Check if a category name is unique (case-insensitive) within a group scope.
 * Categories are compared only against others sharing the same `groupID` value
 * (strict equality — `undefined === undefined` covers the ungrouped bucket).
 *
 * @param categories - Full categories array (must include `groupID`).
 * @param name - The candidate name to check.
 * @param excludingID - A category ID to skip (used when renaming).
 * @param groupID - The group scope to check within. `undefined` = ungrouped.
 */
export function isCategoryNameAvailable(
  categories: { id: string; name: string; groupID?: string }[],
  name: string,
  excludingID: string | undefined,
  groupID: string | undefined,
): boolean {
  return !categories.some((category) => {
    if (excludingID && category.id === excludingID) return false;
    if (category.groupID !== groupID) return false;
    return category.name.toLowerCase() === name.toLowerCase();
  });
}

/**
 * Clears `groupID` on any category whose `groupID` does not match an existing
 * group. This prevents categories from becoming invisible in Settings when a
 * group is deleted on one device but the sync payload arrives without the
 * corresponding group.
 */
export function sanitizeOrphanedGroupIDs<T extends { groupID?: string }>(
  categories: T[],
  groups: { id: string }[],
): T[] {
  const groupIDs = new Set(groups.map((g) => g.id));
  return categories.map((c) =>
    c.groupID !== undefined && !groupIDs.has(c.groupID)
      ? { ...c, groupID: undefined }
      : c,
  );
}

/** Check if a group name is unique (case-insensitive), optionally excluding a given ID. */
export function isGroupNameAvailable(
  groups: { id: string; name: string }[],
  name: string,
  excludingID?: string,
): boolean {
  return !groups.some((group) => {
    if (excludingID && group.id === excludingID) return false;
    return group.name.toLowerCase() === name.toLowerCase();
  });
}

// MARK: - Initial state

/**
 * Loads the initial store state from localStorage, or returns an empty state.
 * Called once on store mount as the `useReducer` initializer.
 */
export function loadInitialState(): StoreState {
  const saved = PersistenceService.load();
  if (saved && saved.categories.length > 0) {
    const savedGroups = saved.groups ?? [];
    const savedGroupID = saved.selectedGroupID;
    const isValidGroupID =
      savedGroupID === null || savedGroups.some((g) => g.id === savedGroupID);
    return {
      categories: sanitizeOrphanedGroupIDs(saved.categories, savedGroups),
      selectedCategoryID: saved.selectedCategoryID ?? saved.categories[0].id,
      groups: savedGroups,
      selectedGroupID: isValidGroupID ? savedGroupID : null,
    };
  }
  return {
    categories: [],
    selectedCategoryID: "",
    groups: [],
    selectedGroupID: null,
  };
}
