// src/store/useCategoryActions.ts
// Stable dispatch-wrapper callbacks for the categories store.
// Extracted from useCategoriesStore to keep the provider under its line budget.

import { useCallback } from "react";
import type { Dispatch } from "react";
import type { SortOrder, SortDirection } from "@/models/types";
import type { StoreAction } from "@/store/categoriesReducer";

// MARK: - Types

/** All mutation callbacks exposed by the categories store. */
export interface CategoryActions {
  selectCategory: (id: string) => void;
  addCategory: (name: string) => void;
  setCategories: (names: string[]) => void;
  renameCategory: (id: string, newName: string) => void;
  deleteCategory: (id: string) => void;
  moveCategories: (from: number, to: number) => void;
  reorderCategories: (orderedIDs: string[]) => void;
  setCategorySortOrder: (id: string, sortOrder: SortOrder) => void;
  setCategorySortDirection: (id: string, sortDirection: SortDirection) => void;
  addItemToSelectedCategory: (name: string) => void;
  toggleItemInSelectedCategory: (itemID: string) => void;
  deleteItemFromSelectedCategory: (itemID: string) => void;
  clearCheckedItemsInSelectedCategory: () => void;
  checkAllItemsInSelectedCategory: () => void;
  uncheckAllItemsInSelectedCategory: () => void;
  reload: () => void;
  resetCategories: () => void;
  selectGroup: (id: string | null) => void;
  addGroup: (name: string) => void;
  renameGroup: (id: string, newName: string) => void;
  deleteGroup: (id: string) => void;
  moveGroups: (from: number, to: number) => void;
  setCategoryGroup: (categoryID: string, groupID: string | undefined) => void;
  /** Atomically creates a new category and assigns it to the given group. */
  addCategoryWithGroup: (name: string, groupID: string) => void;
}

// MARK: - Hook

/**
 * Wraps every reducer action in a stable `useCallback` so consumers never
 * trigger unnecessary re-renders due to changing function references.
 *
 * @param dispatch - The reducer dispatch function from `useReducer`.
 * @returns An object of stable action callbacks.
 */
export function useCategoryActions(
  dispatch: Dispatch<StoreAction>,
): CategoryActions {
  const selectCategory = useCallback(
    (id: string) => dispatch({ type: "SELECT_CATEGORY", id }),
    [dispatch],
  );
  const addCategory = useCallback(
    (name: string) => dispatch({ type: "ADD_CATEGORY", name }),
    [dispatch],
  );
  const setCategories = useCallback(
    (names: string[]) => dispatch({ type: "SET_CATEGORIES", names }),
    [dispatch],
  );
  const renameCategory = useCallback(
    (id: string, newName: string) =>
      dispatch({ type: "RENAME_CATEGORY", id, newName }),
    [dispatch],
  );
  const deleteCategory = useCallback(
    (id: string) => dispatch({ type: "DELETE_CATEGORY", id }),
    [dispatch],
  );
  const moveCategories = useCallback(
    (from: number, to: number) =>
      dispatch({ type: "MOVE_CATEGORIES", from, to }),
    [dispatch],
  );
  const reorderCategories = useCallback(
    (orderedIDs: string[]) =>
      dispatch({ type: "REORDER_CATEGORIES", orderedIDs }),
    [dispatch],
  );
  const setCategorySortOrder = useCallback(
    (id: string, sortOrder: SortOrder) =>
      dispatch({ type: "SET_CATEGORY_SORT_ORDER", id, sortOrder }),
    [dispatch],
  );
  const setCategorySortDirection = useCallback(
    (id: string, sortDirection: SortDirection) =>
      dispatch({ type: "SET_CATEGORY_SORT_DIRECTION", id, sortDirection }),
    [dispatch],
  );
  const addItemToSelectedCategory = useCallback(
    (name: string) => dispatch({ type: "ADD_ITEM", name }),
    [dispatch],
  );
  const toggleItemInSelectedCategory = useCallback(
    (itemID: string) => dispatch({ type: "TOGGLE_ITEM", itemID }),
    [dispatch],
  );
  const deleteItemFromSelectedCategory = useCallback(
    (itemID: string) => dispatch({ type: "DELETE_ITEM", itemID }),
    [dispatch],
  );
  const clearCheckedItemsInSelectedCategory = useCallback(
    () => dispatch({ type: "CLEAR_CHECKED" }),
    [dispatch],
  );
  const checkAllItemsInSelectedCategory = useCallback(
    () => dispatch({ type: "CHECK_ALL" }),
    [dispatch],
  );
  const uncheckAllItemsInSelectedCategory = useCallback(
    () => dispatch({ type: "UNCHECK_ALL" }),
    [dispatch],
  );
  const reload = useCallback(() => dispatch({ type: "RELOAD" }), [dispatch]);
  const resetCategories = useCallback(
    () => dispatch({ type: "RESET_CATEGORIES" }),
    [dispatch],
  );
  const selectGroup = useCallback(
    (id: string | null) => dispatch({ type: "SELECT_GROUP", id }),
    [dispatch],
  );
  const addGroup = useCallback(
    (name: string) => dispatch({ type: "ADD_GROUP", name }),
    [dispatch],
  );
  const renameGroup = useCallback(
    (id: string, newName: string) =>
      dispatch({ type: "RENAME_GROUP", id, newName }),
    [dispatch],
  );
  const deleteGroup = useCallback(
    (id: string) => dispatch({ type: "DELETE_GROUP", id }),
    [dispatch],
  );
  const moveGroups = useCallback(
    (from: number, to: number) => dispatch({ type: "MOVE_GROUPS", from, to }),
    [dispatch],
  );
  const setCategoryGroup = useCallback(
    (categoryID: string, groupID: string | undefined) =>
      dispatch({ type: "SET_CATEGORY_GROUP", categoryID, groupID }),
    [dispatch],
  );
  const addCategoryWithGroup = useCallback(
    (name: string, groupID: string) =>
      dispatch({ type: "ADD_CATEGORY_WITH_GROUP", name, groupID }),
    [dispatch],
  );

  return {
    selectCategory,
    addCategory,
    setCategories,
    renameCategory,
    deleteCategory,
    moveCategories,
    reorderCategories,
    setCategorySortOrder,
    setCategorySortDirection,
    addItemToSelectedCategory,
    toggleItemInSelectedCategory,
    deleteItemFromSelectedCategory,
    clearCheckedItemsInSelectedCategory,
    checkAllItemsInSelectedCategory,
    uncheckAllItemsInSelectedCategory,
    reload,
    resetCategories,
    selectGroup,
    addGroup,
    renameGroup,
    deleteGroup,
    moveGroups,
    setCategoryGroup,
    addCategoryWithGroup,
  };
}
