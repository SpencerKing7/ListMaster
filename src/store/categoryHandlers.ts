// src/store/categoryHandlers.ts
// Reducer handlers for category-level actions (add, rename, delete, reorder, sort, group assignment).

import { v4 as uuidv4 } from "uuid";
import type { Category, SortOrder, SortDirection } from "@/models/types";
import type { StoreState } from "./categoriesReducer";
import { normalizedName, isCategoryNameAvailable } from "./reducerHelpers";

/** SELECT_CATEGORY */
export function handleSelectCategory(
  state: StoreState,
  id: string,
): StoreState | null {
  if (!state.categories.some((c) => c.id === id)) return null;
  return { ...state, selectedCategoryID: id };
}

/** ADD_CATEGORY */
export function handleAddCategory(
  state: StoreState,
  name: string,
): StoreState | null {
  const trimmed = normalizedName(name);
  if (
    !trimmed ||
    !isCategoryNameAvailable(state.categories, trimmed, undefined, undefined)
  )
    return null;
  const newCategory: Category = { id: uuidv4(), name: trimmed, items: [] };
  return {
    ...state,
    categories: [...state.categories, newCategory],
    selectedCategoryID: newCategory.id,
  };
}

/** SET_CATEGORIES — bulk-set categories from onboarding.
 *  All categories created here are ungrouped (same groupID scope),
 *  so the inline duplicate check is sufficient without calling isCategoryNameAvailable. */
export function handleSetCategories(
  state: StoreState,
  names: string[],
): StoreState | null {
  const newCategories: Category[] = [];
  for (const raw of names) {
    const trimmed = normalizedName(raw);
    if (!trimmed) continue;
    if (
      newCategories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())
    )
      continue;
    newCategories.push({ id: uuidv4(), name: trimmed, items: [] });
  }
  if (newCategories.length === 0) return null;
  return {
    ...state,
    categories: newCategories,
    selectedCategoryID: newCategories[0].id,
  };
}

/** RENAME_CATEGORY */
export function handleRenameCategory(
  state: StoreState,
  id: string,
  newName: string,
): StoreState | null {
  const cat = state.categories.find((c) => c.id === id);
  if (!cat) return null;
  const trimmed = normalizedName(newName);
  if (
    !trimmed ||
    !isCategoryNameAvailable(state.categories, trimmed, id, cat.groupID)
  )
    return null;
  const updated = state.categories.map((c) =>
    c.id === id ? { ...c, name: trimmed } : c,
  );
  return { ...state, categories: updated };
}

/** DELETE_CATEGORY */
export function handleDeleteCategory(
  state: StoreState,
  id: string,
): StoreState | null {
  if (state.categories.length <= 1) return null;
  const idx = state.categories.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const deletedWasSelected =
    state.categories[idx].id === state.selectedCategoryID;
  const remaining = state.categories.filter((c) => c.id !== id);
  return {
    ...state,
    categories: remaining,
    selectedCategoryID: deletedWasSelected
      ? remaining[0].id
      : state.selectedCategoryID,
  };
}

/** MOVE_CATEGORIES */
export function handleMoveCategories(
  state: StoreState,
  from: number,
  to: number,
): StoreState {
  const arr = [...state.categories];
  const [moved] = arr.splice(from, 1);
  arr.splice(to, 0, moved);
  return { ...state, categories: arr };
}

/** REORDER_CATEGORIES */
export function handleReorderCategories(
  state: StoreState,
  orderedIDs: string[],
): StoreState | null {
  const idSet = new Set(orderedIDs);
  if (idSet.size !== state.categories.length) return null;
  const lookup = new Map(state.categories.map((c) => [c.id, c]));
  const reordered = orderedIDs
    .map((id) => lookup.get(id))
    .filter((c): c is Category => c !== undefined);
  if (reordered.length !== state.categories.length) return null;
  return { ...state, categories: reordered };
}

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
