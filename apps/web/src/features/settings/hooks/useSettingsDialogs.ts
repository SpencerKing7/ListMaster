// src/features/settings/hooks/useSettingsDialogs.ts
// Composes sub-hooks into a single return value consumed by SettingsSheet.

import { useCallback } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSyncStore } from "@/store/useSyncStore";
import { useRenameDialogs } from "./useRenameDialogs";
import type { UseRenameDialogsReturn } from "./useRenameDialogs";
import { useDeleteDialogs } from "./useDeleteDialogs";
import type { UseDeleteDialogsReturn } from "./useDeleteDialogs";
import { useGroupAssignment } from "./useGroupAssignment";
import type { UseGroupAssignmentReturn } from "./useGroupAssignment";
import { useAddFlowDialogs } from "./useAddFlowDialogs";
import type { UseAddFlowDialogsReturn } from "./useAddFlowDialogs";

// MARK: - Types

/** Aggregate state and callbacks returned by {@link useSettingsDialogs}. */
export type UseSettingsDialogsReturn = UseRenameDialogsReturn &
  UseDeleteDialogsReturn &
  UseGroupAssignmentReturn &
  UseAddFlowDialogsReturn & {
    /** Resets all app data and optionally deletes cloud data. */
    handleReset: () => void;
  };

// MARK: - Hook

/**
 * Composes all dialog/action-sheet state for the SettingsSheet into a
 * single aggregated return value.
 */
export function useSettingsDialogs(
  onCloseSheet: () => void,
): UseSettingsDialogsReturn {
  const store = useCategoriesStore();
  const settings = useSettingsStore();
  const sync = useSyncStore();

  const rename = useRenameDialogs();
  const del = useDeleteDialogs();
  const groupAssignment = useGroupAssignment();
  const addFlow = useAddFlowDialogs();

  const handleReset = useCallback(() => {
    if (sync.isSyncEnabled && sync.syncCode) {
      const codeToDelete = sync.syncCode;
      // Delete the cloud document and the anonymous Firebase auth user so the
      // account is fully cleaned up. disableSync(false) runs synchronously
      // below to clear local state; the cloud ops happen in the background.
      import("@/services/syncService").then(
        ({ ensureAnonymousAuth, deleteSyncData }) =>
          ensureAnonymousAuth()
            .then(() => deleteSyncData(codeToDelete))
            .catch((err: unknown) =>
              console.error("Failed to delete cloud data on reset:", err),
            ),
      );
      import("@/services/authService").then(
        ({ deleteAnonymousUser }) =>
          deleteAnonymousUser().catch((err: unknown) =>
            console.error("Failed to delete anonymous auth user on reset:", err),
          ),
      );
    }
    sync.disableSync(false);
    store.resetCategories();
    settings.resetToNewUser();
    onCloseSheet();
  }, [sync, store, settings, onCloseSheet]);

  return {
    ...rename,
    ...del,
    ...groupAssignment,
    ...addFlow,
    handleReset,
  };
}
