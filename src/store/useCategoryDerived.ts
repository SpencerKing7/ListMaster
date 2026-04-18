// src/store/useCategoryDerived.ts
// Derived / computed values from the categories store state.
// Extracted from useCategoriesStore to keep the provider focused.

import { useMemo, useEffect, useCallback } from "react";
import type { Dispatch } from "react";
import type { Category, CategoryPickerItem } from "@/models/types";
import type { StoreState, StoreAction } from "@/store/categoriesReducer";

// MARK: - Types

/** Derived read-only values computed from the store state. */
export interface CategoryDerived {
  /** The currently selected category, or null if none is found. */
  selectedCategory: Category | null;
  /** Whether deleting the selected category is allowed (requires >1 in the active group view). */
  canDeleteCategories: boolean;
  /** Whether there is a next category to navigate to within the group. */
  canSelectNextCategory: boolean;
  /** Whether there is a previous category to navigate to within the group. */
  canSelectPreviousCategory: boolean;
  /** The next category in the current group, or null. */
  nextCategory: Category | null;
  /** The previous category in the current group, or null. */
  previousCategory: Category | null;
  /** Categories filtered to the currently selected group. */
  categoriesInSelectedGroup: Category[];
  /**
   * Categories for the picker. In the "All" view, ungrouped categories come
   * first with `isUngrouped: true`. In a specific-group view, only that
   * group's categories are included and `isUngrouped` is always `false`.
   */
  pickerCategories: CategoryPickerItem[];
  /** Whether any groups exist in the store. */
  hasGroups: boolean;
  /** Navigate to the next category in the current group. */
  selectNextCategory: () => void;
  /** Navigate to the previous category in the current group. */
  selectPreviousCategory: () => void;
}

// MARK: - Hook

/**
 * Computes derived read-only values from the categories store state,
 * including group-scoped category navigation and selection helpers.
 *
 * Also handles auto-selecting the first visible category when the
 * current selection falls out of the active group.
 *
 * @param state - Current reducer state snapshot.
 * @param dispatch - Reducer dispatch for auto-select corrections.
 * @returns Derived values and navigation callbacks.
 */
export function useCategoryDerived(
  state: StoreState,
  dispatch: Dispatch<StoreAction>,
): CategoryDerived {
  const selectedCategoryIndex = state.categories.findIndex(
    (c) => c.id === state.selectedCategoryID,
  );
  const selectedCategory =
    selectedCategoryIndex !== -1
      ? state.categories[selectedCategoryIndex]
      : null;

  const categoriesInSelectedGroup = useMemo(
    () =>
      state.selectedGroupID === null
        ? state.categories
        : state.categories.filter((c) => c.groupID === state.selectedGroupID),
    [state.categories, state.selectedGroupID],
  );

  const pickerCategories = useMemo((): CategoryPickerItem[] => {
    if (state.selectedGroupID === null) {
      // "All" view: ungrouped categories first, then grouped categories sorted
      // by the display order of their group so same-group pills are always adjacent.
      const groupOrder = new Map(state.groups.map((g, i) => [g.id, i]));
      const ungrouped = state.categories
        .filter((c) => c.groupID === undefined)
        .map((c) => ({ category: c, isUngrouped: true }));
      const grouped = state.categories
        .filter((c) => c.groupID !== undefined)
        .sort(
          (a, b) =>
            (groupOrder.get(a.groupID!) ?? 0) -
            (groupOrder.get(b.groupID!) ?? 0),
        )
        .map((c) => ({ category: c, isUngrouped: false }));
      return [...ungrouped, ...grouped];
    }
    // Specific group: show only the categories assigned to that group.
    return state.categories
      .filter((c) => c.groupID === state.selectedGroupID)
      .map((c) => ({ category: c, isUngrouped: false }));
  }, [state.categories, state.selectedGroupID, state.groups]);

  // Auto-select first visible category if current selection falls out of group.
  // Uses raw state primitives as deps (instead of the derived array) to avoid
  // spurious dispatches when a cloud sync replaces the categories array reference
  // with identical content, which would otherwise cause a no-op effect loop.
  useEffect(() => {
    const inGroup =
      state.selectedGroupID === null
        ? state.categories
        : state.categories.filter((c) => c.groupID === state.selectedGroupID);
    if (inGroup.length === 0) return;
    const isSelectionVisible = inGroup.some(
      (c) => c.id === state.selectedCategoryID,
    );
    if (!isSelectionVisible) {
      dispatch({ type: "SELECT_CATEGORY", id: inGroup[0].id });
    }
  }, [
    state.categories,
    state.selectedGroupID,
    state.selectedCategoryID,
    dispatch,
  ]);

  const hasGroups = state.groups.length > 0;

  const selectedCategoryIndexInGroup = categoriesInSelectedGroup.findIndex(
    (c) => c.id === state.selectedCategoryID,
  );
  const canSelectNextCategory =
    selectedCategoryIndexInGroup !== -1 &&
    selectedCategoryIndexInGroup < categoriesInSelectedGroup.length - 1;
  const canSelectPreviousCategory =
    selectedCategoryIndexInGroup !== -1 && selectedCategoryIndexInGroup > 0;
  const nextCategory = canSelectNextCategory
    ? categoriesInSelectedGroup[selectedCategoryIndexInGroup + 1]
    : null;
  const previousCategory = canSelectPreviousCategory
    ? categoriesInSelectedGroup[selectedCategoryIndexInGroup - 1]
    : null;

  const selectNextCategory = useCallback(() => {
    if (
      selectedCategoryIndexInGroup !== -1 &&
      selectedCategoryIndexInGroup < categoriesInSelectedGroup.length - 1
    ) {
      dispatch({
        type: "SELECT_CATEGORY",
        id: categoriesInSelectedGroup[selectedCategoryIndexInGroup + 1].id,
      });
    }
  }, [selectedCategoryIndexInGroup, categoriesInSelectedGroup, dispatch]);

  const selectPreviousCategory = useCallback(() => {
    if (
      selectedCategoryIndexInGroup !== -1 &&
      selectedCategoryIndexInGroup > 0
    ) {
      dispatch({
        type: "SELECT_CATEGORY",
        id: categoriesInSelectedGroup[selectedCategoryIndexInGroup - 1].id,
      });
    }
  }, [selectedCategoryIndexInGroup, categoriesInSelectedGroup, dispatch]);

  return {
    selectedCategory,
    canDeleteCategories: categoriesInSelectedGroup.length > 1,
    canSelectNextCategory,
    canSelectPreviousCategory,
    nextCategory,
    previousCategory,
    categoriesInSelectedGroup,
    hasGroups,
    pickerCategories,
    selectNextCategory,
    selectPreviousCategory,
  };
}
