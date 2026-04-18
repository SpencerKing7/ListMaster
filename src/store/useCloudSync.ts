// src/store/useCloudSync.ts
// Hook that manages the cloud sync subscription lifecycle and debounced saves.
// Extracted from useCategoriesStore to keep the provider focused on state shape.

import { useEffect, useRef, useCallback } from "react";
import type { Dispatch } from "react";
import type { Category, CategoryGroup } from "@/models/types";
import type { StoreState, StoreAction } from "@/models/types";
import { useCloudSyncSubscription } from "@/store/useCloudSyncSubscription";

// MARK: - Types

/** Parameters required by the cloud sync hook. */
interface UseCloudSyncParams {
  /** Latest reducer state, kept fresh via a ref internally. */
  state: StoreState;
  /** Dispatch function to send SYNC_LOAD actions into the reducer. */
  dispatch: Dispatch<StoreAction>;
  /** Whether cloud sync is enabled. */
  isSyncEnabled: boolean;
  /** The active sync code (empty string when disabled). */
  syncCode: string;
  /** Returns the latest user name for save payloads. */
  getUserName: () => string;
  /** Applies a cloud-provided user name to local settings. */
  syncUserName: (name: string) => void;
  /** Called on every snapshot with the current registered device count. */
  onDeviceCountChange: (count: number) => void;
}

// MARK: - Hook

/**
 * Manages the full cloud-sync lifecycle:
 * 1. Initial load from Firestore on mount / code change.
 * 2. Real-time subscription for updates from other devices.
 * 3. Debounced save whenever categories or groups change locally.
 *
 * @param params - Sync configuration and store references.
 */
export function useCloudSync({
  state,
  dispatch,
  isSyncEnabled,
  syncCode,
  getUserName,
  syncUserName,
  onDeviceCountChange,
}: UseCloudSyncParams): void {
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

  // Stable refs so the subscription setup closure doesn't go stale.
  const getUserNameRef = useRef(getUserName);
  const syncUserNameRef = useRef(syncUserName);
  useEffect(() => {
    getUserNameRef.current = getUserName;
    syncUserNameRef.current = syncUserName;
  }, [getUserName, syncUserName]);

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
            getUserNameRef.current(),
          );
        } catch (error) {
          console.error("Failed to save to cloud:", error);
        }
      }, 1000);
    },
    [isSyncEnabled, syncCode],
  );

  // ── Cloud subscription ──

  useCloudSyncSubscription({
    isSyncEnabled,
    syncCode,
    dispatch,
    stateRef,
    isSyncReadyRef,
    isLoadingFromSyncRef: isLoadingFromSync,
    getUserNameRef,
    syncUserNameRef,
    cloudSaveTimerRef: cloudSaveTimer,
    onDeviceCountChange,
  });

  // Trigger debounced cloud save on data changes (categories and groups).
  // selectedCategoryID is intentionally excluded from the dependency array:
  // it is local UI state per device and should not trigger a cloud write.
  // It is still included in the save payload so that new devices get a
  // reasonable starting view.
  useEffect(() => {
    scheduleCloudSave(state.categories, state.selectedCategoryID, state.groups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.categories, state.groups, scheduleCloudSave]);
}
