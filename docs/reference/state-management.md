# State Management

ListMaster uses **React Context + `useReducer`** (for checklist data) and **React Context + `useState`** (for settings) as its global state system. There is no external state library (no Redux, Zustand, Jotai, etc.).

---

## Provider Setup

Both context providers are instantiated in `src/main.tsx` and wrap the entire React tree. They are never instantiated inside a screen or component.

```tsx
// src/main.tsx (simplified)
<SettingsProvider>
  <StoreProvider>
    <App />
  </StoreProvider>
</SettingsProvider>
```

> **Naming note:** The provider exported from `src/store/useCategoriesStore.ts` is called `StoreProvider` (not `CategoriesProvider`). The context it holds is not exported directly — consumers always access it through the `useCategoriesStore()` hook.

Components consume stores via the exported hook — never by accessing the context object directly:

```ts
// ✅ Correct
const store = useCategoriesStore();

// ❌ Wrong — never use useContext(StoreContext) directly
```

---

## `useCategoriesStore` (`src/store/useCategoriesStore.ts`)

Manages the full checklist state:

- `categories: Category[]` — the ordered list of all categories
- `selectedCategoryID: string` — the ID of the currently displayed category (empty string when no categories exist)
- Derived getters: `selectedCategory`, `previousCategory`, `nextCategory`, `canSelectNextCategory`, `canSelectPreviousCategory`, `canDeleteCategories`

### Mutation Pattern

All state changes are dispatched as typed `StoreAction` objects through a `useReducer` reducer. **No direct state mutation happens outside the reducer.**

```ts
dispatch({ type: "ADD_CATEGORY", name });
dispatch({ type: "DELETE_ITEM", itemID });
```

After every reducer case that modifies data, `PersistenceService.save()` is called with the new state to persist to `localStorage`. This call lives at the bottom of the reducer, after the `switch` statement — not in components. `RELOAD` and `RESET_CATEGORIES` handle their own persistence and return early.

### Category Uniqueness

`ADD_CATEGORY`, `SET_CATEGORIES`, and `RENAME_CATEGORY` all enforce case-insensitive uniqueness via the `isNameAvailable()` helper. Duplicate or empty names are silently ignored (the reducer returns the current state unchanged).

### Full Action Reference

| Action type                   | Payload fields        | Effect                                                                                                                           |
| ----------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `SELECT_CATEGORY`             | `id`                  | Sets `selectedCategoryID` if the ID exists in the categories array                                                               |
| `ADD_CATEGORY`                | `name`                | Appends a new category with a UUID; selects it immediately                                                                       |
| `SET_CATEGORIES`              | `names: string[]`     | Replaces **all** categories with a fresh list built from the name array; selects the first; used only by `OnboardingSetupScreen` |
| `RENAME_CATEGORY`             | `id`, `newName`       | Updates category name; validates uniqueness excluding the category being renamed                                                 |
| `DELETE_CATEGORY`             | `id`                  | Removes the category; minimum 1 category enforced; if deleted category was selected, selects first remaining                     |
| `MOVE_CATEGORIES`             | `from`, `to`          | Reorders the `categories` array by splicing the item at `from` and inserting it at `to`                                          |
| `SET_CATEGORY_SORT_ORDER`     | `id`, `sortOrder`     | Updates `sortOrder` on the specified category                                                                                    |
| `SET_CATEGORY_SORT_DIRECTION` | `id`, `sortDirection` | Updates `sortDirection` on the specified category                                                                                |
| `ADD_ITEM`                    | `name`                | Appends a new `ChecklistItem` with UUID and `createdAt = Date.now()` to the selected category                                    |
| `TOGGLE_ITEM`                 | `itemID`              | Flips `isChecked`; immediately re-sorts to keep unchecked items above checked items                                              |
| `DELETE_ITEM`                 | `itemID`              | Removes the item from the selected category                                                                                      |
| `CLEAR_CHECKED`               | —                     | Removes all checked items from the selected category                                                                             |
| `CHECK_ALL`                   | —                     | Sets `isChecked = true` on all items in the selected category                                                                    |
| `UNCHECK_ALL`                 | —                     | Sets `isChecked = false` on all items in the selected category                                                                   |
| `RELOAD`                      | —                     | Re-reads `localStorage` via `PersistenceService.load()` and replaces all state; does **not** re-save                             |
| `RESET_CATEGORIES`            | —                     | Clears all categories and sets `selectedCategoryID = ""`; writes an empty state to `localStorage`                                |

### Exposed Store Interface

In addition to `categories` and `selectedCategoryID`, the context value exposes these derived properties and methods:

| Name                                     | Type                        | Notes                                                                        |
| ---------------------------------------- | --------------------------- | ---------------------------------------------------------------------------- |
| `selectedCategory`                       | `Category \| null`          | The full category object for the active selection, or `null` if none         |
| `canDeleteCategories`                    | `boolean`                   | `true` when `categories.length > 1`                                          |
| `canSelectNextCategory`                  | `boolean`                   | `true` when selection is not the last category                               |
| `canSelectPreviousCategory`              | `boolean`                   | `true` when selection is not the first category                              |
| `nextCategory`                           | `Category \| null`          | The category immediately after the selected one, or `null`                   |
| `previousCategory`                       | `Category \| null`          | The category immediately before the selected one, or `null`                  |
| `selectCategory(id)`                     | `(id: string) => void`      | Dispatches `SELECT_CATEGORY`                                                 |
| `selectNextCategory()`                   | `() => void`                | Advances selection by one                                                    |
| `selectPreviousCategory()`               | `() => void`                | Moves selection back by one                                                  |
| `addCategory(name)`                      | `(name: string) => void`    | —                                                                            |
| `setCategories(names)`                   | `(names: string[]) => void` | Replaces all categories; used during onboarding                              |
| `renameCategory(id, newName)`            | —                           | —                                                                            |
| `deleteCategory(id)`                     | —                           | —                                                                            |
| `moveCategories(from, to)`               | —                           | Used by drag-to-reorder in `SettingsSheet`                                   |
| `setCategorySortOrder(id, sortOrder)`    | —                           | —                                                                            |
| `setCategorySortDirection(id, dir)`      | —                           | —                                                                            |
| `addItemToSelectedCategory(name)`        | —                           | —                                                                            |
| `toggleItemInSelectedCategory(itemID)`   | —                           | —                                                                            |
| `deleteItemFromSelectedCategory(itemID)` | —                           | —                                                                            |
| `clearCheckedItemsInSelectedCategory()`  | —                           | —                                                                            |
| `checkAllItemsInSelectedCategory()`      | —                           | —                                                                            |
| `uncheckAllItemsInSelectedCategory()`    | —                           | —                                                                            |
| `reload()`                               | —                           | Called by `App.tsx` on tab-visible; dispatches `RELOAD`                      |
| `resetCategories()`                      | —                           | Called by `SettingsSheet` "Reset to New User"; dispatches `RESET_CATEGORIES` |

### `reload()`

`store.reload()` dispatches `{ type: "RELOAD" }`, which causes the reducer to call `PersistenceService.load()` and replace all state with what's currently in `localStorage`. This is called by `App.tsx` on `document.visibilitychange` (when the tab becomes visible) to sync state if it was modified in another tab or by a service worker update.

---

## `useSettingsStore` (`src/store/useSettingsStore.ts`)

Manages user preferences. Uses `useState` instead of `useReducer` because each setting is independent and there are no compound multi-field transitions.

| Setting                  | Type                            | Persisted by                                  |
| ------------------------ | ------------------------------- | --------------------------------------------- |
| `userName`               | `string`                        | `SettingsService.setUserName()`               |
| `hasCompletedOnboarding` | `boolean`                       | `SettingsService.setHasCompletedOnboarding()` |
| `appearanceMode`         | `"system" \| "light" \| "dark"` | `SettingsService.setAppearanceMode()`         |
| `textSize`               | `TextSize`                      | `SettingsService.setTextSize()`               |

Each exported setter (e.g. `setAppearanceMode(mode)`) calls the corresponding `SettingsService` method to persist the value, then updates React state, then applies the DOM side-effect (via `applyThemeToDOM()` or `applyTextSizeToDOM()`).

### Exposed Store Interface

| Name                      | Type                             | Notes                                                         |
| ------------------------- | -------------------------------- | ------------------------------------------------------------- |
| `userName`                | `string`                         | User's display name from setup                                |
| `hasCompletedOnboarding`  | `boolean`                        | Controls routing in `App.tsx`                                 |
| `appearanceMode`          | `"system" \| "light" \| "dark"`  | Controls `data-theme` on `<html>`                             |
| `textSize`                | `TextSize`                       | Controls `--text-size-base` and `--row-padding-y` on `:root`  |
| `setUserName(name)`       | `(name: string) => void`         | Used inline by `SettingsSheet`                                |
| `completeOnboarding()`    | `() => void`                     | Called at the end of `OnboardingSetupScreen`                  |
| `setAppearanceMode(mode)` | `(mode: AppearanceMode) => void` | —                                                             |
| `setTextSize(size)`       | `(size: TextSize) => void`       | —                                                             |
| `resetToNewUser()`        | `() => void`                     | Clears all settings and checklist data; resets DOM theme/size |

### `resetToNewUser()`

Called by `SettingsSheet` when the user confirms "Reset to New User". It:

1. Calls `PersistenceService.clear()` to erase checklist data.
2. Calls `SettingsService.clearAll()` to erase all settings keys.
3. Resets all `useState` values to their defaults.
4. Calls `applyThemeToDOM("system")` and `applyTextSizeToDOM("m")` to restore the DOM to default state.

Because `hasCompletedOnboarding` becomes `false`, `App.tsx` re-renders and routes the user back to the onboarding flow.

### Flash-Free Initialization

`applyThemeToDOM()` is called **synchronously inside the `useState` initializer** in `SettingsProvider`:

```ts
const [appearanceMode, setAppearanceModeState] = useState<AppearanceMode>(
  () => {
    const mode = SettingsService.getAppearanceMode();
    applyThemeToDOM(mode); // ← runs before first React paint
    return mode;
  },
);
```

`applyTextSizeToDOM()` follows the same pattern for text size. This ensures the correct `data-theme` attribute and `--text-size-base` custom property are on `document.documentElement` before React renders anything, preventing a flash of the wrong theme or a layout shift from the wrong font size.

**Do not move these calls out of the initializers.**

---

## Local UI State

`useState` inside a component is reserved exclusively for **local UI state** — things that do not need to survive navigation or be shared between components:

- Input field values (e.g. the new-item text field)
- Modal / sheet open/close booleans
- Animation state (e.g. `isAnimating`, `dragOffset`)
- Tap feedback state (e.g. `tappedId`)

**Never store app-level data in component-local state.** If a value needs to be read by more than one component or needs to survive a re-render of its parent, it belongs in a store.
