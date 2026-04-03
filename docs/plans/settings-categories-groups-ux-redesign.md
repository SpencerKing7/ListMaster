# Settings — Categories & Groups UX Redesign

**Date:** April 2, 2026  
**Branch:** `db-storage-research`  
**Status:** Design plan — ready for implementation  
**Scope:** `src/screens/SettingsSheet.tsx` (Categories and Groups sections only)

---

## 1. Problem Statement

The current settings layout presents **Categories** and **Groups** as two visually identical, sequential cards:

```
┌─────────────────────────────┐
│ CATEGORIES                  │
│  ≡  Groceries    Edit  🗑    │
│  ≡  Work         Edit  🗑    │
│  ≡  Personal     Edit  🗑    │
│  [ Add new category... ] [+] │
└─────────────────────────────┘

┌─────────────────────────────┐
│ GROUPS                      │
│  ≡  Shopping    Edit  🗑     │
│  ≡  Work        Edit  🗑     │
│  [ Add new group...    ] [+] │
└─────────────────────────────┘
```

This creates three compounding usability problems:

1. **Cognitive distance.** A user adds categories first, then sees groups, then realizes they must scroll back up to the category list to assign groups — the mental model is split across two separated UI zones.
2. **Hidden relationship.** The folder icon (`📁 None`) on each category row is small, unlabeled, and easily missed. There is no visual hierarchy that communicates "groups contain categories."
3. **Overwhelm at scale.** With 6–10 categories, the category list alone is long before the user even reaches the groups section. Seeing the same list twice (once to manage categories, once to mentally re-visit for group assignment) is exhausting.

The core insight: **Groups exist only to organize Categories.** The UI should reflect that relationship directly — not treat them as peers at the same level of hierarchy.

---

## 2. Design Principles Guiding This Redesign

| Principle                                     | Application                                                                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Reveal complexity progressively**           | Groups are a power feature. Keep the zero-groups state minimal and clean.                                              |
| **Parent-child relationship must be visible** | Categories nest inside groups, not next to them.                                                                       |
| **One mental task at a time**                 | Assigning a category to a group happens inline, not via a context menu jump.                                           |
| **iOS-feel conventions**                      | Disclosure chevrons, grouped table sections, and inline sub-rows are all native iOS patterns for this exact hierarchy. |
| **Minimal change surface**                    | Only the Categories and Groups cards change. All other settings sections are untouched.                                |

---

## 3. Proposed Information Architecture

The two cards collapse into a **single unified "Categories & Groups" card** with three zones:

### Zone A — Group Rows (when groups exist)

Each group renders as a **collapsible section header** with:

- A disclosure chevron (▶ / ▼) that expands/collapses the category list beneath it.
- An inline rename button and delete button.
- A drag handle for group reordering.

Categories assigned to that group appear indented beneath the group header when expanded.

### Zone B — Ungrouped Categories

Categories with no `groupID` always appear in a flat list **below** all group sections, under a subtle "No Group" header. This section is always visible (not collapsible) so categories are never hidden.

### Zone C — Add Controls

Two distinct add inputs at the bottom of the card:

- "Add category" input (always present).
- "Add group" input (always present — even if no groups yet, so the feature is discoverable).

---

## 4. Wireframe — No Groups State (zero groups created)

When `store.groups.length === 0`, the card looks identical to today's category list — no added complexity:

```
┌────────────────────────────────────────┐
│ CATEGORIES & GROUPS                    │
│                                        │
│  ≡  Groceries            Edit  🗑      │
│  ≡  Work                 Edit  🗑      │
│  ≡  Personal             Edit  🗑      │
│                                        │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                        │
│  [ Add category...         ] [+]       │
│  [ Add group...            ] [+]       │
└────────────────────────────────────────┘
```

The "Add group" input is present but unobtrusive — it signals the feature exists without front-loading it.

---

## 5. Wireframe — Groups Exist State

Once groups exist, the card renders the parent-child hierarchy directly:

```
┌────────────────────────────────────────────┐
│ CATEGORIES & GROUPS                        │
│                                            │
│  ≡  ▼  Shopping                Edit  🗑   │  ← Group header row
│       ┌──────────────────────────────┐    │
│       │  ≡  Groceries    Edit  🗑    │    │  ← Category (indented)
│       │  ≡  Costco       Edit  🗑    │    │
│       │  ≡  Target       Edit  🗑    │    │
│       └──────────────────────────────┘    │
│                                            │
│  ≡  ▼  Work                    Edit  🗑   │
│       ┌──────────────────────────────┐    │
│       │  ≡  Tasks        Edit  🗑    │    │
│       └──────────────────────────────┘    │
│                                            │
│  ──────── No Group ────────────────────   │  ← Ungrouped divider
│  ≡  Personal                  Edit  🗑    │
│  ≡  Notes                     Edit  🗑    │
│                                            │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                            │
│  [ Add category...              ] [+]      │
│  [ Add group...                 ] [+]      │
└────────────────────────────────────────────┘
```

---

## 6. Component Behaviour Specification

### 6.1 Group Header Row

**Visual anatomy:**

```
[drag handle] [chevron] [group name] ─────── [rename] [delete]
```

- **Drag handle** — identical to today's `≡` handle. Pointer Events drag-to-reorder. Only reorders groups relative to other groups.
- **Chevron** — `▶` (collapsed) / `▼` (expanded). Tapping anywhere on the group name area toggles collapse state. Initial state: **all groups expanded** on sheet open. Collapse state is local `useState` only — not persisted.

  > **Implementation note (Issue #4):** `expandedGroupIDs` must be a `Set<string>` managed with `useState`. It is seeded from `store.groups` at mount time. A `useEffect` watching `store.groups` must diff the current group IDs against the set and **add any new IDs** (defaulting them to expanded) so that groups created while the sheet is open appear expanded rather than silently collapsed.

- **Group name** — `text-sm font-semibold`, `var(--color-text-primary)`.
- **Rename button** — pencil icon, same as today.
- **Delete button** — trash icon, same as today. Deleting a group **ungroups** its categories (sets `groupID = undefined`) — they fall through to the "No Group" section rather than being deleted.

**Expand/collapse animation:**

- Category sub-list height animates using a `max-height` CSS transition (`200ms ease-out`). The container transitions between `max-height: 0; overflow: hidden` (collapsed) and a fixed `max-height: 600px` ceiling (expanded). **Do not use `max-height: auto`** — CSS transitions cannot animate to `auto`. A ceiling of `600px` safely accommodates up to ~15 categories per group. The easing will feel slightly front-loaded for very short lists but is imperceptible in practice.
- Chevron rotates `0°` → `90°` with `transition: transform 200ms ease-out`.

### 6.2 Category Sub-Row (inside a group)

**Visual anatomy:**

```
    [drag handle] [category name] ─────────── [rename] [delete]
```

- **Indentation:** `pl-6` (24px) from the left edge of the card's inner padding to visually nest under the group.
- **Background:** Slightly lighter than the group header — `rgba(var(--color-brand-deep-green-rgb), 0.04)` vs group header's `0.08`. This tonal contrast reinforces the hierarchy without introducing new colors.
- **No group assignment button.** In this layout, the group assignment is implicitly communicated by _position_ (the category is physically inside the group). The `📁 None` button is removed from all category rows. Group assignment is instead done by dragging a category row from the ungrouped section into a group, or vice versa (see §6.4).
- **Drag handle** — drag-to-reorder within the same group only. A cross-group drag (dragging a category from one group into another, or into/out of "No Group") is **not implemented in this iteration** to keep the drag logic tractable. Cross-group assignment is still done via the group header's expand/collapse + a "Move to..." context option (see §6.5).

### 6.3 "No Group" Section

- Rendered as a full-width divider row:
  ```
  ─────────────── No Group ───────────────
  ```
  Using a `flex items-center gap-2` row with two `<hr>` lines flanking the label text.
- Label: `text-xs uppercase tracking-wide`, `var(--color-text-secondary)`, `opacity-60`.
- Only rendered when `store.groups.length > 0` AND there is at least one category with no `groupID`.
- If all categories are assigned to groups, this section is hidden entirely.
- Categories in this section have the same row anatomy as today, **minus the group assignment folder button** — they instead show a subtle `"+ Assign"` affordance (a tappable chip, not a full button, to keep visual weight low). Tapping it opens the existing `ActionSheet` group picker.

### 6.4 Drag-to-Reorder Scope

| Drag source             | Can drop on                     | Result                  |
| ----------------------- | ------------------------------- | ----------------------- |
| Group header            | Other group header              | Reorders groups         |
| Category within Group A | Another position within Group A | Reorders within group   |
| Category within Group A | Another group (Group B)         | **Not supported in v1** |
| Ungrouped category      | Another ungrouped position      | Reorders ungrouped list |

Cross-group dragging is deferred to v2 because it requires hit-testing against group section boundaries — a significantly more complex drag algorithm. The "Move to group" affordance on ungrouped categories (§6.3) and the rename/assign flow covers the assignment use case without needing cross-group drag.

> **Critical implementation note — flat-index translation (Issues #1 & #2):** The store's `MOVE_CATEGORIES` action takes indices into the flat global `state.categories` array. The drag UIs in both the group sub-lists and the "No Group" section operate on _filtered subsets_ of that array. Visual drag indices must **never** be passed directly to `store.moveCategories()`. Instead, the implementation must resolve the visual `from` and `to` positions back to their positions in the flat array before dispatching.
>
> **Algorithm:** Given a drag within a scoped list (e.g. categories for group X), build the scoped array as `store.categories.filter(c => c.groupID === groupID)`. Resolve `flatFrom = store.categories.indexOf(scopedList[visualFrom])` and `flatTo = store.categories.indexOf(scopedList[visualTo])`, then call `store.moveCategories(flatFrom, flatTo)`. The same pattern applies to ungrouped reordering using `store.categories.filter(c => !c.groupID)`.
>
> **Edge case — off-by-one consistency:** `MOVE_CATEGORIES` splices the item out at `flatFrom` then inserts it at `flatTo`. When `flatFrom < flatTo`, the splice shifts intermediate elements left by one, meaning the final inserted position may be one slot earlier than the visual "over" slot in the full flat array. This is the same behavior the current single-list drag already produces (e.g. dragging item 0 over item 2 in the existing code lands at flat index 2 after the splice). The scoped translation does not make this worse — it is a pre-existing and acceptable rounding behavior that is imperceptible for short lists.
>
> **Also note:** The group drag state (`groupDragIndex`, `groupOverIndex`, etc.) already exists in the current component and is correct — it operates over `store.groups` directly which is already a flat list, so no flat-index translation is needed there. Only the category drag state needs restructuring. Since `dragIndex`/`overIndex` are now scoped per sub-list, add a `dragContext` ref (value: `{ groupID: string | null }`) that is set on pointer-down alongside `dragIndex`. The pointer-up handler reads `dragContext.current` to determine which scoped list was being dragged, then builds the scoped array and resolves flat indices as described above.

### 6.5 "Move to Group" — Ungrouped Categories

Each category in the "No Group" section has a small `"+ Assign"` tappable chip (not a full button):

- `text-xs font-medium`, `var(--color-brand-teal)` color.
- `px-2 py-0.5 rounded-full`, `rgba(var(--color-brand-teal-rgb), 0.12)` background.
- Tapping opens the existing `ActionSheet` group picker (already implemented) filtered to show all groups plus a "No Group" option.

This replaces the current `📁 None` folder button, which is visually heavier and less discoverable.

### 6.6 Add Controls at the Bottom

Two stacked input rows replace today's single "Add category" input:

```
[ Add category...  ] [+]
[ Add group...     ] [+]
```

- Visual appearance is identical to today's add-category input.
- The "Add group" row uses the same `newGroupName` / `addGroup()` logic as today.
- A `text-xs` helper caption sits above the two inputs:  
  `"Categories live inside groups. Create groups to organize your lists."`  
  This is only shown when `store.groups.length === 0` — it is the primary discoverability mechanism for the groups feature.

---

## 7. Before / After Summary

| Aspect                              | Before                                                       | After                                                            |
| ----------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------- |
| Card count                          | 2 separate cards (Categories, Groups)                        | 1 unified card                                                   |
| Hierarchy visibility                | No visual parent-child relationship                          | Categories are physically nested under group headers             |
| Group assignment                    | Small `📁` folder button on each category row → ActionSheet  | Implicit by position; "Assign" chip on ungrouped rows only       |
| Mental model required               | User must understand abstract relationship between two lists | Relationship is shown directly in the layout                     |
| Groups discoverability              | User must scroll past categories to find groups section      | "Add group" input is in the same card as "Add category"          |
| Cognitive load (with 8+ categories) | High — two long lists to parse                               | Lower — categories are organized under collapsible group headers |
| Groups state (no groups)            | Two separate empty-ish cards                                 | One clean card, looks identical to current categories card       |
| Delete group behavior               | Currently unspecified / may delete categories                | Explicitly ungroups categories, does not delete them             |

---

## 8. What Does NOT Change

- The rename dialogs (category and group) — identical behavior, triggered the same way.
- The "Add group" and `addGroup()` function — same store action.
- The `ActionSheet` group picker — still used for ungrouped category assignment.
- The delete category / rename category store actions — unchanged.
- All other settings cards (Appearance, Text Size, Sync, Account Management) — untouched.
- The `SettingsCard` and `SectionLabel` helper components — reused as-is.

> **Note on drag state:** The drag-to-reorder _logic_ (Pointer Events, pointer capture, `snapshotRects`, `getDropIndex`) is reused verbatim. Importantly, the **group drag system is already fully implemented** in the current code: `groupDragIndex`/`groupOverIndex`, `groupListRef`, `groupItemRects`, `snapshotGroupRects`, `getGroupDropIndex`, and `handleGroupDragPointerDown/Move/Up` all exist and are correct — they do not need to change. What _does_ need restructuring is the **category drag system**: the current single-scope `dragIndex`/`overIndex` pair assumes it operates over the entire flat `store.categories` array. In the redesign it must operate per-sub-list (one instance per group + one for ungrouped), supplemented by a `dragContext` ref (value: `{ groupID: string | null }`) set on pointer-down so the pointer-up handler can resolve the correct flat-index translation for its scope. See §6.4 for the full flat-index translation algorithm.

---

## 9. Implementation Steps

0. **Prerequisite — add missing RGB tokens to `src/styles/tokens.css`.** Two tokens are required before any component work and are currently absent, causing live rendering bugs:

   **`--color-brand-teal-rgb`** — **⚠ live bug:** the current component at line 428 already references `rgba(var(--color-brand-teal-rgb), 0.12)` for the group assignment chip background. Because the token is missing, that chip renders with a fully transparent background in all themes right now. Add to all four CSS rule blocks:
   - `:root` (light default): `44, 144, 150`
   - `@media (prefers-color-scheme: dark)`: `61, 170, 176`
   - `:root[data-theme="light"]`: `44, 144, 150`
   - `:root[data-theme="dark"]`: `61, 170, 176`

   **`--color-brand-deep-green-rgb`** — **⚠ live bug:** this token exists in `:root` and `@media (prefers-color-scheme: dark)` but is **absent** from `:root[data-theme="light"]` and `:root[data-theme="dark"]`. Any element using `rgba(var(--color-brand-deep-green-rgb), …)` will render with a transparent background for users who have manually forced a theme (rather than using system preference). Add to the two forced-override blocks:
   - `:root[data-theme="light"]`: `26, 94, 75`
   - `:root[data-theme="dark"]`: `39, 120, 98`

1. **Merge the two `SettingsCard` blocks** into one card with the label "Categories & Groups".
2. **Add local `expandedGroupIDs` state** — a `Set<string>` initialized to all group IDs (all expanded on open). A `toggleGroup(id)` function adds/removes from the set.
3. **Render group section headers** using the anatomy in §6.1. Wrap each in a `<div>` for the collapse animation container.
4. **Render category sub-rows** under each expanded group, indented with `pl-6`, using the same drag logic scoped to that group's categories.
5. **Render the "No Group" divider** when `store.groups.length > 0` and ungrouped categories exist.
6. **Replace the `📁` folder button** on all category rows with the `"+ Assign"` chip on ungrouped rows only.
7. **Add the groups discoverability caption** below the section label, visible only when no groups exist.
8. **Stack the two add-input rows** at the bottom of the unified card.
9. **Remove the old Groups `SettingsCard` block** from the JSX.

---

## 10. Token Reference

All new visual treatments use existing tokens — no new CSS variables required, **except** `--color-brand-teal-rgb` which must be added (see §9, step 0):

| Visual purpose              | Token                                           |
| --------------------------- | ----------------------------------------------- |
| Group header background     | `rgba(var(--color-brand-deep-green-rgb), 0.08)` |
| Category sub-row background | `rgba(var(--color-brand-deep-green-rgb), 0.04)` |
| "No Group" divider label    | `var(--color-text-secondary)` at `opacity-60`   |
| "Assign" chip color         | `var(--color-brand-teal)`                       |
| "Assign" chip background    | `rgba(var(--color-brand-teal-rgb), 0.12)`       |
| Chevron icon                | `var(--color-brand-teal)` at `opacity-70`       |
| Discoverability caption     | `var(--color-text-secondary)`                   |

**New token — `--color-brand-teal-rgb`** (RGB channel values for use in `rgba()`):

| CSS rule block                        | Value          |
| ------------------------------------- | -------------- |
| `:root` (light default)               | `44, 144, 150` |
| `@media (prefers-color-scheme: dark)` | `61, 170, 176` |
| `:root[data-theme="light"]`           | `44, 144, 150` |
| `:root[data-theme="dark"]`            | `61, 170, 176` |

---

## 11. Additional Settings UX Improvements

The following issues were identified in the broader settings sheet during the same audit pass. They are independent of the Categories & Groups redesign and should be addressed in separate implementation passes, ordered by impact.

---

### 11.1 🔴 Name card is misplaced and lacks context

**Current behaviour:** The "Name" card sits at the very top of the sheet — prime real estate — and saves on every keystroke with no feedback. The name is used to personalize the greeting on the main screen, but the card provides no indication of this.

**Problems:**

- A first-time user who came through onboarding already set their name. Opening settings to find a name field first feels like being sent back to the beginning.
- A returning user who wants to change appearance or categories must scroll past the name card to get there.
- No label or description explains where the name is used, creating a "why does this exist?" moment.

**Recommended changes:**

1. Move the Name card to **below the Text Size card** (new order: Categories & Groups → Appearance → Text Size → Name → Sync & Backup → Reset).
2. Add a `text-xs` helper line beneath the input: `"Shown in your greeting on the main screen."` — using `var(--color-text-secondary)`.

---

### 11.2 🔴 Text Size toggle provides no live preview

**Current behaviour:** The five labels `XS / S / M / L / XL` are all rendered in the same `text-xs` size. The size applies immediately on tap via `applyTextSizeToDOM`, which is correct — but the labels themselves don't demonstrate the sizes, so a user who needs larger text may not be able to read the toggle comfortably enough to find the right stop.

**Recommended change:** Render each `ToggleGroupItem` label in its own corresponding font size rather than a uniform `text-xs`:

| Toggle value | Label font size class |
| ------------ | --------------------- |
| `xs`         | `text-xs`             |
| `s`          | `text-sm`             |
| `m`          | `text-base`           |
| `l`          | `text-lg`             |
| `xl`         | `text-xl`             |

This is the same convention iOS uses in Display & Brightness — the selector is itself the preview. No other changes to the toggle or store are needed.

> **Note:** The `ToggleGroupItem` className currently hard-codes `text-xs`. Each item's size class must be set individually (e.g. via a lookup map), not via the shared class string.

---

### 11.3 🔴 Sync status is invisible when sync is enabled

**Current behaviour:** `syncStatus` (`"idle"` / `"syncing"` / `"synced"` / `"error"`) exists in `useSyncStore` but is never surfaced in the settings UI. A user who opens settings after a failed background sync has no indication their data is not backed up.

**Recommended change:** Add a small inline status badge to the right of the "Sync Code" label row in the sync-enabled state:

| `syncStatus` value | Badge appearance                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| `"synced"`         | Green dot (`●`) + `"Synced"` label — `var(--color-brand-green)`                                  |
| `"syncing"`        | Spinning `◌` indicator — `var(--color-text-secondary)`                                           |
| `"error"`          | `"⚠ Sync failed"` chip — `var(--color-danger)`, `rgba(var(--color-danger-rgb), 0.08)` background |
| `"idle"`           | No badge shown                                                                                   |

**Implementation:** The badge is a purely presentational addition to the existing `sync.isSyncEnabled` branch. No store changes are required. The `syncStatus` value is already exposed from `useSyncStore`.

> **Also:** The hardcoded `rgba(212, 75, 74, 0.08)` value used as the danger tint in three places in `SettingsSheet.tsx` should be replaced. Add a `--color-danger-rgb` token to all four `tokens.css` blocks (`212, 75, 74` for light / `231, 101, 96` for dark), then use `rgba(var(--color-danger-rgb), 0.08)` consistently. This makes the danger tint theme-aware.

---

### 11.4 🟡 Category delete is instant and irreversible — inconsistent with rename

**Current behaviour:** Tapping the trash icon on a category row immediately deletes the category and all its checklist items without any confirmation. Rename, by contrast, is behind a full dialog. These two actions sit side-by-side but have wildly different consequences and friction levels.

**Recommended change — "tap twice to confirm" pattern:**

1. On first tap, transition the trash icon button to a "confirm" state: the icon turns solid red (`var(--color-danger)`), opacity goes to `1.0`, and a 2-second auto-revert timer starts.
2. A second tap within the window executes the delete.
3. If the timer expires or the user taps elsewhere, the button reverts to its default state silently.

**Implementation:** Add a `pendingDeleteCategoryID: string | null` state variable. The **first tap** must first check `store.canDeleteCategories` (the existing guard that prevents deleting the last remaining category) — if false, do nothing. Only if the guard passes does the first tap set `pendingDeleteCategoryID` to the category ID; a `useEffect` sets a 2-second timeout to clear it. The button's visual state derives from `pendingDeleteCategoryID === category.id`. The second tap calls `store.deleteCategory()` and clears `pendingDeleteCategoryID`. Placing the guard on the first tap avoids a visual "confirm" state that can never be completed, which would be confusing.

This pattern avoids a disruptive dialog for what is a small-list operation, while still preventing fat-finger deletions.

---

### 11.5 🟡 "Account Management" is a misleading section label

**Current behaviour:** The section label reads "Account Management" but contains exactly one button: "Reset to New User." The label implies account-level operations (sign in, sign out, change email, etc.) that don't exist.

**Recommended change:** Rename the `SectionLabel` text to `"Data"`. It is shorter, accurate, non-alarming, and doesn't set a false expectation. No other changes required.

---

### 11.6 🟡 "Enter Code" in the sync-enabled state needs a clearer label and consequence warning

**Current behaviour:** Both the sync-disabled and sync-enabled states show an "Enter Code" button that opens the same `isAdoptingCode` dialog. In the enabled state, adopting a different code will **replace all current data** with the data from the new code — but the button label gives no hint of this.

**Recommended changes:**

1. In the sync-enabled state, rename the button to `"Switch Code"`.
2. Add a single `text-xs` note beneath the button row: `"Switching to a different code will replace your current data."` — using `var(--color-text-secondary)`.

No store or dialog logic changes are needed.

---

### 11.7 🟠 "Done" button lacks sufficient visual weight

**Current behaviour:** The "Done" button in the sheet header is a ghost button (`variant="ghost"`) — same visual style as a cancel action. On mobile, it reads as a low-priority label rather than the primary close affordance.

**Recommended change:** Give the "Done" button a subtle filled background to elevate it as the primary action without making it look like a CTA:

- Background: `rgba(var(--color-brand-green-rgb), 0.12)`
- On press: `active:scale-[0.96]`
- Add `style={{ touchAction: "manipulation" }}` to eliminate the 300 ms tap delay on iOS (the button currently lacks this).

The existing border style (`!border-[color:var(--color-brand-green)]/40`) can be removed once the background is present — the two together are redundant.

---

### 11.8 🟠 Appearance toggle could use mode icons

**Current behaviour:** The Appearance toggle shows text labels "System / Light / Dark" only. iOS and macOS use icons (phone/auto, sun, moon) alongside or instead of text, making the choice scannable without reading.

**Recommended change:** Add a small inline SVG icon before each label inside each `ToggleGroupItem`:

| Mode   | Icon (12×12 SVG)                   |
| ------ | ---------------------------------- |
| System | Phone outline (auto / device icon) |
| Light  | Sun outline                        |
| Dark   | Moon outline (crescent)            |

Icons use `currentColor` so they inherit the label's active/inactive color automatically. No token changes required.

---

### 11.9 🟠 Card ordering does not reflect usage frequency

**Current behaviour:** The actual card order in the JSX before the Categories & Groups redesign is: Name → Categories → Groups → Appearance → Text Size → Sync & Backup → Account Management (7 cards). Note: "Categories" and "Groups" are still two separate cards in the current codebase — the listing above reflects the post-redesign merged state as a shorthand.

The name field is rarely changed after onboarding, yet it occupies the first and most visible position. Appearance and Categories are the highest-frequency settings for a returning user.

**Recommended order:**

| Position | Card                |
| -------- | ------------------- |
| 1        | Categories & Groups |
| 2        | Appearance          |
| 3        | Text Size           |
| 4        | Name                |
| 5        | Sync & Backup       |
| 6        | Data (Reset)        |

This moves the most actionable settings to the top, places "set it and forget it" settings (Name) in the middle where they're reachable but not dominant, and keeps the destructive action (Reset) at the very bottom where iOS conventions place it.

**Implementation:** Reorder the `SettingsCard` blocks in the JSX. No logic changes.

---

### 11.10 Summary of Additional Changes

| #    | Impact  | Change                                            | Files affected                    |
| ---- | ------- | ------------------------------------------------- | --------------------------------- |
| 11.1 | 🔴 High | Move Name card; add helper text                   | `SettingsSheet.tsx`               |
| 11.2 | 🔴 High | Text Size labels rendered in own sizes            | `SettingsSheet.tsx`               |
| 11.3 | 🔴 High | Sync status badge; add `--color-danger-rgb` token | `SettingsSheet.tsx`, `tokens.css` |
| 11.4 | 🟡 Med  | Two-tap confirm for category delete               | `SettingsSheet.tsx`               |
| 11.5 | 🟡 Med  | Rename section label to "Data"                    | `SettingsSheet.tsx`               |
| 11.6 | 🟡 Med  | Rename "Enter Code" → "Switch Code" + warning     | `SettingsSheet.tsx`               |
| 11.7 | 🟠 Low  | "Done" button filled background                   | `SettingsSheet.tsx`               |
| 11.8 | 🟠 Low  | Appearance toggle mode icons                      | `SettingsSheet.tsx`               |
| 11.9 | 🟠 Low  | Reorder cards by usage frequency                  | `SettingsSheet.tsx`               |
