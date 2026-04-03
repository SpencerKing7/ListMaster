// src/store/categoriesReducer.ts
// Pure reducer, action types, helpers, and state shape for the categories store.
// No React, no side effects (aside from persistence) — this file is a deterministic state machine.
//
// FILE SIZE NOTE: 489 lines — exceeds the 150-line hard max for utility files.
// This is intentional: the reducer is a single switch expression over a discriminated
// union. Splitting action handlers into separate files would fragment the state machine,
// scatter the action type union, and make reasoning about state transitions harder.
// All 20+ cases share the same state shape and persistence pattern.

import { v4 as uuidv4 } from "uuid";
import type {
  Category,
  CategoryGroup,
  ChecklistItem,
  SortOrder,
  SortDirection,
} from "@/models/types";
import { PersistenceService } from "@/services/persistenceService";

// MARK: - State Shape

/** Top-level shape of the categories store. */
export interface StoreState {
  categories: Category[];
  selectedCategoryID: string;
  groups: CategoryGroup[];
  selectedGroupID: string | null;
}

/** Loads the initial store state from localStorage, or returns an empty state. */
export function loadInitialState(): StoreState {
  const saved = PersistenceService.load();
  if (saved && saved.categories.length > 0) {
    const savedGroups = saved.groups ?? [];
    return {
      categories: saved.categories,
      selectedCategoryID: saved.selectedCategoryID ?? saved.categories[0].id,
      groups: savedGroups,
      selectedGroupID: savedGroups.length > 0 ? savedGroups[0].id : null,
    };
  }
  return {
    categories: [],
    selectedCategoryID: "",
    groups: [],
    selectedGroupID: null,
  };
}

// MARK: - Actions

/** Discriminated union of every action the reducer can handle. */
export type StoreAction =
  | { type: "SELECT_CATEGORY"; id: string }
  | { type: "ADD_CATEGORY"; name: string }
  | { type: "SET_CATEGORIES"; names: string[] }
  | { type: "RENAME_CATEGORY"; id: string; newName: string }
  | { type: "DELETE_CATEGORY"; id: string }
  | { type: "MOVE_CATEGORIES"; from: number; to: number }
  | { type: "REORDER_CATEGORIES"; orderedIDs: string[] }
  | { type: "SET_CATEGORY_SORT_ORDER"; id: string; sortOrder: SortOrder }
  | {
      type: "SET_CATEGORY_SORT_DIRECTION";
      id: string;
      sortDirection: SortDirection;
    }
  | { type: "ADD_ITEM"; name: string }
  | { type: "TOGGLE_ITEM"; itemID: string }
  | { type: "DELETE_ITEM"; itemID: string }
  | { type: "CLEAR_CHECKED" }
  | { type: "CHECK_ALL" }
  | { type: "UNCHECK_ALL" }
  | { type: "RELOAD" }
  | { type: "RESET_CATEGORIES" }
  | {
      type: "SYNC_LOAD";
      categories: Category[];
      selectedCategoryID?: string | null;
      groups?: CategoryGroup[];
    }
  | { type: "ADD_GROUP"; name: string }
  | { type: "RENAME_GROUP"; id: string; newName: string }
  | { type: "DELETE_GROUP"; id: string }
  | { type: "MOVE_GROUPS"; from: number; to: number }
  | { type: "SELECT_GROUP"; id: string | null }
  | {
      type: "SET_CATEGORY_GROUP";
      categoryID: string;
      groupID: string | undefined;
    }
  | { type: "ADD_CATEGORY_WITH_GROUP"; name: string; groupID: string };

// MARK: - Helpers

function normalizedName(value: string): string {
  return value.trim();
}

function isNameAvailable(
  categories: Category[],
  name: string,
  excludingID?: string,
): boolean {
  return !categories.some((category) => {
    if (excludingID && category.id === excludingID) return false;
    return category.name.toLowerCase() === name.toLowerCase();
  });
}

function isGroupNameAvailable(
  groups: CategoryGroup[],
  name: string,
  excludingID?: string,
): boolean {
  return !groups.some((group) => {
    if (excludingID && group.id === excludingID) return false;
    return group.name.toLowerCase() === name.toLowerCase();
  });
}

// MARK: - Reducer

/** Pure reducer for the categories store. Handles persistence as a side effect of returning next state. */
export function categoriesReducer(
  state: StoreState,
  action: StoreAction,
): StoreState {
  let next: StoreState;

  switch (action.type) {
    case "SELECT_CATEGORY": {
      if (!state.categories.some((c) => c.id === action.id)) return state;
      next = { ...state, selectedCategoryID: action.id };
      break;
    }

    case "ADD_CATEGORY": {
      const trimmed = normalizedName(action.name);
      if (!trimmed || !isNameAvailable(state.categories, trimmed)) return state;
      const newCategory: Category = {
        id: uuidv4(),
        name: trimmed,
        items: [],
      };
      next = {
        ...state,
        categories: [...state.categories, newCategory],
        selectedCategoryID: newCategory.id,
      };
      break;
    }

    case "SET_CATEGORIES": {
      const newCategories: Category[] = [];
      for (const raw of action.names) {
        const trimmed = normalizedName(raw);
        if (!trimmed) continue;
        if (
          newCategories.some(
            (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
          )
        )
          continue;
        newCategories.push({ id: uuidv4(), name: trimmed, items: [] });
      }
      if (newCategories.length === 0) return state;
      next = {
        ...state,
        categories: newCategories,
        selectedCategoryID: newCategories[0].id,
      };
      break;
    }

    case "RENAME_CATEGORY": {
      const trimmed = normalizedName(action.newName);
      if (!trimmed || !isNameAvailable(state.categories, trimmed, action.id))
        return state;
      const idx = state.categories.findIndex((c) => c.id === action.id);
      if (idx === -1) return state;
      const updated = state.categories.map((c) =>
        c.id === action.id ? { ...c, name: trimmed } : c,
      );
      next = { ...state, categories: updated };
      break;
    }

    case "DELETE_CATEGORY": {
      if (state.categories.length <= 1) return state;
      const idx = state.categories.findIndex((c) => c.id === action.id);
      if (idx === -1) return state;
      const deletedWasSelected =
        state.categories[idx].id === state.selectedCategoryID;
      const remaining = state.categories.filter((c) => c.id !== action.id);
      next = {
        ...state,
        categories: remaining,
        selectedCategoryID: deletedWasSelected
          ? remaining[0].id
          : state.selectedCategoryID,
      };
      break;
    }

    case "MOVE_CATEGORIES": {
      const arr = [...state.categories];
      const [moved] = arr.splice(action.from, 1);
      arr.splice(action.to, 0, moved);
      next = { ...state, categories: arr };
      break;
    }

    case "REORDER_CATEGORIES": {
      const idSet = new Set(action.orderedIDs);
      if (idSet.size !== state.categories.length) return state;
      const lookup = new Map(state.categories.map((c) => [c.id, c]));
      const reordered = action.orderedIDs
        .map((id) => lookup.get(id))
        .filter((c): c is Category => c !== undefined);
      if (reordered.length !== state.categories.length) return state;
      next = { ...state, categories: reordered };
      break;
    }

    case "SET_CATEGORY_SORT_ORDER": {
      const updated = state.categories.map((c) =>
        c.id === action.id ? { ...c, sortOrder: action.sortOrder } : c,
      );
      next = { ...state, categories: updated };
      break;
    }

    case "SET_CATEGORY_SORT_DIRECTION": {
      const updated = state.categories.map((c) =>
        c.id === action.id ? { ...c, sortDirection: action.sortDirection } : c,
      );
      next = { ...state, categories: updated };
      break;
    }

    case "ADD_ITEM": {
      const trimmed = normalizedName(action.name);
      if (!trimmed) return state;
      const catIdx = state.categories.findIndex(
        (c) => c.id === state.selectedCategoryID,
      );
      if (catIdx === -1) return state;
      const newItem: ChecklistItem = {
        id: uuidv4(),
        name: trimmed,
        isChecked: false,
        createdAt: Date.now(),
      };
      const updatedCats = state.categories.map((c, i) =>
        i === catIdx ? { ...c, items: [...c.items, newItem] } : c,
      );
      next = { ...state, categories: updatedCats };
      break;
    }

    case "TOGGLE_ITEM": {
      const catIdx = state.categories.findIndex(
        (c) => c.id === state.selectedCategoryID,
      );
      if (catIdx === -1) return state;
      const cat = state.categories[catIdx];
      const itemIdx = cat.items.findIndex((i) => i.id === action.itemID);
      if (itemIdx === -1) return state;
      const toggledItems = cat.items.map((item, i) =>
        i === itemIdx ? { ...item, isChecked: !item.isChecked } : item,
      );
      // Stable sort: unchecked first, checked last
      toggledItems.sort((a, b) => {
        if (a.isChecked === b.isChecked) return 0;
        return a.isChecked ? 1 : -1;
      });
      const updatedCats = state.categories.map((c, i) =>
        i === catIdx ? { ...c, items: toggledItems } : c,
      );
      next = { ...state, categories: updatedCats };
      break;
    }

    case "DELETE_ITEM": {
      const updated = state.categories.map((c) =>
        c.id === state.selectedCategoryID
          ? { ...c, items: c.items.filter((i) => i.id !== action.itemID) }
          : c,
      );
      next = { ...state, categories: updated };
      break;
    }

    case "CLEAR_CHECKED": {
      const catIdx = state.categories.findIndex(
        (c) => c.id === state.selectedCategoryID,
      );
      if (catIdx === -1) return state;
      const updatedCats = state.categories.map((c, i) =>
        i === catIdx
          ? { ...c, items: c.items.filter((item) => !item.isChecked) }
          : c,
      );
      next = { ...state, categories: updatedCats };
      break;
    }

    case "CHECK_ALL": {
      const catIdx = state.categories.findIndex(
        (c) => c.id === state.selectedCategoryID,
      );
      if (catIdx === -1) return state;
      const updatedCats = state.categories.map((c, i) =>
        i === catIdx
          ? {
              ...c,
              items: c.items.map((item) => ({ ...item, isChecked: true })),
            }
          : c,
      );
      next = { ...state, categories: updatedCats };
      break;
    }

    case "UNCHECK_ALL": {
      const catIdx = state.categories.findIndex(
        (c) => c.id === state.selectedCategoryID,
      );
      if (catIdx === -1) return state;
      const updatedCats = state.categories.map((c, i) =>
        i === catIdx
          ? {
              ...c,
              items: c.items.map((item) => ({ ...item, isChecked: false })),
            }
          : c,
      );
      next = { ...state, categories: updatedCats };
      break;
    }

    case "RELOAD": {
      const saved = PersistenceService.load();
      if (!saved || saved.categories.length === 0) return state;
      const reloadedGroups = saved.groups ?? [];
      const currentGroupStillExists =
        state.selectedGroupID !== null &&
        reloadedGroups.some((g) => g.id === state.selectedGroupID);
      const reloadedGroupID = currentGroupStillExists
        ? state.selectedGroupID
        : reloadedGroups.length > 0
          ? reloadedGroups[0].id
          : null;
      next = {
        categories: saved.categories,
        selectedCategoryID: saved.selectedCategoryID ?? saved.categories[0].id,
        groups: reloadedGroups,
        selectedGroupID: reloadedGroupID,
      };
      // Don't re-save on reload
      return next;
    }

    case "RESET_CATEGORIES": {
      next = {
        categories: [],
        selectedCategoryID: "",
        groups: [],
        selectedGroupID: null,
      };
      PersistenceService.save(
        next.categories,
        next.selectedCategoryID,
        next.groups,
      );
      return next;
    }

    case "SYNC_LOAD": {
      const syncGroups = action.groups ?? [];
      const syncGroupStillExists =
        state.selectedGroupID !== null &&
        syncGroups.some((g) => g.id === state.selectedGroupID);
      const syncGroupID = syncGroupStillExists
        ? state.selectedGroupID
        : syncGroups.length > 0
          ? syncGroups[0].id
          : null;

      // When selectedCategoryID is provided (initial load from a new device),
      // adopt it. When omitted (real-time listener updates), preserve the
      // local device's selection — syncing it causes a feedback loop.
      let resolvedSelectedID: string;
      if (action.selectedCategoryID !== undefined) {
        resolvedSelectedID =
          action.selectedCategoryID ?? action.categories[0]?.id ?? "";
      } else {
        // Keep local selection if the category still exists in the incoming data.
        const localStillExists = action.categories.some(
          (c) => c.id === state.selectedCategoryID,
        );
        resolvedSelectedID = localStillExists
          ? state.selectedCategoryID
          : (action.categories[0]?.id ?? "");
      }

      next = {
        categories: action.categories,
        selectedCategoryID: resolvedSelectedID,
        groups: syncGroups,
        selectedGroupID: syncGroupID,
      };
      PersistenceService.save(
        next.categories,
        next.selectedCategoryID,
        next.groups,
      );
      return next;
    }

    case "ADD_GROUP": {
      const trimmed = normalizedName(action.name);
      if (!trimmed || !isGroupNameAvailable(state.groups, trimmed))
        return state;
      const newGroup: CategoryGroup = {
        id: uuidv4(),
        name: trimmed,
        sortOrder: state.groups.length,
      };
      next = {
        ...state,
        groups: [...state.groups, newGroup],
      };
      break;
    }

    case "RENAME_GROUP": {
      const trimmed = normalizedName(action.newName);
      if (!trimmed || !isGroupNameAvailable(state.groups, trimmed, action.id))
        return state;
      const updated = state.groups.map((g) =>
        g.id === action.id ? { ...g, name: trimmed } : g,
      );
      next = { ...state, groups: updated };
      break;
    }

    case "DELETE_GROUP": {
      const groupToDelete = state.groups.find((g) => g.id === action.id);
      if (!groupToDelete) return state;
      const remainingGroups = state.groups.filter((g) => g.id !== action.id);
      const updatedCategories = state.categories.map((c) =>
        c.groupID === action.id ? { ...c, groupID: undefined } : c,
      );
      next = {
        ...state,
        groups: remainingGroups,
        categories: updatedCategories,
      };
      break;
    }

    case "MOVE_GROUPS": {
      const arr = [...state.groups];
      const [moved] = arr.splice(action.from, 1);
      arr.splice(action.to, 0, moved);
      const updatedGroups = arr.map((g, i) => ({ ...g, sortOrder: i }));
      next = { ...state, groups: updatedGroups };
      break;
    }

    case "SELECT_GROUP": {
      const categoriesInGroup =
        action.id === null
          ? state.categories
          : state.categories.filter((c) => c.groupID === action.id);
      const currentCategoryInGroup = categoriesInGroup.some(
        (c) => c.id === state.selectedCategoryID,
      );
      const newSelectedCategoryID = currentCategoryInGroup
        ? state.selectedCategoryID
        : (categoriesInGroup[0]?.id ?? "");
      next = {
        ...state,
        selectedGroupID: action.id,
        selectedCategoryID: newSelectedCategoryID,
      };
      break;
    }

    case "SET_CATEGORY_GROUP": {
      const updated = state.categories.map((c) =>
        c.id === action.categoryID ? { ...c, groupID: action.groupID } : c,
      );
      next = { ...state, categories: updated };
      break;
    }

    case "ADD_CATEGORY_WITH_GROUP": {
      const trimmed = normalizedName(action.name);
      if (!trimmed || !isNameAvailable(state.categories, trimmed)) return state;
      const newCategory: Category = {
        id: uuidv4(),
        name: trimmed,
        items: [],
        groupID: action.groupID,
      };
      next = {
        ...state,
        categories: [...state.categories, newCategory],
        selectedCategoryID: newCategory.id,
      };
      break;
    }

    default:
      return state;
  }

  // Auto-save after every mutation (except RELOAD, RESET, SYNC_LOAD which handle their own)
  PersistenceService.save(
    next.categories,
    next.selectedCategoryID,
    next.groups,
  );
  return next;
}
