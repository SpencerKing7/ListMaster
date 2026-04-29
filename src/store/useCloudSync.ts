// src/store/useCloudSync.ts
// Hook that manages the cloud sync subscription lifecycle and debounced saves.
// Extracted from useCategoriesStore to keep the provider focused on state shape.

import { useEffect, useRef, useCallback } from "react";
import type { Dispatch } from "react";
import type { Category, CategoryGroup, ColorTheme } from "@/models/types";
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
  /** Returns the latest color theme for save payloads. */
  getColorTheme: () => ColorTheme;
  /** Applies a cloud-provided color theme to local settings. */
  syncColorTheme: (theme: ColorTheme) => void;
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
  getColorTheme,
  syncColorTheme,
  onDeviceCountChange,
}: UseCloudSyncParams): { triggerSave: () => void } {
  // Tracks whether current state was just loaded from the cloud (remote SYNC_LOAD guard).
  // When true, scheduleCloudSave bails to avoid pushing remote data back to Firestore.
  const isLoadingFromSync = useRef(false);
  // Tracks whether we are waiting for Firestore to echo back our own write.
  // Kept separate from isLoadingFromSync so that user edits made during the
  // in-flight saveState window are not silently dropped.
  const isOwnEchoExpected = useRef(false);
  // Guards against "adopt code" data-wipe race.
  const isSyncReadyRef = useRef(false);
  // Mirrors latest reducer state for async callbacks.
  const stateRef = useRef<StoreState>(state);
  useEffect(() => {
    stateRef.current = state;
  });
  // Pending debounce timer for cloud saves.
  const cloudSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Unix ms of the last local user edit — 0 so first snapshot always wins initially.
  const localEditedAtRef = useRef<number>(0);

  // Stable refs so the subscription setup closure doesn't go stale.
  const getUserNameRef = useRef(getUserName);
  const syncUserNameRef = useRef(syncUserName);
  const getColorThemeRef = useRef(getColorTheme);
  const syncColorThemeRef = useRef(syncColorTheme);
  useEffect(() => {
    getUserNameRef.current = getUserName;
    syncUserNameRef.current = syncUserName;
    getColorThemeRef.current = getColorTheme;
    syncColorThemeRef.current = syncColorTheme;
  }, [getUserName, syncUserName, getColorTheme, syncColorTheme]);

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

      // Stamp the local edit time only after all guards pass, so edits made
      // before sync is ready don't interfere with the first conflict check.
      localEditedAtRef.current = Date.now();

      if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current);
      cloudSaveTimer.current = setTimeout(async () => {
        cloudSaveTimer.current = null;
        try {
          const { saveState } = await import("@/services/syncService");
          // Flag that we are expecting Firestore to echo back our own write.
          // The snapshot callback will check this flag and skip the dispatch,
          // preventing a SYNC_LOAD from reverting any edits made mid-flight.
          isOwnEchoExpected.current = true;
          await saveState(
            syncCode,
            categories,
            selectedCategoryID,
            groups,
            getUserNameRef.current(),
            getColorThemeRef.current(),
          );
        } catch (error) {
          // Clear the flag on failure — no echo will arrive, so no echo to skip.
          isOwnEchoExpected.current = false;
          console.error("Failed to save to cloud:", error);
        }
      }, 1000);
    },
    [isSyncEnabled, syncCode],
  );

  // ── Cloud subscription ──

  // Stable ref pointing to a save function — called by the subscription when
  // local edits are newer than the incoming cloud snapshot (conflict resolution).
  const triggerSaveRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    triggerSaveRef.current = () => {
      scheduleCloudSave(
        stateRef.current.categories,
        stateRef.current.selectedCategoryID,
        stateRef.current.groups,
      );
    };
  }, [scheduleCloudSave]);

  useCloudSyncSubscription({
    isSyncEnabled,
    syncCode,
    dispatch,
    stateRef,
    isSyncReadyRef,
    isLoadingFromSyncRef: isLoadingFromSync,
    isOwnEchoExpectedRef: isOwnEchoExpected,
    getUserNameRef,
    syncUserNameRef,
    getColorThemeRef,
    syncColorThemeRef,
    cloudSaveTimerRef: cloudSaveTimer,
    onDeviceCountChange,
    localEditedAtRef,
    triggerSaveRef,
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

  return { triggerSave: useCallback(() => triggerSaveRef.current(), []) };
}
