// src/services/syncService.ts
// Firestore read/write/subscribe functions for cloud list sync.
// NOTE: Exceeds the 150-line service ceiling because all five API functions
// (saveState, registerDevice, loadState, subscribeToState, deleteSyncData) share the
// same SyncPayloadWrite/SyncPayloadRead types and toUnixMs helper. Extracting any of
// these would require moving those private Firestore types out of scope, breaking cohesion.
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  arrayUnion,
  serverTimestamp,
  type Unsubscribe,
  type FieldValue,
  type Timestamp,
} from "firebase/firestore";
import { getFirebaseInstances } from "./firebaseConfig";
import type {
  Category,
  CategoryGroup,
  ColorTheme,
  LoadedSyncState,
  LoadStateResult,
} from "@/models/types";

export type { LoadedSyncState, LoadStateResult };
export { ensureAnonymousAuth } from "@/services/authService";

// MARK: - Types

/**
 * Shape used when writing to Firestore. `updatedAt` is a server-generated
 * FieldValue so the timestamp is authoritative and immune to client clock skew.
 */
interface SyncPayloadWrite {
  lists: Category[];
  selectedCategoryID: string | null;
  groups?: CategoryGroup[];
  userName?: string;
  colorTheme?: ColorTheme;
  updatedAt: FieldValue;
  deviceIDs?: string[];
}

/**
 * Shape returned when reading from Firestore. `updatedAt` has been resolved
 * by the server to a Timestamp (or a number for legacy documents).
 */
interface SyncPayloadRead {
  lists: Category[];
  selectedCategoryID: string | null;
  groups?: CategoryGroup[];
  userName?: string;
  colorTheme?: ColorTheme;
  updatedAt: Timestamp | number;
  deviceIDs?: string[];
}

/** Converts a Firestore Timestamp or legacy number to Unix ms. */
function toUnixMs(value: Timestamp | number | undefined): number {
  if (value === undefined) return 0;
  if (typeof value === "number") return value;
  return value.toMillis();
}

// MARK: - Firestore Helpers

function syncDocRef(syncCode: string) {
  const { db } = getFirebaseInstances();
  return doc(db, "syncStates", syncCode);
}

// MARK: - API

/**
 * Writes the full list state to Firestore under the given sync code.
 * Includes a timestamp to detect concurrent writes.
 */
export async function saveState(
  syncCode: string,
  categories: Category[],
  selectedCategoryID: string | null,
  groups: CategoryGroup[],
  userName: string,
  colorTheme: ColorTheme,
): Promise<void> {
  const payload: SyncPayloadWrite = {
    lists: categories,
    selectedCategoryID,
    groups,
    userName,
    colorTheme,
    // serverTimestamp() is resolved by Firestore on the server, making it
    // immune to client clock skew across devices.
    updatedAt: serverTimestamp(),
  };
  await setDoc(syncDocRef(syncCode), payload, { merge: true });
}

/**
 * Registers the current device's anonymous UID into the `deviceIDs` array
 * on the sync document using arrayUnion (merge write — never overwrites other entries).
 */
export async function registerDevice(
  syncCode: string,
  uid: string,
): Promise<void> {
  await setDoc(
    syncDocRef(syncCode),
    { deviceIDs: arrayUnion(uid) },
    { merge: true },
  );
}

/**
 * Reads the list state once from Firestore.
 * Returns a discriminated result:
 * - `{ status: "loaded", data }` — document exists and was fetched successfully.
 * - `{ status: "not-found" }` — document does not exist (safe to write initial state).
 * - `{ status: "timeout" }` — fetch exceeded 5 seconds; state unknown, do NOT overwrite cloud.
 */
export async function loadState(syncCode: string): Promise<LoadStateResult> {
  const timeoutPromise = new Promise<{ status: "timeout" }>((resolve) =>
    setTimeout(() => resolve({ status: "timeout" }), 5000),
  );

  const fetchPromise = getDoc(syncDocRef(syncCode)).then((snap) => {
    if (!snap.exists()) return { status: "not-found" as const };
    const data = snap.data() as SyncPayloadRead;
    return {
      status: "loaded" as const,
      data: {
        categories: data.lists,
        selectedCategoryID: data.selectedCategoryID,
        groups: data.groups ?? [],
        userName: data.userName,
        colorTheme: data.colorTheme,
        deviceIDs: data.deviceIDs ?? [],
        updatedAt: toUnixMs(data.updatedAt),
      },
    };
  });

  return Promise.race([fetchPromise, timeoutPromise]);
}

/**
 * Subscribes to real-time updates for the given sync code.
 * Calls the callback with new state whenever the document changes.
 */
export function subscribeToState(
  syncCode: string,
  callback: (
    categories: Category[],
    selectedCategoryID: string | null,
    groups: CategoryGroup[],
    updatedAt: number,
    userName: string | undefined,
    deviceCount: number,
    colorTheme: ColorTheme | undefined,
  ) => void,
): Unsubscribe {
  return onSnapshot(
    syncDocRef(syncCode),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as SyncPayloadRead;
      callback(
        data.lists,
        data.selectedCategoryID,
        data.groups ?? [],
        toUnixMs(data.updatedAt),
        data.userName,
        (data.deviceIDs ?? []).length,
        data.colorTheme,
      );
    },
    (error) => {
      console.error(
        "[SyncService] onSnapshot error — listener stopped:",
        error,
      );
    },
  );
}

/**
 * Permanently deletes the sync document for the given sync code from Firestore.
 * Called when the user explicitly chooses to remove their cloud backup on disable.
 */
export async function deleteSyncData(syncCode: string): Promise<void> {
  const { db } = getFirebaseInstances();
  await deleteDoc(doc(db, "syncStates", syncCode));
}
