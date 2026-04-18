// src/store/categoryAttributeHandlers.ts
// Reducer handlers for category attribute mutations: sort order, sort direction, and group assignment.

import type { SortOrder, SortDirection, StoreState } from "@/models/types";
import { isCategoryNameAvailable, normalizedName } from "./reducerHelpers";
import { v4 as uuidv4 } from "uuid";
import type { Category } from "@/models/types";

// MARK: - Handlers

/** SET_CATEGORY_SORT_ORDER */
export function handleSetCategorySortOrder(
  state: StoreState,
  id: string,
  sortOrder: SortOrder,
): StoreState {
  const updated = state.categories.map((c) =>
    c.id === id ? { ...c, sortOrder } : c,
  );
  return { ...state, categories: updated };
}

/** SET_CATEGORY_SORT_DIRECTION */
export function handleSetCategorySortDirection(
  state: StoreState,
  id: string,
  sortDirection: SortDirection,
): StoreState {
  const updated = state.categories.map((c) =>
    c.id === id ? { ...c, sortDirection } : c,
  );
  return { ...state, categories: updated };
}

/**
 * SET_CATEGORY_GROUP — reassign a category to a different group.
 * @returns null if the destination group already has a category with this name.
 */
export function handleSetCategoryGroup(
  state: StoreState,
  categoryID: string,
  groupID: string | undefined,
): StoreState | null {
  const cat = state.categories.find((c) => c.id === categoryID);
  if (!cat) return null;
  if (!isCategoryNameAvailable(state.categories, cat.name, categoryID, groupID))
    return null;
  const updated = state.categories.map((c) =>
    c.id === categoryID ? { ...c, groupID } : c,
  );
  return { ...state, categories: updated };
}

/** ADD_CATEGORY_WITH_GROUP */
export function handleAddCategoryWithGroup(
  state: StoreState,
  name: string,
  groupID: string,
): StoreState | null {
  const trimmed = normalizedName(name);
  if (
    !trimmed ||
    !isCategoryNameAvailable(state.categories, trimmed, undefined, groupID)
  )
    return null;
  const newCategory: Category = {
    id: uuidv4(),
    name: trimmed,
    items: [],
    groupID,
  };
  return {
    ...state,
    categories: [...state.categories, newCategory],
    selectedCategoryID: newCategory.id,
  };
}
