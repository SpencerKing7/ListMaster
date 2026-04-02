# Local Storage — How User Data Is Stored

ListMaster stores all user data directly on the user's device using the browser's `localStorage` API. There is no server, no account, and no cloud sync. If the user clears their browser data or uninstalls the PWA, everything is gone. If they open the app on a different device or browser, they start fresh.

This document explains exactly what is saved, where it lives, what format it takes, and when it is read or written.

---

## The Two Storage Buckets

All data splits into two logical groups, each managed by a dedicated service:

| Service              | File                                 | What it stores                                      |
| -------------------- | ------------------------------------ | --------------------------------------------------- |
| `PersistenceService` | `src/services/persistenceService.ts` | The checklist data — all categories and their items |
| `SettingsService`    | `src/services/settingsService.ts`    | User preferences and app configuration              |

Neither service talks to React. They are plain objects that call `localStorage.getItem` / `setItem` / `removeItem` directly. The stores (`useCategoriesStore`, `useSettingsStore`) call these services — components never touch `localStorage` themselves.

---

## Checklist Data (`PersistenceService`)

### Storage key

```
"grocery-lists-state"
```

A single `localStorage` entry holds the entire checklist state as a JSON string.

### Stored shape

```json
{
  "lists": [ ... ],
  "selectedListID": "uuid-string-or-null"
}
```

> The field names `lists` and `selectedListID` are intentional — they mirror the `CodingKeys` aliases from the original Swift iOS app, keeping the data shape compatible.

The value of `lists` is an array of category objects. A real example with one category and two items looks like this:

```json
{
  "lists": [
    {
      "id": "3F2504E0-4F89-11D3-9A0C-0305E82C3301",
      "name": "Groceries",
      "sortOrder": "date",
      "sortDirection": "asc",
      "items": [
        {
          "id": "6BA7B810-9DAD-11D1-80B4-00C04FD430C8",
          "name": "Milk",
          "isChecked": false,
          "createdAt": 1743600000000
        },
        {
          "id": "6BA7B811-9DAD-11D1-80B4-00C04FD430C8",
          "name": "Eggs",
          "isChecked": true,
          "createdAt": 1743600060000
        }
      ]
    }
  ],
  "selectedListID": "3F2504E0-4F89-11D3-9A0C-0305E82C3301"
}
```

### Field reference

#### Top-level

| Field            | Type             | Description                                |
| ---------------- | ---------------- | ------------------------------------------ |
| `lists`          | `Category[]`     | All categories, in display order           |
| `selectedListID` | `string \| null` | The `id` of the currently visible category |

#### Per category (`Category`)

| Field           | Type                | Default if absent | Description                                                |
| --------------- | ------------------- | ----------------- | ---------------------------------------------------------- |
| `id`            | `string`            | —                 | UUID string, generated once on creation, never changes     |
| `name`          | `string`            | —                 | The display name of the category (e.g. `"Groceries"`)      |
| `items`         | `ChecklistItem[]`   | —                 | All items in this category, in the order they were created |
| `sortOrder`     | `"date" \| "alpha"` | `"date"`          | How items are sorted within the category                   |
| `sortDirection` | `"asc" \| "desc"`   | `"asc"`           | Sort direction (oldest-first or newest-first, A→Z or Z→A)  |

`sortOrder` and `sortDirection` are optional (`?`) in the TypeScript type. Legacy data saved before these fields were added will not have them. The app defaults both to `"date"` / `"asc"` when they are absent.

#### Per item (`ChecklistItem`)

| Field       | Type      | Description                                                               |
| ----------- | --------- | ------------------------------------------------------------------------- |
| `id`        | `string`  | UUID string, generated once on creation, never changes                    |
| `name`      | `string`  | The display text of the item (e.g. `"Milk"`)                              |
| `isChecked` | `boolean` | Whether the item is checked off                                           |
| `createdAt` | `number`  | Unix timestamp in **milliseconds** (`Date.now()`) when the item was added |

`createdAt` is used for date-based sorting. It is set once and never updated.

### When it is read and written

| Event                                                   | Operation                                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| App launch                                              | `PersistenceService.load()` — reads the key and parses JSON                           |
| Any item added, checked, unchecked, deleted, or renamed | `PersistenceService.save(categories, selectedCategoryID)` — overwrites the entire key |
| Category added, renamed, reordered, or deleted          | `PersistenceService.save(...)` — same as above                                        |
| Selected category changes                               | `PersistenceService.save(...)` — updates `selectedListID`                             |
| Foreground reload                                       | `PersistenceService.load()` — re-reads from storage via `store.reload()`              |
| "Reset to Factory Settings"                             | `PersistenceService.clear()` — removes the key entirely                               |

The entire state is always written as one atomic JSON string. There is no partial update — every write replaces the whole value.

---

## Settings Data (`SettingsService`)

Unlike the checklist data, each setting is stored in its **own separate `localStorage` key**. This means settings can be read and written independently, and a missing key simply means "use the default."

### Keys and values

| `localStorage` key         | TypeScript type                     | Stored as             | Default (when key absent) |
| -------------------------- | ----------------------------------- | --------------------- | ------------------------- |
| `"userName"`               | `string`                            | Plain string          | `""` (empty string)       |
| `"hasCompletedOnboarding"` | `boolean`                           | `"true"` or `"false"` | `false`                   |
| `"appearanceMode"`         | `"system" \| "light" \| "dark"`     | Plain string          | `"system"`                |
| `"textSize"`               | `"xs" \| "s" \| "m" \| "l" \| "xl"` | Plain string          | `"m"`                     |
| `"sortOrder"`              | `"date" \| "alpha"`                 | Plain string          | `"date"`                  |

A freshly installed app has no keys at all. Each setting returns its default until the user changes it.

> **Note on `sortOrder`:** This is a global fallback preference stored in settings. Individual categories also carry their own `sortOrder` and `sortDirection` fields (see above). The settings-level `sortOrder` is used only when creating a new category — it seeds the initial sort preference for that category.

### Validation

`SettingsService` validates values on read. If a stored string is not a recognized value (e.g. the key exists but contains garbage), the getter returns the default:

```ts
getTextSize(): TextSize {
  const saved = localStorage.getItem("textSize") as TextSize;
  return VALID_TEXT_SIZES.includes(saved) ? saved : "m";
}
```

This makes the app resilient to corrupted storage.

### When each setting is read and written

| Setting                  | Read                                                         | Written                                     |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------- |
| `userName`               | App launch (store initializer)                               | When user saves name in Settings            |
| `hasCompletedOnboarding` | App launch (store initializer, controls routing)             | When onboarding completes; cleared on reset |
| `appearanceMode`         | App launch (store initializer, applied synchronously to DOM) | When user changes theme in Settings         |
| `textSize`               | App launch (store initializer, applied synchronously to DOM) | When user changes text size in Settings     |
| `sortOrder`              | Not currently read at runtime (reserved for future use)      | When a category's sort order is changed     |

**`appearanceMode` and `textSize` are applied synchronously** inside the `useState` initializer in `SettingsProvider`. This means the theme and text size are applied before the first React paint, preventing a flash of the wrong theme or wrong text size on load.

---

## What "Reset to Factory Settings" Deletes

When the user taps "Reset to Factory Settings" in the Settings sheet and confirms, `settings.resetToNewUser()` is called. It removes every key:

| Key removed                | Method                                          |
| -------------------------- | ----------------------------------------------- |
| `"grocery-lists-state"`    | `PersistenceService.clear()`                    |
| `"userName"`               | `SettingsService.clearUserName()`               |
| `"hasCompletedOnboarding"` | `SettingsService.clearHasCompletedOnboarding()` |
| `"appearanceMode"`         | `SettingsService.clearAppearanceMode()`         |
| `"textSize"`               | `SettingsService.clearTextSize()`               |
| `"sortOrder"`              | `SettingsService.clearSortOrder()`              |

After clearing storage, `resetToNewUser()` also resets all in-memory React state to defaults and reapplies the DOM to system theme and medium text size. The app then navigates to `/install` — the user goes through onboarding again as if they just installed the app.

---

## Data Lifecycle Summary

```
First install
  └── No localStorage keys exist
  └── App shows OnboardingInstallScreen

Onboarding completes
  └── "userName"                   → set (e.g. "Spencer")
  └── "hasCompletedOnboarding"     → "true"
  └── "grocery-lists-state"        → first save (initial categories, empty items)

Normal use
  └── Every data change             → "grocery-lists-state" overwritten
  └── Theme / text size changes     → individual settings keys updated

App backgrounded and re-opened
  └── store.reload() reads "grocery-lists-state" again (foreground reload)

Reset to Factory Settings
  └── All 6 keys removed
  └── In-memory state reset to defaults
  └── App returns to /install
```

---

## Inspecting Your Own Data

You can view and edit the raw data in any browser's DevTools:

1. Open DevTools → **Application** tab (Chrome) or **Storage** tab (Firefox/Safari).
2. Select **Local Storage** → `https://spencerking7.github.io`.
3. You will see the six keys listed above.
4. The `grocery-lists-state` value is a JSON string — copy it and paste it into a JSON formatter to read it clearly.

> **Warning:** Editing storage directly while the app is open can cause the in-memory React state and the stored state to diverge until the next reload.
