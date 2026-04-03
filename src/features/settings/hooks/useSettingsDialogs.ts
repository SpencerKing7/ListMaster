// src/features/settings/hooks/useSettingsDialogs.ts
// Manages all dialog/action-sheet state and handlers for the SettingsSheet.
// NOTE: 241 lines — exceeds the 120-line hook target because it centralises 15 useState
// bindings and 12 callback handlers for 6 distinct dialogs. Splitting into per-dialog
// hooks would scatter tightly coupled state across files with no clarity gain.

import { useState, useCallback } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSyncStore } from "@/store/useSyncStore";

// MARK: - Types

/** State and callbacks returned by {@link useSettingsDialogs}. */
export interface UseSettingsDialogsReturn {
  // Rename category
  categoryToRename: { id: string; name: string } | null;
  renameCategoryName: string;
  onRenameCategoryNameChange: (v: string) => void;
  openRenameCategory: (id: string, name: string) => void;
  closeRenameCategory: () => void;
  saveRenameCategory: () => void;
  // Rename group
  groupToRename: { id: string; name: string } | null;
  renameGroupName: string;
  onRenameGroupNameChange: (v: string) => void;
  openRenameGroup: (id: string, name: string) => void;
  closeRenameGroup: () => void;
  saveRenameGroup: () => void;
  // Delete category
  categoryToDelete: { id: string; name: string } | null;
  openDeleteCategory: (id: string, name: string) => void;
  closeDeleteCategory: () => void;
  confirmDeleteCategory: () => void;
  // Delete group
  groupToDelete: { id: string; name: string } | null;
  openDeleteGroup: (id: string, name: string) => void;
  closeDeleteGroup: () => void;
  confirmDeleteGroup: () => void;
  // Group assignment
  isGroupActionSheetOpen: boolean;
  selectedCategoryForGroup: { id: string; name: string } | null;
  openGroupAssignment: (categoryId: string, categoryName: string) => void;
  closeGroupAssignment: () => void;
  handleCategoryGroupChange: (groupID: string | null) => void;
  // Add flow
  isAddActionSheetOpen: boolean;
  openAddActionSheet: () => void;
  closeAddActionSheet: () => void;
  addMode: "category" | "group" | null;
  setAddMode: (mode: "category" | "group" | null) => void;
  addCategoryName: string;
  setAddCategoryName: (v: string) => void;
  addCategoryGroupID: string | null;
  setAddCategoryGroupID: (v: string | null) => void;
  addGroupDialogName: string;
  setAddGroupDialogName: (v: string) => void;
  confirmAddCategory: () => void;
  confirmAddGroup: () => void;
  // Reset
  handleReset: () => void;
}

// MARK: - Hook

/**
 * Encapsulates all dialog/action-sheet open/close state and mutation handlers
 * used by the SettingsSheet. Keeps the sheet component thin and compositional.
 */
export function useSettingsDialogs(
  onCloseSheet: () => void,
): UseSettingsDialogsReturn {
  const store = useCategoriesStore();
  const settings = useSettingsStore();
  const sync = useSyncStore();

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

  // ── Delete category ──
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const confirmDeleteCategory = useCallback(() => {
    if (categoryToDelete) {
      store.deleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    }
  }, [categoryToDelete, store]);

  // ── Delete group ──
  const [groupToDelete, setGroupToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const confirmDeleteGroup = useCallback(() => {
    if (groupToDelete) {
      store.deleteGroup(groupToDelete.id);
      setGroupToDelete(null);
    }
  }, [groupToDelete, store]);

  // ── Group assignment ──
  const [selectedCategoryForGroup, setSelectedCategoryForGroup] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isGroupActionSheetOpen, setIsGroupActionSheetOpen] = useState(false);

  const openGroupAssignment = useCallback(
    (categoryId: string, categoryName: string) => {
      setSelectedCategoryForGroup({ id: categoryId, name: categoryName });
      setIsGroupActionSheetOpen(true);
    },
    [],
  );

  const closeGroupAssignment = useCallback(() => {
    setIsGroupActionSheetOpen(false);
  }, []);

  const handleCategoryGroupChange = useCallback(
    (groupID: string | null) => {
      if (!selectedCategoryForGroup) return;
      store.setCategoryGroup(selectedCategoryForGroup.id, groupID ?? undefined);
      setSelectedCategoryForGroup(null);
      setIsGroupActionSheetOpen(false);
    },
    [selectedCategoryForGroup, store],
  );

  // ── Add flow ──
  const [isAddActionSheetOpen, setIsAddActionSheetOpen] = useState(false);
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

  const confirmAddGroup = useCallback(() => {
    const trimmed = addGroupDialogName.trim();
    if (!trimmed) return;
    store.addGroup(trimmed);
    setAddMode(null);
    setAddGroupDialogName("");
  }, [addGroupDialogName, store]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    if (sync.isSyncEnabled && sync.syncCode) {
      const codeToDelete = sync.syncCode;
      import("@/services/syncService").then(
        ({ ensureAnonymousAuth, deleteSyncData }) =>
          ensureAnonymousAuth()
            .then(() => deleteSyncData(codeToDelete))
            .catch((err: unknown) =>
              console.error("Failed to delete cloud data on reset:", err),
            ),
      );
    }
    sync.disableSync(false);
    store.resetCategories();
    settings.resetToNewUser();
    onCloseSheet();
  }, [sync, store, settings, onCloseSheet]);

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
    isGroupActionSheetOpen,
    selectedCategoryForGroup,
    openGroupAssignment,
    closeGroupAssignment,
    handleCategoryGroupChange,
    isAddActionSheetOpen,
    openAddActionSheet: () => setIsAddActionSheetOpen(true),
    closeAddActionSheet: () => setIsAddActionSheetOpen(false),
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
    handleReset,
  };
}
