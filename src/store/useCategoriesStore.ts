// src/store/useCategoriesStore.ts
import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  Category,
  ChecklistItem,
  SortOrder,
  SortDirection,
} from "../models/types";
import { PersistenceService } from "../services/persistenceService";
import React from "react";

// MARK: - State Shape

interface StoreState {
  categories: Category[];
  selectedCategoryID: string;
}

function loadInitialState(): StoreState {
  const saved = PersistenceService.load();
  if (saved && saved.categories.length > 0) {
    return {
      categories: saved.categories,
      selectedCategoryID: saved.selectedCategoryID ?? saved.categories[0].id,
    };
  }
  return { categories: [], selectedCategoryID: "" };
}

// MARK: - Actions

type StoreAction =
  | { type: "SELECT_CATEGORY"; id: string }
  | { type: "ADD_CATEGORY"; name: string }
  | { type: "SET_CATEGORIES"; names: string[] }
  | { type: "RENAME_CATEGORY"; id: string; newName: string }
  | { type: "DELETE_CATEGORY"; id: string }
  | { type: "MOVE_CATEGORIES"; from: number; to: number }
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
  | { type: "RELOAD" }
  | { type: "RESET_CATEGORIES" };

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

// MARK: - Reducer

function reducer(state: StoreState, action: StoreAction): StoreState {
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

    case "RELOAD": {
      const saved = PersistenceService.load();
      if (!saved || saved.categories.length === 0) return state;
      next = {
        categories: saved.categories,
        selectedCategoryID: saved.selectedCategoryID ?? saved.categories[0].id,
      };
      // Don't re-save on reload
      return next;
    }

    case "RESET_CATEGORIES": {
      next = { categories: [], selectedCategoryID: "" };
      PersistenceService.save(next.categories, next.selectedCategoryID);
      return next;
    }

    default:
      return state;
  }

  // Auto-save after every mutation (except RELOAD and RESET which handle their own)
  PersistenceService.save(next.categories, next.selectedCategoryID);
  return next;
}

// MARK: - Context

interface StoreContextValue {
  categories: Category[];
  selectedCategoryID: string;
  selectedCategory: Category | null;
  canDeleteCategories: boolean;
  canSelectNextCategory: boolean;
  canSelectPreviousCategory: boolean;
  nextCategory: Category | null;
  previousCategory: Category | null;
  selectCategory: (id: string) => void;
  selectNextCategory: () => void;
  selectPreviousCategory: () => void;
  addCategory: (name: string) => void;
  setCategories: (names: string[]) => void;
  renameCategory: (id: string, newName: string) => void;
  deleteCategory: (id: string) => void;
  moveCategories: (from: number, to: number) => void;
  setCategorySortOrder: (id: string, sortOrder: SortOrder) => void;
  setCategorySortDirection: (id: string, sortDirection: SortDirection) => void;
  addItemToSelectedCategory: (name: string) => void;
  toggleItemInSelectedCategory: (itemID: string) => void;
  deleteItemFromSelectedCategory: (itemID: string) => void;
  clearCheckedItemsInSelectedCategory: () => void;
  checkAllItemsInSelectedCategory: () => void;
  reload: () => void;
  resetCategories: () => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  const selectedCategoryIndex = state.categories.findIndex(
    (c) => c.id === state.selectedCategoryID,
  );

  const selectedCategory =
    selectedCategoryIndex !== -1
      ? state.categories[selectedCategoryIndex]
      : null;

  const canSelectNextCategory =
    selectedCategoryIndex !== -1 &&
    selectedCategoryIndex < state.categories.length - 1;

  const canSelectPreviousCategory =
    selectedCategoryIndex !== -1 && selectedCategoryIndex > 0;

  const nextCategory = canSelectNextCategory
    ? state.categories[selectedCategoryIndex + 1]
    : null;

  const previousCategory = canSelectPreviousCategory
    ? state.categories[selectedCategoryIndex - 1]
    : null;

  const selectCategory = useCallback(
    (id: string) => dispatch({ type: "SELECT_CATEGORY", id }),
    [],
  );
  const selectNextCategory = useCallback(() => {
    if (
      selectedCategoryIndex !== -1 &&
      selectedCategoryIndex < state.categories.length - 1
    ) {
      dispatch({
        type: "SELECT_CATEGORY",
        id: state.categories[selectedCategoryIndex + 1].id,
      });
    }
  }, [selectedCategoryIndex, state.categories]);

  const selectPreviousCategory = useCallback(() => {
    if (selectedCategoryIndex !== -1 && selectedCategoryIndex > 0) {
      dispatch({
        type: "SELECT_CATEGORY",
        id: state.categories[selectedCategoryIndex - 1].id,
      });
    }
  }, [selectedCategoryIndex, state.categories]);

  const addCategory = useCallback(
    (name: string) => dispatch({ type: "ADD_CATEGORY", name }),
    [],
  );
  const setCategories = useCallback(
    (names: string[]) => dispatch({ type: "SET_CATEGORIES", names }),
    [],
  );
  const renameCategory = useCallback(
    (id: string, newName: string) =>
      dispatch({ type: "RENAME_CATEGORY", id, newName }),
    [],
  );
  const deleteCategory = useCallback(
    (id: string) => dispatch({ type: "DELETE_CATEGORY", id }),
    [],
  );
  const moveCategories = useCallback(
    (from: number, to: number) =>
      dispatch({ type: "MOVE_CATEGORIES", from, to }),
    [],
  );
  const setCategorySortOrder = useCallback(
    (id: string, sortOrder: SortOrder) =>
      dispatch({ type: "SET_CATEGORY_SORT_ORDER", id, sortOrder }),
    [],
  );
  const setCategorySortDirection = useCallback(
    (id: string, sortDirection: SortDirection) =>
      dispatch({ type: "SET_CATEGORY_SORT_DIRECTION", id, sortDirection }),
    [],
  );
  const addItemToSelectedCategory = useCallback(
    (name: string) => dispatch({ type: "ADD_ITEM", name }),
    [],
  );
  const toggleItemInSelectedCategory = useCallback(
    (itemID: string) => dispatch({ type: "TOGGLE_ITEM", itemID }),
    [],
  );
  const deleteItemFromSelectedCategory = useCallback(
    (itemID: string) => dispatch({ type: "DELETE_ITEM", itemID }),
    [],
  );
  const clearCheckedItemsInSelectedCategory = useCallback(
    () => dispatch({ type: "CLEAR_CHECKED" }),
    [],
  );
  const checkAllItemsInSelectedCategory = useCallback(
    () => dispatch({ type: "CHECK_ALL" }),
    [],
  );
  const reload = useCallback(() => dispatch({ type: "RELOAD" }), []);
  const resetCategories = useCallback(
    () => dispatch({ type: "RESET_CATEGORIES" }),
    [],
  );

  const value: StoreContextValue = {
    categories: state.categories,
    selectedCategoryID: state.selectedCategoryID,
    selectedCategory,
    canDeleteCategories: state.categories.length > 1,
    canSelectNextCategory,
    canSelectPreviousCategory,
    nextCategory,
    previousCategory,
    selectCategory,
    selectNextCategory,
    selectPreviousCategory,
    addCategory,
    setCategories,
    renameCategory,
    deleteCategory,
    moveCategories,
    setCategorySortOrder,
    setCategorySortDirection,
    addItemToSelectedCategory,
    toggleItemInSelectedCategory,
    deleteItemFromSelectedCategory,
    clearCheckedItemsInSelectedCategory,
    checkAllItemsInSelectedCategory,
    reload,
    resetCategories,
  };

  return React.createElement(StoreContext.Provider, { value }, children);
}

export function useCategoriesStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx)
    throw new Error("useCategoriesStore must be used inside StoreProvider");
  return ctx;
}
