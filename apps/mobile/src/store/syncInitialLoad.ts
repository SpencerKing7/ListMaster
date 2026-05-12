// src/store/syncInitialLoad.ts
// Resolves the initial Firestore load result against local persisted data.
// Extracted from syncSubscriptionSetup to keep that file under the line ceiling.

import type { Dispatch, RefObject } from "react";
import type { StoreAction, StoreState, ColorTheme } from "@/models/types";
import type { Category, CategoryGroup } from "@/models/types";
import type { LoadStateResult } from "@/services/syncService";
import { PersistenceService } from "@/services/persistenceService";

// MARK: - Types

/** Parameters for resolving the initial cloud load against local data. */
interface ResolveInitialLoadParams {
  loadResult: LoadStateResult;
  syncCode: string;
  stateRef: RefObject<StoreState>;
  isLoadingFromSyncRef: RefObject<boolean>;
  getUserNameRef: RefObject<() => string>;
  syncUserNameRef: RefObject<(name: string) => void>;
  getColorThemeRef: RefObject<() => ColorTheme>;
  syncColorThemeRef: RefObject<(theme: ColorTheme) => void>;
  dispatch: Dispatch<StoreAction>;
  /** Pre-imported saveState function from syncService. */
  saveState: (
    syncCode: string,
    categories: Category[],
    selectedCategoryID: string | null,
    groups: CategoryGroup[],
    userName: string,
    colorTheme: ColorTheme,
  ) => Promise<void>;
}

// MARK: - Helper

/**
 * Resolves what to do after the one-time Firestore `loadState` call:
 *
 * - `"loaded"` + cloud is newer → dispatch `SYNC_LOAD` to replace local state.
 * - `"loaded"` + local is newer → push local data to Firestore so it wins.
 * - `"not-found"` → push local state to create the Firestore document.
 * - `"timeout"` → no-op; the real-time listener will deliver current cloud state.
 */
export async function resolveInitialLoad({
  loadResult,
  syncCode,
  stateRef,
  isLoadingFromSyncRef,
  getUserNameRef,
  syncUserNameRef,
  getColorThemeRef,
  syncColorThemeRef,
  dispatch,
  saveState,
}: ResolveInitialLoadParams): Promise<void> {
  if (loadResult.status === "loaded") {
    const cloudState = loadResult.data;
    const localLastEditedAt = PersistenceService.loadLastEditedAt();

    if (localLastEditedAt > cloudState.updatedAt) {
      // Local list data is newer — push it to Firestore so cloud catches up.
      // Color theme is a shared preference, so we always defer to the cloud
      // value even when local list data wins. Apply it to the DOM and use it
      // in the save payload so the cloud is not overwritten with a stale theme.
      if (cloudState.colorTheme)
        syncColorThemeRef.current(cloudState.colorTheme);
      try {
        const s = stateRef.current;
        await saveState(
          syncCode,
          s.categories,
          s.selectedCategoryID,
          s.groups,
          getUserNameRef.current(),
          // Use cloud theme directly — syncColorThemeRef set React state but the
          // colorThemeRef won't update until the next render (async), so we read
          // cloudState.colorTheme here rather than getColorThemeRef.current().
          cloudState.colorTheme ?? getColorThemeRef.current(),
        );
      } catch (e: unknown) {
        console.error("Failed to push local-wins state to cloud:", e);
      }
    } else {
      // Cloud is newer — accept the remote state.
      if (cloudState.userName) syncUserNameRef.current(cloudState.userName);
      if (cloudState.colorTheme)
        syncColorThemeRef.current(cloudState.colorTheme);
      isLoadingFromSyncRef.current = true;
      dispatch({
        type: "SYNC_LOAD",
        categories: cloudState.categories,
        selectedCategoryID: cloudState.selectedCategoryID,
        groups: cloudState.groups,
      });
    }
  } else if (loadResult.status === "not-found") {
    // Document does not exist — write local state to initialise cloud.
    // Skipped on "timeout" to avoid overwriting cloud with stale local data.
    try {
      const s = stateRef.current;
      await saveState(
        syncCode,
        s.categories,
        s.selectedCategoryID,
        s.groups,
        getUserNameRef.current(),
        getColorThemeRef.current(),
      );
    } catch (e: unknown) {
      console.error("Failed to write initial sync state:", e);
    }
  }
  // status === "timeout": cloud state unknown — subscriber will deliver state
  // once connectivity resumes. No action taken here.
}
