# Features — Settings Catalog — April 2026

> **Purpose:** A reference snapshot of every file in `src/features/settings/`. This module contains all settings-specific UI components, hooks, and utilities. `SettingsSheet` in `src/screens/` imports exclusively from this module's barrel (`src/features/settings/index.ts`).

---

## Table of Contents

- [Module Overview](#module-overview)
- [Barrel Export (`index.ts`)](#barrel-export-indexts)
- [Constants (`constants.ts`)](#constants-constantsts)
- [Section Components](#section-components)
  - [CategoriesGroupsSection](#categoriesgroupssection)
  - [AppearanceSection](#appearancesection)
  - [ColorThemeSection](#colorthemsection)
  - [TextSizeSection](#textsizesection)
  - [NameSection](#namesection)
  - [SyncSection](#syncsection)
  - [DataSection](#datasection)
  - [SettingsDialogPortal](#settingsdialogportal)
- [Internal Components](#internal-components)
  - [CategoryRow / GroupRow / GroupRowHeader](#categoryrow--grouprow--grouprowheader)
  - [AddCategoryGroupButton](#addcategorygroupbutton)
  - [CategoriesGroupsSection sub-layouts](#categoriesgroupssection-sub-layouts)
  - [Dialog components](#dialog-components)
  - [SectionLabel / SettingsCard](#sectionlabel--settingscard)
- [Hooks](#hooks)
  - [useSettingsDialogs](#usesettingsdialogs)
  - [useCategoryDrag](#usecategorydrag)
  - [useGroupDrag](#usegroupdrag)
  - [useAddFlowDialogs](#useaddflowdialogs)
  - [useDeleteDialogs](#usedeletedialogs)
  - [useRenameDialogs](#userenamedialogss)
  - [useGroupAssignment](#usegroupassignment)
  - [useExpandedGroups](#useexpandedgroups)
- [Utilities (`utils/dragUtils.ts`)](#utilities-utilsdragutilsts)

---

## Module Overview

```
src/features/settings/
├── index.ts                        ← Barrel export (only items consumed by SettingsSheet)
├── constants.ts                    ← Shared constants (INPUT_CLASS)
├── components/
│   ├── AppearanceSection.tsx       ← Light / System / Dark toggle
│   ├── ColorThemeSection.tsx       ← Green / Blue / Orange color theme picker
│   ├── TextSizeSection.tsx         ← xs / s / m / l / xl text size selector
│   ├── NameSection.tsx             ← User name inline editor
│   ├── SyncSection.tsx             ← Sync enable/disable, code display, adopt flow
│   ├── DataSection.tsx             ← Reset to new user trigger
│   ├── CategoriesGroupsSection.tsx ← Category + group list with drag-to-reorder
│   ├── SettingsDialogPortal.tsx    ← All confirmation/action dialogs rendered via portal
│   ├── AddCategoryGroupButton.tsx  ← "Add Category" / "Add Group" floating button
│   ├── AddFlow.tsx                 ← Multi-step add flow sheet (category or group)
│   ├── CategoryRow.tsx             ← Single draggable category row
│   ├── GroupRow.tsx                ← Single draggable group row with expand/collapse
│   ├── GroupRowHeader.tsx          ← Header portion of a GroupRow
│   ├── GroupCategoryList.tsx       ← Category list inside an expanded group
│   ├── UngroupedSection.tsx        ← Section for categories not assigned to any group
│   ├── FlatLayout.tsx              ← Flat (no-groups) category list layout
│   ├── GroupAssignmentSheet.tsx    ← Bottom sheet for assigning a category to a group
│   ├── SectionLabel.tsx            ← Styled section-header label ("CATEGORIES", etc.)
│   ├── SettingsCard.tsx            ← Rounded card container for settings sections
│   ├── AddCategoryDialog.tsx       ← Dialog: add a new category
│   ├── AddGroupDialog.tsx          ← Dialog: add a new group
│   ├── AdoptSyncCodeDialog.tsx     ← Dialog: enter an existing sync code
│   ├── DeleteCategoryDialog.tsx    ← Dialog: confirm category deletion
│   ├── DeleteGroupDialog.tsx       ← Dialog: confirm group deletion
│   ├── DisableSyncDialog.tsx       ← Dialog: confirm disabling sync
│   ├── RenameCategoryDialog.tsx    ← Dialog: rename a category
│   └── RenameGroupDialog.tsx       ← Dialog: rename a group
├── hooks/
│   ├── useSettingsDialogs.ts       ← Aggregate hook composing all sub-hooks
│   ├── useCategoryDrag.ts          ← Drag-to-reorder for category rows
│   ├── useGroupDrag.ts             ← Drag-to-reorder for group rows
│   ├── useAddFlowDialogs.ts        ← Add category / add group dialog state
│   ├── useDeleteDialogs.ts         ← Delete category / delete group dialog state
│   ├── useRenameDialogs.ts         ← Rename category / rename group dialog state
│   ├── useGroupAssignment.ts       ← Group assignment sheet state
│   └── useExpandedGroups.ts        ← Expanded/collapsed state per group ID
└── utils/
    └── dragUtils.ts                ← Pure drag math helpers (no React)
```

---

## Barrel Export (`index.ts`)

`src/features/settings/index.ts` is the **only** import path that `SettingsSheet` (and any other external consumer) should use. Internal files import directly from sibling paths within the feature. Adding an export here is required before it can be used outside the feature.

### Exported section components

| Export                    | File                                     |
| ------------------------- | ---------------------------------------- |
| `AppearanceSection`       | `components/AppearanceSection.tsx`       |
| `ColorThemeSection`       | `components/ColorThemeSection.tsx`       |
| `TextSizeSection`         | `components/TextSizeSection.tsx`         |
| `NameSection`             | `components/NameSection.tsx`             |
| `SyncSection`             | `components/SyncSection.tsx`             |
| `DataSection`             | `components/DataSection.tsx`             |
| `CategoriesGroupsSection` | `components/CategoriesGroupsSection.tsx` |
| `SettingsDialogPortal`    | `components/SettingsDialogPortal.tsx`    |

### Exported hooks and types

| Export                     | Kind |
| -------------------------- | ---- |
| `useCategoryDrag`          | Hook |
| `CatDragState`             | Type |
| `UseCategoryDragReturn`    | Type |
| `useGroupDrag`             | Hook |
| `GroupDragState`           | Type |
| `UseGroupDragReturn`       | Type |
| `useSettingsDialogs`       | Hook |
| `UseSettingsDialogsReturn` | Type |

---

## Constants (`constants.ts`)

| Constant      | Value description                                                                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `INPUT_CLASS` | Tailwind class string for all `<Input>` elements within settings dialogs and forms. Applies surface-input background, primary text color, green focus ring, no border by default. |

---

## Section Components

### `CategoriesGroupsSection`

The most complex section. Renders the full category and group management UI.

**Behavior depends on `hasGroups`:**

- **No groups (`FlatLayout`):** All categories shown as a flat draggable list. No group headers or expand/collapse.
- **Has groups:** Groups shown with `GroupRow` (draggable header, expand/collapse toggle) containing `GroupCategoryList` (draggable category rows within the group). `UngroupedSection` appended below for ungrouped categories.

**Props:**

| Prop        | Type                       | Description                      |
| ----------- | -------------------------- | -------------------------------- |
| `catDrag`   | `UseCategoryDragReturn`    | Category drag state and handlers |
| `groupDrag` | `UseGroupDragReturn`       | Group drag state and handlers    |
| `dialogs`   | `UseSettingsDialogsReturn` | Dialog open/close handlers       |
| `onAddFlow` | `() => void`               | Opens the `AddFlow` sheet        |

**Store access:** `useCategoriesStore()` for categories and groups.

---

### `AppearanceSection`

Renders a segmented toggle group with three options: **Light**, **System**, **Dark**.

- Reads `appearanceMode` from `useSettingsStore()`.
- Calls `setAppearanceMode(mode)` on selection.
- Uses `SettingsCard` as wrapper.
- No props — store-connected.

---

### `ColorThemeSection`

Renders a segmented toggle group with three color swatches: **Green**, **Blue**, **Orange**.

- Reads `colorTheme` from `useSettingsStore()`.
- Calls `setColorTheme(theme)` on selection.
- Each option shows a filled color circle preview using the corresponding `--color-brand-*` token.
- Uses `SettingsCard` as wrapper.
- No props — store-connected.

---

### `TextSizeSection`

Renders a segmented toggle group with five steps: **xs**, **s**, **m**, **l**, **xl**.

- Reads `textSize` from `useSettingsStore()`.
- Calls `setTextSize(size)` on selection.
- Each option is labeled with a preview text rendered at the corresponding `--text-size-base` scale.
- Uses `SettingsCard` as wrapper.
- No props — store-connected.

---

### `NameSection`

Renders an inline text input for the user's display name.

- Reads `userName` from `useSettingsStore()`.
- Calls `setUserName(name)` on blur or Enter.
- `autoCapitalize="words"`.
- Uses `SettingsCard` as wrapper.
- No props — store-connected.

---

### `SyncSection`

Renders the full cloud sync UI. State-dependent rendering:

| State         | Rendered UI                                                        |
| ------------- | ------------------------------------------------------------------ |
| Sync disabled | "Enable Sync" button + `SyncBenefitsCard` explanation              |
| Sync enabled  | Sync code display (formatted), device count, "Disable Sync" button |

Also provides an "Adopt Code" flow for entering a sync code from another device.

- Reads from `useSyncStore()`.
- No props — store-connected.

---

### `DataSection`

Renders a single destructive action: **Reset to New User**.

- Tapping opens `DeleteCategoryDialog` (re-used for the reset confirmation) or a dedicated reset dialog.
- On confirm: calls `dialogs.handleReset()` which calls `settings.resetToNewUser()` and redirects to onboarding.
- Uses `SettingsCard` as wrapper.

**Props:**

| Prop      | Type                       | Description             |
| --------- | -------------------------- | ----------------------- |
| `dialogs` | `UseSettingsDialogsReturn` | Reset handler and state |

---

### `SettingsDialogPortal`

A single component that renders **all** settings dialogs (rename, delete, add, reset, sync adopt, group assignment) via React portals. Centralizing dialogs here prevents z-index stacking issues and keeps section components free of dialog JSX.

**Props:**

| Prop      | Type                       | Description                               |
| --------- | -------------------------- | ----------------------------------------- |
| `dialogs` | `UseSettingsDialogsReturn` | All dialog state and action callbacks     |
| `store`   | `StoreContextValue`        | Categories/groups data for dialog content |

Contained dialogs: `AddCategoryDialog`, `AddGroupDialog`, `RenameCategoryDialog`, `RenameGroupDialog`, `DeleteCategoryDialog`, `DeleteGroupDialog`, `AdoptSyncCodeDialog`, `DisableSyncDialog`, `GroupAssignmentSheet`.

---

## Internal Components

### `CategoryRow / GroupRow / GroupRowHeader`

| Component        | Purpose                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `CategoryRow`    | Single draggable row for a category. Shows name, drag handle, long-press → rename/delete/assign |
| `GroupRow`       | Draggable group container. Header + expand/collapse. Contains `GroupCategoryList`.              |
| `GroupRowHeader` | The visible header portion of a `GroupRow` (icon, name, chevron, drag handle).                  |

---

### `AddCategoryGroupButton`

A floating button rendered at the bottom of `CategoriesGroupsSection`. Renders two actions depending on context:

- **"Add Category"** — always present.
- **"Add Group"** — only when `hasGroups` or when user has previously created groups.

Tapping either opens the `AddFlow` sheet.

---

### `CategoriesGroupsSection` sub-layouts

| Component           | When used                                                   |
| ------------------- | ----------------------------------------------------------- |
| `FlatLayout`        | `hasGroups === false` — flat list of all categories         |
| `GroupCategoryList` | Inside each expanded `GroupRow` — categories for that group |
| `UngroupedSection`  | Bottom of grouped layout — categories with no group         |

---

### Dialog components

All dialogs are `<Dialog>` (shadcn) with a controlled `open` prop managed by the sub-hooks in `hooks/`.

| Component              | Trigger                                   |
| ---------------------- | ----------------------------------------- |
| `AddCategoryDialog`    | "Add Category" from `AddFlow`             |
| `AddGroupDialog`       | "Add Group" from `AddFlow`                |
| `RenameCategoryDialog` | Long-press → "Rename" on a category row   |
| `RenameGroupDialog`    | Long-press → "Rename" on a group row      |
| `DeleteCategoryDialog` | Long-press → "Delete" on a category row   |
| `DeleteGroupDialog`    | Long-press → "Delete" on a group row      |
| `AdoptSyncCodeDialog`  | "Adopt Code" button in `SyncSection`      |
| `DisableSyncDialog`    | "Disable Sync" button in `SyncSection`    |
| `GroupAssignmentSheet` | Long-press → "Assign Group" on a category |

---

### `SectionLabel / SettingsCard`

| Component      | Purpose                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `SectionLabel` | Renders a small all-caps label above a settings section (e.g. "CATEGORIES", "APPEARANCE").            |
| `SettingsCard` | Rounded card container (`rounded-2xl`, `var(--color-surface-card)`) wrapping a settings section body. |

---

## Hooks

### `useSettingsDialogs`

**File:** `src/features/settings/hooks/useSettingsDialogs.ts`

Aggregates all settings dialog hooks into a single return value for `SettingsSheet`. The aggregated type `UseSettingsDialogsReturn` is the intersection of all sub-hook return types plus `handleReset`.

```
useSettingsDialogs(onCloseSheet)
  ├── useRenameDialogs()
  ├── useDeleteDialogs()
  ├── useGroupAssignment()
  ├── useAddFlowDialogs()
  └── handleReset (inline — accesses store, settings, sync)
```

`handleReset`:

1. If sync is enabled, deletes the Firestore document via dynamic import.
2. Calls `sync.disableSync(false)`.
3. Calls `store.resetCategories()`.
4. Calls `settings.resetToNewUser()`.
5. Calls `onCloseSheet()`.

---

### `useCategoryDrag`

**File:** `src/features/settings/hooks/useCategoryDrag.ts`

Manages drag-to-reorder state for category rows in `CategoriesGroupsSection`.

**Returns (`UseCategoryDragReturn`):**

| Field            | Type                      | Description                                     |
| ---------------- | ------------------------- | ----------------------------------------------- |
| `catDragState`   | `CatDragState`            | `{ draggingId, overIndex }` — visual drag state |
| `onCatDragStart` | `(id: string) => void`    | Called on drag start for a category row         |
| `onCatDragOver`  | `(index: number) => void` | Called when dragging over an index              |
| `onCatDragEnd`   | `() => void`              | Commits the reorder and resets drag state       |

---

### `useGroupDrag`

**File:** `src/features/settings/hooks/useGroupDrag.ts`

Manages drag-to-reorder for group rows and expand/collapse per group.

**Returns (`UseGroupDragReturn`):**

| Field              | Type                      | Description                                      |
| ------------------ | ------------------------- | ------------------------------------------------ |
| `groupDragState`   | `GroupDragState`          | `{ draggingId, overIndex }` — visual drag state  |
| `expandedGroupIDs` | `Set<string>`             | IDs of currently expanded groups                 |
| `toggleExpanded`   | `(id: string) => void`    | Expands or collapses the group with the given ID |
| `onGroupDragStart` | `(id: string) => void`    | Called on drag start for a group row             |
| `onGroupDragOver`  | `(index: number) => void` | Called when dragging over a group index          |
| `onGroupDragEnd`   | `() => void`              | Commits the reorder and resets drag state        |

---

### `useAddFlowDialogs`

**File:** `src/features/settings/hooks/useAddFlowDialogs.ts`

Controls the open/close state for the `AddFlow` bottom sheet and the `AddCategoryDialog` / `AddGroupDialog` dialogs.

---

### `useDeleteDialogs`

**File:** `src/features/settings/hooks/useDeleteDialogs.ts`

Controls open/close state and target IDs for `DeleteCategoryDialog` and `DeleteGroupDialog`.

---

### `useRenameDialogs`

**File:** `src/features/settings/hooks/useRenameDialogs.ts`

Controls open/close state, target ID, and current name for `RenameCategoryDialog` and `RenameGroupDialog`.

---

### `useGroupAssignment`

**File:** `src/features/settings/hooks/useGroupAssignment.ts`

Controls open/close state, target category ID, and current group ID for `GroupAssignmentSheet`.

---

### `useExpandedGroups`

**File:** `src/features/settings/hooks/useExpandedGroups.ts`

Manages a `Set<string>` of expanded group IDs. All groups start collapsed. Called by `useGroupDrag` internally.

---

## Utilities (`utils/dragUtils.ts`)

**File:** `src/features/settings/utils/dragUtils.ts`

Pure helper functions for drag-to-reorder math. No React dependencies.

| Function       | Description                                                          |
| -------------- | -------------------------------------------------------------------- |
| `clampIndex`   | Clamps a target index within valid array bounds                      |
| `reorderArray` | Returns a new array with the item at `from` moved to `to`; immutable |
