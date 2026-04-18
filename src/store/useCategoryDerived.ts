// src/store/useCategoryDerived.ts
// Derived / computed values from the categories store state.
// Extracted from useCategoriesStore to keep the provider focused.

import { useMemo, useEffect, useCallback } from "react";
import type { Dispatch } from "react";
import type {
  CategoryPickerItem,
  StoreState,
  StoreAction,
  CategoryDerived,
} from "@/models/types";

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

  // Navigation uses pickerCategories order so the bottom bar chevrons move
  // through pills in the same left-to-right sequence the user sees.
  const pickerCategoryList = pickerCategories.map((p) => p.category);
  const selectedCategoryIndexInGroup = pickerCategoryList.findIndex(
    (c) => c.id === state.selectedCategoryID,
  );
  const canSelectNextCategory =
    selectedCategoryIndexInGroup !== -1 &&
    selectedCategoryIndexInGroup < pickerCategoryList.length - 1;
  const canSelectPreviousCategory =
    selectedCategoryIndexInGroup !== -1 && selectedCategoryIndexInGroup > 0;
  const nextCategory = canSelectNextCategory
    ? pickerCategoryList[selectedCategoryIndexInGroup + 1]
    : null;
  const previousCategory = canSelectPreviousCategory
    ? pickerCategoryList[selectedCategoryIndexInGroup - 1]
    : null;

  const selectNextCategory = useCallback(() => {
    if (
      selectedCategoryIndexInGroup !== -1 &&
      selectedCategoryIndexInGroup < pickerCategoryList.length - 1
    ) {
      dispatch({
        type: "SELECT_CATEGORY",
        id: pickerCategoryList[selectedCategoryIndexInGroup + 1].id,
      });
    }
  }, [selectedCategoryIndexInGroup, pickerCategoryList, dispatch]);

  const selectPreviousCategory = useCallback(() => {
    if (
      selectedCategoryIndexInGroup !== -1 &&
      selectedCategoryIndexInGroup > 0
    ) {
      dispatch({
        type: "SELECT_CATEGORY",
        id: pickerCategoryList[selectedCategoryIndexInGroup - 1].id,
      });
    }
  }, [selectedCategoryIndexInGroup, pickerCategoryList, dispatch]);

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
