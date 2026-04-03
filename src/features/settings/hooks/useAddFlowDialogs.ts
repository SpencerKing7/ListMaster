// src/features/settings/hooks/useAddFlowDialogs.ts
// State and handlers for the "Add Category or Group" flow (action sheet + dialogs).

import { useState, useCallback, useRef, useEffect } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";

// MARK: - Types

/** Return type for {@link useAddFlowDialogs}. */
export interface UseAddFlowDialogsReturn {
  /** Whether the add-mode ActionSheet is open. */
  isAddActionSheetOpen: boolean;
  /** Opens the add ActionSheet. */
  openAddActionSheet: () => void;
  /** Closes the add ActionSheet. */
  closeAddActionSheet: () => void;
  /**
   * Opens the Add Category dialog, pre-populating the group picker with the
   * currently selected group so the category lands in the right place.
   */
  openAddCategoryDialog: () => void;
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
  /** Confirms creation of a new category. */
  confirmAddCategory: () => void;
  /** Confirms creation of a new group. */
  confirmAddGroup: () => void;
}

// MARK: - Hook

/** Manages the add-category / add-group flow state and handlers. */
export function useAddFlowDialogs(): UseAddFlowDialogsReturn {
  const store = useCategoriesStore();

  const [isAddActionSheetOpen, setIsAddActionSheetOpen] = useState(false);
  const [addMode, setAddMode] = useState<"category" | "group" | null>(null);
  const [addCategoryName, setAddCategoryName] = useState("");
  const [addCategoryGroupID, setAddCategoryGroupID] = useState<string | null>(
    null,
  );
  const [addGroupDialogName, setAddGroupDialogName] = useState("");

  // Refs mirror the latest state to prevent stale closures in callbacks
  // that fire during @base-ui dialog open/close transitions.
  const categoryNameRef = useRef(addCategoryName);
  const categoryGroupIDRef = useRef(addCategoryGroupID);
  const groupDialogNameRef = useRef(addGroupDialogName);

  useEffect(() => {
    categoryNameRef.current = addCategoryName;
  }, [addCategoryName]);
  useEffect(() => {
    categoryGroupIDRef.current = addCategoryGroupID;
  }, [addCategoryGroupID]);
  useEffect(() => {
    groupDialogNameRef.current = addGroupDialogName;
  }, [addGroupDialogName]);

  const confirmAddCategory = useCallback(() => {
    const trimmed = categoryNameRef.current.trim();
    if (!trimmed) return;
    const groupID = categoryGroupIDRef.current;
    if (groupID) {
      store.addCategoryWithGroup(trimmed, groupID);
    } else {
      store.addCategory(trimmed);
    }
    setAddMode(null);
    setAddCategoryName("");
    setAddCategoryGroupID(null);
  }, [store]);

  /**
   * Opens the Add Category dialog pre-populated with the currently selected
   * group. This ensures the new category lands in the group the user is
   * already viewing rather than silently going into an invisible "No Group"
   * bucket when a group is active.
   */
  const openAddCategoryDialog = useCallback(() => {
    setAddCategoryGroupID(store.selectedGroupID);
    setAddCategoryName("");
    setAddMode("category");
  }, [store.selectedGroupID]);

  const confirmAddGroup = useCallback(() => {
    const trimmed = groupDialogNameRef.current.trim();
    if (!trimmed) return;
    store.addGroup(trimmed);
    setAddMode(null);
    setAddGroupDialogName("");
  }, [store]);

  return {
    isAddActionSheetOpen,
    openAddActionSheet: () => setIsAddActionSheetOpen(true),
    closeAddActionSheet: () => setIsAddActionSheetOpen(false),
    openAddCategoryDialog,
    addMode,
    setAddMode,
    addCategoryName,
    setAddCategoryName,
    addCategoryGroupID,
    setAddCategoryGroupID,
    addGroupDialogName,
    setAddGroupDialogName,
    confirmAddCategory,
    confirmAddGroup,
  };
}
