// src/store/categoriesReducer.ts
// Pure reducer orchestrator — delegates each action to a domain-specific handler module.
// Owns state shape, action type union, initial-state loader, and persistence side effect.

import type {
  Category,
  CategoryGroup,
  SortOrder,
  SortDirection,
} from "@/models/types";
import { PersistenceService } from "@/services/persistenceService";
import {
  handleSelectCategory,
  handleAddCategory,
  handleSetCategories,
  handleRenameCategory,
  handleDeleteCategory,
  handleMoveCategories,
  handleReorderCategories,
  handleSetCategorySortOrder,
  handleSetCategorySortDirection,
  handleSetCategoryGroup,
  handleAddCategoryWithGroup,
} from "./categoryHandlers";
import {
  handleAddItem,
  handleToggleItem,
  handleDeleteItem,
  handleClearChecked,
  handleCheckAll,
  handleUncheckAll,
} from "./itemHandlers";
import {
  handleAddGroup,
  handleRenameGroup,
  handleDeleteGroup,
  handleMoveGroups,
  handleSelectGroup,
} from "./groupHandlers";
import { sanitizeOrphanedGroupIDs } from "./reducerHelpers";

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
      categories: sanitizeOrphanedGroupIDs(saved.categories, savedGroups),
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

// MARK: - Reducer

/** Pure reducer for the categories store. Delegates to domain handlers. */
export function categoriesReducer(
  state: StoreState,
  action: StoreAction,
): StoreState {
  let next: StoreState | null;

  switch (action.type) {
    // ── Category actions ──
    case "SELECT_CATEGORY":
      next = handleSelectCategory(state, action.id);
      break;
    case "ADD_CATEGORY":
      next = handleAddCategory(state, action.name);
      break;
    case "SET_CATEGORIES":
      next = handleSetCategories(state, action.names);
      break;
    case "RENAME_CATEGORY":
      next = handleRenameCategory(state, action.id, action.newName);
      break;
    case "DELETE_CATEGORY":
      next = handleDeleteCategory(state, action.id);
      break;
    case "MOVE_CATEGORIES":
      next = handleMoveCategories(state, action.from, action.to);
      break;
    case "REORDER_CATEGORIES":
      next = handleReorderCategories(state, action.orderedIDs);
      break;
    case "SET_CATEGORY_SORT_ORDER":
      next = handleSetCategorySortOrder(state, action.id, action.sortOrder);
      break;
    case "SET_CATEGORY_SORT_DIRECTION":
      next = handleSetCategorySortDirection(
        state,
        action.id,
        action.sortDirection,
      );
      break;
    case "SET_CATEGORY_GROUP":
      next = handleSetCategoryGroup(state, action.categoryID, action.groupID);
      break;
    case "ADD_CATEGORY_WITH_GROUP":
      next = handleAddCategoryWithGroup(state, action.name, action.groupID);
      break;

    // ── Item actions ──
    case "ADD_ITEM":
      next = handleAddItem(state, action.name);
      break;
    case "TOGGLE_ITEM":
      next = handleToggleItem(state, action.itemID);
      break;
    case "DELETE_ITEM":
      next = handleDeleteItem(state, action.itemID);
      break;
    case "CLEAR_CHECKED":
      next = handleClearChecked(state);
      break;
    case "CHECK_ALL":
      next = handleCheckAll(state);
      break;
    case "UNCHECK_ALL":
      next = handleUncheckAll(state);
      break;

    // ── Group actions ──
    case "ADD_GROUP":
      next = handleAddGroup(state, action.name);
      break;
    case "RENAME_GROUP":
      next = handleRenameGroup(state, action.id, action.newName);
      break;
    case "DELETE_GROUP":
      next = handleDeleteGroup(state, action.id);
      break;
    case "MOVE_GROUPS":
      next = handleMoveGroups(state, action.from, action.to);
      break;
    case "SELECT_GROUP":
      next = handleSelectGroup(state, action.id);
      break;

    // ── Meta actions (handled inline — they have unique persistence/return semantics) ──
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
      // Don't re-save on reload
      return {
        categories: sanitizeOrphanedGroupIDs(saved.categories, reloadedGroups),
        selectedCategoryID: saved.selectedCategoryID ?? saved.categories[0].id,
        groups: reloadedGroups,
        selectedGroupID: reloadedGroupID,
      };
    }

    case "RESET_CATEGORIES": {
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
      );
      return reset;
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

      let resolvedSelectedID: string;
      if (action.selectedCategoryID !== undefined) {
        resolvedSelectedID =
          action.selectedCategoryID ?? action.categories[0]?.id ?? "";
      } else {
        const localStillExists = action.categories.some(
          (c) => c.id === state.selectedCategoryID,
        );
        resolvedSelectedID = localStillExists
          ? state.selectedCategoryID
          : (action.categories[0]?.id ?? "");
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
      );
      return syncNext;
    }

    default:
      return state;
  }

  // null means the handler declined the action (validation failed) — return unchanged state
  if (next === null) return state;

  // Auto-save after every mutation
  PersistenceService.save(
    next.categories,
    next.selectedCategoryID,
    next.groups,
  );
  return next;
}
