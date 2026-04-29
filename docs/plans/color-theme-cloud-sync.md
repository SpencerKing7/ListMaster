# Plan: Color Theme Cloud Sync

## Objective

Persist `colorTheme` in the Firestore sync document so that every device sharing
a sync code automatically inherits and reflects the chosen color theme in real time.

---

## Context

`colorTheme` is currently stored only in `localStorage` via `SettingsService` and
managed by `useSettingsStore`. The Firestore `SyncPayload` document carries list
data (`lists`, `groups`, `selectedCategoryID`) and the user name, but has no
awareness of color theme. This plan wires `colorTheme` into the full sync pipeline
using the same architectural pattern as `userName` (a ref-based cross-store callback
passed through the subscription stack).

---

## Feasibility Assessment

### Option A — Add `colorTheme` to the Firestore document (recommended)

Store `colorTheme` as an optional field on the existing `syncStates/{syncCode}`
document, exactly like `userName`. Propagate it into `useSettingsStore` via a
`syncColorThemeRef` callback (mirror of `syncUserNameRef`).

✅ Consistent with the existing sync pattern.  
✅ No new Firestore collection or document needed.  
✅ Backwards compatible — optional field, defaults to `"green"` when absent.  
✅ Real-time: every `onSnapshot` delivery applies the theme immediately.  
⚠️ Color theme will sync with list data, not independently. A theme change triggers
the same debounced cloud save (1 s) that list mutations trigger.  
🔬 **Recommended.**

### Option B — Separate Firestore document for settings

Store all synced settings (`colorTheme`, future: `appearanceMode`, `textSize`) in a
dedicated `syncSettings/{syncCode}` document, with its own `onSnapshot` listener.

✅ Clean separation of concerns; settings changes don't touch list data.  
⚠️ Requires a second Firestore subscription per session.  
⚠️ Additional `firestore.rules` entry needed.  
⚠️ More files to create and wire.  
🔬 Over-engineered for a single field. Revisit if more settings need syncing.

### Option C — Sync via URL hash / broadcast channel (client-only)

Use `BroadcastChannel` to sync theme across tabs on the same device only.

⚠️ Does not solve the cross-device requirement.  
🔬 Ruled out.

---

## Architecture Notes

- `colorTheme` sync follows the **same one-directional merge rule as `userName`**:
  the remote value is applied only if the local value is the default (`"green"`).
  This prevents a second device joining an existing sync code from overwriting a
  deliberate local theme choice. If a user actively changes their theme on any
  device, that value is saved to Firestore and propagates to all other devices.

  _Alternative considered:_ always overwrite — last-write-wins, no precedence rule.
  This is simpler but risks a device that has never been configured resetting a
  custom theme. The merge rule matches the iOS app's intent.

- `saveState` already uses `setDoc` with `merge: true`, so adding `colorTheme` to
  the write payload is non-breaking for documents written by older clients.

- The `colorTheme` value is written on **every** debounced cloud save (same cadence
  as list data). There is no separate write triggered only by theme changes. This
  means a theme change propagates within ~1 s of the next list edit or immediately
  on page unload if the app flushes pending saves. To guarantee prompt propagation
  on a theme-only change, `setColorTheme` must also trigger an immediate cloud save.

---

## Implementation Steps

### Step 1 — Extend `SyncPayloadWrite` and `SyncPayloadRead` in `src/services/syncService.ts`

Add `colorTheme?: ColorTheme` to both internal payload interfaces.  
Import `type { ColorTheme }` from `@/models/types`.

```ts
// SyncPayloadWrite
colorTheme?: ColorTheme;

// SyncPayloadRead
colorTheme?: ColorTheme;
```

### Step 2 — Add `colorTheme` to `LoadedSyncState` in `src/services/syncService.ts`

```ts
export interface LoadedSyncState {
  // …existing fields…
  colorTheme?: ColorTheme;
}
```

Update `loadState` to forward `data.colorTheme` in the returned object.

### Step 3 — Update `saveState` signature in `src/services/syncService.ts`

Add a `colorTheme: ColorTheme` parameter and include it in `SyncPayloadWrite`:

```ts
export async function saveState(
  syncCode: string,
  categories: Category[],
  selectedCategoryID: string | null,
  groups: CategoryGroup[],
  userName: string,
  colorTheme: ColorTheme, // ← new
): Promise<void>;
```

### Step 4 — Update `subscribeToState` callback signature in `src/services/syncService.ts`

Add `colorTheme: ColorTheme | undefined` as the last parameter of the inner callback,
forwarded from `data.colorTheme`.

```ts
callback(
  data.lists,
  data.selectedCategoryID,
  data.groups ?? [],
  toUnixMs(data.updatedAt),
  data.userName,
  (data.deviceIDs ?? []).length,
  data.colorTheme, // ← new
);
```

Update the callback type signature in `subscribeToState`'s parameter accordingly.

### Step 5 — Add `syncColorTheme` to `useSettingsStore`

In `src/store/useSettingsStore.ts`:

1. Add `syncColorTheme: (theme: ColorTheme) => void` to the `SettingsState` interface.
2. Implement the function — mirrors `syncUserName`; only applies if local theme is
   the default `"green"`:

```ts
function syncColorTheme(theme: ColorTheme) {
  if (!theme || SettingsService.getColorTheme() !== "green") return;
  SettingsService.setColorTheme(theme);
  setColorThemeState(theme);
  applyColorThemeToDOM(theme, appearanceMode);
}
```

3. Expose `syncColorTheme` in the context value object.

### Step 6 — Add `syncColorThemeRef` and `getColorTheme` wiring in `src/store/useCategoriesStore.ts`

Mirror the `syncUserNameRef` / `applySyncUserName` pattern for both new callbacks:

```ts
const colorThemeRef = useRef(settings.colorTheme);
const syncColorThemeRef = useRef(settings.syncColorTheme);
useEffect(() => {
  colorThemeRef.current = settings.colorTheme;
  syncColorThemeRef.current = settings.syncColorTheme;
}, [settings.colorTheme, settings.syncColorTheme]);

const getColorTheme = useCallback(() => colorThemeRef.current, []);
const applySyncColorTheme = useCallback(
  (theme: ColorTheme) => syncColorThemeRef.current(theme),
  [],
);
```

Pass both into `useCloudSync(...)`:

```ts
useCloudSync({
  …,
  getColorTheme,
  syncColorTheme: applySyncColorTheme,
});
```

`colorThemeRef` feeds `getColorTheme` so async save callbacks always read the
latest value without closing over a stale `settings.colorTheme`.

### Step 7 — Thread `syncColorTheme` and `getColorTheme` through `useCloudSync`

In `src/store/useCloudSync.ts`:

1. Add `syncColorTheme: (theme: ColorTheme) => void` and `getColorTheme: () => ColorTheme`
   to the `UseCloudSyncParams` interface.
2. Inside the hook body, wrap both in stable refs (mirroring the existing `getUserNameRef` /
   `syncUserNameRef` pattern — a `useEffect` keeps them current):

```ts
const getColorThemeRef = useRef(getColorTheme);
const syncColorThemeRef = useRef(syncColorTheme);
useEffect(() => {
  getColorThemeRef.current = getColorTheme;
  syncColorThemeRef.current = syncColorTheme;
}, [getColorTheme, syncColorTheme]);
```

3. Forward both refs to `useCloudSyncSubscription`.
4. **Change the return type from `void` to `{ triggerSave: () => void }`** and return:

```ts
return { triggerSave: () => triggerSaveRef.current() };
```

This exposes a stable save-trigger for `StoreProvider` to call after a theme change.

### Step 8 — Thread through `useCloudSyncSubscription`

In `src/store/useCloudSyncSubscription.ts`, add `syncColorThemeRef` and
`getColorThemeRef` to both the `UseCloudSyncSubscriptionParams` interface and
the `setupSubscription(...)` call, and add both refs to the `useEffect` dependency
array. Both are already stable `RefObject`s created in `useCloudSync` so they
satisfy the exhaustive-deps rule without re-triggering the effect.

### Step 9 — Thread through `SetupSubscriptionParams` in `syncSubscriptionSetup.ts`

Add `syncColorThemeRef: RefObject<(theme: ColorTheme) => void>` to the
`SetupSubscriptionParams` interface and destructure it inside `setupSubscription`.

In the `subscribeToState` callback handler, call:

```ts
if (cloudColorTheme) syncColorThemeRef.current(cloudColorTheme);
```

### Step 10 — Thread through `resolveInitialLoad` in `syncInitialLoad.ts`

Add `syncColorThemeRef: RefObject<(theme: ColorTheme) => void>` to
`ResolveInitialLoadParams`. In the cloud-is-newer branch, call:

```ts
if (cloudState.colorTheme) syncColorThemeRef.current(cloudState.colorTheme);
```

### Step 11 — Update all `saveState` call sites to pass `colorTheme`

There are three call sites:

| File                                 | Location                             |
| ------------------------------------ | ------------------------------------ |
| `src/store/syncInitialLoad.ts`       | `saveState(...)` for local-wins push |
| `src/store/useCloudSync.ts`          | debounced save callback              |
| `src/store/syncSubscriptionSetup.ts` | local-wins conflict resolution       |

The `getColorThemeRef` created inside `useCloudSync` (Step 7) is forwarded as far
as `syncSubscriptionSetup.ts` and `syncInitialLoad.ts` via the params objects. Each
call site reads it the same way as `getUserNameRef.current()`:

```ts
await saveState(
  syncCode,
  categories,
  selectedCategoryID,
  groups,
  getUserNameRef.current(),
  getColorThemeRef.current(), // ← new
);
```

No new ref plumbing is needed in `useCategoriesStore` — `getColorTheme` is passed
into `useCloudSync` in Step 6 and the ref is managed entirely inside that hook.

### Step 12 — Trigger an immediate cloud save when `setColorTheme` is called

`setColorTheme` is defined in `SettingsProvider` (`useSettingsStore.ts`), not in
`StoreProvider`. `StoreProvider` cannot intercept or wrap it. The correct mechanism
is a **guarded `useEffect` in `StoreProvider`** that watches `settings.colorTheme`
and calls the `triggerSave` returned by `useCloudSync`.

In `src/store/useCategoriesStore.ts`:

```ts
// Consume triggerSave from useCloudSync (return type changes void → { triggerSave }).
const { triggerSave } = useCloudSync({ … });

// Guard so this effect does not fire on the initial render.
// Without this, every app load would schedule a spurious cloud save.
const hasMountedRef = useRef(false);
useEffect(() => {
  if (!hasMountedRef.current) {
    hasMountedRef.current = true;
    return;
  }
  triggerSave();
}, [settings.colorTheme, triggerSave]);
```

This guarantees a theme-only change propagates to Firestore within the 1 s debounce
window rather than waiting for the next list edit.

### Step 13 — Run `npm run build` and fix all TypeScript errors

---

## Files Modified

| File                                    | Change                                                                                                                                                                                                               |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/syncService.ts`           | Add `colorTheme` to both payload interfaces, `LoadedSyncState`, `saveState` signature, and `subscribeToState` callback                                                                                               |
| `src/store/useSettingsStore.ts`         | Add `syncColorTheme` function + expose in context; add `syncColorTheme` to `SettingsState` interface                                                                                                                 |
| `src/store/useCategoriesStore.ts`       | Add `colorThemeRef`, `syncColorThemeRef`, `getColorTheme`, `applySyncColorTheme`; pass both to `useCloudSync`; consume `triggerSave` return value; add `hasMountedRef` + `useEffect` to trigger save on theme change |
| `src/store/useCloudSync.ts`             | Add `syncColorTheme` + `getColorTheme` params; wrap both in internal refs; forward refs to subscription; **change return type `void` → `{ triggerSave: () => void }`**                                               |
| `src/store/useCloudSyncSubscription.ts` | Add `syncColorThemeRef` + `getColorThemeRef` to params; thread both into `setupSubscription`                                                                                                                         |
| `src/store/syncSubscriptionSetup.ts`    | Add both new refs to `SetupSubscriptionParams`; call `syncColorThemeRef` in snapshot handler; pass `getColorThemeRef` to `resolveInitialLoad` and all `saveState` calls                                              |
| `src/store/syncInitialLoad.ts`          | Add `syncColorThemeRef` + `getColorThemeRef` to params; call both at appropriate branch points                                                                                                                       |

## Files Created

None.
