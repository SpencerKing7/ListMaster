// src/features/settings/hooks/useAddFlowDialogs.ts
// State and handlers for the "Add Category" and "Add Group" flows.

import { useState, useCallback, useMemo } from "react";
import { isCategoryNameAvailable } from "@/store/reducerHelpers";
import { useCategoriesStore } from "@/store/useCategoriesStore";

// MARK: - Types

/** Return type for {@link useAddFlowDialogs}. */
export interface UseAddFlowDialogsReturn {
  /** Opens the Add Category dialog pre-populated with the current group. */
  openAddCategoryDialog: () => void;
  /** Opens the Add Category dialog for a specific group. */
  openAddCategoryDialogForGroup: (groupID: string) => void;
  /** Opens the Add Group dialog. */
  openAddGroupDialog: () => void;
  /** Which add dialog is active: `"category"`, `"group"`, or `null`. */
  addMode: "category" | "group" | null;
  /** Sets the active add mode. */
  setAddMode: (mode: "category" | "group" | null) => void;
  /** Current category name input value. */
  addCategoryName: string;
  /** Updates the category name input. */
  setAddCategoryName: (v: string) => void;
  /** Currently selected group ID for the new category, or `null`. */
  addCategoryGroupID: string | null;
  /** Sets the group for the new category. */
  setAddCategoryGroupID: (v: string | null) => void;
  /** Current group name input value. */
  addGroupDialogName: string;
  /** Updates the group name input. */
  setAddGroupDialogName: (v: string) => void;
  /** Whether the current add-category name collides with an existing name in the selected group. */
  isDuplicate: boolean;
  /** Confirms creation of a new category. */
  confirmAddCategory: () => void;
  /** Confirms creation of a new group. */
  confirmAddGroup: () => void;
}

// MARK: - Hook

/** Manages the add-category / add-group flow state and handlers. */
export function useAddFlowDialogs(): UseAddFlowDialogsReturn {
  const store = useCategoriesStore();

  const [addMode, setAddMode] = useState<"category" | "group" | null>(null);
  const [addCategoryName, setAddCategoryName] = useState("");
  const [addCategoryGroupID, setAddCategoryGroupID] = useState<string | null>(
    null,
  );
  const [addGroupDialogName, setAddGroupDialogName] = useState("");

  const confirmAddCategory = useCallback(() => {
    const trimmed = addCategoryName.trim();
    if (!trimmed) return;
    if (addCategoryGroupID) {
      store.addCategoryWithGroup(trimmed, addCategoryGroupID);
    } else {
      store.addCategory(trimmed);
    }
    setAddMode(null);
    setAddCategoryName("");
    setAddCategoryGroupID(null);
  }, [addCategoryName, addCategoryGroupID, store]);

  // Convert null (hook convention) → undefined (model convention) for group scoping
  const isDuplicate = useMemo(() => {
    const trimmed = addCategoryName.trim();
    if (!trimmed) return false;
    return !isCategoryNameAvailable(
      store.categories,
      trimmed,
      undefined,
      addCategoryGroupID ?? undefined,
    );
  }, [addCategoryName, addCategoryGroupID, store.categories]);

  /** Opens the Add Category dialog pre-populated with the current group. */
  const openAddCategoryDialog = useCallback(() => {
    setAddCategoryGroupID(store.selectedGroupID);
    setAddCategoryName("");
    setAddMode("category");
  }, [store.selectedGroupID]);

  /** Opens the Add Category dialog for a specific group. */
  const openAddCategoryDialogForGroup = useCallback((groupID: string) => {
    setAddCategoryGroupID(groupID);
    setAddCategoryName("");
    setAddMode("category");
  }, []);

  const openAddGroupDialog = useCallback(() => {
    setAddGroupDialogName("");
    setAddMode("group");
  }, []);

  const confirmAddGroup = useCallback(() => {
    const trimmed = addGroupDialogName.trim();
    if (!trimmed) return;
    store.addGroup(trimmed);
    setAddMode(null);
    setAddGroupDialogName("");
  }, [addGroupDialogName, store]);

  return {
    openAddCategoryDialog,
    openAddCategoryDialogForGroup,
    openAddGroupDialog,
    addMode,
    setAddMode,
    addCategoryName,
    setAddCategoryName,
    addCategoryGroupID,
    setAddCategoryGroupID,
    addGroupDialogName,
    setAddGroupDialogName,
    isDuplicate,
    confirmAddCategory,
    confirmAddGroup,
  };
}
