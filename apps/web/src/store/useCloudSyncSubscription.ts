// src/store/useCloudSyncSubscription.ts
// Hook that sets up and tears down the Firestore real-time subscription for cloud sync.
import { useEffect, useRef } from "react";
import type { Dispatch, RefObject } from "react";
import type { StoreAction, StoreState, ColorTheme } from "@/models/types";
import { setupSubscription } from "@/store/syncSubscriptionSetup";

// MARK: - Types

/** Parameters for the cloud subscription lifecycle hook. */
interface UseCloudSyncSubscriptionParams {
  isSyncEnabled: boolean;
  syncCode: string;
  dispatch: Dispatch<StoreAction>;
  stateRef: RefObject<StoreState>;
  isSyncReadyRef: RefObject<boolean>;
  isLoadingFromSyncRef: RefObject<boolean>;
  /** Tracks whether we are waiting for Firestore to echo back our own write. */
  isOwnEchoExpectedRef: RefObject<boolean>;
  getColorThemeRef: RefObject<() => ColorTheme>;
  syncColorThemeRef: RefObject<(theme: ColorTheme) => void>;
  cloudSaveTimerRef: RefObject<ReturnType<typeof setTimeout> | null>;
  /** Called on every snapshot with the current registered device count. */
  onDeviceCountChange: (count: number) => void;
  /** Unix ms of the last local user edit — used for conflict resolution. */
  localEditedAtRef: RefObject<number>;
  /** Schedules a cloud save of current local state — called when local wins conflict. */
  triggerSaveRef: RefObject<() => void>;
}

// MARK: - Hook

/**
 * Manages the Firestore subscription lifecycle: initial load, real-time
 * onSnapshot, and cleanup on unmount / code change.
 * Delegates setup and conflict resolution to syncSubscriptionSetup.
 */
export function useCloudSyncSubscription({
  isSyncEnabled,
  syncCode,
  dispatch,
  stateRef,
  isSyncReadyRef,
  isLoadingFromSyncRef,
  isOwnEchoExpectedRef,
  getColorThemeRef,
  syncColorThemeRef,
  cloudSaveTimerRef,
  onDeviceCountChange,
  localEditedAtRef,
  triggerSaveRef,
}: UseCloudSyncSubscriptionParams): void {
  // Stable ref so the snapshot closure always calls the latest setter.
  const onDeviceCountChangeRef = useRef(onDeviceCountChange);
  useEffect(() => {
    onDeviceCountChangeRef.current = onDeviceCountChange;
  }, [onDeviceCountChange]);

  // Stable ref so the async .then() and the synchronous cleanup
  // share the same unsubscribe slot across the effect boundary.
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isSyncEnabled || !syncCode) return;
    isSyncReadyRef.current = false;

    // Guard against the component unmounting before setupSubscription resolves.
    // Without this, the cleanup runs with unsubscribe === null and the .then()
    // assigns a live listener after cleanup, leaking the subscription permanently.
    let isCancelled = false;

    setupSubscription({
      syncCode,
      dispatch,
      stateRef,
      isSyncReadyRef,
      isLoadingFromSyncRef,
      isOwnEchoExpectedRef,
      getColorThemeRef,
      syncColorThemeRef,
      onDeviceCountChangeRef,
      localEditedAtRef,
      triggerSaveRef,
    }).then((unsub) => {
      if (isCancelled) {
        // Effect cleaned up while we were awaiting — immediately release the listener.
        if (unsub) unsub();
      } else {
        unsubscribeRef.current = unsub;
      }
    });

    return () => {
      isCancelled = true;
      if (unsubscribeRef.current) unsubscribeRef.current();
      unsubscribeRef.current = null;
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
    isOwnEchoExpectedRef,
    getColorThemeRef,
    syncColorThemeRef,
    stateRef,
    cloudSaveTimerRef,
    localEditedAtRef,
    triggerSaveRef,
  ]);
}
