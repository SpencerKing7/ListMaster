// src/store/useCategoriesStore.ts
import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  Category,
  CategoryGroup,
  ChecklistItem,
  SortOrder,
  SortDirection,
} from "../models/types";
import { PersistenceService } from "../services/persistenceService";
import { useSyncStore } from "./useSyncStore";
import { useSettingsStore } from "./useSettingsStore";
import React from "react";

// MARK: - State Shape

interface StoreState {
  categories: Category[];
  selectedCategoryID: string;
  groups: CategoryGroup[];
  selectedGroupID: string | null;
}

function loadInitialState(): StoreState {
  const saved = PersistenceService.load();
  if (saved && saved.categories.length > 0) {
    const savedGroups = saved.groups ?? [];
    return {
      categories: saved.categories,
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
  | { type: "UNCHECK_ALL" }
  | { type: "RELOAD" }
  | { type: "RESET_CATEGORIES" }
  | {
      type: "SYNC_LOAD";
      categories: Category[];
      selectedCategoryID: string | null;
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

function isGroupNameAvailable(
  groups: CategoryGroup[],
  name: string,
  excludingID?: string,
): boolean {
  return !groups.some((group) => {
    if (excludingID && group.id === excludingID) return false;
    return group.name.toLowerCase() === name.toLowerCase();
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
        ...state,
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
        ...state,
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
        ...state,
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

    case "UNCHECK_ALL": {
      const catIdx = state.categories.findIndex(
        (c) => c.id === state.selectedCategoryID,
      );
      if (catIdx === -1) return state;
      const updatedCats = state.categories.map((c, i) =>
        i === catIdx
          ? {
              ...c,
              items: c.items.map((item) => ({ ...item, isChecked: false })),
            }
          : c,
      );
      next = { ...state, categories: updatedCats };
      break;
    }

    case "RELOAD": {
      const saved = PersistenceService.load();
      if (!saved || saved.categories.length === 0) return state;
      const reloadedGroups = saved.groups ?? [];
      // Preserve the current group selection if it still exists in the reloaded data.
      // If it doesn't (e.g. the group was deleted on another device), fall back to
      // the first group, or null ("All") if there are no groups.
      const currentGroupStillExists =
        state.selectedGroupID !== null &&
        reloadedGroups.some((g) => g.id === state.selectedGroupID);
      const reloadedGroupID = currentGroupStillExists
        ? state.selectedGroupID
        : reloadedGroups.length > 0
          ? reloadedGroups[0].id
          : null;
      next = {
        categories: saved.categories,
        selectedCategoryID: saved.selectedCategoryID ?? saved.categories[0].id,
        groups: reloadedGroups,
        selectedGroupID: reloadedGroupID,
      };
      // Don't re-save on reload
      return next;
    }

    case "RESET_CATEGORIES": {
      next = {
        categories: [],
        selectedCategoryID: "",
        groups: [],
        selectedGroupID: null,
      };
      PersistenceService.save(
        next.categories,
        next.selectedCategoryID,
        next.groups,
      );
      return next;
    }

    case "SYNC_LOAD": {
      const syncGroups = action.groups ?? [];
      // Preserve the current group selection if it still exists in the synced data.
      // Fall back to the first group, or null ("All") if there are no groups.
      const syncGroupStillExists =
        state.selectedGroupID !== null &&
        syncGroups.some((g) => g.id === state.selectedGroupID);
      const syncGroupID = syncGroupStillExists
        ? state.selectedGroupID
        : syncGroups.length > 0
          ? syncGroups[0].id
          : null;
      next = {
        categories: action.categories,
        selectedCategoryID:
          action.selectedCategoryID ?? action.categories[0]?.id ?? "",
        groups: syncGroups,
        selectedGroupID: syncGroupID,
      };
      // Persist to localStorage so remote data survives an app close.
      PersistenceService.save(
        next.categories,
        next.selectedCategoryID,
        next.groups,
      );
      return next;
    }

    case "ADD_GROUP": {
      const trimmed = normalizedName(action.name);
      if (!trimmed || !isGroupNameAvailable(state.groups, trimmed))
        return state;
      const newGroup: CategoryGroup = {
        id: uuidv4(),
        name: trimmed,
        sortOrder: state.groups.length,
      };
      next = {
        ...state,
        groups: [...state.groups, newGroup],
      };
      break;
    }

    case "RENAME_GROUP": {
      const trimmed = normalizedName(action.newName);
      if (!trimmed || !isGroupNameAvailable(state.groups, trimmed, action.id))
        return state;
      const updated = state.groups.map((g) =>
        g.id === action.id ? { ...g, name: trimmed } : g,
      );
      next = { ...state, groups: updated };
      break;
    }

    case "DELETE_GROUP": {
      const groupToDelete = state.groups.find((g) => g.id === action.id);
      if (!groupToDelete) return state;
      const remainingGroups = state.groups.filter((g) => g.id !== action.id);
      // Clear groupID for all categories that belonged to this group
      const updatedCategories = state.categories.map((c) =>
        c.groupID === action.id ? { ...c, groupID: undefined } : c,
      );
      next = {
        ...state,
        groups: remainingGroups,
        categories: updatedCategories,
      };
      break;
    }

    case "MOVE_GROUPS": {
      const arr = [...state.groups];
      const [moved] = arr.splice(action.from, 1);
      arr.splice(action.to, 0, moved);
      // Update sortOrder to match new positions
      const updatedGroups = arr.map((g, i) => ({ ...g, sortOrder: i }));
      next = { ...state, groups: updatedGroups };
      break;
    }

    case "SELECT_GROUP": {
      const categoriesInGroup =
        action.id === null
          ? state.categories
          : state.categories.filter(
              (c) => c.groupID === action.id || c.groupID === undefined,
            );
      const currentCategoryInGroup = categoriesInGroup.some(
        (c) => c.id === state.selectedCategoryID,
      );
      const newSelectedCategoryID = currentCategoryInGroup
        ? state.selectedCategoryID
        : (categoriesInGroup[0]?.id ?? "");
      next = {
        ...state,
        selectedGroupID: action.id,
        selectedCategoryID: newSelectedCategoryID,
      };
      break;
    }

    case "SET_CATEGORY_GROUP": {
      const updated = state.categories.map((c) =>
        c.id === action.categoryID ? { ...c, groupID: action.groupID } : c,
      );
      next = { ...state, categories: updated };
      break;
    }

    case "ADD_CATEGORY_WITH_GROUP": {
      const trimmed = normalizedName(action.name);
      if (!trimmed || !isNameAvailable(state.categories, trimmed)) return state;
      const newCategory: Category = {
        id: uuidv4(),
        name: trimmed,
        items: [],
        groupID: action.groupID,
      };
      next = {
        ...state,
        categories: [...state.categories, newCategory],
        selectedCategoryID: newCategory.id,
      };
      break;
    }

    default:
      return state;
  }

  // Auto-save after every mutation (except RELOAD and RESET which handle their own)
  PersistenceService.save(
    next.categories,
    next.selectedCategoryID,
    next.groups,
  );
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
  uncheckAllItemsInSelectedCategory: () => void;
  reload: () => void;
  resetCategories: () => void;
  // New group-related properties
  groups: CategoryGroup[];
  selectedGroupID: string | null;
  categoriesInSelectedGroup: Category[];
  hasGroups: boolean;
  selectGroup: (id: string | null) => void;
  addGroup: (name: string) => void;
  renameGroup: (id: string, newName: string) => void;
  deleteGroup: (id: string) => void;
  moveGroups: (from: number, to: number) => void;
  setCategoryGroup: (categoryID: string, groupID: string | undefined) => void;
  /** Atomically creates a new category and assigns it to the given group. */
  addCategoryWithGroup: (name: string, groupID: string) => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);
  const { isSyncEnabled, syncCode } = useSyncStore();
  const settings = useSettingsStore();
  // Keep a ref to the current userName so async cloud-save callbacks always
  // have the latest value without needing it as a useCallback dependency.
  const userNameRef = useRef(settings.userName);
  // Keep a ref to syncUserName so the subscription useEffect closure always
  // calls the latest version without re-running the subscription.
  const syncUserNameRef = useRef(settings.syncUserName);
  useEffect(() => {
    userNameRef.current = settings.userName;
    syncUserNameRef.current = settings.syncUserName;
  }, [settings.userName, settings.syncUserName]);
  // Tracks whether the current state was just loaded from the cloud.
  // Cleared synchronously at the start of the cloud-save path so we never
  // echo a remote write back to Firestore.
  const isLoadingFromSync = useRef(false);
  // Holds the pending debounce timer ID for cloud saves.
  const cloudSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Schedules a cloud save 1 second after the last local mutation.
  const scheduleCloudSave = useCallback(
    (
      categories: Category[],
      selectedCategoryID: string | null,
      groups: CategoryGroup[],
    ) => {
      // If this render was triggered by a SYNC_LOAD, skip — no echo writes.
      if (isLoadingFromSync.current) {
        isLoadingFromSync.current = false;
        return;
      }
      if (!isSyncEnabled || !syncCode) return;

      if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current);
      cloudSaveTimer.current = setTimeout(async () => {
        cloudSaveTimer.current = null;
        try {
          const { saveState } = await import("../services/syncService");
          await saveState(
            syncCode,
            categories,
            selectedCategoryID,
            groups,
            userNameRef.current,
          );
        } catch (error) {
          console.error("Failed to save to cloud:", error);
        }
      }, 1000);
    },
    [isSyncEnabled, syncCode],
  );

  // Subscribe to cloud changes when sync is enabled.
  // The effect cleanup tears down the listener when sync is disabled or the
  // code changes, so no ghost subscriptions survive.
  useEffect(() => {
    if (!isSyncEnabled || !syncCode) return;

    let unsubscribe: (() => void) | null = null;

    const setupSubscription = async () => {
      try {
        const { subscribeToState, loadState } =
          await import("../services/syncService");

        // Immediately fetch the current cloud state so we don't overwrite it
        // with stale local data before the first onSnapshot fires.
        const cloudState = await loadState(syncCode);
        if (cloudState) {
          if (cloudState.userName) syncUserNameRef.current(cloudState.userName);
          isLoadingFromSync.current = true;
          dispatch({
            type: "SYNC_LOAD",
            categories: cloudState.categories,
            selectedCategoryID: cloudState.selectedCategoryID,
            groups: cloudState.groups,
          });
        }

        unsubscribe = subscribeToState(
          syncCode,
          (categories, selectedCategoryID, groups, cloudUserName) => {
            if (cloudUserName) syncUserNameRef.current(cloudUserName);
            // Mark synchronously before dispatch so the subsequent useEffect
            // that calls scheduleCloudSave sees it on the same render cycle.
            isLoadingFromSync.current = true;
            dispatch({
              type: "SYNC_LOAD",
              categories,
              selectedCategoryID,
              groups,
            });
          },
        );
      } catch (error) {
        console.error("Failed to subscribe to cloud changes:", error);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) unsubscribe();
      // Cancel any pending debounced write when unsubscribing.
      if (cloudSaveTimer.current) {
        clearTimeout(cloudSaveTimer.current);
        cloudSaveTimer.current = null;
      }
    };
  }, [isSyncEnabled, syncCode]);

  // Trigger a debounced cloud save whenever local state changes.
  useEffect(() => {
    scheduleCloudSave(state.categories, state.selectedCategoryID, state.groups);
  }, [
    state.categories,
    state.selectedCategoryID,
    state.groups,
    scheduleCloudSave,
  ]);

  const selectedCategoryIndex = state.categories.findIndex(
    (c) => c.id === state.selectedCategoryID,
  );

  const selectedCategory =
    selectedCategoryIndex !== -1
      ? state.categories[selectedCategoryIndex]
      : null;

  // New derived values for groups
  const categoriesInSelectedGroup = React.useMemo(
    () =>
      state.selectedGroupID === null
        ? state.categories
        : [
            ...state.categories.filter(
              (c) => c.groupID === state.selectedGroupID,
            ),
            ...state.categories.filter((c) => c.groupID === undefined),
          ],
    [state.categories, state.selectedGroupID],
  );

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

  const selectCategory = useCallback(
    (id: string) => dispatch({ type: "SELECT_CATEGORY", id }),
    [],
  );
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
  }, [selectedCategoryIndexInGroup, categoriesInSelectedGroup]);

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
  }, [selectedCategoryIndexInGroup, categoriesInSelectedGroup]);

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
  const uncheckAllItemsInSelectedCategory = useCallback(
    () => dispatch({ type: "UNCHECK_ALL" }),
    [],
  );
  const reload = useCallback(() => dispatch({ type: "RELOAD" }), []);
  const resetCategories = useCallback(
    () => dispatch({ type: "RESET_CATEGORIES" }),
    [],
  );

  // New group-related callbacks
  const selectGroup = useCallback(
    (id: string | null) => dispatch({ type: "SELECT_GROUP", id }),
    [],
  );
  const addGroup = useCallback(
    (name: string) => dispatch({ type: "ADD_GROUP", name }),
    [],
  );
  const renameGroup = useCallback(
    (id: string, newName: string) =>
      dispatch({ type: "RENAME_GROUP", id, newName }),
    [],
  );
  const deleteGroup = useCallback(
    (id: string) => dispatch({ type: "DELETE_GROUP", id }),
    [],
  );
  const moveGroups = useCallback(
    (from: number, to: number) => dispatch({ type: "MOVE_GROUPS", from, to }),
    [],
  );
  const setCategoryGroup = useCallback(
    (categoryID: string, groupID: string | undefined) =>
      dispatch({ type: "SET_CATEGORY_GROUP", categoryID, groupID }),
    [],
  );
  const addCategoryWithGroup = useCallback(
    (name: string, groupID: string) =>
      dispatch({ type: "ADD_CATEGORY_WITH_GROUP", name, groupID }),
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
    uncheckAllItemsInSelectedCategory,
    reload,
    resetCategories,
    // New group-related properties
    groups: state.groups,
    selectedGroupID: state.selectedGroupID,
    categoriesInSelectedGroup,
    hasGroups,
    selectGroup,
    addGroup,
    renameGroup,
    deleteGroup,
    moveGroups,
    setCategoryGroup,
    addCategoryWithGroup,
  };

  return React.createElement(StoreContext.Provider, { value }, children);
}

export function useCategoriesStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx)
    throw new Error("useCategoriesStore must be used inside StoreProvider");
  return ctx;
}
