# Services Catalog — April 2026

> **Purpose:** A reference snapshot of every file in `src/services/`. Documents each service's role, API surface, storage keys, and implementation details. Use this when debugging persistence, planning new settings, or understanding the sync pipeline.

---

## Table of Contents

- [Architecture overview](#architecture-overview)
- [PersistenceService](#persistenceservice)
- [SettingsService](#settingsservice)
- [HapticService](#hapticservice)
- [syncService.ts](#syncservicets)
- [firebaseConfig.ts](#firebaseconfigts)

---

## Architecture overview

All services in `src/services/` are **stateless I/O singletons**. They encapsulate `localStorage` access, browser APIs, and Firebase interactions. No service holds React state or renders JSX.

| File                    | Concern                                        | Accessed by                                            |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| `persistenceService.ts` | Categories/groups persistence (`localStorage`) | `categoriesReducer.ts`, `useSettingsStore.ts`          |
| `settingsService.ts`    | User preferences persistence (`localStorage`)  | `useSettingsStore.ts`, `useSyncStore.tsx`              |
| `hapticService.ts`      | Haptic feedback via Vibration API              | Components throughout the app                          |
| `syncService.ts`        | Firestore read/write/subscribe                 | `useCloudSync.ts`, `useSyncStore.tsx` (dynamic import) |
| `firebaseConfig.ts`     | Firebase SDK initialization                    | `syncService.ts`                                       |

### Persistence contract

**Only `PersistenceService` and `SettingsService` may call `localStorage` directly.** Components and store hooks never access `localStorage` — they call these services. This is enforced by the project's copilot instructions.

---

## `PersistenceService`

**File:** `src/services/persistenceService.ts`

Manages the main app data blob — categories, selected category ID, and groups — as a single JSON object in `localStorage`.

### Storage key

`"grocery-lists-state"` — mirrors the key name from the original iOS app's UserDefaults.

### Persisted shape (`PersistedState`)

```ts
interface PersistedState {
  lists: Category[]; // uses "lists" key for iOS CodingKeys compatibility
  selectedListID: string | null;
  groups?: CategoryGroup[]; // optional for backwards compatibility
}
```

The `lists` / `selectedListID` naming preserves compatibility with the iOS app's Swift `CodingKeys` alias.

### API

| Method  | Signature                                                                               | Description                                                                                                                             |
| ------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `save`  | `(categories: Category[], selectedCategoryID: string, groups: CategoryGroup[]) => void` | Serializes the full state to `localStorage`                                                                                             |
| `load`  | `() => { categories, selectedCategoryID, groups } \| null`                              | Deserializes from `localStorage`; returns `null` if missing or corrupt. Falls back `groups` to `[]` and `selectedCategoryID` to `null`. |
| `clear` | `() => void`                                                                            | Removes the storage key entirely                                                                                                        |

### Callers

- `categoriesReducer.ts` — `loadInitialState()` reads on app start; every reducer mutation writes via `save()`.
- `useSettingsStore.ts` — `resetToNewUser()` calls `clear()`.

---

## `SettingsService`

**File:** `src/services/settingsService.ts`

Manages individual user preference values as separate `localStorage` keys.

### Storage keys

| Key                        | Type             | Default    | Getter return                   |
| -------------------------- | ---------------- | ---------- | ------------------------------- |
| `"userName"`               | `string`         | `""`       | `string`                        |
| `"hasCompletedOnboarding"` | `"true"/"false"` | `false`    | `boolean`                       |
| `"appearanceMode"`         | `string`         | `"system"` | `"system" \| "light" \| "dark"` |
| `"textSize"`               | `string`         | `"m"`      | `TextSize`                      |
| `"sortOrder"`              | `string`         | `"date"`   | `SortOrder`                     |
| `"syncCode"`               | `string`         | `""`       | `string`                        |
| `"isSyncEnabled"`          | `"true"/"false"` | `false`    | `boolean`                       |

### Validation

`getAppearanceMode()`, `getTextSize()`, and `getSortOrder()` validate the stored value against a whitelist before returning. Invalid or missing values return the default. `setAppearanceMode()`, `setTextSize()`, and `setSortOrder()` throw on invalid values.

### API pattern

Each setting follows a consistent three-method pattern:

- `get{Setting}()` — reads from `localStorage`, validates, returns typed value.
- `set{Setting}(value)` — validates and writes to `localStorage`.
- `clear{Setting}()` — removes the key from `localStorage`.

### `clearAll()`

Calls every individual `clear*()` method. Used by `useSettingsStore.resetToNewUser()`.

### Callers

- `useSettingsStore.ts` — reads on provider initialization, writes on every setter call.
- `useSyncStore.tsx` — reads/writes sync code and sync-enabled flag.

---

## `HapticService`

**File:** `src/services/hapticService.ts`

Provides iOS-equivalent haptic feedback using the Web Vibration API. Each method maps to a `UIImpactFeedbackGenerator` style.

### API

| Method        | Vibration pattern | iOS equivalent                              | Used for                                    |
| ------------- | ----------------- | ------------------------------------------- | ------------------------------------------- |
| `light()`     | `8ms`             | `UIImpactFeedbackGenerator(.light)`         | Item toggle, sort toggle, nav pill tap      |
| `medium()`    | `15ms`            | `UIImpactFeedbackGenerator(.medium)`        | Swipe snap open, check-all, clear confirmed |
| `heavy()`     | `25ms`            | `UIImpactFeedbackGenerator(.heavy)`         | Swipe delete                                |
| `success()`   | `[8, 40, 8]ms`    | `UINotificationFeedbackGenerator(.success)` | _(available, not currently used)_           |
| `error()`     | `40ms`            | `UINotificationFeedbackGenerator(.error)`   | _(available, not currently used)_           |
| `selection()` | `4ms`             | `UISelectionFeedbackGenerator`              | Category pill selection                     |

All methods use optional chaining (`navigator.vibrate?.(...)`) — safe on browsers that do not support the Vibration API (Safari on iOS does not support it as of April 2026, so these are effectively no-ops on the target platform).

---

## `syncService.ts`

**File:** `src/services/syncService.ts`

Manages all Firestore read/write operations for cloud sync. This module is **never statically imported** by store hooks — it is always loaded via dynamic `import()` to keep the Firebase SDK out of the main bundle for non-sync users.

### Firestore document structure

Collection: `"syncStates"`. Document ID: the sync code (e.g. `"A1B2C-D3E4F-G5H6I-J7K8L"`).

```ts
interface SyncPayload {
  lists: Category[]; // mirrors PersistenceService key naming
  selectedCategoryID: string | null;
  groups?: CategoryGroup[]; // optional for backwards compatibility
  userName?: string; // optional for backwards compatibility
  updatedAt: number; // Unix ms timestamp
}
```

### API

| Function              | Signature                                                                              | Description                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `ensureAnonymousAuth` | `() => Promise<User>`                                                                  | Signs in anonymously if no user is authenticated. Uses `onAuthStateChanged` to check first. |
| `saveState`           | `(syncCode, categories, selectedCategoryID, groups, userName) => Promise<void>`        | Writes the full state to Firestore with `setDoc` (merge: false)                             |
| `loadState`           | `(syncCode) => Promise<{ categories, selectedCategoryID, groups, userName? } \| null>` | One-time read with 5-second timeout race                                                    |
| `subscribeToState`    | `(syncCode, callback) => Unsubscribe`                                                  | Real-time `onSnapshot` listener; calls callback on every change                             |
| `deleteSyncData`      | `(syncCode) => Promise<void>`                                                          | Permanently deletes the Firestore document                                                  |

### `loadState` timeout

Uses `Promise.race([fetchPromise, timeoutPromise])` with a 5-second timeout. Returns `null` if the document doesn't exist or the request times out. The `groups` field falls back to `[]` inside `loadState` (not the caller) for backwards compatibility.

### `subscribeToState` callback

```ts
callback: (
  categories: Category[],
  selectedCategoryID: string | null,
  groups: CategoryGroup[],
  userName: string | undefined,
) => void
```

The `groups` field falls back to `[]` before being passed to the callback. Error handler logs to console but does not throw.

### Callers

- `useCloudSync.ts` — `loadState`, `saveState`, `subscribeToState` (all via dynamic `import()`).
- `useSyncStore.tsx` — `ensureAnonymousAuth`, `deleteSyncData` (all via dynamic `import()`).

---

## `firebaseConfig.ts`

**File:** `src/services/firebaseConfig.ts`

Lazy singleton factory for Firebase SDK instances.

### Environment variables

All Firebase config values are read from Vite environment variables:

| Variable                            | Firebase config key |
| ----------------------------------- | ------------------- |
| `VITE_FIREBASE_API_KEY`             | `apiKey`            |
| `VITE_FIREBASE_AUTH_DOMAIN`         | `authDomain`        |
| `VITE_FIREBASE_PROJECT_ID`          | `projectId`         |
| `VITE_FIREBASE_STORAGE_BUCKET`      | `storageBucket`     |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID`              | `appId`             |

### API

| Function               | Return type         | Description                                                                                   |
| ---------------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `getFirebaseInstances` | `FirebaseInstances` | Returns `{ app, db, auth }`. Creates instances on first call; returns cached singleton after. |

### Lazy initialization

Uses `getApps().length === 0` guard to avoid double-initialization. Instances are cached in a module-level `let instances` variable. This file is only imported by `syncService.ts`, which itself is only dynamic-imported — so the Firebase SDK is never loaded unless the user enables sync.
