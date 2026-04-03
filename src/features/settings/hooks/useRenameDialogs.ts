// src/features/settings/hooks/useRenameDialogs.ts
// State and handlers for the rename-category and rename-group dialogs.

import { useState, useCallback } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";

// MARK: - Types

/** Return type for {@link useRenameDialogs}. */
export interface UseRenameDialogsReturn {
  /** The category being renamed, or `null` when idle. */
  categoryToRename: { id: string; name: string } | null;
  /** Current rename-category input value. */
  renameCategoryName: string;
  /** Updates the rename-category input value. */
  onRenameCategoryNameChange: (v: string) => void;
  /** Opens the rename-category dialog pre-filled with the given name. */
  openRenameCategory: (id: string, name: string) => void;
  /** Closes the rename-category dialog and resets the input. */
  closeRenameCategory: () => void;
  /** Saves the renamed category and closes the dialog. */
  saveRenameCategory: () => void;
  /** The group being renamed, or `null` when idle. */
  groupToRename: { id: string; name: string } | null;
  /** Current rename-group input value. */
  renameGroupName: string;
  /** Updates the rename-group input value. */
  onRenameGroupNameChange: (v: string) => void;
  /** Opens the rename-group dialog pre-filled with the given name. */
  openRenameGroup: (id: string, name: string) => void;
  /** Closes the rename-group dialog and resets the input. */
  closeRenameGroup: () => void;
  /** Saves the renamed group and closes the dialog. */
  saveRenameGroup: () => void;
}

// MARK: - Hook

/** Manages rename state for both categories and groups. */
export function useRenameDialogs(): UseRenameDialogsReturn {
  const store = useCategoriesStore();

  // ── Rename category ──
  const [categoryToRename, setCategoryToRename] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [renameCategoryName, setRenameCategoryName] = useState("");

  const openRenameCategory = useCallback((id: string, name: string) => {
    setRenameCategoryName(name);
    setCategoryToRename({ id, name });
  }, []);

  const closeRenameCategory = useCallback(() => {
    setCategoryToRename(null);
    setRenameCategoryName("");
  }, []);

  const saveRenameCategory = useCallback(() => {
    if (!categoryToRename) return;
    const trimmed = renameCategoryName.trim();
    if (!trimmed) return;
    store.renameCategory(categoryToRename.id, trimmed);
    closeRenameCategory();
  }, [categoryToRename, renameCategoryName, store, closeRenameCategory]);

  // ── Rename group ──
  const [groupToRename, setGroupToRename] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [renameGroupName, setRenameGroupName] = useState("");

  const openRenameGroup = useCallback((id: string, name: string) => {
    setRenameGroupName(name);
    setGroupToRename({ id, name });
  }, []);

  const closeRenameGroup = useCallback(() => {
    setGroupToRename(null);
    setRenameGroupName("");
  }, []);

  const saveRenameGroup = useCallback(() => {
    if (!groupToRename) return;
    const trimmed = renameGroupName.trim();
    if (!trimmed) return;
    store.renameGroup(groupToRename.id, trimmed);
    closeRenameGroup();
  }, [groupToRename, renameGroupName, store, closeRenameGroup]);

  return {
    categoryToRename,
    renameCategoryName,
    onRenameCategoryNameChange: setRenameCategoryName,
    openRenameCategory,
    closeRenameCategory,
    saveRenameCategory,
    groupToRename,
    renameGroupName,
    onRenameGroupNameChange: setRenameGroupName,
    openRenameGroup,
    closeRenameGroup,
    saveRenameGroup,
  };
}
