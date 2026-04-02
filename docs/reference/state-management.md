# State Management

ListMaster uses **React Context + `useReducer`** (for checklist data) and **React Context + `useState`** (for settings) as its global state system. There is no external state library (no Redux, Zustand, Jotai, etc.).

---

## Provider Setup

Both context providers are instantiated in `src/main.tsx` and wrap the entire React tree. They are never instantiated inside a screen or component.

```tsx
// src/main.tsx (simplified)
<CategoriesProvider>
  <SettingsProvider>
    <App />
  </SettingsProvider>
</CategoriesProvider>
```

Components consume stores via the exported hook — never by accessing the context object directly:

```ts
// ✅ Correct
const store = useCategoriesStore();

// ❌ Wrong — never use useContext(CategoriesContext) directly
```

---

## `useCategoriesStore` (`src/store/useCategoriesStore.ts`)

Manages the full checklist state:

- `categories: Category[]` — the ordered list of all categories
- `selectedCategoryID: string | null` — which category is currently displayed
- Derived getters: `selectedCategory`, `previousCategory`, `nextCategory`, `canSelectNextCategory`, `canSelectPreviousCategory`

### Mutation Pattern

All state changes are dispatched as typed `StoreAction` objects through a `useReducer` reducer. **No direct state mutation happens outside the reducer.**

```ts
dispatch({ type: "ADD_CATEGORY", payload: { name } });
dispatch({ type: "DELETE_ITEM", payload: { categoryId, itemId } });
```

After every reducer case that changes data, `PersistenceService.save()` is called with the new state to persist to `localStorage`. This happens inside the reducer itself — not in components.

### Key Actions

| Action type          | Effect                                                                     |
| -------------------- | -------------------------------------------------------------------------- |
| `ADD_CATEGORY`       | Appends a new category with a UUID                                         |
| `DELETE_CATEGORY`    | Removes category by ID; adjusts selection                                  |
| `RENAME_CATEGORY`    | Updates category name in-place                                             |
| `REORDER_CATEGORIES` | Moves a category to a new index                                            |
| `ADD_ITEM`           | Appends a new checklist item to the selected category                      |
| `DELETE_ITEM`        | Removes an item by ID from a category                                      |
| `TOGGLE_ITEM`        | Flips `isChecked` on an item                                               |
| `CLEAR_CHECKED`      | Removes all checked items from the selected category                       |
| `SET_SORT_ORDER`     | Updates `sortOrder` on a specific category                                 |
| `SET_SORT_DIRECTION` | Updates `sortDirection` on a specific category                             |
| `RELOAD`             | Re-reads `localStorage` via `PersistenceService.load()` and replaces state |
| `SELECT_CATEGORY`    | Sets `selectedCategoryID`                                                  |
| `SELECT_NEXT`        | Advances selection to the next category                                    |
| `SELECT_PREVIOUS`    | Moves selection to the previous category                                   |

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

This ensures the correct `data-theme` attribute is on `document.documentElement` before React renders anything, preventing a flash of the wrong theme.

---

## Local UI State

`useState` inside a component is reserved exclusively for **local UI state** — things that do not need to survive navigation or be shared between components:

- Input field values (e.g. the new-item text field)
- Modal / sheet open/close booleans
- Animation state (e.g. `isAnimating`, `dragOffset`)
- Tap feedback state (e.g. `tappedId`)

**Never store app-level data in component-local state.** If a value needs to be read by more than one component or needs to survive a re-render of its parent, it belongs in a store.
