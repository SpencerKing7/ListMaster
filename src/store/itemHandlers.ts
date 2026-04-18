// src/store/itemHandlers.ts
// Reducer handlers for checklist-item actions (add, toggle, delete, check/uncheck all, clear checked).

import { v4 as uuidv4 } from "uuid";
import type { ChecklistItem } from "@/models/types";
import type { StoreState } from "@/models/types";
import { normalizedName } from "./reducerHelpers";

// MARK: - Helpers

/** Find the index of the selected category in the state. Returns -1 if not found. */
function selectedCatIdx(state: StoreState): number {
  return state.categories.findIndex((c) => c.id === state.selectedCategoryID);
}

// MARK: - Handlers

/** ADD_ITEM */
export function handleAddItem(
  state: StoreState,
  name: string,
): StoreState | null {
  const trimmed = normalizedName(name);
  if (!trimmed) return null;
  const catIdx = selectedCatIdx(state);
  if (catIdx === -1) return null;
  const newItem: ChecklistItem = {
    id: uuidv4(),
    name: trimmed,
    isChecked: false,
    createdAt: Date.now(),
  };
  const updatedCats = state.categories.map((c, i) =>
    i === catIdx ? { ...c, items: [...c.items, newItem] } : c,
  );
  return { ...state, categories: updatedCats };
}

/** TOGGLE_ITEM */
export function handleToggleItem(
  state: StoreState,
  itemID: string,
): StoreState | null {
  const catIdx = selectedCatIdx(state);
  if (catIdx === -1) return null;
  const cat = state.categories[catIdx];
  const itemIdx = cat.items.findIndex((i) => i.id === itemID);
  if (itemIdx === -1) return null;
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
  return { ...state, categories: updatedCats };
}

/** DELETE_ITEM */
export function handleDeleteItem(
  state: StoreState,
  itemID: string,
): StoreState {
  const updated = state.categories.map((c) =>
    c.id === state.selectedCategoryID
      ? { ...c, items: c.items.filter((i) => i.id !== itemID) }
      : c,
  );
  return { ...state, categories: updated };
}

/** CLEAR_CHECKED */
export function handleClearChecked(state: StoreState): StoreState | null {
  const catIdx = selectedCatIdx(state);
  if (catIdx === -1) return null;
  const updatedCats = state.categories.map((c, i) =>
    i === catIdx
      ? { ...c, items: c.items.filter((item) => !item.isChecked) }
      : c,
  );
  return { ...state, categories: updatedCats };
}

/** CHECK_ALL */
export function handleCheckAll(state: StoreState): StoreState | null {
  const catIdx = selectedCatIdx(state);
  if (catIdx === -1) return null;
  const updatedCats = state.categories.map((c, i) =>
    i === catIdx
      ? { ...c, items: c.items.map((item) => ({ ...item, isChecked: true })) }
      : c,
  );
  return { ...state, categories: updatedCats };
}

/** UNCHECK_ALL */
export function handleUncheckAll(state: StoreState): StoreState | null {
  const catIdx = selectedCatIdx(state);
  if (catIdx === -1) return null;
  const updatedCats = state.categories.map((c, i) =>
    i === catIdx
      ? { ...c, items: c.items.map((item) => ({ ...item, isChecked: false })) }
      : c,
  );
  return { ...state, categories: updatedCats };
}
