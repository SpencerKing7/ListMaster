# Data Models

All TypeScript interfaces and types are defined in `src/models/types.ts`. This file is inert — it contains only `interface` and `type` declarations, no functions, no classes, no imports.

---

## `ChecklistItem`

```ts
interface ChecklistItem {
  id: string;
  name: string;
  isChecked: boolean;
  createdAt: number;
}
```

| Field       | Type      | Notes                                                          |
| ----------- | --------- | -------------------------------------------------------------- |
| `id`        | `string`  | UUID v4, matches `UUID.uuidString` from Swift                  |
| `name`      | `string`  | The item label as entered by the user                          |
| `isChecked` | `boolean` | Whether the item has been ticked off                           |
| `createdAt` | `number`  | Unix millisecond timestamp — used for date-based sort ordering |

---

## `Category`

```ts
interface Category {
  id: string;
  name: string;
  items: ChecklistItem[];
  sortOrder?: SortOrder;
  sortDirection?: SortDirection;
  groupID?: string;
}
```

| Field           | Type                         | Notes                                                                                                                                                                                                                                                                                                         |
| --------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | `string`                     | UUID v4                                                                                                                                                                                                                                                                                                       |
| `name`          | `string`                     | The list name as displayed in the category picker                                                                                                                                                                                                                                                             |
| `items`         | `ChecklistItem[]`            | All items belonging to this list                                                                                                                                                                                                                                                                              |
| `sortOrder`     | `SortOrder \| undefined`     | Optional — defaults to `"date"` when absent (legacy data compatibility)                                                                                                                                                                                                                                       |
| `sortDirection` | `SortDirection \| undefined` | Optional — defaults to `"asc"` when absent (legacy data compatibility)                                                                                                                                                                                                                                        |
| `groupID`       | `string \| undefined`        | Optional — UUID of the owning `CategoryGroup`. `undefined` means the category is ungrouped and appears under "All" and in the dimmed trailing section of any specific group view. Category name uniqueness is scoped to this field — two categories may share a name if they have different `groupID` values. |

`sortOrder` and `sortDirection` are optional to maintain backwards compatibility with data saved before per-category sort settings were introduced. Any code reading these fields must use the `?? "date"` / `?? "asc"` fallback pattern. `groupID` is also optional for backwards compatibility — existing persisted data with no `groupID` is treated as ungrouped with zero migration needed.

---

## `CategoryGroup`

```ts
interface CategoryGroup {
  id: string;
  name: string;
  sortOrder: number;
}
```

| Field       | Type     | Notes                                                                    |
| ----------- | -------- | ------------------------------------------------------------------------ |
| `id`        | `string` | UUID v4                                                                  |
| `name`      | `string` | User-visible label — e.g. `"Shopping"`, `"Work"`                         |
| `sortOrder` | `number` | Display order among groups. Managed by the `MOVE_GROUPS` reducer action. |

`CategoryGroup` is a power-user feature. If `groups` is an empty array, the `GroupTabBar` is not rendered and the app behaves identically to before groups were introduced.

---

## `SortOrder`

```ts
type SortOrder = "date" | "alpha";
```

| Value     | Meaning                                    |
| --------- | ------------------------------------------ |
| `"date"`  | Sort items by `createdAt` timestamp        |
| `"alpha"` | Sort items by `name` using `localeCompare` |

---

## `SortDirection`

```ts
type SortDirection = "asc" | "desc";
```

| Value    | Meaning                                         |
| -------- | ----------------------------------------------- |
| `"asc"`  | Ascending — oldest first (date) or A→Z (alpha)  |
| `"desc"` | Descending — newest first (date) or Z→A (alpha) |

---

## `TextSize`

```ts
type TextSize = "xs" | "s" | "m" | "l" | "xl";
```

A five-step scale for the checklist item font size. Maps to `rem` values via `applyTextSizeToDOM()` in `src/store/useTheme.ts`, which sets the `--text-size-item` CSS custom property on `:root`.

---

## `AppearanceMode`

```ts
type AppearanceMode = "system" | "light" | "dark";
```

| Value      | Meaning                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------- |
| `"system"` | Removes `data-theme` from `<html>` — OS `prefers-color-scheme` media query controls the theme |
| `"light"`  | Sets `data-theme="light"` on `<html>` — forces light mode regardless of OS setting            |
| `"dark"`   | Sets `data-theme="dark"` on `<html>` — forces dark mode regardless of OS setting              |

> **Note:** `AppearanceMode` is declared locally inside `src/store/useSettingsStore.ts` (not in `types.ts`) and is not exported from models. `SettingsService` declares its own matching local type. This is intentional: `AppearanceMode` is a UI concern owned by the settings layer. If it needs to be shared more widely, it should be moved to `types.ts`.

---

## ID Format

All `id` fields are UUID v4 strings (e.g. `"550e8400-e29b-41d4-a716-446655440000"`). This matches the `UUID.uuidString` property from Swift, ensuring compatibility if data is ever round-tripped between the iOS app and the PWA via a shared backend or export format.

IDs are generated using `crypto.randomUUID()` in the store reducer when new items or categories are created.
