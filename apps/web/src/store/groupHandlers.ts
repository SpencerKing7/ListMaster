// src/store/groupHandlers.ts
// Reducer handlers for group-level actions (add, rename, delete, reorder, select).

import { v4 as uuidv4 } from "uuid";
import type { CategoryGroup, StoreState } from "@/models/types";
import { normalizedName, isGroupNameAvailable } from "./reducerHelpers";

/** ADD_GROUP */
export function handleAddGroup(
  state: StoreState,
  name: string,
): StoreState | null {
  const trimmed = normalizedName(name);
  if (!trimmed || !isGroupNameAvailable(state.groups, trimmed)) return null;
  const newGroup: CategoryGroup = {
    id: uuidv4(),
    name: trimmed,
    sortOrder: state.groups.length,
  };
  return { ...state, groups: [...state.groups, newGroup] };
}

/** RENAME_GROUP */
export function handleRenameGroup(
  state: StoreState,
  id: string,
  newName: string,
): StoreState | null {
  const trimmed = normalizedName(newName);
  if (!trimmed || !isGroupNameAvailable(state.groups, trimmed, id)) return null;
  const updated = state.groups.map((g) =>
    g.id === id ? { ...g, name: trimmed } : g,
  );
  return { ...state, groups: updated };
}

/** DELETE_GROUP — removes the group and un-assigns any categories that belonged to it. */
export function handleDeleteGroup(
  state: StoreState,
  id: string,
): StoreState | null {
  const groupToDelete = state.groups.find((g) => g.id === id);
  if (!groupToDelete) return null;
  const remainingGroups = state.groups.filter((g) => g.id !== id);
  const updatedCategories = state.categories.map((c) =>
    c.groupID === id ? { ...c, groupID: undefined } : c,
  );
  return { ...state, groups: remainingGroups, categories: updatedCategories };
}

/** MOVE_GROUPS */
export function handleMoveGroups(
  state: StoreState,
  from: number,
  to: number,
): StoreState {
  const arr = [...state.groups];
  const [moved] = arr.splice(from, 1);
  arr.splice(to, 0, moved);
  const updatedGroups = arr.map((g, i) => ({ ...g, sortOrder: i }));
  return { ...state, groups: updatedGroups };
}

/** SELECT_GROUP — also updates selectedCategoryID if the current selection is not in the new group. */
export function handleSelectGroup(
  state: StoreState,
  id: string | null,
): StoreState {
  const categoriesInGroup =
    id === null
      ? state.categories
      : state.categories.filter((c) => c.groupID === id);
  const currentCategoryInGroup = categoriesInGroup.some(
    (c) => c.id === state.selectedCategoryID,
  );
  const newSelectedCategoryID = currentCategoryInGroup
    ? state.selectedCategoryID
    : (categoriesInGroup[0]?.id ?? "");
  return {
    ...state,
    selectedGroupID: id,
    selectedCategoryID: newSelectedCategoryID,
  };
}
