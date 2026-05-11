// src/features/settings/hooks/useRenameDialogs.ts
// State and handlers for inline rename editing.

import { useState, useCallback, useMemo } from "react";
import { isCategoryNameAvailable } from "@/store/reducerHelpers";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { useRenameGroup } from "./useRenameGroup";
import type { UseRenameGroupReturn } from "./useRenameGroup";

// MARK: - Types

/** Return type for {@link useRenameDialogs}. */
export interface UseRenameDialogsReturn extends UseRenameGroupReturn {
  /** ID of the category currently in inline-edit mode, or `null` when idle. */
  inlineEditingCategoryID: string | null;
  /** Current rename-category input value. */
  renameCategoryName: string;
  /** Updates the rename-category input value. */
  onRenameCategoryNameChange: (v: string) => void;
  /** Enters inline-edit mode for a category. */
  setInlineEditingCategoryID: (id: string | null) => void;
  /** Whether the rename input collides with an existing name in the same group. */
  isRenameDuplicate: boolean;
  /** Whether any groups exist (for adaptive error message). */
  hasGroups: boolean;
  /** Saves the renamed category and exits inline-edit mode. */
  saveRenameCategory: () => void;
  /** ID of the group currently in inline-edit mode, or `null` when idle. */
  inlineEditingGroupID: string | null;
  /** Enters inline-edit mode for a group. */
  setInlineEditingGroupID: (id: string | null) => void;
}

// MARK: - Hook

/** Manages inline rename state for both categories and groups. */
export function useRenameDialogs(): UseRenameDialogsReturn {
  const store = useCategoriesStore();
  const group = useRenameGroup();

  const [inlineEditingCategoryID, setInlineEditingCategoryID] = useState<string | null>(null);
  const [renameCategoryName, setRenameCategoryName] = useState("");

  const onRenameCategoryNameChange = useCallback((v: string) => {
    setRenameCategoryName(v);
  }, []);

  // When entering edit mode, pre-fill the current name
  const setInlineEditingCategoryIDWithPreFill = useCallback((id: string | null) => {
    if (id !== null) {
      const category = store.categories.find((c) => c.id === id);
      setRenameCategoryName(category?.name ?? "");
    } else {
      setRenameCategoryName("");
    }
    setInlineEditingCategoryID(id);
  }, [store.categories]);

  const editGroupID = useMemo(() => {
    if (!inlineEditingCategoryID) return undefined;
    return store.categories.find((c) => c.id === inlineEditingCategoryID)?.groupID;
  }, [inlineEditingCategoryID, store.categories]);

  const isRenameDuplicate = useMemo(() => {
    if (!inlineEditingCategoryID) return false;
    const trimmed = renameCategoryName.trim();
    if (!trimmed) return false;
    return !isCategoryNameAvailable(
      store.categories,
      trimmed,
      inlineEditingCategoryID,
      editGroupID,
    );
  }, [inlineEditingCategoryID, renameCategoryName, store.categories, editGroupID]);

  const saveRenameCategory = useCallback(() => {
    if (!inlineEditingCategoryID) return;
    const trimmed = renameCategoryName.trim();
    if (!trimmed || isRenameDuplicate) return;
    store.renameCategory(inlineEditingCategoryID, trimmed);
    setInlineEditingCategoryID(null);
    setRenameCategoryName("");
  }, [inlineEditingCategoryID, renameCategoryName, isRenameDuplicate, store]);

  const [inlineEditingGroupID, setInlineEditingGroupID] = useState<string | null>(null);

  const setInlineEditingGroupIDWithPreFill = useCallback((id: string | null) => {
    if (id !== null) {
      const grp = store.groups.find((g) => g.id === id);
      group.onRenameGroupNameChange(grp?.name ?? "");
    } else {
      group.onRenameGroupNameChange("");
    }
    setInlineEditingGroupID(id);
  }, [store.groups, group]);

  // Override: useRenameGroup.saveRenameGroup guards on groupToRename (dialog-based); use inlineEditingGroupID instead.
  const saveRenameGroup = useCallback(() => {
    if (!inlineEditingGroupID) return;
    const trimmed = group.renameGroupName.trim();
    if (!trimmed) return;
    store.renameGroup(inlineEditingGroupID, trimmed);
    setInlineEditingGroupID(null);
    group.onRenameGroupNameChange("");
  }, [inlineEditingGroupID, group, store]);

  return {
    inlineEditingCategoryID,
    renameCategoryName,
    onRenameCategoryNameChange,
    setInlineEditingCategoryID: setInlineEditingCategoryIDWithPreFill,
    saveRenameCategory,
    isRenameDuplicate,
    hasGroups: store.groups.length > 0,
    inlineEditingGroupID,
    setInlineEditingGroupID: setInlineEditingGroupIDWithPreFill,
    ...group,
    saveRenameGroup,
  };
}
