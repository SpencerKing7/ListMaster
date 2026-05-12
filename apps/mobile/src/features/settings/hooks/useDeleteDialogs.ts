// src/features/settings/hooks/useDeleteDialogs.ts
// State and handlers for the delete-category and delete-group confirmation dialogs.

import { useState, useCallback } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";

// MARK: - Types

/** Return type for {@link useDeleteDialogs}. */
export interface UseDeleteDialogsReturn {
  /** The category pending deletion, or `null` when idle. */
  categoryToDelete: { id: string; name: string } | null;
  /** Opens the delete-category confirmation dialog. */
  openDeleteCategory: (id: string, name: string) => void;
  /** Closes the delete-category dialog without deleting. */
  closeDeleteCategory: () => void;
  /** Confirms the deletion and closes the dialog. */
  confirmDeleteCategory: () => void;
  /** The group pending deletion, or `null` when idle. */
  groupToDelete: { id: string; name: string } | null;
  /** Opens the delete-group confirmation dialog. */
  openDeleteGroup: (id: string, name: string) => void;
  /** Closes the delete-group dialog without deleting. */
  closeDeleteGroup: () => void;
  /** Confirms the deletion and closes the dialog. */
  confirmDeleteGroup: () => void;
}

// MARK: - Hook

/** Manages delete-confirmation state for both categories and groups. */
export function useDeleteDialogs(): UseDeleteDialogsReturn {
  const store = useCategoriesStore();

  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const confirmDeleteCategory = useCallback(() => {
    if (categoryToDelete) {
      store.deleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    }
  }, [categoryToDelete, store]);

  const confirmDeleteGroup = useCallback(() => {
    if (groupToDelete) {
      store.deleteGroup(groupToDelete.id);
      setGroupToDelete(null);
    }
  }, [groupToDelete, store]);

  return {
    categoryToDelete,
    openDeleteCategory: (id: string, name: string) =>
      setCategoryToDelete({ id, name }),
    closeDeleteCategory: () => setCategoryToDelete(null),
    confirmDeleteCategory,
    groupToDelete,
    openDeleteGroup: (id: string, name: string) =>
      setGroupToDelete({ id, name }),
    closeDeleteGroup: () => setGroupToDelete(null),
    confirmDeleteGroup,
  };
}
