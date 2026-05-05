# Settings Add-Flow Redesign Plan

## Executive Summary

**Problem:** The "Add Category or Group" flow in the Settings sheet has a two-step
interaction pattern (button → ActionSheet → Dialog) that adds ~300ms of dead animation
time and an extra tap, uses a directional-mismatch animation (ActionSheet drops from top,
Sheet slides from bottom), silently swallows the Enter key when groups exist, and can
overflow the viewport on devices with four or more groups because the pill picker uses
`flex-wrap`.

**Solution:** Five proposals (A–E) in priority order progressively reduce friction.
Proposals A and B can be shipped as a single pass, D is a quick polish on top of A+B,
and C and E are independent follow-ons.

---

## Audit Verification — Corrections to the Original Report

The audit's component and hook names are all correct. The file structure matches exactly.
One detail to clarify:

- The audit called the ActionSheet "custom iOS card **from top of screen**" — confirmed.
  `action-sheet.tsx` uses `items-start`, `paddingTop: "calc(env(safe-area-inset-top, 0px)
  + 3.5rem)"`, and an entrance animation of `translateY(-12px) → 0` (slides **down**
  from near the top). The Dialog (`@base-ui/react`) drops from the top of the viewport
  at the shadcn default. Directional mismatch is real.

- The "No Group" pill is **not** pre-selected by default. `openAddCategoryDialog` in
  `useAddFlowDialogs.ts` (line 106) sets `addCategoryGroupID` to
  `store.selectedGroupID`, not `null`. When no group is selected (selectedGroupID is
  null), `selectedGroupID === null` makes "No Group" appear active — so it looks
  pre-selected. But when a group IS selected in the picker, that group is pre-selected,
  not "No Group". The audit's description is partially correct; see Proposal B detail.

- `CategoriesGroupsSection` is at 178 lines (hard ceiling 180). Any edit to that file
  must stay within 2 lines or extract first. This is a risk noted under each relevant
  proposal.

---

## File Reference Map

| File | Current Lines | Ceiling | Risk |
|---|---|---|---|
| `src/features/settings/components/AddCategoryGroupButton.tsx` | 34 | 180 | None |
| `src/features/settings/components/AddFlow.tsx` | 120 | 180 | Low |
| `src/features/settings/components/AddCategoryDialog.tsx` | 151 | 180 | Medium (close to ceiling) |
| `src/features/settings/components/AddGroupDialog.tsx` | 88 | 180 | None |
| `src/features/settings/hooks/useAddFlowDialogs.ts` | 136 | 120 | **OVER CEILING** — currently 16 lines over the 120-line hook ceiling. Any addition requires extraction first. |
| `src/features/settings/components/GroupCategoryList.tsx` | 118 | 180 | None |
| `src/features/settings/components/GroupRow.tsx` | 94 | 180 | None |
| `src/features/settings/components/GroupRowHeader.tsx` | 139 | 180 | Low |
| `src/features/settings/components/CategoriesGroupsSection.tsx` | 178 | 180 | **AT CEILING** — 2 lines of headroom only. Any addition requires extraction first. |
| `src/features/settings/components/SettingsDialogPortal.tsx` | 87 | 180 | None |
| `src/screens/SettingsSheet.tsx` | 155 | 200 | Low |

---

## CLAUDE.md Constraint Check

| Constraint | Status |
|---|---|
| No edits to `src/components/ui/` | Safe — `action-sheet.tsx` lives in `src/components/ui/`. Proposals A–D do **not** edit it; they stop importing it. |
| No direct `localStorage` | Safe — no proposal touches persistence. |
| No `any` type | Must enforce in new code. |
| File size ceilings | `useAddFlowDialogs.ts` (136 lines, ceiling 120) must be reduced before adding to it. `CategoriesGroupsSection.tsx` (178 lines, ceiling 180) must be reduced before adding to it. Both are flagged per-proposal below. |
| No hardcoded hex colors | Must use `var(--color-*)` in all new JSX. |
| `touch-action: manipulation` on buttons | Required on all new interactive elements. |
| Pointer Events API only (no mouse events) | Not applicable to these proposals (no new gesture surfaces). |
| `@/` alias imports only | Required in all new code. |
| JSDoc on all exported functions/hooks | Required. |
| Boolean naming (`is*`, `has*`, `should*`) | Required. |
| `// MARK: -` section dividers | Required. |

---

## Proposal A — Replace ActionSheet with Two Side-by-Side Buttons

**Priority:** 1 (ship first)
**Complexity:** Low
**Friction eliminated:** Two-step flow, directional mismatch, misleading button label

### What changes

The single "Add Category or Group" button and the `AddFlow`/`ActionSheet` step are
replaced by two side-by-side buttons rendered directly in `CategoriesGroupsSection`.
`AddFlow` is stripped of its ActionSheet block. The ActionSheet import is removed.
`isAddActionSheetOpen` state and its three functions (`openAddActionSheet`,
`closeAddActionSheet`) are deleted from `useAddFlowDialogs`.

When `groups.length === 0`, only the `"+ Add Category"` button is shown full-width
(no group to add to in the obvious UI sense — user can still add groups, but adding
both buttons when there are no groups yet would confuse new users).

Wait — re-reading: the audit says "When no groups exist, show only `+ Add Category`
full-width." However, users need to be able to create their first group. Recommended
adjustment: show both buttons always. When groups.length === 0, change the layout to
stacked (column) with a subtitle on the group button reading "Organize your categories
into groups". This keeps discoverability intact. If the product decision is truly
"hide group button when no groups", a single full-width category button is fine and
the group button re-appears once the first group is created. Choose one and note it
in the PR; the implementation steps below support either approach via a single
conditional.

### Files to modify

1. `src/features/settings/hooks/useAddFlowDialogs.ts` (136 lines → ~110 lines after removal)
   - **Pre-condition:** Must reduce to under 120 first, or the deletions in this proposal
     bring it under on their own. Removing `isAddActionSheetOpen`, `openAddActionSheet`,
     `closeAddActionSheet` removes ~8 lines from the interface and ~5 lines from the body.
     Net result: ~123 lines. Still slightly over. Extract the `isDuplicate` useMemo block
     (lines 88–97) into a standalone pure function `computeIsDuplicate` in
     `src/features/settings/hooks/useAddFlowDialogs.ts` itself is fine — but if that is
     still over, move it to `src/lib/utils.ts` as a pure function with no React
     dependency. However the function needs `isCategoryNameAvailable` from store, so it
     belongs in `reducerHelpers.ts` or stays in the hook. The cleanest extraction is to
     inline a helper inside the file and keep it under 120. With the ActionSheet state
     gone (~13 lines removed), the file lands at ~123 lines — still 3 over. Remove the
     three refs (`categoryNameRef`, `categoryGroupIDRef`, `groupDialogNameRef`) and the
     `useEffect` that mirrors them (lines 62–71, 10 lines) into a new hook
     `src/features/settings/hooks/useFormRefs.ts` if needed, or simply inline the
     values into callbacks using the current approach (refs are defensive but not
     required by React). The simplest fix: after ActionSheet removal (~13 lines),
     delete the JSDoc comment block on `openAddCategoryDialog` (currently 8 lines,
     lines 99–109) and reduce it to a 2-line comment. That brings the file to ~117 lines
     — under the ceiling.
   - **Changes:** Delete `isAddActionSheetOpen` state, `openAddActionSheet` callback,
     `closeAddActionSheet` callback. Delete all three from `UseAddFlowDialogsReturn`
     interface. Keep `openAddCategoryDialog` (now called directly by the button).
     Add `openAddGroupDialog` convenience callback that sets `addGroupDialogName("")`
     and `setAddMode("group")` — currently this is done inline in `AddFlow`'s
     ActionSheet action; extracting it to the hook is cleaner.

2. `src/features/settings/components/AddFlow.tsx` (120 lines → ~70 lines after removal)
   - Remove the entire `ActionSheet` JSX block (lines 69–90) and the
     `onCloseAddActionSheet` / `isAddActionSheetOpen` props from the interface and
     destructuring. Remove the `ActionSheet` import. Keep the two Dialog renders.
   - Remove `onOpenAddCategoryDialog` prop (the button now calls
     `openAddCategoryDialog` directly via the hook, not routed through `AddFlow`).
   - Props interface shrinks by ~6 lines. Component body shrinks by ~22 lines.
   - Rename `AddFlow` → `AddDialogs` to reflect that it no longer orchestrates an
     ActionSheet. Update the export name everywhere it is imported
     (`SettingsDialogPortal.tsx`).
   - File will be ~70 lines, well under ceiling.

3. `src/features/settings/components/AddCategoryGroupButton.tsx` (34 lines → ~55 lines)
   - **Rename this file** to `AddButtons.tsx` (or add a second exported component).
   - Replace the single full-width button with two side-by-side buttons in a
     `flex-row gap-2` container. Each button is half-width (`flex-1`), uses the same
     green-tinted style, and calls its own `onClick` prop.
   - New props interface: `{ onAddCategory: () => void; onAddGroup: () => void;
     hasGroups: boolean }`. When `hasGroups` is false (product decision: hide group
     button), render only the category button full-width.
   - Button labels: `"+ Category"` and `"+ Group"` (short, matches iOS convention).
   - Apply `touchAction: "manipulation"` and `active:scale-[0.97]` per UI rules.

4. `src/features/settings/components/CategoriesGroupsSection.tsx` (178 lines, **at ceiling**)
   - **Pre-condition:** Must extract before adding. The IIFE block on lines 89–138
     (the group map with drag state logic) is a good extraction candidate. Extract it
     into a new component `GroupsMapSection` in
     `src/features/settings/components/GroupsMapSection.tsx`. This removes ~50 lines
     from `CategoriesGroupsSection`, bringing it to ~128 lines, creating ~55-line new file.
   - After extraction: update the import of `AddCategoryGroupButton` to import
     `AddButtons` from the renamed file. Update the prop from `onOpenAddSheet: () =>
     void` to `onAddCategory: () => void; onAddGroup: () => void`.
   - Update the `<AddButtons>` render at the bottom of the card.

5. `src/features/settings/components/SettingsDialogPortal.tsx` (87 lines)
   - Update `AddFlow` → `AddDialogs` import.
   - Remove `isAddActionSheetOpen`, `onCloseAddActionSheet`, `onOpenAddCategoryDialog`
     props from the `AddDialogs` render (or `AddFlow` if not renamed).

6. `src/screens/SettingsSheet.tsx` (155 lines)
   - Update `CategoriesGroupsSection` call: replace `onOpenAddSheet={d.openAddActionSheet}`
     with `onAddCategory={d.openAddCategoryDialog}` and `onAddGroup={d.openAddGroupDialog}`.

7. `src/features/settings/index.ts`
   - If `AddCategoryGroupButton.tsx` is renamed to `AddButtons.tsx`, no barrel change
     needed (it is only used internally within the feature).

### Step-by-step implementation

1. Open `useAddFlowDialogs.ts`. Delete `isAddActionSheetOpen` state (line 53),
   `openAddActionSheet` callback (line 121), `closeAddActionSheet` callback (line 122),
   and their interface entries. Add `openAddGroupDialog` callback. Reduce JSDoc comment
   on `openAddCategoryDialog` to bring file under 120 lines. Verify line count.
2. Extract the groups-map IIFE in `CategoriesGroupsSection.tsx` into
   `GroupsMapSection.tsx`. Verify `CategoriesGroupsSection` is under 180 lines.
3. Rename `AddCategoryGroupButton.tsx` → `AddButtons.tsx`. Replace the single-button
   JSX with the two-button layout. Update the props interface.
4. Edit `AddFlow.tsx`: remove ActionSheet block, remove related props, rename component
   and file to `AddDialogs.tsx`.
5. Update `SettingsDialogPortal.tsx` to import `AddDialogs` and remove deleted props.
6. Update `CategoriesGroupsSection.tsx`: import `AddButtons`, update prop names.
7. Update `SettingsSheet.tsx`: pass `onAddCategory` and `onAddGroup` instead of
   `onOpenAddSheet`.
8. `npm run build && npx eslint .`

### Risks

- `CategoriesGroupsSection` is 2 lines from its ceiling. The extraction of
  `GroupsMapSection` is mandatory before any net additions.
- `useAddFlowDialogs` is 16 lines over its ceiling. The ActionSheet deletions bring it
  to ~123 lines, still 3 over. An additional minor extraction or comment trimming is
  required. Do NOT add `openAddGroupDialog` until the file is under 120 first.
- The rename of `AddFlow.tsx` → `AddDialogs.tsx` propagates to two files
  (`SettingsDialogPortal.tsx` and `index.ts`). If `AddFlow` is not exported from
  `index.ts`, it is only one update. Confirmed: `index.ts` does not export `AddFlow`,
  so only `SettingsDialogPortal.tsx` needs updating.

---

## Proposal B — Fix Enter-to-Submit in AddCategoryDialog + Ensure "No Group" Pre-selected

**Priority:** 2 (ship with A or immediately after)
**Complexity:** Low
**Friction eliminated:** Silent Enter key, confusing group picker default

### What changes

**Enter fix:** Remove the `groups.length === 0` guard on line 72–74 of
`AddCategoryDialog.tsx`. Always call `onConfirm()` on Enter. The existing disabled
state on the Confirm button (`disabled={categoryName.trim().length === 0 || isDuplicate}`)
already prevents double-submit when the name is empty or duplicate. The `enterKeyHint`
attribute changes from a lie to truth.

**"No Group" pre-selection:** In `useAddFlowDialogs.ts`, `openAddCategoryDialog`
(line 105–109) sets `addCategoryGroupID` to `store.selectedGroupID`. This means if
a group is currently selected in the category picker on the main screen, that group
is pre-selected in the dialog — which is intentional and correct. However, the "No
Group" pill only shows as active when `selectedGroupID === null`. If a group IS
active, that group's pill is highlighted, not "No Group". The audit's request to
"ensure No Group pill is visually pre-selected by default" conflicts with the existing
smart pre-population logic that puts the category in the right group. The correct fix
is: if `store.selectedGroupID` is not null, pre-select that group (current behavior,
keep it). If `store.selectedGroupID` is null, "No Group" is already highlighted
(current behavior, keep it). No change needed to the selection logic.

What IS needed: add a visual "active" ring or checkmark to the pre-selected pill so
it is immediately obvious which group is active. The current "active" state is only
a background-color change (`var(--color-brand-green)` vs `var(--color-surface-input)`).
This is already sufficient for the selection indicator. No additional change needed here
either.

**Summary:** Proposal B reduces to a 2-line change in `AddCategoryDialog.tsx`.

### Files to modify

1. `src/features/settings/components/AddCategoryDialog.tsx` (151 lines → 149 lines)
   - Lines 71–74: Replace
     ```
     if (e.key === "Enter") {
       e.preventDefault();
       if (groups.length === 0) onConfirm();
     }
     ```
     with
     ```
     if (e.key === "Enter") {
       e.preventDefault();
       onConfirm();
     }
     ```
   - This removes the `groups.length === 0` guard. The `onConfirm` callback in
     `useAddFlowDialogs.ts` already guards against empty/invalid input via the
     `if (!trimmed) return` check (line 75) and the button's `disabled` prop.
   - The `isDuplicate` check inside `confirmAddCategory` would need to be added if
     it is not already there — looking at `confirmAddCategory` (lines 73–85 of
     `useAddFlowDialogs.ts`), it does NOT check `isDuplicate` before calling the
     store action. Add an `isDuplicate` guard: `if (!trimmed || isDuplicate) return`.
     But `isDuplicate` is derived state, not in scope of `confirmAddCategory`. The
     safest approach: pass `isDuplicate` as a check condition in the `onKeyDown`
     handler alongside the `disabled` prop. Change `onConfirm()` call to:
     ```
     if (e.key === "Enter") {
       e.preventDefault();
       if (!isDuplicate) onConfirm();
     }
     ```
     This is already safe because `onConfirm` is disabled when empty (store guard)
     or duplicate (store guard is absent, so add `isDuplicate` prop check here).

### Step-by-step implementation

1. Open `AddCategoryDialog.tsx`. Update the `onKeyDown` handler to remove the
   `groups.length === 0` guard and add an `!isDuplicate` guard.
2. Verify `AddCategoryDialog` already receives `isDuplicate` as a prop — confirmed
   (line 26 of `AddCategoryDialog.tsx`, prop is `isDuplicate: boolean`).
3. `npm run build && npx eslint .`

### Risks

- None beyond the 2-line edit. The `isDuplicate` prop is already threaded through.
- If `confirmAddCategory` in the hook is called while `isDuplicate` is true (e.g.,
  keyboard shortcut), the store will create a duplicate category. The hook-level guard
  is missing. Consider adding it there too: inside `confirmAddCategory`, after
  `if (!trimmed) return`, add `if (!isCategoryNameAvailable(…)) return`. This is
  already computed in `isDuplicate` — extract to a local check or pass it through.
  Best approach: the `isDuplicate` guard in `onKeyDown` is sufficient since the
  Confirm button is also `disabled`. Document this as a known limitation if not fixed.

---

## Proposal D — Horizontal Scroll Strip for Group Pills

**Priority:** 3 (ship after A+B)
**Complexity:** Low
**Friction eliminated:** Viewport overflow on 4+ groups

### What changes

The `flex-wrap` container in `AddCategoryDialog.tsx` (lines 94–127) is replaced with
a horizontally scrollable single-row strip. Left and right CSS fade masks are added
to hint at overflow. The selected pill is scrolled into view on dialog open.

### Files to modify

1. `src/features/settings/components/AddCategoryDialog.tsx` (151 lines, ceiling 180)
   - Replace `<div className="flex flex-wrap gap-2">` with:
     ```
     <div
       className="relative"
       style={{ maskImage: "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)" }}
     >
       <div
         ref={pillScrollRef}
         className="flex flex-row gap-2 overflow-x-auto"
         style={{ scrollbarWidth: "none", paddingLeft: "8px", paddingRight: "8px" }}
       >
     ```
   - Add a `useRef<HTMLDivElement>(null)` for `pillScrollRef`.
   - Add a `useEffect` that calls `pillScrollRef.current?.querySelector('[data-selected]')?.scrollIntoView({ behavior: 'instant', inline: 'center', block: 'nearest' })` when `isOpen` becomes true and when `selectedGroupID` changes.
   - Add `data-selected` attribute to the active pill button.
   - Net line delta: +~10 lines. File goes to ~161 lines — under the 180 ceiling.

2. No other files need to change.

### CLAUDE.md constraint note

The `scrollIntoView` call should use the exact pattern from CLAUDE.md UI rules:
`scrollIntoView({ behavior: "smooth", inline: "center" })`. For dialog-open (initial
position), use `"instant"` instead of `"smooth"` to avoid janky animation before the
dialog fully appears. The CLAUDE.md rule specifies the pattern for the CategoryPicker;
this is a different scroll container so `"instant"` on open and `"smooth"` on change
are both acceptable.

### Step-by-step implementation

1. Add `useRef` import to `AddCategoryDialog.tsx` (it currently only imports `type JSX`).
2. Add `useEffect` import.
3. Add `pillScrollRef` ref.
4. Add `useEffect` for scroll-into-view on `selectedGroupID` change and `isOpen` change.
5. Replace `flex-wrap` container with the horizontal scroll container + mask wrapper.
6. Add `data-selected` attribute to the active pill.
7. `npm run build && npx eslint .`

### Risks

- The CSS mask approach (`maskImage`) requires `-webkit-mask-image` for Safari/iOS.
  Add both `maskImage` and `WebkitMaskImage` to the inline style, or use Tailwind's
  `[mask-image:...]` arbitrary variant. Forgetting the webkit prefix silently breaks
  the fade on iOS Safari (the primary target platform).
- `AddCategoryDialog.tsx` is currently at 151 lines. Adding ~10 lines brings it to
  ~161 lines. Still under the 180 ceiling. Safe.
- The `overflow-x: auto` scroll container needs `scrollbar-width: none` for Firefox
  and `::-webkit-scrollbar { display: none }` for Chrome/Safari. The `scrollbar-width`
  inline style handles Firefox. For Safari, a CSS class is needed. The existing
  codebase uses a pattern for this in the CategoryPicker — verify via
  `main-screen-ui-snapshot.md` before implementing and reuse whatever class is already
  defined.

---

## Proposal C — Inline "Add Category" Button in Each GroupCategoryList

**Priority:** 4 (medium complexity, optional)
**Complexity:** Medium
**Friction eliminated:** Having to scroll to the bottom button, then navigate back up
to see the newly added category inside a specific group

### What changes

Each expanded `GroupCategoryList` renders a `"+ Add category"` ghost button at its
bottom (below the last category row, above the empty-state message). Tapping it
bypasses the ActionSheet (which is already removed by Proposal A) and opens the
`AddCategoryDialog` with the group pre-populated.

### Files to modify

1. `src/features/settings/hooks/useAddFlowDialogs.ts` (~110 lines after Proposal A)
   - Add a new exported function `openAddCategoryDialogForGroup(groupID: string)`:
     sets `addCategoryGroupID(groupID)`, clears `addCategoryName`, sets
     `addMode("category")`.
   - Add to `UseAddFlowDialogsReturn` interface.
   - Net delta: ~6 lines. File stays under 120.

2. `src/features/settings/components/GroupCategoryList.tsx` (118 lines, ceiling 180)
   - Add `onAddCategory?: () => void` prop to `GroupCategoryListProps`.
   - After the `{groupCategories.length === 0 && <p>}` empty-state block, add:
     ```tsx
     {isExpanded && onAddCategory && (
       <button
         type="button"
         className="w-full text-left text-xs py-2 pl-1 transition-all active:scale-[0.96] active:opacity-70"
         style={{ color: "var(--color-brand-green)", touchAction: "manipulation" }}
         onClick={onAddCategory}
       >
         + Add category
       </button>
     )}
     ```
   - Net delta: ~8 lines. File goes to ~126 lines — under the 180 ceiling.

3. `src/features/settings/components/GroupRow.tsx` (94 lines, ceiling 180)
   - Add `onAddCategory?: () => void` prop to `GroupRowProps`.
   - Thread it into the `<GroupCategoryList>` render.
   - Net delta: ~4 lines. File stays under 180.

4. `src/features/settings/components/CategoriesGroupsSection.tsx` (~128 lines after Proposal A extraction)
   - Add `onAddCategoryInGroup?: (groupID: string) => void` prop.
   - In the groups map, pass `onAddCategory={() => onAddCategoryInGroup?.(group.id)}`
     to each `<GroupRow>`.
   - Net delta: ~6 lines.

5. `src/screens/SettingsSheet.tsx` (~155 lines)
   - Pass `onAddCategoryInGroup={d.openAddCategoryDialogForGroup}` to
     `CategoriesGroupsSection`.
   - Net delta: ~1 line.

6. `src/features/settings/components/SettingsDialogPortal.tsx`
   - No change needed; `AddDialogs` (formerly `AddFlow`) already wires everything.

### Step-by-step implementation

1. Add `openAddCategoryDialogForGroup` to `useAddFlowDialogs.ts` and its return type.
2. Add optional `onAddCategory` prop to `GroupCategoryList`. Add the ghost button.
3. Thread `onAddCategory` through `GroupRow` → `GroupCategoryList`.
4. Thread `onAddCategoryInGroup` through `CategoriesGroupsSection` → `GroupRow`.
5. Wire `d.openAddCategoryDialogForGroup` in `SettingsSheet.tsx`.
6. `npm run build && npx eslint .`

### Risks

- This proposal depends on Proposal A being complete first, because A removes the
  ActionSheet intermediate step. If shipped without A, the inline button would still
  open the dialog correctly (via the new `openAddCategoryDialogForGroup` which goes
  directly to the dialog), but the existing main button would still show the ActionSheet
  creating two inconsistent code paths in parallel. Implement A first.
- The `onAddCategory` prop on `GroupCategoryList` is optional (`?`) so no downstream
  component breaks if not threaded.

---

## Proposal E — Inline Rename Editing

**Priority:** 5 (medium-high complexity, optional)
**Complexity:** Medium-High
**Friction eliminated:** Extra tap + modal for rename flows

### What changes

Tapping the rename pencil icon on a `CategoryRow` or `GroupRowHeader` turns that row
into an inline editable input, saving on blur or Enter, canceling on Escape. The
existing `RenameCategoryDialog` and `RenameGroupDialog` components are retired.

### Files to modify

1. `src/features/settings/hooks/useRenameDialogs.ts` (132 lines, **over hook ceiling of 120**)
   - **Pre-condition:** Currently 12 lines over ceiling. Must extract before adding.
     Extract the rename-group block (lines 91–131) into a `useRenameGroup.ts` hook.
     `useRenameDialogs` delegates and re-exports. After extraction, `useRenameDialogs`
     drops to ~75 lines.
   - Replace `openRenameCategory` / `openRenameGroup` with `setInlineEditingCategoryID`
     / `setInlineEditingGroupID` that toggle an "inline editing" mode.
   - Remove `categoryToRename` / `groupToRename` states (dialog-based).
   - Add `inlineEditingCategoryID: string | null` and `inlineEditingGroupID: string | null`.

2. `src/features/settings/components/CategoryRow.tsx` (not yet read — must read before editing)
   - Conditionally render an `<input>` instead of the static name label when
     `category.id === inlineEditingCategoryID`.
   - Wire autoFocus, onBlur (save), onKeyDown (Enter = save, Escape = cancel).

3. `src/features/settings/components/GroupRowHeader.tsx` (139 lines, ceiling 180)
   - Same pattern for the group name.
   - Net delta: ~20 lines → ~159 lines. Under ceiling.

4. `src/features/settings/components/RenameCategoryDialog.tsx` — **delete this file**
   after verifying no other consumers.

5. `src/features/settings/components/RenameGroupDialog.tsx` — **delete this file**
   after verifying no other consumers.

6. `src/features/settings/components/SettingsDialogPortal.tsx`
   - Remove `RenameCategoryDialog` and `RenameGroupDialog` renders and imports.

7. `src/features/settings/index.ts`
   - No barrel change needed (dialogs not exported).

### Step-by-step implementation

1. Read `CategoryRow.tsx` (not read yet; required before coding).
2. Extract `useRenameGroup` from `useRenameDialogs.ts` to bring file under 120 lines.
3. Refactor `useRenameDialogs` to use inline-edit IDs instead of dialog state.
4. Update `CategoryRow` with conditional inline input rendering.
5. Update `GroupRowHeader` with conditional inline input rendering.
6. Remove dialog renders from `SettingsDialogPortal`.
7. Delete `RenameCategoryDialog.tsx` and `RenameGroupDialog.tsx`.
8. `npm run build && npx eslint .`

### Risks

- **Highest risk of all proposals.** Inline editing on drag-sortable rows requires
  careful pointer-event discipline. The drag handle fires `onPointerDown`, which must
  not steal focus from an active inline input. Add an `isEditing` guard in the
  drag handle's `onPointerDown` to short-circuit if inline editing is active.
- `@base-ui/react` Dialog handles focus trap and scroll lock automatically. Inline
  inputs do not. Ensure the settings sheet scroll container does not prevent the
  inline input from being visible (it uses `overflow-y: auto`, so `scrollIntoView`
  on the input element on focus is required).
- `useRenameDialogs.ts` is at 132 lines (12 over the 120 ceiling). Extraction is
  **mandatory before any additions** to that file.
- `CategoryRow.tsx` has not been read in this audit. Read it and verify its line
  count before beginning Proposal E.
- This proposal has the most surface area for regressions. Ship A, B, D, and C first
  and treat E as an independent follow-on.

---

## Recommended Implementation Order

```
Pass 1 (same PR): Proposal A + Proposal B
  → Eliminates the two-step modal flow and the silent Enter key in one diff.
  → Mandatory prerequisite: extract GroupsMapSection from CategoriesGroupsSection
    and trim useAddFlowDialogs to under 120 lines before any net additions.

Pass 2 (follow-on PR): Proposal D
  → Small, isolated change to AddCategoryDialog only.
  → No dependencies on A or B, but A should already be merged so the dialog
    is the primary entry point.

Pass 3 (follow-on PR): Proposal C
  → Depends on A being merged (ActionSheet already gone).
  → Adds inline group-specific add buttons to GroupCategoryList.

Pass 4 (optional, separate PR): Proposal E
  → Read CategoryRow.tsx first.
  → Extract useRenameGroup before touching useRenameDialogs.
  → Highest risk; test thoroughly before merging.
```

---

## Build Validation Steps (per pass)

After each pass:

```bash
npm run build     # tsc --noEmit + vite build — zero errors required
npx eslint .      # zero lint errors required
```

Manual verification checklist (test in browser on mobile viewport):

**Pass 1 (A+B):**
- [ ] Settings sheet opens; two buttons visible ("+ Category" and "+ Group") where single button was.
- [ ] Tapping "+ Category" opens the Add Category dialog directly (no ActionSheet).
- [ ] Tapping "+ Group" opens the Add Group dialog directly (no ActionSheet).
- [ ] When groups exist: Add Category dialog shows group pill picker.
- [ ] Pre-selected group pill matches the currently active group in the main picker.
- [ ] Pressing Enter in the Add Category name field submits (regardless of groups count).
- [ ] Pressing Enter when name is empty or duplicate does NOT submit.
- [ ] Pressing Enter in Add Group name field submits.
- [ ] Cancel button in both dialogs dismisses without creating.
- [ ] No ActionSheet appears anywhere in the flow.

**Pass 2 (D):**
- [ ] Group pills render in a single horizontal row (no wrapping).
- [ ] With 6+ groups, the pill strip is scrollable horizontally.
- [ ] Fade masks appear at left/right edges when overflow exists.
- [ ] On dialog open, the pre-selected pill is scrolled into view.
- [ ] No scrollbar visible in the pill strip on iOS Safari.

**Pass 3 (C):**
- [ ] Expanding a group row reveals a small "+ Add category" ghost button at the bottom.
- [ ] Tapping it opens the Add Category dialog with that group pre-selected.
- [ ] The bottom "Add Category" button (from Pass 1) still works independently.
- [ ] Collapsed groups do not show the inline button.

**Pass 4 (E):**
- [ ] Tapping the rename pencil on a category row turns the name into an editable input.
- [ ] Enter or blur saves the new name.
- [ ] Escape cancels and restores the original name.
- [ ] Drag handles are inert while a row is in inline-edit mode.
- [ ] Same behavior for group row header rename.
- [ ] No RenameCategoryDialog or RenameGroupDialog appears anywhere.
