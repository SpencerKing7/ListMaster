// src/store/syncSubscriptionSetup.ts
// Async function that performs the one-time Firestore load, device registration,
// and real-time subscription setup for a given sync code.
// Extracted from useCloudSyncSubscription to satisfy the 150-line store ceiling.

import type { Dispatch, MutableRefObject } from "react";
import type { StoreAction, StoreState } from "@/models/types";

// MARK: - Types

/** All refs and callbacks needed to set up a Firestore sync subscription. */
export interface SetupSubscriptionParams {
  syncCode: string;
  dispatch: Dispatch<StoreAction>;
  stateRef: MutableRefObject<StoreState>;
  isSyncReadyRef: MutableRefObject<boolean>;
  isLoadingFromSyncRef: MutableRefObject<boolean>;
  getUserNameRef: MutableRefObject<() => string>;
  syncUserNameRef: MutableRefObject<(name: string) => void>;
  onDeviceCountChangeRef: MutableRefObject<(count: number) => void>;
  /** Unix ms of the last local user edit — used for conflict resolution. */
  localEditedAtRef: MutableRefObject<number>;
  /** Schedules a cloud save of the current local state — called when local wins conflict. */
  triggerSaveRef: MutableRefObject<() => void>;
}

// MARK: - Setup

/**
 * Performs the initial Firestore load, device registration, and subscribes to
 * real-time updates. Returns the unsubscribe function, or null on failure.
 *
 * Conflict resolution (last-write-wins by timestamp):
 * - On each real-time snapshot the cloud `updatedAt` is compared to `localEditedAtRef`.
 * - Cloud newer → dispatch SYNC_LOAD to accept remote changes.
 * - Local newer → call `triggerSaveRef` to push offline edits up to Firestore.
 */
export async function setupSubscription(
  params: SetupSubscriptionParams,
): Promise<(() => void) | null> {
  const {
    syncCode,
    dispatch,
    stateRef,
    isSyncReadyRef,
    isLoadingFromSyncRef,
    getUserNameRef,
    syncUserNameRef,
    onDeviceCountChangeRef,
    localEditedAtRef,
    triggerSaveRef,
  } = params;

  try {
    const { subscribeToState, loadState, saveState } =
      await import("@/services/syncService");

    const loadResult = await loadState(syncCode);

    if (loadResult.status === "loaded") {
      const cloudState = loadResult.data;
      if (cloudState.userName) syncUserNameRef.current(cloudState.userName);
      isLoadingFromSyncRef.current = true;
      dispatch({
        type: "SYNC_LOAD",
        categories: cloudState.categories,
        selectedCategoryID: cloudState.selectedCategoryID,
        groups: cloudState.groups,
      });
    } else if (loadResult.status === "not-found") {
      // Document genuinely does not exist — write local state to initialise cloud.
      // Skipped on "timeout" to avoid overwriting cloud with stale local data.
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
    // status === "timeout": cloud state unknown — just subscribe; listener will deliver
    // current state once connectivity resumes.

    isSyncReadyRef.current = true;

    // Self-register this device so the device count stays accurate.
    try {
      const { ensureAnonymousAuth, registerDevice } =
        await import("@/services/syncService");
      const user = await ensureAnonymousAuth();
      await registerDevice(syncCode, user.uid);
    } catch (regError) {
      console.error("Failed to register device:", regError);
    }

    // Skip the first onSnapshot — Firestore delivers it immediately on subscription
    // with the current document, duplicating what loadState already handled.
    let isFirstSnapshot = true;

    const unsubscribe = subscribeToState(
      syncCode,
      (
        categories,
        _selectedCategoryID,
        groups,
        cloudUpdatedAt,
        cloudUserName,
        deviceCount,
      ) => {
        if (isFirstSnapshot) {
          isFirstSnapshot = false;
          onDeviceCountChangeRef.current(deviceCount);
          return;
        }

        onDeviceCountChangeRef.current(deviceCount);

        // Conflict resolution: compare cloud timestamp against last local edit.
        // If the user made edits while offline their localEditedAt will be newer
        // than the stale cloud snapshot — push local state up instead of overwriting.
        if (cloudUpdatedAt > localEditedAtRef.current) {
          // Cloud is the source of truth — accept remote changes.
          if (cloudUserName) syncUserNameRef.current(cloudUserName);
          isLoadingFromSyncRef.current = true;
          dispatch({ type: "SYNC_LOAD", categories, groups });
        } else {
          // Local edits are newer — push them to Firestore to win the conflict.
          triggerSaveRef.current();
        }
      },
    );

    return unsubscribe;
  } catch (error) {
    console.error("Failed to subscribe to cloud changes:", error);
    return null;
  }
}
