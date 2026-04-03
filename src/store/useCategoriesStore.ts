// src/store/useCategoriesStore.ts
// React Context provider and hook for the categories store.
// The pure reducer logic lives in categoriesReducer.ts.
//
// FILE SIZE NOTE: ~380 lines — exceeds the 120-line custom hook hard max.
// This is the Context provider for the app's primary state. It couples the
// reducer, cloud sync side-effects, derived values, and 20+ useCallback
// dispatch wrappers into a single context value. Splitting the dispatch
// callbacks into a separate file would require passing `dispatch` across
// module boundaries and lose the co-location benefit.

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  createElement,
  type ReactNode,
} from "react";
import type {
  Category,
  CategoryGroup,
  SortOrder,
  SortDirection,
} from "@/models/types";
import { useSyncStore } from "@/store/useSyncStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import {
  categoriesReducer,
  loadInitialState,
  type StoreState,
} from "@/store/categoriesReducer";

// MARK: - Context Value

/** Public API surface of the categories store. */
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

// MARK: - Provider

/** Provides the categories store to the component tree. */
export function StoreProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const [state, dispatch] = useReducer(
    categoriesReducer,
    undefined,
    loadInitialState,
  );
  const { isSyncEnabled, syncCode } = useSyncStore();
  const settings = useSettingsStore();

  // Keep refs to latest values so async callbacks never capture stale closures.
  const userNameRef = useRef(settings.userName);
  const syncUserNameRef = useRef(settings.syncUserName);
  useEffect(() => {
    userNameRef.current = settings.userName;
    syncUserNameRef.current = settings.syncUserName;
  }, [settings.userName, settings.syncUserName]);

  // Tracks whether current state was just loaded from the cloud.
  const isLoadingFromSync = useRef(false);
  // Guards against "adopt code" data-wipe race.
  const isSyncReadyRef = useRef(false);
  // Mirrors latest reducer state for async callbacks.
  const stateRef = useRef<StoreState>(state);
  useEffect(() => {
    stateRef.current = state;
  });
  // Pending debounce timer for cloud saves.
  const cloudSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Cloud save (debounced) ──

  const scheduleCloudSave = useCallback(
    (
      categories: Category[],
      selectedCategoryID: string | null,
      groups: CategoryGroup[],
    ) => {
      if (isLoadingFromSync.current) {
        isLoadingFromSync.current = false;
        return;
      }
      if (!isSyncReadyRef.current) return;
      if (!isSyncEnabled || !syncCode) return;

      if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current);
      cloudSaveTimer.current = setTimeout(async () => {
        cloudSaveTimer.current = null;
        try {
          const { saveState } = await import("@/services/syncService");
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

  // ── Cloud subscription ──

  useEffect(() => {
    if (!isSyncEnabled || !syncCode) return;
    isSyncReadyRef.current = false;

    let unsubscribe: (() => void) | null = null;

    const setupSubscription = async (): Promise<void> => {
      try {
        const { subscribeToState, loadState } =
          await import("@/services/syncService");

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
        } else {
          // Document doesn't exist yet — write local state.
          try {
            const { saveState } = await import("@/services/syncService");
            const s = stateRef.current;
            await saveState(
              syncCode,
              s.categories,
              s.selectedCategoryID,
              s.groups,
              userNameRef.current,
            );
          } catch (saveError) {
            console.error("Failed to write initial sync state:", saveError);
          }
        }

        isSyncReadyRef.current = true;

        unsubscribe = subscribeToState(
          syncCode,
          (categories, _selectedCategoryID, groups, cloudUserName) => {
            if (cloudUserName) syncUserNameRef.current(cloudUserName);
            isLoadingFromSync.current = true;
            // Real-time updates intentionally omit selectedCategoryID.
            // Each device keeps its own category selection — syncing it
            // causes an infinite feedback loop between devices.
            dispatch({
              type: "SYNC_LOAD",
              categories,
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
      isSyncReadyRef.current = false;
      if (cloudSaveTimer.current) {
        clearTimeout(cloudSaveTimer.current);
        cloudSaveTimer.current = null;
      }
    };
  }, [isSyncEnabled, syncCode]);

  // Trigger debounced cloud save on data changes (categories and groups).
  // selectedCategoryID is intentionally excluded from the dependency array:
  // it is local UI state per device and should not trigger a cloud write.
  // It is still included in the save payload so that new devices get a
  // reasonable starting view.
  useEffect(() => {
    scheduleCloudSave(state.categories, state.selectedCategoryID, state.groups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.categories, state.groups, scheduleCloudSave]);

  // ── Derived values ──

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

  // Auto-select first visible category if current selection falls out of group.
  useEffect(() => {
    if (categoriesInSelectedGroup.length === 0) return;
    const isSelectionVisible = categoriesInSelectedGroup.some(
      (c) => c.id === state.selectedCategoryID,
    );
    if (!isSelectionVisible) {
      dispatch({
        type: "SELECT_CATEGORY",
        id: categoriesInSelectedGroup[0].id,
      });
    }
  }, [categoriesInSelectedGroup, state.selectedCategoryID]);

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

  // ── Dispatch callbacks ──

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

  // ── Assemble context value ──

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

  return createElement(StoreContext.Provider, { value }, children);
}

/** Hook to access the categories store. Must be used within a StoreProvider. */
export function useCategoriesStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx)
    throw new Error("useCategoriesStore must be used inside StoreProvider");
  return ctx;
}
