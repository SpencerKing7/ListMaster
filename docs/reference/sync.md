# Cloud Sync — Reference

**Feature branch:** `db-storage-research`  
**Last updated:** 2026-04-02

Cloud sync is an **opt-in** feature that lets a user's checklist data survive browser-cache clears and be shared across multiple devices — without requiring a traditional login or a user account. The feature is built on Firebase Firestore and Firebase Anonymous Auth. Users who never enable sync pay **zero bundle cost** because the Firebase SDK is loaded via dynamic `import()` only when sync is first activated.

---

## How It Works — The Sync Code Model

Instead of tying data to a user account, ListMaster uses a **sync code** as the sole identity key. The sync code is a randomly generated 20-character string, formatted for readability as four groups of five characters:

```
KXMW4-TQP9R-NZVLJ-E3HMF
```

Each sync code maps directly to one Firestore document at the path `syncStates/{syncCode}`. Any device that knows the code can read and write to that document.

### Security Model

This is a **shared-secret** model, not per-user identity:

- Anyone who has the code can read and overwrite the data. This is intentional — it enables household sharing by simply handing someone the code.
- Codes are drawn from an unambiguous 32-character alphabet (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — no `0/O` or `1/I` confusion) using `crypto.getRandomValues`. With 20 characters this provides roughly 104 bits of entropy, making brute-force enumeration infeasible.
- Firestore security rules require `request.auth != null` on every read/write. This is satisfied silently with **Firebase Anonymous Auth** — the user never sees a login flow. The anonymous UID acts only as a Firestore access token, not as an identity. What gates actual data access is _knowing the sync code_.

See `firestore.rules` for the deployed rules.

### Firebase Anonymous Auth

Each device independently signs in anonymously via `ensureAnonymousAuth()` (in `src/services/syncService.ts`). The resulting anonymous `uid` is device-specific and unrelated to the sync code. Firebase's SDK refreshes the anonymous auth token automatically while the app is online. If the token has expired after a long offline period and the SDK cannot refresh silently, `signInAnonymously()` is called again — this may produce a new `uid`, but because Firestore rules only check `request.auth != null` (not a specific uid), access to the sync document is unaffected.

---

## File Map

| File                              | Role                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------- |
| `src/services/firebaseConfig.ts`  | Lazy singleton that initializes the Firebase app, Firestore, and Auth instances |
| `src/services/syncService.ts`     | Pure functions: anonymous auth, Firestore read/write/subscribe/delete           |
| `src/store/useSyncStore.tsx`      | React Context + `useState` store for sync code and sync status                  |
| `src/store/useCategoriesStore.ts` | Wires debounced cloud saves and the real-time Firestore subscription            |
| `src/services/settingsService.ts` | Persists `syncCode` and `isSyncEnabled` to `localStorage`                       |
| `src/lib/utils.ts`                | `generateSyncCode()` utility                                                    |
| `firestore.rules`                 | Firestore security rules                                                        |

---

## `src/services/firebaseConfig.ts`

Exports a single function `getFirebaseInstances()` that returns `{ app, db, auth }`. Firebase is initialized **lazily** — on the first call to this function. Subsequent calls return the cached instances.

This lazy pattern is critical: `firebaseConfig.ts` is only imported by `syncService.ts`, and `syncService.ts` is only imported via dynamic `import()` from `useSyncStore.tsx` and `useCategoriesStore.ts`. This ensures the Firebase SDK never enters the initial bundle.

A `getApps().length` guard prevents duplicate app initialization in React StrictMode's double-render in development.

---

## `src/services/syncService.ts`

A pure-function module. No React, no hooks. It is the **only file** that imports from `firebase/firestore` and `firebase/auth`.

### `SyncPayload` (internal type)

The shape of every Firestore document under `syncStates/{syncCode}`:

```ts
interface SyncPayload {
  lists: Category[];
  selectedCategoryID: string | null;
  updatedAt: number; // Unix ms timestamp — last-write-wins
}
```

### API

| Function              | Signature                                                           | Description                                                                                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ensureAnonymousAuth` | `() => Promise<User>`                                               | Signs in anonymously if not already authenticated. Checks current auth state first via `onAuthStateChanged` to avoid redundant calls. Safe to call multiple times.                                                                                                                 |
| `saveState`           | `(syncCode, categories, selectedCategoryID) => Promise<void>`       | Writes the full list state to Firestore. Uses `setDoc` (full overwrite). Includes a `Date.now()` timestamp as `updatedAt`. Last write wins.                                                                                                                                        |
| `loadState`           | `(syncCode) => Promise<{ categories, selectedCategoryID } \| null>` | One-time read of the Firestore document. Returns `null` if the document does not exist. Races the Firestore fetch against a **5-second timeout** that resolves `null` — this prevents the app from hanging indefinitely when the device is offline and the document is not cached. |
| `subscribeToState`    | `(syncCode, callback) => Unsubscribe`                               | Opens a real-time `onSnapshot` listener. Calls `callback` with the latest `categories` and `selectedCategoryID` on every document change. Returns an unsubscribe function. Errors are logged and the listener stops — they are not thrown.                                         |
| `deleteSyncData`      | `(syncCode) => Promise<void>`                                       | Permanently deletes the Firestore document for the given sync code. Called when the user disables sync and chooses to remove their cloud data.                                                                                                                                     |

---

## `src/store/useSyncStore.tsx`

A React Context store built with `useState`. Exported via `SyncProvider` and `useSyncStore()`.

### State

| Property        | Type         | Initial value                        | Source                                |
| --------------- | ------------ | ------------------------------------ | ------------------------------------- |
| `syncCode`      | `string`     | `SettingsService.getSyncCode()`      | Hydrated from `localStorage` on mount |
| `isSyncEnabled` | `boolean`    | `SettingsService.getIsSyncEnabled()` | Hydrated from `localStorage` on mount |
| `syncStatus`    | `SyncStatus` | `"idle"`                             | In-memory only                        |

### `SyncStatus` Type

```ts
type SyncStatus = "idle" | "syncing" | "synced" | "error";
```

| Value       | Meaning                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| `"idle"`    | Sync is disabled or has not been attempted                               |
| `"syncing"` | Anonymous auth or a Firestore operation is in progress                   |
| `"synced"`  | Last cloud operation succeeded                                           |
| `"error"`   | Last cloud operation failed (auth error, network error, or invalid code) |

### Methods

#### `enableSync(): Promise<void>`

1. Sets `syncStatus` to `"syncing"`.
2. Dynamically imports `syncService.ts` and calls `ensureAnonymousAuth()`.
3. Generates a new sync code via `generateSyncCode()`.
4. Persists the code and the `isSyncEnabled = true` flag via `SettingsService`.
5. Updates React state; sets `syncStatus` to `"synced"`.
6. On failure: sets `syncStatus` to `"error"`. Does not persist anything.

Guards against double-enabling with an early return if `isSyncEnabled` is already `true`.

#### `disableSync(deleteCloud: boolean): Promise<void>`

1. **Immediately** clears `isSyncEnabled` and `syncCode` from both `SettingsService` and React state. `syncStatus` returns to `"idle"`.
2. If `deleteCloud` is `true` and a sync code existed, dynamically imports `syncService.ts` and calls `deleteSyncData(codeToDelete)`. This step is **non-fatal** — if the Firestore delete fails, local state has already been cleared and the error is only logged.

#### `adoptSyncCode(code: string): Promise<void>`

Used to connect a second device to an existing sync code.

1. Trims and upper-cases the input.
2. Validates the code against `SYNC_CODE_PATTERN` (`/^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/`). If invalid, sets `syncStatus` to `"error"` and returns early without touching Firebase or `localStorage`.
3. Sets `syncStatus` to `"syncing"`.
4. Dynamically imports `syncService.ts` and calls `ensureAnonymousAuth()`.
5. Persists the adopted code and `isSyncEnabled = true` via `SettingsService`.
6. Updates React state; sets `syncStatus` to `"synced"`.
7. On failure: sets `syncStatus` to `"error"`.

Because `useCategoriesStore` watches `isSyncEnabled` and `syncCode` via `useSyncStore()`, setting these values triggers the subscription effect in `StoreProvider`, which immediately fetches the cloud state and dispatches a `SYNC_LOAD` action. The data from the adopted code's document appears in the UI automatically.

#### `resetSync(): void`

Generates a fresh sync code, persists it via `SettingsService`, and updates React state. Does **not** clear `isSyncEnabled`. The old cloud document is abandoned — not deleted. The next local mutation will begin writing to the new code's document.

### Provider Tree Position

`SyncProvider` must wrap `StoreProvider` because `StoreProvider` calls `useSyncStore()` internally. The required nesting order in `src/main.tsx` is:

```tsx
<SettingsProvider>
  <SyncProvider>
    <StoreProvider>
      {" "}
      {/* reads from useSyncStore() */}
      <App />
    </StoreProvider>
  </SyncProvider>
</SettingsProvider>
```

---

## `src/store/useCategoriesStore.ts` — Sync Integration

`StoreProvider` reads `{ isSyncEnabled, syncCode }` from `useSyncStore()` and wires two behaviours.

### 1. Debounced Cloud Save (`scheduleCloudSave`)

After every state change that triggers the `useEffect` watching `[state, scheduleCloudSave]`, a **1-second debounced** cloud save is scheduled. If another state change arrives within the second, the timer resets. On expiry:

1. Dynamically imports `syncService.ts` and calls `saveState(syncCode, categories, selectedCategoryID)`.
2. If the call throws, the error is logged but not surfaced to the UI.

**Echo prevention:** An `isLoadingFromSync` ref (a `React.useRef<boolean>`) is set to `true` synchronously immediately before any `SYNC_LOAD` dispatch. The `scheduleCloudSave` callback checks this flag at the start of its execution — if it is `true`, the save is skipped and the flag is cleared. This prevents an incoming remote update from being immediately echoed back to Firestore.

### 2. Real-Time Subscription

A `useEffect` keyed on `[isSyncEnabled, syncCode]` manages the Firestore subscription lifecycle:

1. When `isSyncEnabled` becomes `true` (or the component mounts with sync already enabled):
   - Calls `loadState(syncCode)` once to pull the current cloud state immediately.
   - If a cloud document exists, sets `isLoadingFromSync.current = true` and dispatches `SYNC_LOAD`.
   - Opens a `subscribeToState` listener. On each subsequent remote change, sets `isLoadingFromSync.current = true` and dispatches `SYNC_LOAD`.
2. The effect cleanup function calls `unsubscribe()`, tearing down the Firestore listener whenever sync is disabled, the sync code changes, or the component unmounts. No ghost subscriptions survive.

### `SYNC_LOAD` Reducer Case

```ts
case "SYNC_LOAD": {
  next = {
    categories: action.categories,
    selectedCategoryID: action.selectedCategoryID ?? action.categories[0]?.id ?? "",
  };
  PersistenceService.save(next.categories, next.selectedCategoryID);
  return next;
}
```

The reducer writes the incoming cloud data to `localStorage` immediately so that the remote state survives an app close without waiting for a local mutation. It falls through to `return next` before the bottom-of-reducer `PersistenceService.save()` call, so the save does not happen twice.

---

## `src/services/settingsService.ts` — Sync Keys

Two `localStorage` keys are owned by `SettingsService` for sync:

| Key               | Type stored           | Default   | Getter               | Setter                    | Clear                  |
| ----------------- | --------------------- | --------- | -------------------- | ------------------------- | ---------------------- |
| `"syncCode"`      | `string`              | `""`      | `getSyncCode()`      | `setSyncCode(code)`       | `clearSyncCode()`      |
| `"isSyncEnabled"` | `"true"` \| `"false"` | `"false"` | `getIsSyncEnabled()` | `setIsSyncEnabled(value)` | `clearIsSyncEnabled()` |

Both keys are cleared by `SettingsService.clearAll()`, which is called by the "Reset to New User" flow.

---

## `src/lib/utils.ts` — `generateSyncCode()`

```ts
export function generateSyncCode(): string {
  const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr = new Uint8Array(20);
  crypto.getRandomValues(arr);
  const chars = Array.from(arr, (byte) => ALPHABET[byte % ALPHABET.length]);
  return [
    chars.slice(0, 5).join(""),
    chars.slice(5, 10).join(""),
    chars.slice(10, 15).join(""),
    chars.slice(15, 20).join(""),
  ].join("-");
}
```

The alphabet deliberately excludes `0`, `O`, `1`, and `I` to prevent visual ambiguity when users read a code aloud or transcribe it by hand. `crypto.getRandomValues` is used instead of `Math.random` for cryptographic-quality entropy.

---

## `firestore.rules`

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /syncStates/{syncCode} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Any Firebase-authenticated request (including anonymous) can read or write any document under `syncStates/`. The sync code in the document path is the only access control — there is no per-user ownership enforced by the rules themselves.

---

## Environment Variables

Firebase credentials are injected at build time via Vite's `import.meta.env`. A `.env` file (gitignored) must exist locally for `npm run dev` and `npm run build` to work.

| Variable                            | Description                  |
| ----------------------------------- | ---------------------------- |
| `VITE_FIREBASE_API_KEY`             | Firebase web API key         |
| `VITE_FIREBASE_AUTH_DOMAIN`         | `<project>.firebaseapp.com`  |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase project ID          |
| `VITE_FIREBASE_STORAGE_BUCKET`      | `<project>.appspot.com`      |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging sender ID    |
| `VITE_FIREBASE_APP_ID`              | Firebase app registration ID |

A `.env.example` file (committed) provides the variable names without values for new contributors.

> Firebase web API keys are **not sensitive** — they identify the project but grant no admin access. Security is enforced entirely by Firestore Rules and Anonymous Auth. The variables are stored in GitHub Secrets only to keep them out of the git history, which is best practice.

---

## Bundle Impact

The Firebase SDK (`firebase/app`, `firebase/firestore`, `firebase/auth`) is loaded only when the user enables sync for the first time in a session. For users who never enable sync, the bundle is unaffected. The estimated gzipped cost of the Firebase SDK is approximately **35–45 KB**.

---

## Known Limitations

- **Last-write-wins:** There is no merge strategy. If two devices modify data simultaneously offline, whichever device syncs last overwrites the other's changes. A `updatedAt` timestamp is stored with each document but is not yet used for conflict detection.
- **Anonymous token expiry:** After a long offline period, the Firebase SDK may not be able to silently refresh the anonymous token and may issue a new `uid` on the next `signInAnonymously()` call. This is transparent in v1 because Firestore rules check only `request.auth != null`. If rules are ever tightened to a specific UID, this becomes a breaking issue.
- **No per-field updates:** `saveState` always calls `setDoc` with the full payload. There is no partial-field update (`updateDoc`) path.
- **Offline `loadState` hang:** `loadState` uses a 5-second timeout to guard against `getDoc` never resolving when offline. The real-time `subscribeToState` listener handles offline gracefully on its own via Firestore's offline cache.
