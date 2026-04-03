# Services Layer

The `src/services/` directory contains stateless singletons that perform all I/O. **Components and stores never call `localStorage` or `navigator.vibrate` directly** — all such access goes through these services.

---

## `PersistenceService` (`src/services/persistenceService.ts`)

The **only** layer permitted to read and write `localStorage` for checklist data.

### Storage Key & Shape

Data is stored under the key `"grocery-lists-state"` with the following shape:

```ts
{
  lists: Category[];       // the full category array
  selectedListID: string | null;
}
```

The field names (`lists`, `selectedListID`) mirror the Swift `CodingKeys` used in the iOS app, ensuring data portability.

### API

| Method                                 | Description                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| `save(categories, selectedCategoryID)` | Serializes and writes current state to `localStorage` under `"grocery-lists-state"`  |
| `load()`                               | Reads and deserializes state; returns `{ categories, selectedCategoryID }` or `null` |
| `clear()`                              | Removes `"grocery-lists-state"` from `localStorage` entirely                         |

### Usage Rule

Only `useCategoriesStore` calls `PersistenceService`. The reducer calls `PersistenceService.save()` after every action that modifies data, and the `RELOAD` action calls `PersistenceService.load()` to hydrate state from storage.

---

## `SettingsService` (`src/services/settingsService.ts`)

The **only** layer permitted to read and write `localStorage` for user settings.

### Storage Keys

Each setting is stored as a separate `localStorage` key (using camelCase key strings):

| `localStorage` key         | Setting                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `"userName"`               | `userName`                                                                                                        |
| `"hasCompletedOnboarding"` | `hasCompletedOnboarding`                                                                                          |
| `"appearanceMode"`         | `appearanceMode`                                                                                                  |
| `"textSize"`               | `textSize`                                                                                                        |
| `"sortOrder"`              | `sortOrder` (legacy global default, no longer written by the store but still readable for backward compatibility) |
| `"syncCode"`               | The user's sync code. Empty string until sync is enabled for the first time.                                      |
| `"isSyncEnabled"`          | `"true"` or `"false"` string. Whether cloud sync is currently active.                                             |

### Validation

All getters validate the stored value against an allowed-values list. If the stored value is missing or invalid (e.g. a user manually edited `localStorage` with a typo), the getter returns a safe default. This prevents the app from entering an undefined state due to corrupted or outdated stored data.

### Full API

| Method                             | Description                                                                |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `getUserName()`                    | Returns stored name string, or `""` if not set                             |
| `setUserName(name)`                | Persists the name string                                                   |
| `clearUserName()`                  | Removes `"userName"` from `localStorage`                                   |
| `getHasCompletedOnboarding()`      | Returns `true` if stored value is `"true"`, otherwise `false`              |
| `setHasCompletedOnboarding(value)` | Persists `"true"` or `"false"` as a string                                 |
| `clearHasCompletedOnboarding()`    | Removes `"hasCompletedOnboarding"` from `localStorage`                     |
| `getAppearanceMode()`              | Returns `"system"` / `"light"` / `"dark"`, defaults to `"system"`          |
| `setAppearanceMode(mode)`          | Persists the mode; throws if mode is not a valid value                     |
| `clearAppearanceMode()`            | Removes `"appearanceMode"` from `localStorage`                             |
| `getTextSize()`                    | Returns a `TextSize` value, defaults to `"m"`                              |
| `setTextSize(size)`                | Persists the size; throws if size is not a valid value                     |
| `clearTextSize()`                  | Removes `"textSize"` from `localStorage`                                   |
| `getSortOrder()`                   | Returns a `SortOrder` value, defaults to `"date"` (legacy)                 |
| `setSortOrder(order)`              | Persists the order; throws if order is not a valid value                   |
| `clearSortOrder()`                 | Removes `"sortOrder"` from `localStorage`                                  |
| `getSyncCode()`                    | Returns the stored sync code string, or `""` if not set                    |
| `setSyncCode(code)`                | Persists the sync code string                                              |
| `clearSyncCode()`                  | Removes `"syncCode"` from `localStorage`                                   |
| `getIsSyncEnabled()`               | Returns `true` if stored value is `"true"`, otherwise `false`              |
| `setIsSyncEnabled(value)`          | Persists `"true"` or `"false"` as a string                                 |
| `clearIsSyncEnabled()`             | Removes `"isSyncEnabled"` from `localStorage`                              |
| `clearAll()`                       | Calls all `clear*` methods including sync keys; used by `resetToNewUser()` |

### Usage Rule

Only `useSettingsStore` calls `SettingsService`. Each setter in the store calls the service method first (to persist), then updates React state.

---

## `HapticService` (`src/services/hapticService.ts`)

Wraps the browser **Vibration API** (`navigator.vibrate`) to provide iOS-equivalent haptic feedback presets.

### Presets

| Method                      | Pattern      | iOS Equivalent                              |
| --------------------------- | ------------ | ------------------------------------------- |
| `HapticService.light()`     | 8ms          | `UIImpactFeedbackGenerator(.light)`         |
| `HapticService.medium()`    | 15ms         | `UIImpactFeedbackGenerator(.medium)`        |
| `HapticService.heavy()`     | 25ms         | `UIImpactFeedbackGenerator(.heavy)`         |
| `HapticService.success()`   | `[8, 40, 8]` | `UINotificationFeedbackGenerator(.success)` |
| `HapticService.error()`     | 40ms         | `UINotificationFeedbackGenerator(.error)`   |
| `HapticService.selection()` | 4ms          | `UISelectionFeedbackGenerator`              |

### Compatibility

All calls are silent no-ops on devices and browsers that do not support the Vibration API (e.g. desktop browsers, iOS Safari, which intentionally blocks `navigator.vibrate`). The service checks for API availability before calling `navigator.vibrate`, so callers do not need to guard the call themselves.

> **Note:** iOS Safari does not support the Vibration API as of April 2026. Haptics on iOS PWA installs are therefore non-functional. This matches the behavior described in the iOS app's web companion notes.

---

## `firebaseConfig` (`src/services/firebaseConfig.ts`)

Provides a lazy singleton that initializes the Firebase app, Firestore instance, and Auth instance.

### API

| Function                 | Returns             | Description                                                                                                      |
| ------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `getFirebaseInstances()` | `{ app, db, auth }` | Returns the singleton Firebase instances. Creates them on first call; subsequent calls return the cached object. |

### Why Lazy Initialization?

Top-level `export const db = getFirestore(...)` would execute at module-import time, loading the Firebase SDK for every user — including those who have never enabled sync. Wrapping initialization in a function means the SDK only loads when `getFirebaseInstances()` is first called, which only happens inside `syncService.ts`, which is only imported via dynamic `import()`. See `docs/reference/sync.md` for the full bundle-impact rationale.

### Usage Rule

Only `syncService.ts` calls `getFirebaseInstances()`. Do not import from `firebaseConfig.ts` directly in components, stores, or other services.

---

## `SyncService` (`src/services/syncService.ts`)

The **only** file that imports from `firebase/firestore` and `firebase/auth`. Exports pure async functions — no React, no hooks.

### API

| Function              | Signature                                                           | Description                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ensureAnonymousAuth` | `() => Promise<User>`                                               | Signs in anonymously if no user is currently authenticated. Checks current auth state first. Safe to call multiple times.                            |
| `saveState`           | `(syncCode, categories, selectedCategoryID) => Promise<void>`       | Full-overwrite write to `syncStates/{syncCode}`. Includes a `Date.now()` `updatedAt` timestamp. Last write wins.                                     |
| `loadState`           | `(syncCode) => Promise<{ categories, selectedCategoryID } \| null>` | One-time Firestore read. Returns `null` if the document does not exist. Races against a 5-second timeout to avoid hanging indefinitely when offline. |
| `subscribeToState`    | `(syncCode, callback) => Unsubscribe`                               | Opens a real-time `onSnapshot` listener. Calls `callback` on every document change. Returns an unsubscribe function.                                 |
| `deleteSyncData`      | `(syncCode) => Promise<void>`                                       | Permanently deletes the sync document from Firestore.                                                                                                |

### Usage Rule

`SyncService` functions are **never called directly from components**. The call chain is: component → `useSyncStore` method → dynamic `import("@/services/syncService")` → `SyncService` function. `useCategoriesStore` follows the same pattern for `saveState` and `subscribeToState`.

For full architecture details, see `docs/reference/sync.md`.
