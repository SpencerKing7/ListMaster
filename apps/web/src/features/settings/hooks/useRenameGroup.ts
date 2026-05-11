// src/features/settings/hooks/useRenameGroup.ts
// State and handlers for the rename-group dialog.

import { useState, useCallback } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";

// MARK: - Types

/** Return type for {@link useRenameGroup}. */
export interface UseRenameGroupReturn {
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

/** Manages rename state for groups. */
export function useRenameGroup(): UseRenameGroupReturn {
  const store = useCategoriesStore();

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
    groupToRename,
    renameGroupName,
    onRenameGroupNameChange: setRenameGroupName,
    openRenameGroup,
    closeRenameGroup,
    saveRenameGroup,
  };
}
