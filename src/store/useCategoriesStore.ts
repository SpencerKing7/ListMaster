// src/store/useCategoriesStore.ts
// React Context provider and hook for the categories store.
// Cloud sync, dispatch wrappers, and derived values are extracted into
// useCloudSync.ts, useCategoryActions.ts, and useCategoryDerived.ts.

import {
  createContext,
  useContext,
  useReducer,
  useRef,
  useEffect,
  useCallback,
  createElement,
  type ReactNode,
} from "react";
import type { StoreContextValue } from "@/models/types";
import { useSyncStore } from "@/store/useSyncStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { categoriesReducer, loadInitialState } from "@/store/categoriesReducer";
import { useCloudSync } from "@/store/useCloudSync";
import { useCategoryActions } from "@/store/useCategoryActions";
import { useCategoryDerived } from "@/store/useCategoryDerived";

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
  const { isSyncEnabled, syncCode, setSyncedDeviceCount } = useSyncStore();
  const settings = useSettingsStore();

  // Keep stable refs for cloud sync callbacks.
  const userNameRef = useRef(settings.userName);
  const syncUserNameRef = useRef(settings.syncUserName);
  useEffect(() => {
    userNameRef.current = settings.userName;
    syncUserNameRef.current = settings.syncUserName;
  }, [settings.userName, settings.syncUserName]);

  const getUserName = useCallback(() => userNameRef.current, []);
  const applySyncUserName = useCallback(
    (name: string) => syncUserNameRef.current(name),
    [],
  );

  // -- Composed hooks --

  useCloudSync({
    state,
    dispatch,
    isSyncEnabled,
    syncCode,
    getUserName,
    syncUserName: applySyncUserName,
    onDeviceCountChange: setSyncedDeviceCount,
  });

  const actions = useCategoryActions(dispatch);
  const derived = useCategoryDerived(state, dispatch);

  // -- Assemble context value --

  const value: StoreContextValue = {
    categories: state.categories,
    selectedCategoryID: state.selectedCategoryID,
    selectedCategory: derived.selectedCategory,
    canDeleteCategories: derived.canDeleteCategories,
    canSelectNextCategory: derived.canSelectNextCategory,
    canSelectPreviousCategory: derived.canSelectPreviousCategory,
    nextCategory: derived.nextCategory,
    previousCategory: derived.previousCategory,
    selectCategory: actions.selectCategory,
    selectNextCategory: derived.selectNextCategory,
    selectPreviousCategory: derived.selectPreviousCategory,
    addCategory: actions.addCategory,
    setCategories: actions.setCategories,
    renameCategory: actions.renameCategory,
    deleteCategory: actions.deleteCategory,
    moveCategories: actions.moveCategories,
    reorderCategories: actions.reorderCategories,
    setCategorySortOrder: actions.setCategorySortOrder,
    setCategorySortDirection: actions.setCategorySortDirection,
    addItemToSelectedCategory: actions.addItemToSelectedCategory,
    toggleItemInSelectedCategory: actions.toggleItemInSelectedCategory,
    deleteItemFromSelectedCategory: actions.deleteItemFromSelectedCategory,
    clearCheckedItemsInSelectedCategory:
      actions.clearCheckedItemsInSelectedCategory,
    checkAllItemsInSelectedCategory: actions.checkAllItemsInSelectedCategory,
    uncheckAllItemsInSelectedCategory:
      actions.uncheckAllItemsInSelectedCategory,
    reload: actions.reload,
    resetCategories: actions.resetCategories,
    groups: state.groups,
    selectedGroupID: state.selectedGroupID,
    categoriesInSelectedGroup: derived.categoriesInSelectedGroup,
    pickerCategories: derived.pickerCategories,
    hasGroups: derived.hasGroups,
    selectGroup: actions.selectGroup,
    addGroup: actions.addGroup,
    renameGroup: actions.renameGroup,
    deleteGroup: actions.deleteGroup,
    moveGroups: actions.moveGroups,
    setCategoryGroup: actions.setCategoryGroup,
    addCategoryWithGroup: actions.addCategoryWithGroup,
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
