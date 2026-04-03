# Store Catalog — April 2026

> **Purpose:** A reference snapshot of every file in `src/store/`. Documents each module's role, public API, state shape, and key implementation details. Use this when debugging state flow, planning new actions, or onboarding to the codebase.

---

## Table of Contents

- [Architecture overview](#architecture-overview)
- [useCategoriesStore.ts](#usecategoriesstorets)
- [categoriesReducer.ts](#categoriesreducerts)
- [useCategoryActions.ts](#usecategoryactionsts)
- [useCategoryDerived.ts](#usecategoryderivedts)
- [useCloudSync.ts](#usecloudsyncts)
- [categoryHandlers.ts](#categoryhandlersts)
- [itemHandlers.ts](#itemhandlersts)
- [groupHandlers.ts](#grouphandlersts)
- [reducerHelpers.ts](#reducerhelpersts)
- [useSettingsStore.ts](#usesettingsstorets)
- [useSyncStore.tsx](#usesyncstoretsx)
- [useTheme.ts](#usethemets)

---

## Architecture overview

The store layer uses **React Context + `useReducer`** for global state. There are three independent context providers:

| Provider           | File                    | Concern                              | State pattern |
| ------------------ | ----------------------- | ------------------------------------ | ------------- |
| `SettingsProvider` | `useSettingsStore.ts`   | User preferences and onboarding flag | `useState` ×4 |
| `SyncProvider`     | `useSyncStore.tsx`      | Cloud sync code, status, lifecycle   | `useState` ×3 |
| `StoreProvider`    | `useCategoriesStore.ts` | Categories, items, groups            | `useReducer`  |

**Provider nesting order** (in `main.tsx`, outermost → innermost): `SettingsProvider` → `SyncProvider` → `StoreProvider`. This order matters because `StoreProvider` reads from both `useSyncStore` and `useSettingsStore`.

### Decomposition of the categories store

`useCategoriesStore.ts` is the public API surface. Internally, it composes four extracted hooks:

```
useCategoriesStore.ts  (provider + context, ~174 lines)
├── categoriesReducer.ts  (pure reducer + StoreAction union, ~290 lines)
│   ├── categoryHandlers.ts  (category domain handlers)
│   ├── itemHandlers.ts      (item domain handlers)
│   └── groupHandlers.ts     (group domain handlers)
├── useCategoryActions.ts  (stable dispatch wrappers, ~182 lines)
├── useCategoryDerived.ts  (computed values + auto-select, ~137 lines)
└── useCloudSync.ts        (Firestore subscription + debounced save, ~185 lines)
```

---

## `useCategoriesStore.ts`

**Role:** React Context provider and public hook for the categories store.

### Exports

| Export               | Kind      | Description                                    |
| -------------------- | --------- | ---------------------------------------------- |
| `StoreProvider`      | Component | Context provider — wraps the app in `main.tsx` |
| `useCategoriesStore` | Hook      | Returns the `StoreContextValue` from context   |

### `StoreContextValue` (public API)

The context value assembles fields from three composed hooks:

| Source               | Fields                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `state` (reducer)    | `categories`, `selectedCategoryID`, `groups`, `selectedGroupID`                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `useCategoryDerived` | `selectedCategory`, `canDeleteCategories`, `canSelectNextCategory`, `canSelectPreviousCategory`, `nextCategory`, `previousCategory`, `categoriesInSelectedGroup`, `hasGroups`, `selectNextCategory`, `selectPreviousCategory`                                                                                                                                                                                                                                                                                                                 |
| `useCategoryActions` | `selectCategory`, `addCategory`, `setCategories`, `renameCategory`, `deleteCategory`, `moveCategories`, `reorderCategories`, `setCategorySortOrder`, `setCategorySortDirection`, `addItemToSelectedCategory`, `toggleItemInSelectedCategory`, `deleteItemFromSelectedCategory`, `clearCheckedItemsInSelectedCategory`, `checkAllItemsInSelectedCategory`, `uncheckAllItemsInSelectedCategory`, `reload`, `resetCategories`, `selectGroup`, `addGroup`, `renameGroup`, `deleteGroup`, `moveGroups`, `setCategoryGroup`, `addCategoryWithGroup` |
| `useCloudSync`       | _(no public fields — side-effect only)_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

### Cloud sync integration

`StoreProvider` reads `isSyncEnabled` and `syncCode` from `useSyncStore()` and `userName` / `syncUserName` from `useSettingsStore()`. These are passed to `useCloudSync` via stable refs (`userNameRef`, `syncUserNameRef`) to avoid stale closures.

---

## `categoriesReducer.ts`

**Role:** Pure reducer orchestrator. Defines the state shape, action union, initial-state loader, and delegates each action to a domain-specific handler module.

### `StoreState`

```ts
interface StoreState {
  categories: Category[];
  selectedCategoryID: string;
  groups: CategoryGroup[];
  selectedGroupID: string | null;
}
```

### `loadInitialState()`

Reads from `PersistenceService.load()`. If saved data exists with ≥1 category, restores it. `selectedGroupID` initializes to the first group's ID if groups exist, otherwise `null`. If no saved data, returns empty state (`categories: []`, `selectedCategoryID: ""`, etc.).

### `StoreAction` union (27 action types)

#### Category actions

| Action type                   | Payload                                            | Handler                          |
| ----------------------------- | -------------------------------------------------- | -------------------------------- |
| `SELECT_CATEGORY`             | `id: string`                                       | `handleSelectCategory`           |
| `ADD_CATEGORY`                | `name: string`                                     | `handleAddCategory`              |
| `SET_CATEGORIES`              | `names: string[]`                                  | `handleSetCategories`            |
| `RENAME_CATEGORY`             | `id: string, newName: string`                      | `handleRenameCategory`           |
| `DELETE_CATEGORY`             | `id: string`                                       | `handleDeleteCategory`           |
| `MOVE_CATEGORIES`             | `from: number, to: number`                         | `handleMoveCategories`           |
| `REORDER_CATEGORIES`          | `orderedIDs: string[]`                             | `handleReorderCategories`        |
| `SET_CATEGORY_SORT_ORDER`     | `id: string, sortOrder: SortOrder`                 | `handleSetCategorySortOrder`     |
| `SET_CATEGORY_SORT_DIRECTION` | `id: string, sortDirection: SortDirection`         | `handleSetCategorySortDirection` |
| `SET_CATEGORY_GROUP`          | `categoryID: string, groupID: string \| undefined` | `handleSetCategoryGroup`         |
| `ADD_CATEGORY_WITH_GROUP`     | `name: string, groupID: string`                    | `handleAddCategoryWithGroup`     |

#### Item actions

| Action type     | Payload          | Handler              |
| --------------- | ---------------- | -------------------- |
| `ADD_ITEM`      | `name: string`   | `handleAddItem`      |
| `TOGGLE_ITEM`   | `itemID: string` | `handleToggleItem`   |
| `DELETE_ITEM`   | `itemID: string` | `handleDeleteItem`   |
| `CLEAR_CHECKED` | _(none)_         | `handleClearChecked` |
| `CHECK_ALL`     | _(none)_         | `handleCheckAll`     |
| `UNCHECK_ALL`   | _(none)_         | `handleUncheckAll`   |

#### Group actions

| Action type    | Payload                       | Handler             |
| -------------- | ----------------------------- | ------------------- |
| `ADD_GROUP`    | `name: string`                | `handleAddGroup`    |
| `RENAME_GROUP` | `id: string, newName: string` | `handleRenameGroup` |
| `DELETE_GROUP` | `id: string`                  | `handleDeleteGroup` |
| `MOVE_GROUPS`  | `from: number, to: number`    | `handleMoveGroups`  |
| `SELECT_GROUP` | `id: string \| null`          | `handleSelectGroup` |

#### Meta actions (handled inline in reducer)

| Action type        | Payload                                    | Behavior                                                                       |
| ------------------ | ------------------------------------------ | ------------------------------------------------------------------------------ |
| `RELOAD`           | _(none)_                                   | Re-reads `PersistenceService.load()`, preserves group selection if still valid |
| `RESET_CATEGORIES` | _(none)_                                   | Clears state to empty, saves to persistence                                    |
| `SYNC_LOAD`        | `categories, selectedCategoryID?, groups?` | Replaces state from cloud data, preserves local group selection if valid       |

### Persistence

Every delegated handler that returns a non-null `StoreState` triggers `PersistenceService.save(next.categories, next.selectedCategoryID, next.groups)`. If a handler returns `null`, the action is silently declined (validation failed) and state is unchanged.

---

## `useCategoryActions.ts`

**Role:** Wraps every reducer action type in a stable `useCallback` so consumer components never re-render due to changing function references.

### Export

| Export               | Kind | Return type       |
| -------------------- | ---- | ----------------- |
| `useCategoryActions` | Hook | `CategoryActions` |

`CategoryActions` is an interface with 27 callback functions — one per action type. Each is a thin wrapper around `dispatch({ type, ...payload })`. All are dependency-stable via `[dispatch]`.

---

## `useCategoryDerived.ts`

**Role:** Computes read-only derived values from the store state, including group-scoped navigation.

### Export

| Export               | Kind | Return type       |
| -------------------- | ---- | ----------------- |
| `useCategoryDerived` | Hook | `CategoryDerived` |

### Key derivations

| Value                       | Computation                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `selectedCategory`          | `state.categories.find(c => c.id === state.selectedCategoryID)` or `null`                                          |
| `categoriesInSelectedGroup` | If `selectedGroupID === null`, all categories. Otherwise, `categories.filter(c => c.groupID === selectedGroupID)`. |
| `hasGroups`                 | `state.groups.length > 0`                                                                                          |
| `canSelectNextCategory`     | Selected index in group < last index                                                                               |
| `canSelectPreviousCategory` | Selected index in group > 0                                                                                        |
| `nextCategory`              | Category at `selectedIndexInGroup + 1`, or `null`                                                                  |
| `previousCategory`          | Category at `selectedIndexInGroup - 1`, or `null`                                                                  |

### Auto-select effect

A `useEffect` watches `categoriesInSelectedGroup` and `selectedCategoryID`. If the current selection is not in the visible group (e.g. after a group switch), it dispatches `SELECT_CATEGORY` with the first category in the group.

---

## `useCloudSync.ts`

**Role:** Manages the full cloud-sync lifecycle: initial Firestore load, real-time subscription, and debounced saves.

### Export

| Export         | Kind | Return type |
| -------------- | ---- | ----------- |
| `useCloudSync` | Hook | `void`      |

### Parameters (`UseCloudSyncParams`)

| Param           | Type                     | Description                                   |
| --------------- | ------------------------ | --------------------------------------------- |
| `state`         | `StoreState`             | Latest reducer state                          |
| `dispatch`      | `Dispatch<StoreAction>`  | Reducer dispatch for `SYNC_LOAD` actions      |
| `isSyncEnabled` | `boolean`                | Whether cloud sync is enabled                 |
| `syncCode`      | `string`                 | Active sync code (empty when disabled)        |
| `getUserName`   | `() => string`           | Returns latest user name for save payloads    |
| `syncUserName`  | `(name: string) => void` | Applies cloud-provided name to local settings |

### Lifecycle

1. **Subscription setup** (`useEffect` on `[isSyncEnabled, syncCode]`):
   - Dynamic-imports `syncService` (Firebase only loads when needed).
   - Calls `loadState(syncCode)` — if cloud data exists, dispatches `SYNC_LOAD` with full state. If not, writes local state to cloud.
   - Sets up `subscribeToState()` for real-time updates from other devices.
   - Real-time updates intentionally **omit `selectedCategoryID`** — each device keeps its own category selection to avoid infinite feedback loops.
   - Cleanup: unsubscribes and clears pending save timers.

2. **Debounced save** (`scheduleCloudSave`):
   - Triggered by `useEffect` on `[state.categories, state.groups]`.
   - `selectedCategoryID` is excluded from deps (local UI state) but included in the save payload for new-device seeding.
   - 1000 ms debounce. Skipped if `isLoadingFromSync` is `true` (prevents echo saves from incoming cloud data).
   - `isSyncReadyRef` gate prevents saves during the setup window before the subscription is established.

---

## `categoryHandlers.ts`

**Role:** Pure handler functions for category-domain actions. Each takes `(state, ...params)` and returns `StoreState | null` (null = decline).

### Handlers

| Function                         | Action                        | Key behavior                                                         |
| -------------------------------- | ----------------------------- | -------------------------------------------------------------------- |
| `handleSelectCategory`           | `SELECT_CATEGORY`             | Sets `selectedCategoryID` if the category exists                     |
| `handleAddCategory`              | `ADD_CATEGORY`                | Creates a new `Category` with UUID, empty items, selects it          |
| `handleSetCategories`            | `SET_CATEGORIES`              | Bulk-creates categories from names, selects the first                |
| `handleRenameCategory`           | `RENAME_CATEGORY`             | Updates category name, validates not empty/duplicate                 |
| `handleDeleteCategory`           | `DELETE_CATEGORY`             | Removes category, selects a neighbor if the deleted one was selected |
| `handleMoveCategories`           | `MOVE_CATEGORIES`             | Array splice reorder by index                                        |
| `handleReorderCategories`        | `REORDER_CATEGORIES`          | Reorders categories to match an array of IDs                         |
| `handleSetCategorySortOrder`     | `SET_CATEGORY_SORT_ORDER`     | Updates `sortOrder` on the target category                           |
| `handleSetCategorySortDirection` | `SET_CATEGORY_SORT_DIRECTION` | Updates `sortDirection` on the target category                       |
| `handleSetCategoryGroup`         | `SET_CATEGORY_GROUP`          | Assigns or removes a category from a group                           |
| `handleAddCategoryWithGroup`     | `ADD_CATEGORY_WITH_GROUP`     | Atomically creates a category and assigns it to a group              |

---

## `itemHandlers.ts`

**Role:** Pure handler functions for checklist-item actions. All operate on items within the currently selected category.

### Helpers (module-internal)

`selectedCategoryItems(state)` — returns `{ catIndex, category }` for the selected category, or `null` if not found.

### Handlers

| Function             | Action          | Key behavior                                                       |
| -------------------- | --------------- | ------------------------------------------------------------------ |
| `handleAddItem`      | `ADD_ITEM`      | Creates `ChecklistItem` with UUID + `createdAt`, prepends to items |
| `handleToggleItem`   | `TOGGLE_ITEM`   | Toggles `isChecked` on the target item                             |
| `handleDeleteItem`   | `DELETE_ITEM`   | Removes the item from the selected category                        |
| `handleClearChecked` | `CLEAR_CHECKED` | Removes all checked items from the selected category               |
| `handleCheckAll`     | `CHECK_ALL`     | Sets `isChecked = true` on all items in the selected category      |
| `handleUncheckAll`   | `UNCHECK_ALL`   | Sets `isChecked = false` on all items in the selected category     |

---

## `groupHandlers.ts`

**Role:** Pure handler functions for category-group actions.

### Handlers

| Function            | Action         | Key behavior                                                                                         |
| ------------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| `handleAddGroup`    | `ADD_GROUP`    | Creates `CategoryGroup` with UUID + `sortOrder`, validates name uniqueness                           |
| `handleRenameGroup` | `RENAME_GROUP` | Updates group name, validates not empty/duplicate                                                    |
| `handleDeleteGroup` | `DELETE_GROUP` | Removes group, unassigns categories that belonged to it, selects "All" if deleted group was selected |
| `handleMoveGroups`  | `MOVE_GROUPS`  | Array splice reorder + reassigns `sortOrder` values                                                  |
| `handleSelectGroup` | `SELECT_GROUP` | Sets `selectedGroupID` (accepts `null` for "All")                                                    |

---

## `reducerHelpers.ts`

**Role:** Pure utility functions shared across handler modules.

### Exports

| Function                  | Description                                                                  |
| ------------------------- | ---------------------------------------------------------------------------- |
| `normalizedName(value)`   | Trims and lowercases a name for case-insensitive comparison                  |
| `isCategoryNameAvailable` | Checks whether a category name is unique (case-insensitive) within the store |
| `isGroupNameAvailable`    | Checks whether a group name is unique (case-insensitive) within the store    |

---

## `useSettingsStore.ts`

**Role:** React Context provider for user preferences and onboarding state.

### Exports

| Export             | Kind      | Description                                |
| ------------------ | --------- | ------------------------------------------ |
| `SettingsProvider` | Component | Context provider — outermost in `main.tsx` |
| `useSettingsStore` | Hook      | Returns `SettingsState` from context       |

### `SettingsState` (public API)

| Field                    | Type                            | Read/Write | Description                                         |
| ------------------------ | ------------------------------- | ---------- | --------------------------------------------------- |
| `userName`               | `string`                        | Read       | User's display name                                 |
| `hasCompletedOnboarding` | `boolean`                       | Read       | Whether onboarding is finished                      |
| `appearanceMode`         | `"system" \| "light" \| "dark"` | Read       | Current theme mode                                  |
| `textSize`               | `TextSize`                      | Read       | Current text size (`"xs"` to `"xl"`)                |
| `setUserName`            | `(name: string) => void`        | Method     | Saves to `SettingsService` + updates state          |
| `syncUserName`           | `(name: string) => void`        | Method     | Cloud-provided name; only applies if local is empty |
| `completeOnboarding`     | `() => void`                    | Method     | Marks onboarding as complete                        |
| `setAppearanceMode`      | `(mode) => void`                | Method     | Saves + calls `applyThemeToDOM()`                   |
| `setTextSize`            | `(size) => void`                | Method     | Saves + calls `applyTextSizeToDOM()`                |
| `resetToNewUser`         | `() => void`                    | Method     | Clears all persistence + resets all state           |

### Flash-free initialization

Both `appearanceMode` and `textSize` are initialized in their `useState` callback with a synchronous call to `applyThemeToDOM()` / `applyTextSizeToDOM()`. This applies the correct theme and text size **before** the first React paint, preventing flash of wrong theme or layout shift.

### `resetToNewUser()`

Calls `PersistenceService.clear()` and `SettingsService.clearAll()`, then resets all four state variables to defaults and re-applies `"system"` theme and `"m"` text size to the DOM.

---

## `useSyncStore.tsx`

**Role:** React Context provider for cloud sync state and code management.

### Exports

| Export         | Kind      | Description                                   |
| -------------- | --------- | --------------------------------------------- |
| `SyncProvider` | Component | Context provider — between Settings and Store |
| `useSyncStore` | Hook      | Returns `SyncContextValue` from context       |
| `SyncStatus`   | Type      | `"idle" \| "syncing" \| "synced" \| "error"`  |

### `SyncContextValue` (public API)

| Field           | Type                                      | Read/Write | Description                                          |
| --------------- | ----------------------------------------- | ---------- | ---------------------------------------------------- |
| `syncCode`      | `string`                                  | Read       | Current sync code (empty if never enabled)           |
| `isSyncEnabled` | `boolean`                                 | Read       | Whether sync is currently enabled                    |
| `syncStatus`    | `SyncStatus`                              | Read       | Current sync status indicator                        |
| `enableSync`    | `() => Promise<void>`                     | Method     | Generates new code, auths with Firebase, saves       |
| `disableSync`   | `(deleteCloud: boolean) => Promise<void>` | Method     | Disables sync; optionally deletes Firestore document |
| `adoptSyncCode` | `(code: string) => Promise<void>`         | Method     | Adopts an existing code from another device          |
| `resetSync`     | `() => void`                              | Method     | Generates a new sync code without disabling          |

### Sync code format

`XXXXX-XXXXX-XXXXX-XXXXX` — validated by `SYNC_CODE_PATTERN` regex. `adoptSyncCode` normalizes input to uppercase and validates before proceeding.

### Lazy Firebase loading

`enableSync`, `disableSync`, and `adoptSyncCode` all use `await import("@/services/syncService")` — Firebase SDK is only loaded when the user first interacts with sync. This preserves zero bundle cost for non-sync users.

---

## `useTheme.ts`

**Role:** DOM-mutating utilities for applying theme and text size preferences. Not a hook despite the filename — exports two pure functions.

### Exports

| Function             | Parameters                            | Description                                                                                  |
| -------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `applyThemeToDOM`    | `mode: "system" \| "light" \| "dark"` | Sets/removes `data-theme` attribute, updates `<meta theme-color>`, forces background repaint |
| `applyTextSizeToDOM` | `size: TextSize`                      | Sets `--text-size-base` and `--row-padding-y` CSS custom properties                          |

### Theme application details

- `"system"` → removes `data-theme`, restores both media-conditional `<meta theme-color>` tags.
- `"light"` / `"dark"` → sets `data-theme="light"` / `data-theme="dark"`, forces both meta tags to the same color.
- Forces `backgroundColor` on both `documentElement` and `body` to prevent flash between old and new theme.
- Also reads and applies `--gradient-brand-wide` to `backgroundImage` for full safe-area coverage.

### Text size values

5-step scale mapping `TextSize` → rem values:

| Token | `--text-size-base` | `--row-padding-y` |
| ----- | ------------------ | ----------------- |
| `xs`  | `0.6875rem`        | `0.45rem`         |
| `s`   | `0.8125rem`        | `0.6rem`          |
| `m`   | `1rem`             | `0.875rem`        |
| `l`   | `1.125rem`         | `1.0rem`          |
| `xl`  | `1.3125rem`        | `1.25rem`         |

### Theme-color meta tags

`setThemeColor(color, scheme)` updates `<meta name="theme-color" media="(prefers-color-scheme: ...)">` tags so the iOS status bar area matches the current surface background. Light: `#f0f6f3`. Dark: `#0e1714`.
