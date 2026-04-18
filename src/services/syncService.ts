// src/services/syncService.ts
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  arrayUnion,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseInstances } from "./firebaseConfig";
import type { Category, CategoryGroup } from "@/models/types";

export { ensureAnonymousAuth } from "@/services/authService";

// MARK: - Types

interface SyncPayload {
  lists: Category[];
  selectedCategoryID: string | null;
  groups?: CategoryGroup[]; // optional for backwards compatibility with older clients
  userName?: string; // optional for backwards compatibility with older documents
  updatedAt: number; // Unix ms — used to detect stale writes
  deviceIDs?: string[]; // anonymous Firebase UIDs of all registered devices
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
): Promise<void> {
  const payload: SyncPayload = {
    lists: categories,
    selectedCategoryID,
    groups,
    userName,
    updatedAt: Date.now(),
  };
  await setDoc(syncDocRef(syncCode), payload);
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
 * Returns null if the document doesn't exist or times out.
 */
export async function loadState(syncCode: string): Promise<{
  categories: Category[];
  selectedCategoryID: string | null;
  groups: CategoryGroup[];
  userName?: string;
  deviceIDs: string[];
} | null> {
  const timeoutPromise = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), 5000),
  );

  const fetchPromise = getDoc(syncDocRef(syncCode)).then((snap) => {
    if (!snap.exists()) return null;
    const data = snap.data() as SyncPayload;
    return {
      categories: data.lists,
      selectedCategoryID: data.selectedCategoryID,
      groups: data.groups ?? [], // critical fallback here, not in the caller
      userName: data.userName,
      deviceIDs: data.deviceIDs ?? [],
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
    userName: string | undefined,
    deviceCount: number,
  ) => void,
): Unsubscribe {
  return onSnapshot(
    syncDocRef(syncCode),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as SyncPayload;
      callback(
        data.lists,
        data.selectedCategoryID,
        data.groups ?? [],
        data.userName,
        (data.deviceIDs ?? []).length,
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
