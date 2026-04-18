# Plan: Synced Device Count

**Goal:** Track how many devices are registered to a sync code and display "Synced devices: N" in the Sync & Backup section of Settings.

**Validation command:** `npm run build` — run after all steps and fix every error before considering complete.

---

## Approach

Each device that enables or adopts a sync code writes its anonymous Firebase UID into a `deviceIDs: string[]` field on the Firestore document using `arrayUnion` (merge write — never clobbers other devices). `subscribeToState` surfaces `deviceIDs.length` as a 5th callback argument. `useSyncStore` exposes `syncedDeviceCount: number` via context. `SyncSection` renders it.

---

## Pre-Edit Extractions — Required Before Any Feature Code

Three files violate line-count ceilings and must be extracted before being edited:

| File | Current lines | Ceiling | Extraction |
|------|--------------|---------|------------|
| `src/services/syncService.ts` | 150 | 150 | A |
| `src/store/useSyncStore.tsx` | 154 | 150 | B |
| `src/store/useCloudSync.ts` | 184 | 120 | C |

---

### Extraction A — Create `src/services/authService.ts`

**Create** `src/services/authService.ts`:

```ts
// src/services/authService.ts
import {
  signInAnonymously,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirebaseInstances } from "./firebaseConfig";

// MARK: - Auth

/**
 * Signs in anonymously if no user is currently authenticated.
 * Returns a promise that resolves to the authenticated User.
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
```

**Edit** `src/services/syncService.ts`:
- Delete the `import { signInAnonymously, onAuthStateChanged, type User } from "firebase/auth"` line.
- Delete the entire `// MARK: - Auth` section and `ensureAnonymousAuth` function body.
- Add this re-export immediately after the remaining imports (keeps all existing `import("@/services/syncService")` call sites working without changes):

```ts
export { ensureAnonymousAuth } from "@/services/authService";
```

**Result:** `syncService.ts` drops to ~125 lines.

---

### Extraction B — Create `src/store/useSyncActions.ts`

**Create** `src/store/useSyncActions.ts`:

```ts
// src/store/useSyncActions.ts
import { useCallback } from "react";
import { SettingsService } from "@/services/settingsService";
import { generateSyncCode } from "@/lib/utils";
import type { SyncStatus } from "@/store/useSyncStore";

// MARK: - Types

/** Setter functions passed in from SyncProvider. */
export interface UseSyncSetters {
  setSyncCode: (code: string) => void;
  setIsSyncEnabled: (enabled: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  /** Required: written after registerDevice + loadState resolve inside enableSync/adoptSyncCode. */
  setSyncedDeviceCount: (count: number) => void;
}

/** Return type of useSyncActions. */
export interface UseSyncActionsReturn {
  enableSync: () => Promise<void>;
  disableSync: (deleteCloud: boolean) => Promise<void>;
  adoptSyncCode: (code: string) => Promise<void>;
  resetSync: () => void;
}

/** Regex matching the XXXXX-XXXXX-XXXXX-XXXXX sync code format. */
const SYNC_CODE_PATTERN = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;

// MARK: - Hook

/**
 * Provides the four sync action callbacks for SyncProvider.
 * enableSync and adoptSyncCode capture user.uid from ensureAnonymousAuth()
 * and immediately call registerDevice, then loadState for the initial count.
 */
export function useSyncActions(
  isSyncEnabled: boolean,
  setters: UseSyncSetters,
): UseSyncActionsReturn {
  const { setSyncCode, setIsSyncEnabled, setSyncStatus, setSyncedDeviceCount } =
    setters;

  const enableSync = useCallback(async () => {
    if (isSyncEnabled) return;
    setSyncStatus("syncing");
    try {
      const { ensureAnonymousAuth, registerDevice, loadState } =
        await import("@/services/syncService");
      const user = await ensureAnonymousAuth();

      const newCode = generateSyncCode();
      SettingsService.setSyncCode(newCode);
      SettingsService.setIsSyncEnabled(true);
      setSyncCode(newCode);
      setIsSyncEnabled(true);

      await registerDevice(newCode, user.uid);
      const result = await loadState(newCode);
      setSyncedDeviceCount((result?.deviceIDs ?? []).length);

      setSyncStatus("synced");
    } catch (error) {
      console.error("Failed to enable sync:", error);
      setSyncStatus("error");
    }
  }, [isSyncEnabled, setSyncCode, setIsSyncEnabled, setSyncStatus, setSyncedDeviceCount]);

  const disableSync = useCallback(async (deleteCloud: boolean) => {
    const codeToDelete = SettingsService.getSyncCode();

    SettingsService.setIsSyncEnabled(false);
    SettingsService.clearSyncCode();
    setIsSyncEnabled(false);
    setSyncCode("");
    setSyncStatus("idle");
    setSyncedDeviceCount(0);

    if (deleteCloud && codeToDelete) {
      try {
        const { deleteSyncData } = await import("@/services/syncService");
        await deleteSyncData(codeToDelete);
      } catch (error) {
        console.error("Failed to delete cloud sync data:", error);
      }
    }
  }, [setSyncCode, setIsSyncEnabled, setSyncStatus, setSyncedDeviceCount]);

  const adoptSyncCode = useCallback(async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    if (!SYNC_CODE_PATTERN.test(trimmed)) {
      console.error("Invalid sync code format:", trimmed);
      setSyncStatus("error");
      return;
    }

    setSyncStatus("syncing");
    try {
      const { ensureAnonymousAuth, registerDevice, loadState } =
        await import("@/services/syncService");
      const user = await ensureAnonymousAuth();

      SettingsService.setSyncCode(trimmed);
      SettingsService.setIsSyncEnabled(true);
      setSyncCode(trimmed);
      setIsSyncEnabled(true);

      await registerDevice(trimmed, user.uid);
      const result = await loadState(trimmed);
      setSyncedDeviceCount((result?.deviceIDs ?? []).length);

      setSyncStatus("synced");
    } catch (error) {
      console.error("Failed to adopt sync code:", error);
      setSyncStatus("error");
    }
  }, [setSyncCode, setIsSyncEnabled, setSyncStatus, setSyncedDeviceCount]);

  const resetSync = useCallback(() => {
    const newCode = generateSyncCode();
    SettingsService.setSyncCode(newCode);
    setSyncCode(newCode);
    setSyncStatus("idle");
  }, [setSyncCode, setSyncStatus]);

  return { enableSync, disableSync, adoptSyncCode, resetSync };
}
```

**Edit** `src/store/useSyncStore.tsx` — replace the entire file with:

```tsx
// src/store/useSyncStore.tsx
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { SettingsService } from "@/services/settingsService";
import { useSyncActions } from "@/store/useSyncActions";

// MARK: - Types

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface SyncContextValue {
  /** The current sync code (empty string if sync has never been enabled). */
  syncCode: string;
  /** Whether sync is currently enabled. */
  isSyncEnabled: boolean;
  /** Current sync status indicator. */
  syncStatus: SyncStatus;
  /** Number of devices registered to the current sync code. */
  syncedDeviceCount: number;
  /** Called by useCloudSync to update the count from subscription snapshots. */
  setSyncedDeviceCount: (count: number) => void;
  /** Enables sync by generating a new code and saving it. */
  enableSync: () => Promise<void>;
  /** Disables sync. Pass `true` to also permanently delete the Firestore document. */
  disableSync: (deleteCloud: boolean) => Promise<void>;
  /** Adopts an existing sync code from another device. */
  adoptSyncCode: (code: string) => Promise<void>;
  /** Resets sync by generating a new code. */
  resetSync: () => void;
}

// MARK: - Context

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

// MARK: - Provider

/** Provides the sync store to the component tree. */
export function SyncProvider({ children }: { children: ReactNode }): ReactNode {
  const [syncCode, setSyncCode] = useState<string>(() =>
    SettingsService.getSyncCode(),
  );
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(() =>
    SettingsService.getIsSyncEnabled(),
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncedDeviceCount, setSyncedDeviceCount] = useState<number>(0);

  const { enableSync, disableSync, adoptSyncCode, resetSync } = useSyncActions(
    isSyncEnabled,
    { setSyncCode, setIsSyncEnabled, setSyncStatus, setSyncedDeviceCount },
  );

  const value: SyncContextValue = {
    syncCode,
    isSyncEnabled,
    syncStatus,
    syncedDeviceCount,
    setSyncedDeviceCount,
    enableSync,
    disableSync,
    adoptSyncCode,
    resetSync,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

// MARK: - Hook

// eslint-disable-next-line react-refresh/only-export-components
/** Returns the sync store context value. Must be used within SyncProvider. */
export function useSyncStore(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error("useSyncStore must be used within a SyncProvider");
  }
  return ctx;
}
```

**Result:** `useSyncStore.tsx` drops to ~75 lines.

---

### Extraction C — Create `src/store/useCloudSyncSubscription.ts`

**Create** `src/store/useCloudSyncSubscription.ts` by moving the `// ── Cloud subscription ──` `useEffect` block out of `useCloudSync.ts`:

```ts
// src/store/useCloudSyncSubscription.ts
import { useEffect, useRef } from "react";
import type { Dispatch, MutableRefObject } from "react";
import type { StoreAction, StoreState } from "@/store/categoriesReducer";

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

        unsubscribe = subscribeToState(
          syncCode,
          (categories, _selectedCategoryID, groups, cloudUserName, deviceCount) => {
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
  }, [isSyncEnabled, syncCode, dispatch, isSyncReadyRef, isLoadingFromSyncRef,
      getUserNameRef, syncUserNameRef, stateRef, cloudSaveTimerRef]);
}
```

**Edit** `src/store/useCloudSync.ts`:

1. Add import at the top:
```ts
import { useCloudSyncSubscription } from "@/store/useCloudSyncSubscription";
```

2. Add `onDeviceCountChange: (count: number) => void` to the `UseCloudSyncParams` interface.

3. Add `onDeviceCountChange` to the destructured function params.

4. Remove the entire `// ── Cloud subscription ──` `useEffect` block (from the comment line through the closing `}, [isSyncEnabled, syncCode, dispatch]);`).

5. Replace it with this single call (placed where the removed block was):
```ts
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
```

**Result:** `useCloudSync.ts` drops to ~80 lines.

---

## Feature Implementation Steps

### Step 1 — Add `deviceIDs` to `SyncPayload` in `syncService.ts`

Extend the internal `SyncPayload` interface:

```ts
interface SyncPayload {
  lists: Category[];
  selectedCategoryID: string | null;
  groups?: CategoryGroup[];
  userName?: string;
  updatedAt: number;
  deviceIDs?: string[]; // anonymous Firebase UIDs of all registered devices
}
```

### Step 2 — Add `arrayUnion` to static import and add `registerDevice()` in `syncService.ts`

Edit the existing static `firebase/firestore` import — add `arrayUnion`:

```ts
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
  arrayUnion,
  type Unsubscribe,
} from "firebase/firestore";
```

Add this exported function after `saveState`:

```ts
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
```

### Step 3 — Extend `loadState()` to return `deviceIDs`

Edit the return statement inside `loadState`'s `fetchPromise` resolver:

```ts
// Before:
return {
  categories: data.lists,
  selectedCategoryID: data.selectedCategoryID,
  groups: data.groups ?? [],
  userName: data.userName,
};

// After:
return {
  categories: data.lists,
  selectedCategoryID: data.selectedCategoryID,
  groups: data.groups ?? [],
  userName: data.userName,
  deviceIDs: data.deviceIDs ?? [],
};
```

Also update the return type annotation of `loadState` to add `deviceIDs: string[]` to the resolved object shape.

### Step 4 — Extend `subscribeToState()` in `syncService.ts`

Update the callback parameter type to add a fifth argument:

```ts
callback: (
  categories: Category[],
  selectedCategoryID: string | null,
  groups: CategoryGroup[],
  userName: string | undefined,
  deviceCount: number,
) => void,
```

Update the `callback(...)` call inside the `onSnapshot` handler to pass the count as the fifth argument:

```ts
callback(
  data.lists,
  data.selectedCategoryID,
  data.groups ?? [],
  data.userName,
  (data.deviceIDs ?? []).length,
);
```

### Step 5 — Thread `onDeviceCountChange` through `useCategoriesStore.ts` into `useCloudSync`

Edit `src/store/useCategoriesStore.ts`:

1. Read `setSyncedDeviceCount` from `useSyncStore`:

```ts
// Before:
const { isSyncEnabled, syncCode } = useSyncStore();

// After:
const { isSyncEnabled, syncCode, setSyncedDeviceCount } = useSyncStore();
```

2. Pass it into `useCloudSync`:

```ts
// Before:
useCloudSync({
  state,
  dispatch,
  isSyncEnabled,
  syncCode,
  getUserName,
  syncUserName: applySyncUserName,
});

// After:
useCloudSync({
  state,
  dispatch,
  isSyncEnabled,
  syncCode,
  getUserName,
  syncUserName: applySyncUserName,
  onDeviceCountChange: setSyncedDeviceCount,
});
```

### Step 6 — Add `syncedDeviceCount` prop to `SyncSection`

Edit `src/features/settings/components/SyncSection.tsx`:

Add to `SyncSectionProps`:

```ts
/** Number of devices registered to the current sync code. */
syncedDeviceCount: number;
```

Add to the destructured function params:

```ts
export function SyncSection({
  isSyncEnabled,
  syncCode,
  syncStatus,
  syncedDeviceCount,
  onEnableSync,
  onDisableSync,
  onAdoptSyncCode,
}: SyncSectionProps): JSX.Element {
```

Inside the `isSyncEnabled` branch, add this line directly above `<div className="flex gap-2 mt-3">`:

```tsx
<p className="text-xs mt-2" style={{ color: "var(--color-text-secondary)" }}>
  Synced devices: {syncedDeviceCount}
</p>
```

### Step 7 — Pass `syncedDeviceCount` from `SettingsSheet.tsx`

Edit `src/screens/SettingsSheet.tsx` — add the new prop to `<SyncSection>`:

```tsx
// Before:
<SyncSection
  isSyncEnabled={sync.isSyncEnabled}
  syncCode={sync.syncCode}
  syncStatus={sync.syncStatus}
  onEnableSync={sync.enableSync}
  onDisableSync={sync.disableSync}
  onAdoptSyncCode={sync.adoptSyncCode}
/>

// After:
<SyncSection
  isSyncEnabled={sync.isSyncEnabled}
  syncCode={sync.syncCode}
  syncStatus={sync.syncStatus}
  syncedDeviceCount={sync.syncedDeviceCount}
  onEnableSync={sync.enableSync}
  onDisableSync={sync.disableSync}
  onAdoptSyncCode={sync.adoptSyncCode}
/>
```

### Step 8 — Validate

Run `npm run build`. Fix all TypeScript errors before considering complete.

---

## Files Created

| File | Purpose |
|------|---------|
| `src/services/authService.ts` | Extracted `ensureAnonymousAuth` from `syncService.ts` |
| `src/store/useSyncActions.ts` | Extracted 4 action callbacks; adds `registerDevice` + `loadState` calls for initial count |
| `src/store/useCloudSyncSubscription.ts` | Extracted subscription `useEffect`; calls `onDeviceCountChange` in snapshot handler |

## Files Modified

| File | Changes |
|------|---------|
| `src/services/syncService.ts` | Re-export `ensureAnonymousAuth`; add `arrayUnion` to import; add `registerDevice()`; extend `loadState` return with `deviceIDs`; extend `subscribeToState` with `deviceCount` arg; add `deviceIDs` to `SyncPayload` |
| `src/store/useSyncStore.tsx` | Replace with thin provider; add `syncedDeviceCount` state + `setSyncedDeviceCount`; expose both in context; delegate actions to `useSyncActions` |
| `src/store/useCloudSync.ts` | Add `onDeviceCountChange` to params; remove subscription block; call `useCloudSyncSubscription` |
| `src/store/useCloudSyncSubscription.ts` | (new) — subscription logic + `onDeviceCountChange` call |
| `src/store/useCategoriesStore.ts` | Read `setSyncedDeviceCount` from `useSyncStore`; pass as `onDeviceCountChange` to `useCloudSync` |
| `src/features/settings/components/SyncSection.tsx` | Add `syncedDeviceCount` prop; render "Synced devices: N" |
| `src/screens/SettingsSheet.tsx` | Pass `sync.syncedDeviceCount` to `<SyncSection>` |
