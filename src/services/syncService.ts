// src/services/syncService.ts
import {
  signInAnonymously,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseInstances } from "./firebaseConfig";
import type { Category, CategoryGroup } from "@/models/types";

// MARK: - Types

interface SyncPayload {
  lists: Category[];
  selectedCategoryID: string | null;
  groups?: CategoryGroup[]; // optional for backwards compatibility with older clients
  updatedAt: number; // Unix ms — used to detect stale writes
}

// MARK: - Auth

/**
 * Signs in anonymously if no user is currently authenticated.
 * Returns a promise that resolves to the authenticated user.
 */
export function ensureAnonymousAuth(): Promise<User> {
  const { auth } = getFirebaseInstances();

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        signInAnonymously(auth)
          .then((credential) => resolve(credential.user))
          .catch(reject);
      }
    });
  });
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
): Promise<void> {
  const payload: SyncPayload = {
    lists: categories,
    selectedCategoryID,
    groups,
    updatedAt: Date.now(),
  };
  await setDoc(syncDocRef(syncCode), payload);
}

/**
 * Reads the list state once from Firestore.
 * Returns null if the document doesn't exist or times out.
 */
export async function loadState(syncCode: string): Promise<{
  categories: Category[];
  selectedCategoryID: string | null;
  groups: CategoryGroup[];
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
  ) => void,
): Unsubscribe {
  return onSnapshot(
    syncDocRef(syncCode),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as SyncPayload;
      callback(data.lists, data.selectedCategoryID, data.groups ?? []);
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
