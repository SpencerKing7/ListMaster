# Allow Duplicate Category Names Across Different Groups

## Goal

Scope category name uniqueness to the **group level** instead of globally. Two categories may share a name if they belong to different groups. Ungrouped categories (`groupID === undefined`) are treated as their own scope. Add inline validation feedback in the Add and Rename dialogs.

---

## Execution Steps

Each step is atomic. Complete them in order. Every step lists the exact file, the exact code to find, and the exact replacement.

---

### Step 1 · `src/store/reducerHelpers.ts`

**What:** Add a `groupID` parameter to `isCategoryNameAvailable()` so it only compares categories within the same group scope.

**Find (lines 9–20):**

```ts
/** Check if a category name is unique (case-insensitive), optionally excluding a given ID. */
export function isCategoryNameAvailable(
  categories: { id: string; name: string }[],
  name: string,
  excludingID?: string,
): boolean {
  return !categories.some((category) => {
    if (excludingID && category.id === excludingID) return false;
    return category.name.toLowerCase() === name.toLowerCase();
  });
}
```

**Replace with:**

```ts
/**
 * Check if a category name is unique (case-insensitive) within a group scope.
 * Categories are compared only against others sharing the same `groupID` value
 * (strict equality — `undefined === undefined` covers the ungrouped bucket).
 *
 * @param categories - Full categories array (must include `groupID`).
 * @param name - The candidate name to check.
 * @param excludingID - A category ID to skip (used when renaming).
 * @param groupID - The group scope to check within. `undefined` = ungrouped.
 */
export function isCategoryNameAvailable(
  categories: { id: string; name: string; groupID?: string }[],
  name: string,
  excludingID: string | undefined,
  groupID: string | undefined,
): boolean {
  return !categories.some((category) => {
    if (excludingID && category.id === excludingID) return false;
    if (category.groupID !== groupID) return false;
    return category.name.toLowerCase() === name.toLowerCase();
  });
}
```

**Key detail:** The 3rd and 4th parameters are **required positional** (not `?:`). Every call site must explicitly pass `undefined` when there is no excluding ID or when targeting the ungrouped scope. This prevents silent fallback to the old global check.

---

### Step 2 · `src/store/categoryHandlers.ts` — `handleAddCategory`

**What:** Pass `undefined, undefined` for ungrouped scope.

**Find (lines 24–26):**

```ts
const trimmed = normalizedName(name);
if (!trimmed || !isCategoryNameAvailable(state.categories, trimmed))
  return null;
```

**Replace with:**

```ts
const trimmed = normalizedName(name);
if (
  !trimmed ||
  !isCategoryNameAvailable(state.categories, trimmed, undefined, undefined)
)
  return null;
```

---

### Step 3 · `src/store/categoryHandlers.ts` — `handleRenameCategory`

**What:** Look up the category's `groupID` and pass it. Also remove the redundant `findIndex` guard below.

**Find (lines 63–71):**

```ts
const trimmed = normalizedName(newName);
if (!trimmed || !isCategoryNameAvailable(state.categories, trimmed, id))
  return null;
const idx = state.categories.findIndex((c) => c.id === id);
if (idx === -1) return null;
const updated = state.categories.map((c) =>
  c.id === id ? { ...c, name: trimmed } : c,
);
return { ...state, categories: updated };
```

**Replace with:**

```ts
const cat = state.categories.find((c) => c.id === id);
if (!cat) return null;
const trimmed = normalizedName(newName);
if (
  !trimmed ||
  !isCategoryNameAvailable(state.categories, trimmed, id, cat.groupID)
)
  return null;
const updated = state.categories.map((c) =>
  c.id === id ? { ...c, name: trimmed } : c,
);
return { ...state, categories: updated };
```

---

### Step 4 · `src/store/categoryHandlers.ts` — `handleSetCategories`

**What:** No logic change. Add a comment clarifying the scoping.

**Find (lines 36–37):**

```ts
/** SET_CATEGORIES — bulk-set categories from onboarding. */
export function handleSetCategories(
```

**Replace with:**

```ts
/** SET_CATEGORIES — bulk-set categories from onboarding.
 *  All categories created here are ungrouped (same groupID scope),
 *  so the inline duplicate check is sufficient without calling isCategoryNameAvailable. */
export function handleSetCategories(
```

---

### Step 5 · `src/store/categoryHandlers.ts` — `handleSetCategoryGroup`

**What:** Add name-collision validation for the destination group. Change return type to `StoreState | null`.

**Find (lines 150–157):**

```ts
/** SET_CATEGORY_GROUP */
export function handleSetCategoryGroup(
  state: StoreState,
  categoryID: string,
  groupID: string | undefined,
): StoreState {
  const updated = state.categories.map((c) =>
    c.id === categoryID ? { ...c, groupID } : c,
  );
  return { ...state, categories: updated };
}
```

**Replace with:**

```ts
/**
 * SET_CATEGORY_GROUP — reassign a category to a different group.
 * @returns null if the destination group already has a category with this name.
 */
export function handleSetCategoryGroup(
  state: StoreState,
  categoryID: string,
  groupID: string | undefined,
): StoreState | null {
  const cat = state.categories.find((c) => c.id === categoryID);
  if (!cat) return null;
  if (!isCategoryNameAvailable(state.categories, cat.name, categoryID, groupID))
    return null;
  const updated = state.categories.map((c) =>
    c.id === categoryID ? { ...c, groupID } : c,
  );
  return { ...state, categories: updated };
}
```

**Reducer impact:** None. The reducer's `if (next === null) return state` guard already handles `null` returns from any handler.

---

### Step 6 · `src/store/categoryHandlers.ts` — `handleAddCategoryWithGroup`

**What:** Pass the target `groupID` to `isCategoryNameAvailable`.

**Find (lines 164–165):**

```ts
const trimmed = normalizedName(name);
if (!trimmed || !isCategoryNameAvailable(state.categories, trimmed))
  return null;
```

**Replace with:**

```ts
const trimmed = normalizedName(name);
if (
  !trimmed ||
  !isCategoryNameAvailable(state.categories, trimmed, undefined, groupID)
)
  return null;
```

---

### Step 7 · `src/features/settings/hooks/useAddFlowDialogs.ts`

**What:** (a) Add `useMemo` import and `isCategoryNameAvailable` import. (b) Collapse three `useEffect` ref-syncs into one to stay under line ceiling. (c) Compute `isDuplicate`. (d) Add to return type and return object.

**7a — Imports.** Find (line 4):

```ts
import { useState, useCallback, useRef, useEffect } from "react";
```

Replace with:

```ts
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { isCategoryNameAvailable } from "@/store/reducerHelpers";
```

**7b — Collapse ref-syncs.** Find (lines 71–79):

```ts
useEffect(() => {
  categoryNameRef.current = addCategoryName;
}, [addCategoryName]);
useEffect(() => {
  categoryGroupIDRef.current = addCategoryGroupID;
}, [addCategoryGroupID]);
useEffect(() => {
  groupDialogNameRef.current = addGroupDialogName;
}, [addGroupDialogName]);
```

Replace with:

```ts
useEffect(() => {
  categoryNameRef.current = addCategoryName;
  categoryGroupIDRef.current = addCategoryGroupID;
  groupDialogNameRef.current = addGroupDialogName;
}, [addCategoryName, addCategoryGroupID, addGroupDialogName]);
```

**7c — Add `isDuplicate` computation.** Insert immediately after the collapsed `useEffect` block (before `confirmAddCategory`):

```ts
// Convert null (hook convention) → undefined (model convention) for group scoping
const isDuplicate = useMemo(() => {
  const trimmed = addCategoryName.trim();
  if (!trimmed) return false;
  return !isCategoryNameAvailable(
    store.categories,
    trimmed,
    undefined,
    addCategoryGroupID ?? undefined,
  );
}, [addCategoryName, addCategoryGroupID, store.categories]);
```

**7d — Update return type.** Find in `UseAddFlowDialogsReturn` interface:

```ts
  /** Confirms creation of a new category. */
  confirmAddCategory: () => void;
```

Insert before that line:

```ts
/** Whether the current add-category name collides with an existing name in the selected group. */
isDuplicate: boolean;
```

**7e — Update return object.** Find:

```ts
    confirmAddCategory,
    confirmAddGroup,
```

Replace with:

```ts
    isDuplicate,
    confirmAddCategory,
    confirmAddGroup,
```

---

### Step 8 · `src/features/settings/components/AddFlow.tsx`

**What:** Thread `isDuplicate` from props into `AddCategoryDialog`.

**8a — Add to props interface.** Find:

```ts
  /** Confirms creation of the new category. */
  onAddCategoryConfirm: () => void;
```

Insert before that line:

```ts
/** Whether the category name collides in the selected group. */
isDuplicate: boolean;
```

**8b — Destructure it.** Find:

```ts
  onAddCategoryConfirm,
  onAddGroupConfirm,
  groups,
}: AddFlowProps): JSX.Element {
```

Replace with:

```ts
  isDuplicate,
  onAddCategoryConfirm,
  onAddGroupConfirm,
  groups,
}: AddFlowProps): JSX.Element {
```

**8c — Pass to `AddCategoryDialog`.** Find:

```tsx
      <AddCategoryDialog
        isOpen={addMode === "category"}
        categoryName={addCategoryName}
```

Replace with:

```tsx
      <AddCategoryDialog
        isOpen={addMode === "category"}
        isDuplicate={isDuplicate}
        categoryName={addCategoryName}
```

---

### Step 9 · `src/features/settings/components/AddCategoryDialog.tsx`

**What:** Accept `isDuplicate` prop. Show inline error. Disable button.

**9a — Add to props interface.** Find:

```ts
/** Current category name input value. */
categoryName: string;
```

Insert before that line:

```ts
/** Whether the name collides with an existing category in the selected group. */
isDuplicate: boolean;
```

**9b — Destructure it.** Find:

```ts
  isOpen,
  categoryName,
```

Replace with:

```ts
  isOpen,
  isDuplicate,
  categoryName,
```

**9c — Add inline error text.** Find:

```tsx
          autoCapitalize="words"
        />
        {groups.length > 0 && (
```

Replace with:

```tsx
          autoCapitalize="words"
        />
        {isDuplicate && (
          <p className="text-xs px-0.5 -mt-1" style={{ color: "var(--color-danger)" }}>
            {groups.length > 0
              ? "A category with this name already exists in this group."
              : "A category with this name already exists."}
          </p>
        )}
        {groups.length > 0 && (
```

**9d — Disable button on duplicate.** Find:

```tsx
            disabled={categoryName.trim().length === 0}
```

Replace with:

```tsx
            disabled={categoryName.trim().length === 0 || isDuplicate}
```

---

### Step 10 · `src/features/settings/hooks/useRenameDialogs.ts`

**What:** (a) Add `useMemo` import and `isCategoryNameAvailable` import. (b) Compute `isRenameDuplicate` by deriving `groupID` from `store.categories`. (c) Add to return type and return object.

**10a — Imports.** Find:

```ts
import { useState, useCallback } from "react";
```

Replace with:

```ts
import { useState, useCallback, useMemo } from "react";
import { isCategoryNameAvailable } from "@/store/reducerHelpers";
```

**10b — Add computation.** Insert immediately after `saveRenameCategory` (before the `// ── Rename group ──` comment):

```ts
// Derive the groupID of the category being renamed from the store
const renameGroupID = useMemo(() => {
  if (!categoryToRename) return undefined;
  return store.categories.find((c) => c.id === categoryToRename.id)?.groupID;
}, [categoryToRename, store.categories]);

const isRenameDuplicate = useMemo(() => {
  if (!categoryToRename) return false;
  const trimmed = renameCategoryName.trim();
  if (!trimmed) return false;
  return !isCategoryNameAvailable(
    store.categories,
    trimmed,
    categoryToRename.id,
    renameGroupID,
  );
}, [categoryToRename, renameCategoryName, store.categories, renameGroupID]);
```

**10c — Update return type.** Find in `UseRenameDialogsReturn`:

```ts
  /** Saves the renamed category and closes the dialog. */
  saveRenameCategory: () => void;
```

Insert before that line:

```ts
/** Whether the rename input collides with an existing name in the same group. */
isRenameDuplicate: boolean;
/** Whether any groups exist (for adaptive error message). */
hasGroups: boolean;
```

**10d — Update return object.** Find:

```ts
    saveRenameCategory,
    groupToRename,
```

Replace with:

```ts
    saveRenameCategory,
    isRenameDuplicate,
    hasGroups: store.groups.length > 0,
    groupToRename,
```

---

### Step 11 · `src/features/settings/components/RenameCategoryDialog.tsx`

**What:** Accept `isRenameDuplicate` and `hasGroups` props. Show inline error. Disable button.

**11a — Add to props interface.** Find:

```ts
/** Current value of the rename input field. */
renameCategoryName: string;
```

Insert before that line:

```ts
/** Whether the new name collides with an existing category in the same group. */
isRenameDuplicate: boolean;
/** Whether any groups exist (for adaptive error message). */
hasGroups: boolean;
```

**11b — Destructure.** Find:

```ts
  categoryToRename,
  renameCategoryName,
  onNameChange,
```

Replace with:

```ts
  categoryToRename,
  isRenameDuplicate,
  hasGroups,
  renameCategoryName,
  onNameChange,
```

**11c — Add inline error.** Find:

```tsx
          className={INPUT_CLASS}
          autoFocus
        />
        <DialogFooter className="flex-row gap-2 mt-1">
```

Replace with:

```tsx
          className={INPUT_CLASS}
          autoFocus
        />
        {isRenameDuplicate && (
          <p className="text-xs px-0.5 -mt-1" style={{ color: "var(--color-danger)" }}>
            {hasGroups
              ? "A category with this name already exists in this group."
              : "A category with this name already exists."}
          </p>
        )}
        <DialogFooter className="flex-row gap-2 mt-1">
```

**11d — Disable Save button.** Find the Save `<Button>`:

```tsx
            style={{ color: "var(--color-brand-green)" }}
            onClick={onSave}
```

Replace with:

```tsx
            style={{ color: "var(--color-brand-green)" }}
            disabled={renameCategoryName.trim().length === 0 || isRenameDuplicate}
            onClick={onSave}
```

---

### Step 12 · `src/features/settings/components/SettingsDialogPortal.tsx`

**What:** Pass new props through to dialogs. These values flow through `d` (the `UseSettingsDialogsReturn` type) automatically since Steps 7 and 10 added them to the sub-hook return types which are spread into the composite type.

**12a — AddFlow.** Find:

```tsx
        onAddCategoryConfirm={d.confirmAddCategory}
```

Insert before that line:

```tsx
        isDuplicate={d.isDuplicate}
```

**12b — RenameCategoryDialog.** Find:

```tsx
      <RenameCategoryDialog
        categoryToRename={d.categoryToRename}
        renameCategoryName={d.renameCategoryName}
```

Replace with:

```tsx
      <RenameCategoryDialog
        categoryToRename={d.categoryToRename}
        isRenameDuplicate={d.isRenameDuplicate}
        hasGroups={d.hasGroups}
        renameCategoryName={d.renameCategoryName}
```

---

### Step 13 · `docs/reference/state-management.md`

**What:** Update the "Category Uniqueness" section.

**Find (line 58):**

```
`ADD_CATEGORY`, `SET_CATEGORIES`, and `RENAME_CATEGORY` all enforce case-insensitive uniqueness via the `isNameAvailable()` helper. Duplicate or empty names are silently ignored (the reducer returns the current state unchanged). `ADD_GROUP` and `RENAME_GROUP` enforce the same uniqueness via `isGroupNameAvailable()`.
```

**Replace with:**

```
`ADD_CATEGORY`, `ADD_CATEGORY_WITH_GROUP`, `SET_CATEGORIES`, `RENAME_CATEGORY`, and `SET_CATEGORY_GROUP` all enforce case-insensitive uniqueness via the `isCategoryNameAvailable()` helper. Uniqueness is **scoped per group** — two categories may share the same name if they belong to different groups. Categories with `groupID === undefined` (ungrouped) are treated as their own scope. Duplicate or empty names within the same group are silently ignored (the reducer returns the current state unchanged). `ADD_GROUP` and `RENAME_GROUP` enforce the same uniqueness via `isGroupNameAvailable()`. The Add Category and Rename Category dialogs also surface inline validation errors when a name collision is detected, preventing the user from submitting.
```

---

### Step 14 · `docs/reference/data-models.md`

**What:** Add uniqueness note to the `Category` table.

**Find (line 47):**

```
| `groupID`       | `string \| undefined`        | Optional — UUID of the owning `CategoryGroup`. `undefined` means the category is ungrouped and appears under "All" and in the dimmed trailing section of any specific group view. |
```

**Replace with:**

```
| `groupID`       | `string \| undefined`        | Optional — UUID of the owning `CategoryGroup`. `undefined` means the category is ungrouped and appears under "All" and in the dimmed trailing section of any specific group view. Category name uniqueness is scoped to this field — two categories may share a name if they have different `groupID` values. |
```

---

## Verification Checklist

After all steps, confirm:

1. `npm run build` succeeds with zero TypeScript errors.
2. Create a group "Work" and a group "Tasks". Add a category "To Do" under Work. Add a category "To Do" under Tasks. Both are created successfully.
3. Try adding a third "To Do" under Work — the "Add" button is disabled and inline error text appears.
4. Open Rename for "To Do" under Work, type "To Do" — no error (same name, same category). Type the name of another category in Work — error appears, "Save" disabled.
5. With no groups, add a category, then try adding a duplicate — inline error says "A category with this name already exists." (no mention of "group").
6. Reassign a category to a group that already has one with the same name — the move is silently declined (category stays in its original group).

---

## Known Limitations

1. **"All" tab duplicate names** — When `selectedGroupID === null`, two pills labeled "To Do" appear in `CategoryPicker` with no visual disambiguation. Functionally correct (`category.id` keys). Future enhancement: append group name in "All" view.
2. **Cloud sync race** — If a sync payload adds a same-name category between the `isDuplicate` check and the button click, the dialog closes but the category isn't created. Extremely unlikely.
3. **Group deletion collision** — Deleting a group un-assigns its categories to ungrouped. If this creates a name collision in the ungrouped bucket, both categories keep their names. Data integrity is preserved; uniqueness is not retroactively enforced.

---

## Files Modified (summary)

| #   | File                                                        | Change                                                                                                                                                               |
| --- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/store/reducerHelpers.ts`                               | Add `groupID` param to `isCategoryNameAvailable`                                                                                                                     |
| 2   | `src/store/categoryHandlers.ts`                             | Update 4 handlers: `handleAddCategory`, `handleRenameCategory`, `handleSetCategoryGroup`, `handleAddCategoryWithGroup`; add scoping comment to `handleSetCategories` |
| 3   | `src/features/settings/hooks/useAddFlowDialogs.ts`          | Add `isDuplicate` computation; collapse ref-sync effects                                                                                                             |
| 4   | `src/features/settings/components/AddFlow.tsx`              | Thread `isDuplicate` prop                                                                                                                                            |
| 5   | `src/features/settings/components/AddCategoryDialog.tsx`    | Show inline error; disable button                                                                                                                                    |
| 6   | `src/features/settings/hooks/useRenameDialogs.ts`           | Add `isRenameDuplicate` and `hasGroups`                                                                                                                              |
| 7   | `src/features/settings/components/RenameCategoryDialog.tsx` | Show inline error; disable button                                                                                                                                    |
| 8   | `src/features/settings/components/SettingsDialogPortal.tsx` | Wire new props through to dialogs                                                                                                                                    |
| 9   | `docs/reference/state-management.md`                        | Update "Category Uniqueness" section                                                                                                                                 |
| 10  | `docs/reference/data-models.md`                             | Add per-group uniqueness note                                                                                                                                        |
