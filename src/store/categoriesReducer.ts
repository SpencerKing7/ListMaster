// src/store/categoriesReducer.ts
// Pure reducer orchestrator — delegates each action to a domain-specific handler module.

import type { StoreState, StoreAction } from "@/models/types";
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
import {
  handleReload,
  handleResetCategories,
  handleSyncLoad,
} from "./metaHandlers";

export { loadInitialState } from "./reducerHelpers";

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

    // ── Meta actions — own their persistence, return directly ──
    case "RELOAD":
      return handleReload(state);
    case "RESET_CATEGORIES":
      return handleResetCategories();
    case "SYNC_LOAD":
      return handleSyncLoad(state, action);

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
    next.selectedGroupID,
  );
  return next;
}
