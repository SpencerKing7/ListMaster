// src/store/useCloudSyncSubscription.ts
import { useEffect, useRef } from "react";
import type { Dispatch, MutableRefObject } from "react";
import type { StoreAction, StoreState } from "@/models/types";

// MARK: - Types

/** Parameters for the cloud subscription lifecycle hook. */
interface UseCloudSyncSubscriptionParams {
  isSyncEnabled: boolean;
  syncCode: string;
  dispatch: Dispatch<StoreAction>;
  stateRef: MutableRefObject<StoreState>;
  isSyncReadyRef: MutableRefObject<boolean>;
  isLoadingFromSyncRef: MutableRefObject<boolean>;
  getUserNameRef: MutableRefObject<() => string>;
  syncUserNameRef: MutableRefObject<(name: string) => void>;
  cloudSaveTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  /** Called on every snapshot with the current registered device count. */
  onDeviceCountChange: (count: number) => void;
}

// MARK: - Hook

/**
 * Manages the Firestore subscription lifecycle: initial load, real-time
 * onSnapshot, and cleanup on unmount / code change.
 * Extracted from useCloudSync to satisfy the 120-line hook ceiling.
 */
export function useCloudSyncSubscription({
  isSyncEnabled,
  syncCode,
  dispatch,
  stateRef,
  isSyncReadyRef,
  isLoadingFromSyncRef,
  getUserNameRef,
  syncUserNameRef,
  cloudSaveTimerRef,
  onDeviceCountChange,
}: UseCloudSyncSubscriptionParams): void {
  // Stable ref so the snapshot closure always calls the latest setter.
  const onDeviceCountChangeRef = useRef(onDeviceCountChange);
  useEffect(() => {
    onDeviceCountChangeRef.current = onDeviceCountChange;
  }, [onDeviceCountChange]);

  useEffect(() => {
    if (!isSyncEnabled || !syncCode) return;
    isSyncReadyRef.current = false;

    let unsubscribe: (() => void) | null = null;

    const setupSubscription = async (): Promise<void> => {
      try {
        const { subscribeToState, loadState, saveState } =
          await import("@/services/syncService");

        const cloudState = await loadState(syncCode);
        if (cloudState) {
          if (cloudState.userName) syncUserNameRef.current(cloudState.userName);
          isLoadingFromSyncRef.current = true;
          dispatch({
            type: "SYNC_LOAD",
            categories: cloudState.categories,
            selectedCategoryID: cloudState.selectedCategoryID,
            groups: cloudState.groups,
          });
        } else {
          try {
            const s = stateRef.current;
            await saveState(
              syncCode,
              s.categories,
              s.selectedCategoryID,
              s.groups,
              getUserNameRef.current(),
            );
          } catch (saveError) {
            console.error("Failed to write initial sync state:", saveError);
          }
        }

        isSyncReadyRef.current = true;

        // Self-register this device on every app load so existing devices
        // (that synced before deviceIDs was introduced) appear in the count.
        try {
          const { ensureAnonymousAuth, registerDevice } =
            await import("@/services/syncService");
          const user = await ensureAnonymousAuth();
          await registerDevice(syncCode, user.uid);
        } catch (regError) {
          console.error("Failed to register device:", regError);
        }

        unsubscribe = subscribeToState(
          syncCode,
          (
            categories,
            _selectedCategoryID,
            groups,
            cloudUserName,
            deviceCount,
          ) => {
            if (cloudUserName) syncUserNameRef.current(cloudUserName);
            isLoadingFromSyncRef.current = true;
            // Real-time updates intentionally omit selectedCategoryID.
            // Each device keeps its own category selection — syncing it
            // causes an infinite feedback loop between devices.
            dispatch({ type: "SYNC_LOAD", categories, groups });
            onDeviceCountChangeRef.current(deviceCount);
          },
        );
      } catch (error) {
        console.error("Failed to subscribe to cloud changes:", error);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) unsubscribe();
      isSyncReadyRef.current = false;
      if (cloudSaveTimerRef.current) {
        clearTimeout(cloudSaveTimerRef.current);
        cloudSaveTimerRef.current = null;
      }
    };
  }, [
    isSyncEnabled,
    syncCode,
    dispatch,
    isSyncReadyRef,
    isLoadingFromSyncRef,
    getUserNameRef,
    syncUserNameRef,
    stateRef,
    cloudSaveTimerRef,
  ]);
}
