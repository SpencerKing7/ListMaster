<!-- Status: In Progress | Last updated: April 2026 -->
# Firebase Firestore Sync — Detailed Implementation Plan

**Branch:** `db-storage-research`  
**Date:** 2026-04-02  
**Parent research:** `docs/plans/db-sync-options.md`

---

## Goal

Add opt-in cloud sync to ListMaster so that:

1. Data survives browser-cache clears (PWA reinstalls, clearing site data).
2. Users can share their list across multiple devices without creating an account or logging in with Google.
3. The app continues to work fully offline — cloud sync is purely additive.

---

## Auth Design — The "Sync Code" Model

### The Problem With Traditional Auth

The original research plan proposed Firebase Anonymous Auth → Google Sign-In. That works, but it introduces friction: the user sees a Google OAuth popup, has to have a Google account, and must trust this app with it. For a personal grocery list app, that feels heavy.

### The Proposed Model: Sync Code as Identity

Instead, we generate a random **Sync Code** locally and use it as the user's identity in Firestore. No traditional login flow. No OAuth. No passwords.

**How it works:**

1. On first launch (during onboarding or first open), the app generates a cryptographically random 20-character alphanumeric code, formatted for readability as four groups of five characters: `KXMW4-TQP9R-NZVLJ-E3HMF`.
2. This code is stored in `localStorage` (via `SettingsService`) and never leaves the device unless the user deliberately copies and enters it elsewhere.
3. The code becomes the Firestore document key: `syncStates/{syncCode}`.
4. To sync a second device, the user opens Settings → "Sync & Backup" → taps "Enter Sync Code" → pastes the code → the app adopts that code and loads the cloud data.
5. To share data with another person (e.g. a household partner), they just share the code — like a shared password for the list.

### Security Model

This is a **shared-secret** model, not a per-user identity model. Anyone who has the sync code can read and overwrite the data. This is appropriate because:

- It's a personal grocery list, not sensitive data.
- The user explicitly controls who has the code — they have to physically share it.
- Codes are 20 random alphanumeric characters (~104 bits of entropy), making brute-force infeasible.
- Firestore security rules enforce that writes must include the correct code in the document path — there's no way to enumerate or guess other users' data.

### Firebase Auth Requirement

Firestore requires a Firebase Auth token for security rules. We satisfy this with **Firebase Anonymous Auth**, but as a silent background step — the user never sees it and it has nothing to do with their identity. Each device gets its own anonymous `uid` (just for Firestore to accept the connection), but all devices share the same `syncCode` as the data key.

Security rules allow any authenticated user (any valid anonymous uid) to access `syncStates/{syncCode}` — what gates access is _knowing the sync code_, not which anonymous uid you have.

```
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /syncStates/{syncCode} {
      // Any authenticated user (incl. anonymous) can read/write a document
      // if they know its path (i.e. they have the sync code).
      allow read, write: if request.auth != null;
    }
  }
}
```

> **Why not open rules?** Requiring `request.auth != null` still prevents unauthenticated scraping or bots from hammering the database. It just doesn't tie the document to a specific uid.

### Sync Code Generation

```ts
// 20 random chars from a safe alphabet, formatted as XXXXX-XXXXX-XXXXX-XXXXX
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I confusion
function generateSyncCode(): string {
  const arr = new Uint8Array(20);
  crypto.getRandomValues(arr);
  const chars = Array.from(arr, (b) => ALPHABET[b % ALPHABET.length]);
  return `${chars.slice(0, 5).join("")}-${chars.slice(5, 10).join("")}-${chars.slice(10, 15).join("")}-${chars.slice(15, 20).join("")}`;
}
```

This produces codes like `KXMW4-TQP9R-NZVLJ-E3HMF`. Each group is easy to read aloud or type.

---

## Architecture Overview

```
SettingsService (localStorage)
  └── syncCode: string         ← generated once, persisted forever
  └── isSyncEnabled: boolean   ← user has opted into sync

SyncService (new)
  ├── signInAnonymously()      ← silent, called once on app init
  ├── saveState(syncCode, state)
  ├── loadState(syncCode)
  └── subscribeToState(syncCode, callback) → unsubscribe fn

useSyncStore (new React Context)
  ├── syncCode: string
  ├── isSyncEnabled: boolean
  ├── syncStatus: "idle" | "syncing" | "synced" | "error"
  ├── enableSync()             ← generates code if none exists, enables sync
  ├── disableSync()
  └── adoptSyncCode(code)      ← enter a code from another device

useCategoriesStore (modified)
  └── after every PersistenceService.save() call:
      └── if (isSyncEnabled) debouncedSyncSave(syncCode, state)
  └── on init: if (isSyncEnabled) subscribe to Firestore for real-time updates
```

---

## File Inventory

| File                              | Action | Description                                           |
| --------------------------------- | ------ | ----------------------------------------------------- |
| `.env`                            | Create | Firebase config vars (`VITE_FIREBASE_*`)              |
| `.env.example`                    | Create | Template for contributors                             |
| `.gitignore`                      | Modify | Ensure `.env` is ignored                              |
| `src/services/firebaseConfig.ts`  | Create | Firebase app + Auth + Firestore instances             |
| `src/services/syncService.ts`     | Create | Firestore read/write/subscribe + anonymous auth       |
| `src/store/useSyncStore.ts`       | Create | React Context for sync state and sync code management |
| `src/store/useCategoriesStore.ts` | Modify | Wire debounced cloud save + `SYNC_LOAD` action        |
| `src/services/settingsService.ts` | Modify | Add `syncCode` and `isSyncEnabled` getters/setters    |
| `src/main.tsx`                    | Modify | Add `<SyncProvider>` inside `<SettingsProvider>`      |
| `src/screens/SettingsSheet.tsx`   | Modify | Add "Sync & Backup" card                              |
| `firestore.rules`                 | Create | Firestore security rules                              |
| `package.json`                    | Modify | Add `firebase` dependency                             |

---

## Phase 0 — Firebase Project Setup (Manual Steps)

These are one-time manual steps in the Firebase Console — not code.

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Create a project** → name it `listmaster-pwa`. Disable Google Analytics (not needed).
2. In the project, click **Build → Cloud Firestore** → **Create database** → choose **Native mode** → pick a region close to your users (e.g. `us-central`).
3. Click **Build → Authentication** → **Get started** → **Sign-in method** → enable **Anonymous**.
4. Click the gear ⚙️ → **Project settings** → under "Your apps" → **Add app** → choose **Web** → register it → copy the `firebaseConfig` object.
5. Set the Firestore rules to the content in Phase 4 of this plan.

---

## Phase 1 — Install Firebase SDK

```bash
npm install firebase
```

The modular Firebase v9+ SDK is tree-shakable. By importing only `firestore` and `auth`, the bundle addition is approximately **35–45 KB gzipped** — acceptable.

---

## Phase 2 — Environment Variables & Firebase Config

### `.gitignore` — verify `.env` is ignored

Check whether `.env` is already in `.gitignore`. If not, add it. `.env.example` must **not** be ignored:

```bash
grep -n "^\.env$" .gitignore || echo "ADD .env TO .gitignore"
```

The correct entries are:

```
.env
# .env.example is intentionally NOT ignored — it is a safe template
```

### GitHub Repository Secrets (deployment blocker — GAP 6)

`VITE_FIREBASE_*` vars are injected at **build time** by Vite. For GitHub Pages deployment via `npm run deploy` (which runs `vite build` locally), the `.env` file on your machine provides the vars and no CI config is needed.

However, if you ever add a GitHub Actions CI/CD pipeline to build and deploy automatically (e.g. `.github/workflows/deploy.yml`), the `.env` file is gitignored and the vars will be `undefined` at build time — causing `initializeApp()` to receive empty strings and Firebase to silently fail for all users after deployment.

**If a CI workflow exists or is added, follow these steps:**

1. Go to the GitHub repository → **Settings → Secrets and variables → Actions → New repository secret**.
2. Add one secret per `VITE_FIREBASE_*` variable (copy values from your local `.env`):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. In the workflow YAML, inject them into the build step's `env`:

```yaml
- name: Build
  run: npm run build
  env:
    VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
    VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
    VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
    VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
    VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
    VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
```

> **Note:** Firebase web API keys are not sensitive secrets — they are safe to include in client-side bundles. They identify the Firebase project but do not grant admin access. Security is enforced by Firestore Rules and Anonymous Auth, not by keeping the API key secret. However, adding them to GitHub Secrets keeps them out of the git history and follows best practice.

### `.env` (gitignored, create locally)

VITE_FIREBASE_AUTH_DOMAIN=listmaster-pwa.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=listmaster-pwa
VITE_FIREBASE_STORAGE_BUCKET=listmaster-pwa.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

```

### `.env.example`

```

VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

````

### `src/services/firebaseConfig.ts` (new file)

> **GAP 8 — Lazy initialisation:** The previous version of this module called `initializeApp()`, `getFirestore()`, and `getAuth()` at module-import time, meaning the Firebase SDK would load and initialise for **every** user as soon as any code path imported this file — even users who have never enabled sync. Since `useSyncStore.ts` statically imports `ensureAnonymousAuth` from `syncService.ts`, which statically imports `firebaseConfig.ts`, the earlier design defeated the dynamic-import strategy in Phase 6b.
>
> The fix: `firebaseConfig.ts` uses a **lazy singleton** pattern. The Firebase app, Firestore, and Auth instances are only created on the **first call** to `getFirebaseInstances()`. `syncService.ts` calls this getter; `useSyncStore.ts` uses dynamic `import()` for every Firebase code path (see Phase 5 updates below).

```ts
// src/services/firebaseConfig.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

interface FirebaseInstances {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
}

let instances: FirebaseInstances | null = null;

/**
 * Returns the singleton Firebase app, Firestore, and Auth instances.
 * Initialises Firebase on the first call; subsequent calls return the
 * cached instances. Safe to call in React StrictMode (duplicate-app guard
 * via getApps().length check — GAP 12).
 */
export function getFirebaseInstances(): FirebaseInstances {
  if (instances) return instances;
  // Duplicate-app guard: handles React StrictMode double-invocation in dev
  // and any hot-module-reload scenario where initializeApp may be called again.
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  instances = {
    app,
    db: getFirestore(app),
    auth: getAuth(app),
  };
  return instances;
}
````

> **Why a getter instead of top-level exports?** Top-level `export const db = getFirestore(...)` executes at import time regardless of whether the module is statically or dynamically imported. Wrapping in a function means the work only happens when the function is first called — which only happens when sync is enabled.

---

## Phase 3 — Sync Code Generation (SettingsService)

Add two new keys to `SettingsService`: `syncCode` and `isSyncEnabled`.

### New `localStorage` keys

| Key               | Type                  | Default   | Description                                        |
| ----------------- | --------------------- | --------- | -------------------------------------------------- |
| `"syncCode"`      | `string`              | `""`      | The user's sync code. Empty until sync is enabled. |
| `"isSyncEnabled"` | `"true"` \| `"false"` | `"false"` | Whether cloud sync is active.                      |

### Changes to `src/services/settingsService.ts`

Add the following to the existing `SettingsService` object:

```ts
// Sync Code — generated once, persisted forever
getSyncCode(): string {
  return localStorage.getItem("syncCode") ?? "";
},
setSyncCode(code: string): void {
  localStorage.setItem("syncCode", code);
},
clearSyncCode(): void {
  localStorage.removeItem("syncCode");
},

// Sync Enabled flag
getIsSyncEnabled(): boolean {
  return localStorage.getItem("isSyncEnabled") === "true";
},
setIsSyncEnabled(value: boolean): void {
  localStorage.setItem("isSyncEnabled", String(value));
},
clearIsSyncEnabled(): void {
  localStorage.removeItem("isSyncEnabled");
},
```

Also update `clearAll()` to call `clearSyncCode()` and `clearIsSyncEnabled()` so "Reset to New User" wipes sync state.

### Sync code generator utility (add to `src/lib/utils.ts`)

```ts
/**
 * Generates a cryptographically random 20-character sync code formatted
 * as four groups of five characters: e.g. "KXMW4-TQP9R-NZVLJ-E3HMF".
 * Uses an unambiguous alphabet (no 0/O, 1/I confusion).
 */
export function generateSyncCode(): string {
  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr = new Uint8Array(20);
  crypto.getRandomValues(arr);
  const chars = Array.from(arr, (b) => ALPHABET[b % ALPHABET.length]);
  return [
    chars.slice(0, 5).join(""),
    chars.slice(5, 10).join(""),
    chars.slice(10, 15).join(""),
    chars.slice(15, 20).join(""),
  ].join("-");
}
```

---

## Phase 4 — Sync Service

### `src/services/syncService.ts` (new file)

This is the only file that imports from `firebase/firestore` and `firebase/auth`. No React, no hooks — pure functions.

```ts
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
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseInstances } from "./firebaseConfig";
import type { Category } from "@/models/types";

// MARK: - Types

interface SyncPayload {
  lists: Category[];
  selectedListID: string | null;
  updatedAt: number; // Unix ms — used to detect stale writes
}

// MARK: - Auth

/**
 * Signs in anonymously if no user is currently authenticated.
 * Returns a Promise that resolves when auth is ready.
 * Safe to call multiple times — Firebase deduplicates.
 *
 * Token expiry note (GAP 7): Firebase Anonymous Auth tokens are refreshed
 * automatically by the SDK while the app is active and online. If the SDK
 * has not been able to refresh (e.g. long period offline), calling
 * `signInAnonymously()` may create a **new** anonymous UID. Because Firestore
 * rules only check `request.auth != null` (not a specific UID), this is
 * functionally transparent — the same sync code still grants access. However,
 * if rules are ever tightened to include UID checks, this would break.
 * Known v1 limitation; document in the Decisions & Answers section.
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
          .then((cred) => resolve(cred.user))
          .catch(reject);
      }
    });
  });
}

// MARK: - Firestore Helpers

function syncDocRef(syncCode: string) {
  const { db } = getFirebaseInstances();
  // Document path: syncStates/{syncCode}
  return doc(db, "syncStates", syncCode);
}

// MARK: - API

/**
 * Writes the full list state to Firestore under the given sync code.
 * Overwrites — last write wins.
 */
export async function saveState(
  syncCode: string,
  categories: Category[],
  selectedCategoryID: string,
): Promise<void> {
  const payload: SyncPayload = {
    lists: categories,
    selectedListID: selectedCategoryID || null,
    updatedAt: Date.now(),
  };
  await setDoc(syncDocRef(syncCode), payload);
}

/**
 * Reads the list state once from Firestore.
 * Returns null if the document does not exist yet.
 *
 * IMPORTANT — offline behaviour (GAP 4): `getDoc` will never resolve or
 * reject when the device is offline and there is no cached entry for the
 * document. To avoid hanging the app indefinitely, this function races the
 * Firestore read against an 8-second timeout that resolves with null.
 * `onSnapshot` (used in Phase 6e for real-time updates) handles offline
 * gracefully on its own — this timeout only guards the one-time initial pull.
 */
export async function loadState(syncCode: string): Promise<{
  categories: Category[];
  selectedCategoryID: string | null;
} | null> {
  const timeoutPromise = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), 8000),
  );
  const fetchPromise = getDoc(syncDocRef(syncCode)).then((snap) => {
    if (!snap.exists()) return null;
    const data = snap.data() as SyncPayload;
    return {
      categories: data.lists ?? [],
      selectedCategoryID: data.selectedListID ?? null,
    };
  });
  return Promise.race([fetchPromise, timeoutPromise]);
}

/**
 * Subscribes to real-time updates for the given sync code.
 * Calls `callback` whenever the cloud document changes.
 * Returns an unsubscribe function — call it on cleanup.
 */
export function subscribeToState(
  syncCode: string,
  callback: (state: {
    categories: Category[];
    selectedCategoryID: string | null;
  }) => void,
): Unsubscribe {
  return onSnapshot(syncDocRef(syncCode), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data() as SyncPayload;
    callback({
      categories: data.lists ?? [],
      selectedCategoryID: data.selectedListID ?? null,
    });
  });
}
```

---

## Phase 5 — Sync Store

### `src/store/useSyncStore.ts` (new file)

This store owns all sync-related UI state. It is separate from `useCategoriesStore` to keep concerns clean — the categories store only needs to call `SyncService.saveState()` and receive `SYNC_LOAD` dispatches. The sync store handles the code management and status indicator.

```ts
// src/store/useSyncStore.ts
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { SettingsService } from "@/services/settingsService";
import { generateSyncCode } from "@/lib/utils";
// NOTE: syncService is NOT statically imported here (GAP 8). All calls to
// ensureAnonymousAuth() use dynamic import() so the Firebase SDK only loads
// after the user has enabled sync. This preserves zero bundle cost for users
// who never use sync.

// MARK: - Types

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface SyncContextValue {
  /** The current sync code (empty string if sync has never been enabled). */
  syncCode: string;
  /** Whether cloud sync is currently active. */
  isSyncEnabled: boolean;
  /** Live status for UI feedback. */
  syncStatus: SyncStatus;
  /** Enables sync: generates a code (if none exists), signs in anonymously, persists. */
  enableSync: () => Promise<void>;
  /** Disables cloud sync. Local data is preserved. */
  disableSync: () => void;
  /**
   * Adopts a sync code entered by the user from another device.
   * Enables sync with that code, which will trigger a SYNC_LOAD on the
   * categories store via the subscription set up in StoreProvider.
   * Throws `Error("INVALID_CODE_FORMAT")` if the code does not match the
   * expected pattern — callers should catch this and show a validation error.
   */
  adoptSyncCode: (code: string) => Promise<void>;
  /** Called by the categories store after a successful cloud save. */
  notifySaveSuccess: () => void;
  /** Called by the categories store if a cloud save fails. */
  notifySaveError: () => void;
  /**
   * Clears all sync state from memory and localStorage.
   * Must be called by SettingsSheet's "Reset to New User" handler BEFORE
   * calling settings.resetToNewUser() (GAP 3).
   */
  resetSync: () => void;
}

// MARK: - Context

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

// MARK: - Provider

export function SyncProvider({ children }: { children: ReactNode }) {
  const [syncCode, setSyncCodeState] = useState<string>(() =>
    SettingsService.getSyncCode(),
  );
  const [isSyncEnabled, setIsSyncEnabledState] = useState<boolean>(() =>
    SettingsService.getIsSyncEnabled(),
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  // GAP 10 (removed): syncingTimeoutRef was declared but never used.
  // Status is driven entirely by notifySaveSuccess/notifySaveError callbacks.

  // On mount, if sync is already enabled, ensure anonymous auth is live.
  // Uses dynamic import so Firebase SDK is not loaded for users who have
  // never enabled sync (GAP 8).
  useEffect(() => {
    if (isSyncEnabled) {
      import("@/services/syncService")
        .then(({ ensureAnonymousAuth }) => ensureAnonymousAuth())
        .catch(() => setSyncStatus("error"));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function enableSync(): Promise<void> {
    setSyncStatus("syncing");
    try {
      const { ensureAnonymousAuth } = await import("@/services/syncService");
      await ensureAnonymousAuth();
      const code = syncCode || generateSyncCode();
      SettingsService.setSyncCode(code);
      SettingsService.setIsSyncEnabled(true);
      setSyncCodeState(code);
      setIsSyncEnabledState(true);
      setSyncStatus("synced");
    } catch {
      setSyncStatus("error");
    }
  }

  function disableSync(): void {
    SettingsService.setIsSyncEnabled(false);
    setIsSyncEnabledState(false);
    setSyncStatus("idle");
  }

  async function adoptSyncCode(code: string): Promise<void> {
    const normalized = code.trim().toUpperCase().replace(/\s/g, "");
    // Validate format before touching Firebase or persisting anything.
    // Accept codes with or without dashes (e.g. "KXMW4TQP9RNZVLJE3HMF" or
    // "KXMW4-TQP9R-NZVLJ-E3HMF"). Alphabet: A-Z (no I, O) + 2-9.
    const codeNoDashes = normalized.replace(/-/g, "");
    const isValidFormat = /^[A-HJ-NP-Z2-9]{20}$/.test(codeNoDashes);
    if (!isValidFormat) {
      // Reject early — do not authenticate or persist.
      setSyncStatus("error");
      // Propagate a structured error so the UI can show a specific message.
      throw new Error("INVALID_CODE_FORMAT");
    }
    // Re-format with dashes for canonical storage.
    const canonical = [
      codeNoDashes.slice(0, 5),
      codeNoDashes.slice(5, 10),
      codeNoDashes.slice(10, 15),
      codeNoDashes.slice(15, 20),
    ].join("-");
    setSyncStatus("syncing");
    try {
      const { ensureAnonymousAuth } = await import("@/services/syncService");
      await ensureAnonymousAuth();
      SettingsService.setSyncCode(canonical);
      SettingsService.setIsSyncEnabled(true);
      setSyncCodeState(canonical);
      setIsSyncEnabledState(true);
      // The categories store's subscription will pick up the new code
      // and fire a SYNC_LOAD automatically (see Phase 6e).
      setSyncStatus("synced");
    } catch (err) {
      // Re-throw INVALID_CODE_FORMAT so the UI can show a specific message;
      // set status to error for all other failures.
      if (err instanceof Error && err.message === "INVALID_CODE_FORMAT") throw;
      setSyncStatus("error");
    }
  }

  function notifySaveSuccess(): void {
    setSyncStatus("synced");
  }

  function notifySaveError(): void {
    setSyncStatus("error");
  }

  function resetSync(): void {
    SettingsService.clearSyncCode();
    SettingsService.clearIsSyncEnabled();
    setSyncCodeState("");
    setIsSyncEnabledState(false);
    setSyncStatus("idle");
  }

  const value: SyncContextValue = {
    syncCode,
    isSyncEnabled,
    syncStatus,
    enableSync,
    disableSync,
    adoptSyncCode,
    notifySaveSuccess,
    notifySaveError,
    resetSync,
  };

  // Use standard JSX — do not use React.createElement (violates project
  // conventions; React import is not needed with the JSX transform).
  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncStore(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSyncStore must be used inside SyncProvider");
  return ctx;
}
```

---

## Phase 6 — Wire Sync Into the Categories Store

### Changes to `src/store/useCategoriesStore.ts`

This is the most surgical change. The goal is to add cloud sync without breaking the existing synchronous `localStorage` flow.

#### 6a — Add `SYNC_LOAD` action

Add the following to the `StoreAction` union type:

```ts
| { type: "SYNC_LOAD"; categories: Category[]; selectedCategoryID: string | null }
```

Add the case to the reducer (before the `default` case). It must **not** call `PersistenceService.save()` — incoming cloud data should not trigger an echo write back to the cloud:

```ts
case "SYNC_LOAD": {
  // Incoming data from Firestore — replace state and persist locally,
  // but do NOT trigger a cloud write (avoid echo loops).
  const incoming: StoreState = {
    categories: action.categories,
    selectedCategoryID:
      action.selectedCategoryID ?? action.categories[0]?.id ?? "",
  };
  PersistenceService.save(incoming.categories, incoming.selectedCategoryID);
  return incoming;
}
```

> **Echo loop prevention (GAP 1):** `SYNC_LOAD` causes `state` to change, which would normally trigger the cloud-save `useEffect` in Phase 6d — writing the data back to Firestore and creating an infinite loop. This is prevented by an `isSyncLoadRef` ref (see Phase 6c/6d) that is set to `true` immediately before dispatching `SYNC_LOAD` and checked (then cleared) at the top of the `useEffect`. The `prevStateRef` identity check alone is **not** sufficient because `SYNC_LOAD` always produces a new state object.

#### 6b — Debounced cloud save helper (module-level, outside the component)

Add this above the reducer, inside `useCategoriesStore.ts`:

```ts
// MARK: - Debounced Cloud Save

let cloudSaveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounces cloud saves by 1.5 s so that rapid mutations (e.g. toggling
 * several items quickly) result in only one Firestore write.
 */
function scheduledCloudSave(
  syncCode: string,
  categories: Category[],
  selectedCategoryID: string,
  onSuccess: () => void,
  onError: () => void,
): void {
  if (cloudSaveTimer) clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(() => {
    import("@/services/syncService")
      .then(({ saveState }) =>
        saveState(syncCode, categories, selectedCategoryID),
      )
      .then(onSuccess)
      .catch(onError);
  }, 1500);
}
```

> Using a dynamic `import()` for `syncService` keeps the Firebase SDK out of the initial JS bundle — it only loads after the user has enabled sync.

#### 6c — Pass sync dependencies into `StoreProvider`

> **Import update required (NEW — gap found in audit):** `StoreProvider` now uses `useRef` and `useEffect`, which are **not** currently imported in `useCategoriesStore.ts`. Before adding the code below, update the React import at the top of the file from:
>
> ```ts
> import {
>   createContext,
>   useContext,
>   useReducer,
>   useCallback,
>   type ReactNode,
> } from "react";
> ```
>
> to:
>
> ```ts
> import {
>   createContext,
>   useContext,
>   useReducer,
>   useCallback,
>   useEffect,
>   useRef,
>   type ReactNode,
> } from "react";
> ```
>
> **`React` default import:** `useCategoriesStore.ts` currently has `import React from "react"` (line 17) because `StoreProvider` renders via `React.createElement`. This default import must be **kept** — the new `useEffect` and `useRef` calls are named imports added alongside it. Do not remove the `import React from "react"` line.

`StoreProvider` needs to know `syncCode`, `isSyncEnabled`, and the `notify*` callbacks from `useSyncStore`. Because `SyncProvider` wraps `StoreProvider` in `main.tsx`, `StoreProvider` can consume `useSyncStore` internally.

Also declare `isSyncLoadRef` here — this ref is the echo-loop guard. It must be set to `true` immediately before dispatching `SYNC_LOAD` (see Phase 6e) so that the cloud-save `useEffect` can detect and skip saves that originate from incoming cloud data:

```ts
// Inside StoreProvider function body, before useReducer:
const sync = useSyncStore();

// Echo-loop guard: set to true before dispatching SYNC_LOAD, checked and
// cleared in the cloud-save useEffect so incoming Firestore data is never
// written back to Firestore. prevStateRef alone is not sufficient because
// SYNC_LOAD always produces a new state object reference.
const isSyncLoadRef = useRef(false);
```

#### 6d — Cloud save side-effect after mutation

Add a cloud-save `useEffect` in the `StoreProvider`. The `PersistenceService.save()` calls inside the reducer remain untouched. Since the reducer cannot access React hooks, the cloud save is triggered here:

```ts
// Inside StoreProvider, after useReducer:
const prevStateRef = useRef(state);
useEffect(() => {
  if (prevStateRef.current === state) return; // no change
  prevStateRef.current = state;
  // Skip cloud write if this state change came from Firestore (SYNC_LOAD).
  // Resetting the flag here is safe because this effect runs after the render
  // in which isSyncLoadRef was set.
  if (isSyncLoadRef.current) {
    isSyncLoadRef.current = false;
    return;
  }
  if (!sync.isSyncEnabled || !sync.syncCode) return;
  scheduledCloudSave(
    sync.syncCode,
    state.categories,
    state.selectedCategoryID,
    sync.notifySaveSuccess,
    sync.notifySaveError,
  );
}, [state, sync.isSyncEnabled, sync.syncCode]); // eslint-disable-line
```

#### 6e — Real-time subscription on init and when sync code changes

```ts
// Inside StoreProvider:
useEffect(() => {
  if (!sync.isSyncEnabled || !sync.syncCode) return;

  let unsubscribe: (() => void) | null = null;

  // Load once immediately when sync is first enabled or code changes,
  // then subscribe to real-time updates.
  import("@/services/syncService").then(({ loadState, subscribeToState }) => {
    // Initial pull (handles the "adopting a new code" case).
    // loadState has a built-in 8s timeout (see Phase 4) to avoid hanging
    // indefinitely when the device is offline with no cached document.
    loadState(sync.syncCode).then((loaded) => {
      if (loaded && loaded.categories.length > 0) {
        isSyncLoadRef.current = true; // prevent echo write-back
        dispatch({
          type: "SYNC_LOAD",
          categories: loaded.categories,
          selectedCategoryID: loaded.selectedCategoryID,
        });
      }
    });

    // Real-time subscription. Guard against empty category arrays so that
    // a remote reset/empty document does not silently wipe the user's list
    // on this device (GAP 9).
    unsubscribe = subscribeToState(sync.syncCode, (incoming) => {
      if (incoming.categories.length === 0) return;
      isSyncLoadRef.current = true; // prevent echo write-back
      dispatch({
        type: "SYNC_LOAD",
        categories: incoming.categories,
        selectedCategoryID: incoming.selectedCategoryID,
      });
    });
  });

  return () => {
    unsubscribe?.();
  };
}, [sync.isSyncEnabled, sync.syncCode]); // eslint-disable-line
```

> **`visibilitychange` / `RELOAD` interaction (GAP 2):** `App.tsx` dispatches `RELOAD` (re-reads `localStorage`) when the app is foregrounded. `RELOAD` reads the same localStorage that `SYNC_LOAD` writes to, so the state converges correctly: if `SYNC_LOAD` arrived first, `RELOAD` picks up the cloud data; if `RELOAD` fires first (stale data), the `onSnapshot` subscription will fire `SYNC_LOAD` moments later and correct it. There is no data-loss risk. One scenario that **is** a limitation: if the device was offline while backgrounded, Firestore's offline cache may serve the `onSnapshot` callback with a stale (cached) version of the document rather than the latest server data. This is an accepted known limitation for v1 — the user will see the correct state once connectivity is restored and Firestore reconnects.

---

## Phase 7 — Provider Wiring in `main.tsx`

`SyncProvider` must wrap `StoreProvider` because `StoreProvider` calls `useSyncStore()` internally.

```tsx
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SettingsProvider } from "./store/useSettingsStore";
import { SyncProvider } from "./store/useSyncStore";
import { StoreProvider } from "./store/useCategoriesStore";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SettingsProvider>
      <SyncProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </SyncProvider>
    </SettingsProvider>
  </StrictMode>,
);
```

---

## Phase 8 — Firestore Security Rules

Create `firestore.rules` in the project root:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /syncStates/{syncCode} {
      // Any Firebase-authenticated user (including anonymous) can read or
      // write a sync document. Access is gated by knowing the sync code
      // (i.e. knowing the document path), which is a shared secret with
      // ~104 bits of entropy. This is appropriate for a personal list app.
      allow read, write: if request.auth != null;
    }
  }
}
```

Deploy via Firebase CLI:

```bash
npx firebase deploy --only firestore:rules
```

---

## Phase 9 — Settings UI

Add a **"Sync & Backup"** card to `src/screens/SettingsSheet.tsx`.

### State 1 — Sync disabled (initial state for all users)

Both entry points are visible at the same time — there is no need to "enable" sync before entering an existing code.

```
┌─────────────────────────────────────────┐
│ SYNC & BACKUP                           │
│                                         │
│  Keep your list safe and up to date     │
│  across all your devices.               │
│                                         │
│  [ Enable Sync ]                        │
│  [ I Have a Sync Code ]                 │
└─────────────────────────────────────────┘
```

- **"Enable Sync"** — calls `sync.enableSync()`. Generates a new code, silently signs in anonymously, starts syncing. While `syncStatus === "syncing"` the button shows a spinner.
- **"I Have a Sync Code"** — opens the Enter Code dialog immediately (see below), _without_ needing to enable sync first. This is the primary path for a second device or after a cache clear. After the code is entered and confirmed, `sync.adoptSyncCode()` is called, which enables sync and pulls the cloud data in one step.

### State 2 — Sync enabled

```
┌─────────────────────────────────────────┐
│ SYNC & BACKUP                    ● Live │
│                                         │
│  Your Sync Code                         │
│  ┌─────────────────────────────────┐    │
│  │  KXMW4-TQP9R-NZVLJ-E3HMF  [⎘] │    │
│  └─────────────────────────────────┘    │
│  Keep this code safe. Enter it on       │
│  another device to sync your list.      │
│                                         │
│  [ Sync a Different Code ]              │
│  [ Disable Sync ]                       │
└─────────────────────────────────────────┘
```

- The sync code is displayed in a monospace pill with a **Copy** button (`navigator.clipboard.writeText`).
- The status dot in the header updates from `sync.syncStatus`:
  - `● Live` (green) — connected and up to date
  - `● Syncing` (yellow) — write in flight
  - `● Error` (red) — last write failed or no connectivity
- **"Sync a Different Code"** — opens the Enter Code dialog. Use this to switch to a different device's code (e.g. merging with a household partner's list). Shows the same warning about data replacement.
- **"Disable Sync"** — calls `sync.disableSync()`. Local data is preserved; the cloud document is left intact.

### Enter Code Dialog (shared by both paths above)

```
┌─────────────────────────────────────────┐
│ Sync With Another Device                │
│                                         │
│  Enter the Sync Code from the device    │
│  you want to sync with.                 │
│                                         │
│  [ KXMW4-TQP9R-NZVLJ-E3HMF        ]    │
│                                         │
│  ⚠️  This will replace your current     │
│  list data with the data from that      │
│  device.                                │
│                                         │
│       [ Cancel ]  [ Sync with Code ]    │
└─────────────────────────────────────────┘
```

- The input should auto-capitalise and accept the code with or without dashes (normalise in `adoptSyncCode`).
- On "Sync with Code": call `sync.adoptSyncCode(inputValue)`. `adoptSyncCode` validates the format before doing anything — if the code is malformed it throws `"INVALID_CODE_FORMAT"`. The dialog should catch this and display an inline validation error (e.g. _"Please enter a valid sync code — it should look like KXMW4-TQP9R-NZVLJ-E3HMF"_) without closing the dialog.
- On a valid code: `loadState` inside the subscription `useEffect` in Phase 6e fires automatically when `sync.syncCode` changes, dispatching `SYNC_LOAD` and replacing the local list with cloud data.
- The dialog is opened from both "I Have a Sync Code" (State 1) and "Sync a Different Code" (State 2), so it is a single reusable `Dialog` component driven by an `isEnterCodeDialogOpen` boolean state variable in `SettingsSheet`.

---

## Phase 10 — Reset to New User (Sync Cleanup)

`SettingsService.clearAll()` clears all `localStorage` keys including the sync keys added in Phase 3. However, `useSyncStore` holds `syncCode` and `isSyncEnabled` in **React state** — clearing `localStorage` alone does not update the in-memory store. If React state is not updated, the `onSnapshot` subscription in `StoreProvider` keeps running against the old sync code even after reset, and any incoming Firestore writes continue dispatching `SYNC_LOAD` on the now-reset app.

### Fix — Add `resetSync()` to `useSyncStore`

Add the following method to `useSyncStore`'s context interface and provider:

```ts
/** Clears all sync state from memory and localStorage. Called during "Reset to New User". */
resetSync: () => void;
```

Implementation inside `SyncProvider`:

```ts
function resetSync(): void {
  SettingsService.clearSyncCode();
  SettingsService.clearIsSyncEnabled();
  setSyncCodeState("");
  setIsSyncEnabledState(false);
  setSyncStatus("idle");
}
```

The `onSnapshot` unsubscribe is handled automatically: when `isSyncEnabled` changes to `false` and `syncCode` changes to `""`, the dependency array `[sync.isSyncEnabled, sync.syncCode]` on the subscription `useEffect` in Phase 6e triggers a cleanup — the effect's return function calls `unsubscribe?.()`, cancelling the Firestore listener before the new effect run skips subscription setup (because `!sync.isSyncEnabled`).

### Fix — `SettingsSheet` reset handler must call both stores

The "Reset to New User" confirmation handler in `SettingsSheet.tsx` currently calls:

```ts
store.resetCategories();
settings.resetToNewUser();
setIsResetDialogOpen(false);
onOpenChange(false);
```

Update it to also call `sync.resetSync()` first, and also add the `useSyncStore` import and a `const sync = useSyncStore()` binding at the top of `SettingsSheet`:

```ts
sync.resetSync();
settings.resetToNewUser();
store.resetCategories();
setIsResetDialogOpen(false);
onOpenChange(false);
```

> **Important:** `store.dispatch` is not exposed on `StoreContextValue` — use the public `store.resetCategories()` method, which is what the existing handler already calls.

> **Order matters:** `sync.resetSync()` must be called first so that the Firestore subscription teardown begins before list data is wiped, preventing a race where an incoming snapshot writes `SYNC_LOAD` after `RESET_CATEGORIES` has cleared the store.

### `clearAll()` update

`SettingsService.clearAll()` should still call `clearSyncCode()` and `clearIsSyncEnabled()` (as described in Phase 3) for consistency — but the `SettingsSheet` reset handler is the authoritative callsite that coordinates all three stores.

> **Double-clear is intentional and harmless:** `sync.resetSync()` calls `clearSyncCode()` and `clearIsSyncEnabled()`, then `settings.resetToNewUser()` calls `SettingsService.clearAll()` which calls them again. `localStorage.removeItem` on an already-absent key is a no-op, so there is no bug here. The redundancy is kept so that each function remains correct if called independently.

---

## Conflict Strategy

**Last-write-wins.** This is appropriate because:

- ListMaster is used by one person (or a household sharing one list), not a multi-author collaborative editor.
- The Firestore `setDoc` call overwrites the entire document each time.
- The `subscribeToState` listener fires on every remote write, so the app immediately picks up changes from another device.
- The `updatedAt` timestamp is stored but not yet used for conflict resolution. If needed in the future it can be used to reject older writes.

---

## Bundle Size Impact

| Module               | Gzipped size |
| -------------------- | ------------ |
| `firebase/app`       | ~4 KB        |
| `firebase/auth`      | ~17 KB       |
| `firebase/firestore` | ~18 KB       |
| **Total**            | **~39 KB**   |

The `syncService.ts` module is dynamically imported (see Phase 6b), so the Firebase SDK is only loaded after sync has been enabled by the user. First-time users pay zero bundle cost.

---

## UX Flow Summary

### New User (first install)

1. Completes onboarding → data lives in `localStorage` only.
2. Opens Settings → sees "Sync & Backup" card → "Enable Sync".
3. Taps → anonymous Firebase sign-in happens silently in background → sync code is generated and displayed.
4. User can note/copy the sync code for later.

### Returning User (same device)

- App opens, sync code is in `localStorage`, anonymous auth re-establishes silently.
- `onSnapshot` subscription reconnects, any changes from other devices are received.

### Adding a Second Device

1. On Device 1: Settings → copy sync code.
2. On Device 2: after onboarding, Settings → "Enter a different code" → paste → confirm.
3. Device 2 immediately pulls Device 1's data and subscribes to real-time updates.
4. Both devices are now in sync. Any write on either device propagates to the other within ~1 second.

### Data Survives Cache Clear

- If the user clears browser data, `localStorage` is wiped — but the sync code is also gone.
- This is the main caveat of the sync-code model: **the user needs to have saved their sync code somewhere** (notes app, password manager, etc.) before clearing data, otherwise they start fresh.
- Mitigations: prominently display the code, recommend copying it, and show a warning in the "Reset to New User" flow that the sync code will be lost.

---

## Decisions & Answers

### Do users need a traditional login (Google, Apple, email/password)?

**No.** Traditional auth is not needed and would be actively harmful to UX for this app. Here's why:

- There is **no sensitive data** — a personal grocery list is not a bank account.
- The sync-code model provides **~104 bits of entropy**, which is cryptographically stronger than most passwords.
- Firebase Anonymous Auth satisfies Firestore's technical auth requirement silently — the user never sees it or interacts with it.
- Avoiding OAuth means no "Sign in with Google" popup, no account dependency, no trust concern, no password to forget. The barrier to sync is as low as it can be: just copy and paste a code.

The sync code **is** the login. It's a shared secret that acts like a password for the list document, but it's auto-generated, long, and the user never has to create or remember it.

### Should sync be opt-in or opt-out?

**Opt-in.** Users who never open Settings never touch Firebase at all — zero cloud footprint, zero bundle cost (Firebase SDK is dynamically imported). This also respects privacy-conscious users.

### What happens if `adoptSyncCode` is called with a code that has no data in the cloud yet?

`loadState` returns `null`, no `SYNC_LOAD` is dispatched, and the local data is preserved. The `onSnapshot` subscription is set up anyway. The next local mutation will write the local data up to that sync code's document. This is fine — it means "first device to write wins," which is the right behaviour.

### Should the sync code be shown during onboarding?

Not in v1. It would add visual complexity to onboarding for a feature that is optional. Settings is the right place — users who want sync will look there.

### Should "Reset to New User" delete the Firestore document?

Not in v1. The document stays in the cloud, orphaned. Storage is cheap, and the user might want to recover it. A "Delete cloud data" option can be added later alongside a warning that it is permanent.

### What happens if the Firebase Anonymous Auth token expires after a long period offline?

Firebase refreshes Anonymous Auth tokens automatically while the app is active and online. If the SDK fails to refresh (e.g. extended offline period), calling `signInAnonymously()` inside `ensureAnonymousAuth()` creates a **new** anonymous UID silently. Because the current Firestore rules only check `request.auth != null` (not a specific UID), this is functionally transparent — the same sync code still grants read/write access on reconnect.

**Known v1 limitation:** If rules are ever tightened to tie a document to a specific UID (e.g. `request.auth.uid == resource.data.ownerUID`), this silent re-auth would break access to existing documents. For that reason, the `SyncPayload` interface in Phase 4 does **not** include an `ownerUID` field — adding one now would lock documents to UIDs that may silently change. This is an accepted trade-off for the shared-secret model.
