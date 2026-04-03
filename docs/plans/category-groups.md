# Category Groups — Design & Implementation Plan

**Branch:** `db-storage-research`  
**Date:** 2026-04-02  
**Status:** Ready for implementation

---

## 1. Problem Statement

ListMaster currently has a flat list of categories (lists). With multi-device sync, power users will accumulate more lists — e.g. "Groceries", "Costco", "Target", "Work Tasks", "Meeting Notes", "Home Repairs". A flat, undifferentiated pill row in the `CategoryPicker` scales poorly past ~6 items visually and cognitively. Users need a way to **group related lists** (e.g. a "Shopping" group and a "Work" group) without losing the fast-tap navigation feel.

---

## 2. Design Context (from `UI-Expert` guidelines)

The following UI concerns must be satisfied before any implementation:

- **Brand alignment:** Groups must use the existing token palette (`--color-brand-*`, `--color-surface-*`). No new hex values in components.
- **iOS-feel conventions:** Group switching must feel like a native iOS segmented-control tap — snappy, with press feedback. No full-page navigation changes.
- **Accessibility:** Group headers must be readable, interactive elements must have `aria-label`.
- **Performance:** No layout jank. Group tabs rendered via CSS transforms, not relayout-heavy JS.
- **Dark mode:** All new UI elements must derive colors from CSS custom properties — no `dark:` Tailwind variants.
- **Touch interaction:** `touch-action: manipulation` on group tabs; Pointer Events API for any drag behavior.
- **Motion:** Spring easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`) for the active indicator slide. `ease-out` for panel transitions.

---

## 3. Current Architecture Snapshot

### Data Model (flat)

```
StoreState {
  categories: Category[]     // flat ordered array
  selectedCategoryID: string
}

Category {
  id: string
  name: string
  items: ChecklistItem[]
  sortOrder?: SortOrder
  sortDirection?: SortDirection
}
```

### UI Rendering Flow

```
MainScreen
  └── HeaderBar
        └── CategoryPicker     ← pill row over ALL categories
  └── CategoryPanel            ← single selected category
```

### Persistence

- `PersistenceService` serializes `{ lists: Category[], selectedListID: string }` to `localStorage`.
- `syncService` pushes the same payload shape to Firestore under `syncStates/{syncCode}`.
- Both storage layers use the same `Category[]` shape.

---

## 4. Approach: Group Tab Bar Above CategoryPicker

A row of group tabs lives **above** the existing `CategoryPicker` pill row. The `CategoryPicker` only shows categories that belong to the active group. Groups are themselves first-class objects in the data model (`CategoryGroup`).

**Visual hierarchy:**

```
HeaderBar
  ├── greeting row
  ├── [GroupTabBar — underline tab style]    ← NEW
  └── CategoryPicker (pill row — filtered to active group)
```

### Core Principles

1. **Groups are optional.** If no groups have been created, the group tab bar is **not rendered**. The app looks and behaves exactly as today. Zero regression risk.
2. **A special virtual "All" tab** always appears first when groups exist, showing every category regardless of group assignment.
3. **Categories are not required to belong to a group.** A category with `groupID: undefined` appears under "All" and — critically — **also appears when any specific group is active**, rendered as a dimmed trailing set of pills at the end of `CategoryPicker` after the group's assigned categories. This prevents ungrouped lists from silently disappearing when a group is selected, which would confuse users who haven't finished assigning all their lists. See Section 4 "Ungrouped visibility" below.
4. **`CategoryGroup` is a new first-class model** — a simple named container with an ID and display order.
5. **`selectedGroupID` is new store state** — the group filter currently applied. `null` means "All".
6. **The app always launches on "All".** `selectedGroupID` is never persisted — it resets to `null` on every launch. This is intentional: the "All" view is the safe, complete starting state. Users who want a specific group can switch to it in one tap. Starting in a filtered state would be disorienting if the user doesn't immediately remember which group they were in.
7. **Group creation is discovered via Settings.** Groups are a power-user feature with no onboarding prompt. A user who never opens Settings will never see the feature — this is acceptable. Future iteration could add a contextual "Organise into groups" suggestion when the category count exceeds ~7.

### Visual Differentiation — `GroupTabBar` vs `CategoryPicker`

This is the most critical design constraint. Both rows are horizontal and text-based, so they must communicate a **clear visual hierarchy**: groups sit _above_ categories conceptually, and the UI must reflect that.

**`CategoryPicker` (existing — do not change):**

- `rounded-full` pill-shaped track with `rgba(--color-brand-deep-green-rgb, 0.12)` background.
- Active item: floating `--color-surface-card` capsule button with drop shadow.
- Text size: `text-xs` (12px), `font-semibold`.
- Shape language: bubbly, floating, iOS-tab-bar feel.

**`GroupTabBar` (new — must look distinctly different):**

- **No track background** — rendered on the raw header gradient, not inside a pill container. This gives it a more structural, "navigation level" feel.
- **Underline indicator** instead of a floating capsule. A `--color-brand-green` 2px line slides along the bottom of the active tab using `transform: translateX(...)`, matching iOS `UITabBar` and Safari tab underline patterns. The indicator is positioned at `bottom: 3px` (not `bottom: 0`) — see Section 4 "Underline Indicator Contrast" for why.
- Text size: `text-sm` (14px), `font-medium` for inactive / `font-semibold` for active. Slightly larger than `CategoryPicker` pills to reinforce the hierarchy (groups > lists).
- Active tab text: `--color-brand-green`, `font-semibold`.
- Inactive tab text: `--color-text-secondary`, `font-medium`.
- **No border-radius on tabs** — flat text buttons, not pill buttons.
- Spacing: tabs are `px-3 py-1` with `gap-1`. The container has `pb-[3px]` so the underline indicator is not flush with the edge, and `mb-3` (12px) above `CategoryPicker` to provide clear visual breathing room between the two rows. An additional `mt-1` (4px) separates the GroupTabBar from the greeting row above it, preventing the two from sitting uncomfortably close on compact screens.
- The sliding underline bar is `h-[2px]` wide matching the active tab's text width, with `border-radius: 1px`. It slides with spring easing.
- Press feedback: `active:opacity-50` (a noticeable but not jarring fade, chosen over `active:opacity-70` which is too subtle against the semi-transparent header gradient background).

**Side-by-side visual contrast:**

```
GroupTabBar:
  All   Shopping   Work
  ────
  (flat text tabs, brand-green underline slides under "All")

CategoryPicker (below):
  ┌──────────────────────────────────────────┐
  │ ● Groceries  │ Costco  │ Target          │
  └──────────────────────────────────────────┘
  (rounded pill track, floating card capsule on "Groceries")
```

The contrast comes from three combined signals: **shape** (flat text vs pill track), **scale** (14px vs 12px), and **indicator type** (underline vs floating capsule). Together they read immediately as "top-level navigation" vs "sub-navigation".

### Ungrouped Category Visibility

When a specific group is active (not "All"), categories that have no `groupID` must **not silently vanish** from the `CategoryPicker`. Silent disappearance breaks trust — the user knows those lists exist but can't see them and has no idea why.

**Spec:** When `selectedGroupID !== null`, `categoriesInSelectedGroup` contains:

1. All categories where `c.groupID === selectedGroupID` (primary, full opacity — rendered first).
2. All categories where `c.groupID === undefined` (ungrouped — rendered after a visual separator, at `opacity-50`, with `italic` style or a soft tint to signal they're "global/ungrouped").

The visual treatment communicates "these belong to everyone, not specifically this group" without hiding them. A user who has only partially assigned their lists can still reach all lists from any group tab.

> **Implementation note:** `categoriesInSelectedGroup` derivation in the store must be updated to reflect this: it returns `assignedCategories` (full `opacity`) followed by `ungroupedCategories` (flagged). The `CategoryPicker` component differentiates them via a boolean on each item — not a separate array — so the existing `scrollIntoView` and drag-scroll logic is unaffected.

### Why There Is No "Default" Group

A natural instinct is to auto-assign new lists to a "General" or "Default" group so nothing is ever technically ungrouped. **This is deliberately not done**, for three reasons:

1. **It breaks the zero-regression guarantee.** The moment a default group exists in the data model, `groups.length > 0` is always true — even for users who never touch groups — and `GroupTabBar` renders. A user with 3 lists suddenly has an unexplained navigation layer they didn't ask for.
2. **A default group can't be cleanly deleted.** If the user can't delete it (because new lists would have nowhere to go), it's permanent UX clutter. If they can delete it, all lists in it become ungrouped anyway — which means the default group provided no lasting safety net.
3. **"All" already is the default.** The "All" tab shows every list regardless of group assignment. Ungrouped lists never disappear from the user's reach — they're fully accessible from "All" and appear dimmed in any specific group view. There is no scenario where a list is orphaned or invisible.

**New list behaviour when groups exist:** Lists created via `ADD_CATEGORY` always land with `groupID: undefined`. They immediately appear in "All" and in the dimmed-trailing section of whatever group is currently active. The user is expected to assign them to a group via Settings at their leisure — there is no forced assignment at creation time.

**Future consideration:** If users find the ungrouped-trailing-pills concept confusing in practice, a lighter-touch alternative for a v2 would be a contextual "Assign to a group?" prompt in Settings next to any unassigned list — rather than a pre-created default group.

### Underline Indicator Contrast

The `GroupTabBar` sits directly above the `CategoryPicker`. The header background below the greeting row is the brand gradient (`linear-gradient(to top, transparent 0%, var(--color-surface-background) 35%, ...)`) — meaning the area where the GroupTabBar sits is **not a solid surface**. A 2px underline at the very bottom of the tab row will render partially against the transparent-to-background gradient, making it harder to see.

**Spec:** The container div for `GroupTabBar` must include `pb-[3px]` bottom padding so the underline bar is not clipped flush to the container's bottom edge. The underline itself is positioned at `bottom: 3px` (not `bottom: 0`) to sit visually above the transition zone between the GroupTabBar and the CategoryPicker track, giving it a slightly elevated shelf that reads as connected to the active tab, not as a border between the two rows.

---

## 5. Data Model Changes

### New type: `CategoryGroup` (add to `src/models/types.ts`)

```ts
export interface CategoryGroup {
  id: string; // UUID v4
  name: string; // User-visible label — e.g. "Shopping", "Work"
  sortOrder: number; // Display order among groups
}
```

### Modified type: `Category` (add optional field to `src/models/types.ts`)

```ts
export interface Category {
  id: string;
  name: string;
  items: ChecklistItem[];
  sortOrder?: SortOrder;
  sortDirection?: SortDirection;
  groupID?: string; // ← NEW: UUID of the owning CategoryGroup, or undefined
}
```

> **Backwards compatibility:** `groupID` is optional. All existing persisted data has no `groupID` — these categories behave as "ungrouped" and appear under the "All" tab. No migration needed.

---

## 6. State Management Changes

### `StoreState` additions (`src/store/useCategoriesStore.ts`)

```ts
interface StoreState {
  categories: Category[];
  selectedCategoryID: string;
  groups: CategoryGroup[]; // ← NEW
  selectedGroupID: string | null; // ← NEW: null = "All"
}
```

### New `StoreAction` variants

| Action type          | Payload                            | Effect                                                                                                                       |
| -------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `ADD_GROUP`          | `name: string`                     | Appends a new `CategoryGroup`; assigns `sortOrder = groups.length`                                                           |
| `RENAME_GROUP`       | `id, newName`                      | Updates group name; case-insensitive uniqueness enforced                                                                     |
| `DELETE_GROUP`       | `id`                               | Removes the group; all categories with `groupID === id` have their `groupID` cleared to `undefined`                          |
| `MOVE_GROUPS`        | `from, to`                         | Reorders `groups` array                                                                                                      |
| `SELECT_GROUP`       | `id \| null`                       | Sets `selectedGroupID`; if the currently selected category is not in the new group, selects the first category in that group |
| `SET_CATEGORY_GROUP` | `categoryID, groupID \| undefined` | Assigns or unassigns a category to a group                                                                                   |

### New derived values exposed on `StoreContextValue`

```ts
groups: CategoryGroup[];
selectedGroupID: string | null;
categoriesInSelectedGroup: Category[];  // derived: filtered by selectedGroupID
hasGroups: boolean;                     // groups.length > 0
```

### `loadInitialState` changes

```ts
function loadInitialState(): StoreState {
  const saved = PersistenceService.load();
  if (saved && saved.categories.length > 0) {
    return {
      categories: saved.categories,
      selectedCategoryID: saved.selectedCategoryID ?? saved.categories[0].id,
      groups: saved.groups ?? [], // ← NEW with fallback
      selectedGroupID: null, // ← Always start on "All"
    };
  }
  return {
    categories: [],
    selectedCategoryID: "",
    groups: [],
    selectedGroupID: null,
  };
}
```

> **Note:** `selectedGroupID` is intentionally **not persisted**. The app always opens on the "All" view, which mirrors the way iOS apps handle filter state — it resets on relaunch.

---

## 7. Persistence Changes

### `PersistenceService` (`src/services/persistenceService.ts`)

Add `groups` to the persisted payload:

```ts
interface PersistedState {
  lists: Category[];
  selectedListID: string | null;
  groups?: CategoryGroup[]; // ← NEW (optional for backwards compat)
}
```

Update `save()`:

```ts
save(categories: Category[], selectedCategoryID: string, groups: CategoryGroup[]): void
```

Update `load()` to return `groups`:

```ts
load(): { categories: Category[]; selectedCategoryID: string | null; groups: CategoryGroup[] } | null
```

### `syncService` (`src/services/syncService.ts`)

Add `groups` to `SyncPayload`:

```ts
interface SyncPayload {
  lists: Category[];
  selectedCategoryID: string | null;
  groups?: CategoryGroup[]; // ← NEW (optional for backwards compat with older clients)
  updatedAt: number;
}
```

The `SYNC_LOAD` action must be extended to carry `groups`:

```ts
| { type: "SYNC_LOAD"; categories: Category[]; selectedCategoryID: string | null; groups?: CategoryGroup[] }
```

---

## 8. UI Changes

### New component: `GroupTabBar` (`src/components/GroupTabBar.tsx`)

A horizontally-scrollable tab bar that deliberately contrasts with the `CategoryPicker` below it. See Section 4 for the full differentiation rationale.

#### Visual Design

The `GroupTabBar` must read as a **higher-level navigation layer** than the `CategoryPicker` pill row it sits above. Every visual decision reinforces this:

| Property            | `GroupTabBar`                                                                                   | `CategoryPicker` (existing)                                         |
| ------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Container shape     | No outer track — flat, borderless                                                               | `rounded-full` tinted pill track                                    |
| Active indicator    | 2px `--color-brand-green` underline that slides                                                 | Floating `--color-surface-card` capsule with shadow                 |
| Indicator motion    | `translateX` on a `position: absolute` `h-[2px]` bar                                            | `translateX` + width on an absolutely-positioned `rounded-full` div |
| Tab shape           | Flat text button, no border-radius                                                              | `rounded-full` pill button                                          |
| Font size           | `text-sm` (14px)                                                                                | `text-xs` (12px)                                                    |
| Font weight         | `font-medium` inactive / `font-semibold` active                                                 | `font-semibold` inactive / `font-bold` active                       |
| Press feedback      | `active:opacity-50` (fade — stronger than `0.70` to read against the semi-transparent gradient) | `active:scale-[0.97]` (squish)                                      |
| Active text color   | `--color-brand-green`                                                                           | `--color-brand-green`                                               |
| Inactive text color | `--color-text-secondary`                                                                        | `--color-text-secondary`                                            |
| Bottom margin       | `mb-3` + `pb-[3px]` (breathing room + underline shelf above CategoryPicker track)               | —                                                                   |

#### Sliding underline implementation

- The indicator is an absolutely-positioned `div` at the bottom of the tab row: `position: absolute; bottom: 3px; height: 2px; border-radius: 1px; background: var(--color-brand-green)`. The `bottom: 3px` offset (matching the container's `pb-[3px]`) places the indicator visually attached to the active tab's text baseline rather than flush with the container edge, preventing it from blending into the CategoryPicker track below.
- Its `left` and `width` are driven by the active button's `offsetLeft` and `offsetWidth`, measured via `useLayoutEffect` on `[selectedGroupID, groups]`.
- Animated with `transition: left var(--duration-element) var(--spring-snap), width var(--duration-element) var(--spring-snap)` — the spring easing gives it an iOS tab-bar snap feel.
- The container div holding both the buttons and underline needs `position: relative` to establish the absolute positioning context.

#### Drag-to-scroll

- Same Pointer Events pattern as `CategoryPicker` (`onPointerDown/Move/Up`, `setPointerCapture` on intent confirmed at 5px).
- Only engages when groups overflow the container width (i.e., when `scrollWidth > clientWidth`).
- `touch-action: manipulation` on each tab button.

#### Accessibility

- Each button: `aria-pressed={isSelected}`, `aria-label={group.name}`.
- The row container: `role="tablist"`, `aria-label="Groups"`.

#### Props

```ts
interface GroupTabBarProps {
  groups: CategoryGroup[];
  selectedGroupID: string | null; // null = "All"
  onSelectGroup: (id: string | null) => void;
}
```

#### "All" Tab

The "All" tab is synthesized inside the component — it is **not** a `CategoryGroup` in the data model. It is always rendered first with `id` value of `null`. Its label is "All".

#### Rendering condition

`GroupTabBar` is only rendered in `HeaderBar` when `store.hasGroups === true`. The component itself is unconditional — the guard is in `HeaderBar`.

#### Empty group state

When a user selects a group tab that has no assigned categories **and** no ungrouped categories exist to show, `categoriesInSelectedGroup` will be an empty array. This edge case must be handled gracefully:

- **`CategoryPicker`:** Renders nothing (the pill track container collapses to zero height because it has no pill children). The `rounded-full` tinted track should be hidden when `categoriesInSelectedGroup.length === 0` to avoid showing an empty floating pill container, which looks broken. **Spec:** conditionally render the outer track only when there are pills to show.
- **`CategoryPanel`:** Receives `store.selectedCategory` as `undefined` (since no valid `selectedCategoryID` exists for an empty group). The existing `undefined` guard in `CategoryPanel` already renders an empty spacer — but this reads as a blank crash, not a helpful message. **Spec:** when `hasGroups && categoriesInSelectedGroup.length === 0`, `CategoryPanel` should render an empty-state prompt: _"No lists in this group yet. Assign lists to this group in Settings."_ Use the same empty-state visual pattern (icon + heading + subtext) already used when a category has no items.
- **`BottomBar`:** Both `canSelectNextCategory` and `canSelectPreviousCategory` will be `false` (empty array). The `<footer>` still renders for safe-area padding, which is correct.

This scenario is most likely to happen immediately after a user creates a new group in Settings before they've assigned any lists to it.

---

### `HeaderBar` changes (`src/components/HeaderBar.tsx`)

Add `GroupTabBar` between the greeting row and `CategoryPicker`:

```tsx
{
  store.hasGroups && (
    <GroupTabBar
      groups={store.groups}
      selectedGroupID={store.selectedGroupID}
      onSelectGroup={store.selectGroup}
    />
  );
}
<CategoryPicker />;
```

> **Note:** `HeaderBar` currently does not consume `useCategoriesStore` directly — it receives props from `MainScreen`. This must change: `HeaderBar` should call `useCategoriesStore()` itself (or the group props should be threaded through). **Preferred approach:** have `GroupTabBar` call `useCategoriesStore()` directly (as `CategoryPicker` already does). This avoids prop threading through `HeaderBar` for data it doesn't otherwise need.

---

### `CategoryPicker` changes (`src/components/CategoryPicker.tsx`)

`CategoryPicker` should render from `store.categoriesInSelectedGroup` instead of `store.categories`. This is a one-line change to the destructuring at the top of the component:

```ts
// Before
const { categories, selectedCategoryID, selectCategory } = useCategoriesStore();

// After
const { categoriesInSelectedGroup, selectedCategoryID, selectCategory } =
  useCategoriesStore();
// ... replace `categories` with `categoriesInSelectedGroup` throughout
```

The `selectNextCategory` / `selectPreviousCategory` logic in the store must also respect the group filter — when a group is active, "next" and "previous" are scoped to `categoriesInSelectedGroup`.

---

### `SettingsSheet` changes (`src/screens/SettingsSheet.tsx`)

Add a **"Groups"** section between the existing "Categories" section and "Appearance". The Groups section allows:

1. **Create group** — inline text input + add button (same pattern as the existing "Add list" input).
2. **Rename group** — tap group name → opens the existing rename `Dialog` pattern.
3. **Delete group** — swipe-left on a group row reveals a red delete button, or a trailing delete icon.
4. **Assign categories to a group** — each category row in the "Categories" section gets a disclosure row or contextual "Move to group" action sheet. **Recommended approach:** a long-press or secondary tap action on each category row in Settings opens a small `ActionSheet` (already present in `src/components/ui/action-sheet.tsx`) listing group names + "Remove from group" + "Cancel".

#### Group ordering

Groups can be drag-to-reordered in the same way as categories (same drag handle + Pointer Events pattern already implemented for categories in `SettingsSheet`).

---

## 9. `SELECT_GROUP` Behavior Detail

When `SELECT_GROUP` is dispatched:

1. Update `selectedGroupID` to the new value (or `null` for "All").
2. Compute `categoriesInGroup` — the filtered list for the new group.
3. Check if `selectedCategoryID` exists in `categoriesInGroup`:
   - If yes → keep `selectedCategoryID` unchanged.
   - If no → set `selectedCategoryID` to `categoriesInGroup[0]?.id ?? ""`.
4. **Do not persist `selectedGroupID`** — it is ephemeral UI state.

The `nextCategory`/`previousCategory` derived values must also filter by `selectedGroupID` so that the `PageIndicator` dot count and swipe navigation stay consistent within the active group.

### Scope Transparency — PageIndicator and BottomBar Chevrons

This is a subtle but important UX concern. When a group is active:

- The `PageIndicator` shows **N dots** for the N lists in the active group — not the total list count. A user who has 8 lists total but is in a "Shopping" group with 3 lists will see 3 dots. This is **correct behaviour** — it accurately reflects navigation scope.
- The `BottomBar` chevrons navigate only within the active group. The left chevron label shows the previous list _in the group_, and the right chevron shows the next list _in the group_.
- **The potential confusion:** A user taps the right chevron expecting to reach a list they remember exists ("Notes"), but it's in a different group and is not reachable via chevron navigation. They must either tap "All" in `GroupTabBar` or switch groups to find it.

**Mitigation already in place:** The BottomBar chevron buttons display the adjacent category's name. If no adjacent category exists within the group, the chevron is hidden entirely — so a user at the last list in "Shopping" will see no right chevron, signalling there's nothing more in this context rather than implying the app has no more lists at all.

**No additional UI spec changes required** — the existing BottomBar conditional rendering already handles this correctly once navigation is scoped to `categoriesInSelectedGroup`. This note is here for implementer awareness.

---

## 10. File-by-File Change Summary

| File                                        | Change Type | Description                                                                                                                                                                                                                             |
| ------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/models/types.ts`                       | **Edit**    | Add `CategoryGroup` interface; add `groupID?: string` to `Category`                                                                                                                                                                     |
| `src/store/useCategoriesStore.ts`           | **Edit**    | Add `groups`, `selectedGroupID` to state; add 6 new action types + reducer cases; expose `categoriesInSelectedGroup`, `hasGroups`, `selectGroup`, `addGroup`, `renameGroup`, `deleteGroup`, `moveGroups`, `setCategoryGroup` on context |
| `src/services/persistenceService.ts`        | **Edit**    | Add `groups?: CategoryGroup[]` to `PersistedState`; update `save()` / `load()` signatures                                                                                                                                               |
| `src/services/syncService.ts`               | **Edit**    | Add `groups?: CategoryGroup[]` to `SyncPayload`; pass groups through `saveState`, `loadState`, `subscribeToState`                                                                                                                       |
| `src/components/GroupTabBar.tsx`            | **Create**  | New underline tab bar component for group selection                                                                                                                                                                                     |
| `src/components/CategoryPicker.tsx`         | **Edit**    | Consume `categoriesInSelectedGroup` instead of `categories`                                                                                                                                                                             |
| `src/components/HeaderBar.tsx`              | **Edit**    | Conditionally render `<GroupTabBar>` below greeting row, above `CategoryPicker`                                                                                                                                                         |
| `src/screens/SettingsSheet.tsx`             | **Edit**    | Add "Groups" section with CRUD operations and category-to-group assignment                                                                                                                                                              |
| `docs/snapshots/main-screen-ui-snapshot.md` | **Update**  | Document the new `GroupTabBar` component and updated `HeaderBar` layout tree                                                                                                                                                            |
| `docs/reference/data-models.md`             | **Update**  | Add `CategoryGroup` interface documentation                                                                                                                                                                                             |
| `docs/reference/state-management.md`        | **Update**  | Document new actions and derived values                                                                                                                                                                                                 |

---

## 11. Detailed Step-by-Step Execution Plan

### Phase 1 — Data Model & Store Foundation

**Step 1.1 — Add `CategoryGroup` to `src/models/types.ts`**

- Add `interface CategoryGroup { id: string; name: string; sortOrder: number; }` after the existing `Category` interface.
- Add `groupID?: string` as an optional field at the bottom of `Category`.
- Export `CategoryGroup`.

**Step 1.2 — Extend `PersistenceService`**

- Add `groups?: CategoryGroup[]` to `PersistedState`.
- Update `save(categories, selectedCategoryID, groups)` to include `groups` in the stored JSON.
- Update `load()` to return `groups: state.groups ?? []`.

**Step 1.3 — Extend `syncService`**

- Add `groups?: CategoryGroup[]` to `SyncPayload`.
- Update `saveState(syncCode, categories, selectedCategoryID, groups)` to include `groups` in the Firestore document.
- Update `loadState()`: the return value **must** explicitly include `groups: data.groups ?? []`. The `?? []` fallback must be on the return statement itself — not delegated to the caller — because any document written by an older client will have `data.groups === undefined`, which must be normalised to `[]` before it is dispatched into the store. Omitting this causes `state.groups` to become `undefined` and break every downstream `.length`/`.map`/`.filter` call.
  ```ts
  return {
    categories: data.lists,
    selectedCategoryID: data.selectedCategoryID,
    groups: data.groups ?? [], // ← critical fallback here, not in the caller
  };
  ```
- Update `subscribeToState()`: add `groups: CategoryGroup[]` as a third parameter to the callback type:
  ```ts
  callback: (categories: Category[], selectedCategoryID: string | null, groups: CategoryGroup[]) => void
  ```
  Inside the snapshot handler, pass `data.groups ?? []` as the third argument to the callback.

**Step 1.4 — Extend `useCategoriesStore`**

- Add `groups: CategoryGroup[]` and `selectedGroupID: string | null` to `StoreState`.
- Update `loadInitialState()` to read `groups` from `PersistenceService.load()`.
- Add 6 new action types to `StoreAction` union: `ADD_GROUP`, `RENAME_GROUP`, `DELETE_GROUP`, `MOVE_GROUPS`, `SELECT_GROUP`, `SET_CATEGORY_GROUP`.
- Add `SYNC_LOAD` action union member extension for `groups`.
- Implement reducer cases for all 6 new actions.
- Update the `RELOAD`, `RESET_CATEGORIES`, and `SYNC_LOAD` cases to handle `groups`. **Special care for `RELOAD`:** the current `RELOAD` case builds `next` without `groups` or `selectedGroupID` — once `StoreState` has these fields TypeScript will surface this as a type error, but it must be fixed explicitly:
  ```ts
  case "RELOAD": {
    const saved = PersistenceService.load();
    if (!saved || saved.categories.length === 0) return state;
    next = {
      categories: saved.categories,
      selectedCategoryID: saved.selectedCategoryID ?? saved.categories[0].id,
      groups: saved.groups ?? [],   // ← must be present
      selectedGroupID: null,        // ← reset to "All" on reload, same as initial load
    };
    return next;
  }
  ```
- Update the bottom auto-save call to pass `groups`: `PersistenceService.save(next.categories, next.selectedCategoryID, next.groups)`.
- Update `scheduleCloudSave` in `StoreProvider` to accept and forward `groups`:
  ```ts
  const scheduleCloudSave = useCallback(
    (categories: Category[], selectedCategoryID: string | null, groups: CategoryGroup[]) => {
      ...
      await saveState(syncCode, categories, selectedCategoryID, groups);
    },
    [isSyncEnabled, syncCode],
  );
  ```
  And update the trigger `useEffect` to watch `state.groups` and pass it as the third argument — **without this, group mutations never reach Firestore**:
  ```ts
  useEffect(() => {
    scheduleCloudSave(state.categories, state.selectedCategoryID, state.groups);
  }, [
    state.categories,
    state.selectedCategoryID,
    state.groups,
    scheduleCloudSave,
  ]);
  ```
- Update **both** `SYNC_LOAD` dispatch sites in `StoreProvider` to forward `groups`. There are two sites and both must be updated:
  1. The `loadState` call site (initial fetch on subscription setup):
     ```ts
     const cloudState = await loadState(syncCode);
     if (cloudState) {
       isLoadingFromSync.current = true;
       dispatch({
         type: "SYNC_LOAD",
         categories: cloudState.categories,
         selectedCategoryID: cloudState.selectedCategoryID,
         groups: cloudState.groups, // ← must be forwarded
       });
     }
     ```
  2. The `subscribeToState` callback (real-time updates):
     ```ts
     unsubscribe = subscribeToState(
       syncCode,
       (categories, selectedCategoryID, groups) => {
         // ← destructure groups
         isLoadingFromSync.current = true;
         dispatch({
           type: "SYNC_LOAD",
           categories,
           selectedCategoryID,
           groups,
         });
       },
     );
     ```
- Compute `categoriesInSelectedGroup` as a derived value: `selectedGroupID === null ? state.categories : state.categories.filter(c => c.groupID === selectedGroupID)`.
- Update `canSelectNextCategory`, `canSelectPreviousCategory`, `nextCategory`, `previousCategory` to operate on `categoriesInSelectedGroup` instead of `state.categories` (so navigation arrows and `PageIndicator` stay scoped to the group).
- Add `hasGroups: state.groups.length > 0` to context value.
- Expose new action methods: `selectGroup`, `addGroup`, `renameGroup`, `deleteGroup`, `moveGroups`, `setCategoryGroup`.
- Add all new values/methods to `StoreContextValue` interface.

---

### Phase 2 — New `GroupTabBar` Component

**Step 2.1 — Create `src/components/GroupTabBar.tsx`**

```
GroupTabBar
  └── outer div (position: relative, overflow-x: auto, pb-[3px], mb-3, mt-1)
        ├── flex row of tab buttons
        │     ├── "All" button (always first, selectedGroupID === null)
        │     └── groups.map(g => <button key={g.id}>)
        └── [position: absolute, bottom: 3px] sliding underline bar (h-[2px], brand-green)
```

Implementation notes:

- Use `useRef<(HTMLButtonElement | null)[]>([])` to collect button element refs (one per tab including "All").
- Use `useLayoutEffect` watching `[selectedGroupID, groups]` to read the active button's `offsetLeft` and `offsetWidth` and set the underline's `left` and `width` inline styles.
- Underline style: `position: absolute; bottom: 3px; height: 2px; border-radius: 1px; background: var(--color-brand-green); transition: left var(--duration-element) var(--spring-snap), width var(--duration-element) var(--spring-snap)`. **Use `bottom: 3px`, not `bottom: 0`** — this lifts the indicator off the container edge so it reads as connected to the tab text rather than as a border between the two rows. See Section 4 "Underline Indicator Contrast".
- The `--spring-snap` easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`) gives the underline a slight overshoot snap matching the existing dot/pill spring animations elsewhere in the app.
- Tab buttons: flat text (`text-sm`), no border-radius, `touch-action: manipulation`, **`active:opacity-50`** (not `active:opacity-70` — `0.70` is too subtle against the semi-transparent header gradient).
- Container spacing: `pb-[3px]` (underline shelf), `mb-3` (breathing room above CategoryPicker), `mt-1` (separation from greeting row).
- For drag-to-scroll (when groups overflow the container), inline the same `handlePointerDown/Move/Up` Pointer Events pattern as `CategoryPicker` — `isDraggingRef`, `hasDraggedRef`, `startXRef`, `scrollLeftRef`, `setPointerCapture` on `|dx| > 5px`.
- `hasDraggedRef` guard prevents drag from accidentally selecting a group tab on release.
- Each button: `aria-pressed={isSelected}`, `aria-label` set to the group name or "All".
- Container: `role="tablist"`, `aria-label="Groups"`.

**Step 2.2 — Add CSS animation to `src/index.css` (if needed)**

- The spring transition is applied inline via style props so no new CSS keyframes are needed.

---

### Phase 3 — Wire `GroupTabBar` into `HeaderBar`

**Step 3.1 — Update `src/components/HeaderBar.tsx`**

- Import `GroupTabBar` and `useCategoriesStore`.
- Below the greeting row and above `<CategoryPicker />`, add:
  ```tsx
  {
    store.hasGroups && (
      <GroupTabBar
        groups={store.groups}
        selectedGroupID={store.selectedGroupID}
        onSelectGroup={store.selectGroup}
      />
    );
  }
  ```
- `GroupTabBar` is conditionally rendered — no visual change for users without groups.

---

### Phase 4 — Update `CategoryPicker`

**Step 4.1 — Swap `categories` for `categoriesInSelectedGroup`**

- Change the destructured store value from `categories` to `categoriesInSelectedGroup`.
- Replace all internal references to `categories` with `categoriesInSelectedGroup`.
- No other changes needed — the component behavior is identical, just operating on a smaller array.

---

### Phase 5 — Settings Sheet — Groups CRUD

> **Before editing:** The full file is 765 lines. The key structural insight: the existing drag-to-reorder state (`dragIndex`, `overIndex`, `listRef`, `itemRects`, `dragOffsetY`, `dragNodeY`, and all four handlers) belongs exclusively to the **Categories** list. The **Groups** list needs its own parallel set — `groupDragIndex`, `groupOverIndex`, `groupListRef`, `groupItemRects`, `groupDragOffsetY`, `groupDragNodeY`, and its own `handleGroupDragPointerDown/Move/Up` + `snapshotGroupRects` + `getGroupDropIndex`. **Do not share drag state between the two lists.**

**Step 5.1 — Add new local state to `SettingsSheet`**

At the top of `SettingsSheet` (below the existing category rename state, around line 48), add:

```ts
// ── Group state ──
const [newGroupName, setNewGroupName] = useState("");
const [groupToRename, setGroupToRename] = useState<{
  id: string;
  name: string;
} | null>(null);
const [renameGroupName, setRenameGroupName] = useState("");
const [groupAssignTarget, setGroupAssignTarget] = useState<{
  id: string;
  name: string;
} | null>(null);

// ── Group drag-to-reorder state ──
const [groupDragIndex, setGroupDragIndex] = useState<number | null>(null);
const [groupOverIndex, setGroupOverIndex] = useState<number | null>(null);
const groupDragOffsetY = useRef(0);
const groupDragNodeY = useRef(0);
const groupListRef = useRef<HTMLUListElement>(null);
const groupItemRects = useRef<DOMRect[]>([]);

const addGroupInputRef = useRef<HTMLInputElement>(null);
const renameGroupInputRef = useRef<HTMLInputElement>(null);
const trimmedNewGroupName = newGroupName.trim();
```

**Step 5.2 — Add group drag handlers**

Below the existing `handleDragPointerUp` function (around line 160), add parallel group drag handlers that mirror the category drag handlers exactly, but reference the `group*` state and call `store.moveGroups`:

```ts
// ── Group drag handlers ──
const snapshotGroupRects = useCallback(() => {
  if (!groupListRef.current) return;
  const items =
    groupListRef.current.querySelectorAll<HTMLElement>("[data-group-idx]");
  groupItemRects.current = Array.from(items).map((el) =>
    el.getBoundingClientRect(),
  );
}, []);

const getGroupDropIndex = useCallback((clientY: number) => {
  const rects = groupItemRects.current;
  for (let i = 0; i < rects.length; i++) {
    const mid = rects[i].top + rects[i].height / 2;
    if (clientY < mid) return i;
  }
  return rects.length - 1;
}, []);

const handleGroupDragPointerDown = useCallback(
  (e: React.PointerEvent, idx: number) => {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    snapshotGroupRects();
    const rect = groupItemRects.current[idx];
    groupDragOffsetY.current = e.clientY - rect.top;
    groupDragNodeY.current = e.clientY;
    setGroupDragIndex(idx);
    setGroupOverIndex(idx);
  },
  [snapshotGroupRects],
);

const handleGroupDragPointerMove = useCallback(
  (e: React.PointerEvent) => {
    if (groupDragIndex === null) return;
    if (e.pointerType === "mouse" && e.buttons === 0) return;
    groupDragNodeY.current = e.clientY;
    setGroupOverIndex(getGroupDropIndex(e.clientY));
  },
  [groupDragIndex, getGroupDropIndex],
);

const handleGroupDragPointerUp = useCallback(() => {
  if (groupDragIndex === null || groupOverIndex === null) {
    setGroupDragIndex(null);
    setGroupOverIndex(null);
    return;
  }
  if (groupDragIndex !== groupOverIndex) {
    store.moveGroups(groupDragIndex, groupOverIndex);
  }
  setGroupDragIndex(null);
  setGroupOverIndex(null);
}, [groupDragIndex, groupOverIndex, store]);

function handleRenameGroupSave() {
  if (!groupToRename) return;
  const trimmed = renameGroupName.trim();
  if (!trimmed) return;
  store.renameGroup(groupToRename.id, trimmed);
  setGroupToRename(null);
  setRenameGroupName("");
}
```

**Step 5.3 — Insert the Groups `SettingsCard` into the JSX**

**Exact insertion point:** After the closing `</SettingsCard>` of the Categories card (line ~396) and before the `{/* Appearance */}` comment. The JSX block to insert:

```tsx
{
  /* Groups */
}
<SettingsCard>
  <SectionLabel>Groups</SectionLabel>

  {store.groups.length > 0 && (
    <ul
      ref={groupListRef}
      className="flex flex-col gap-1.5"
      onPointerMove={handleGroupDragPointerMove}
      onPointerUp={handleGroupDragPointerUp}
      onPointerCancel={handleGroupDragPointerUp}
    >
      {(() => {
        const groups = store.groups;
        const indices = groups.map((_, i) => i);
        if (
          groupDragIndex !== null &&
          groupOverIndex !== null &&
          groupDragIndex !== groupOverIndex
        ) {
          const [moved] = indices.splice(groupDragIndex, 1);
          indices.splice(groupOverIndex, 0, moved);
        }
        return indices.map((srcIdx) => {
          const group = groups[srcIdx];
          const isDragging = srcIdx === groupDragIndex;
          return (
            <li
              key={group.id}
              data-group-idx={srcIdx}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-transform duration-150"
              style={{
                backgroundColor: `rgba(var(--color-brand-deep-green-rgb), 0.06)`,
                opacity: isDragging ? 0.5 : 1,
                transform: isDragging ? "scale(0.97)" : undefined,
              }}
            >
              {/* Drag handle */}
              <div
                className="touch-none cursor-grab active:cursor-grabbing select-none p-1 -m-1 active:scale-[0.96] transition-transform"
                onPointerDown={(e) => handleGroupDragPointerDown(e, srcIdx)}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    color: "var(--color-brand-teal)",
                    opacity: 0.5,
                    flexShrink: 0,
                  }}
                >
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </div>

              <span
                className="flex-1 text-sm font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                {group.name}
              </span>

              {/* Rename button */}
              <button
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-all active:scale-[0.96] active:opacity-75"
                onClick={() => {
                  setRenameGroupName(group.name);
                  setGroupToRename({ id: group.id, name: group.name });
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-brand-teal)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>

              {/* Delete button */}
              <button
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-all active:scale-[0.96] active:opacity-75"
                onClick={() => store.deleteGroup(group.id)}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-danger)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </li>
          );
        });
      })()}
    </ul>
  )}

  {/* Add group inline */}
  <div className="flex gap-2 items-center">
    <Input
      ref={addGroupInputRef}
      value={newGroupName}
      onChange={(e) => setNewGroupName(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (trimmedNewGroupName) {
            store.addGroup(trimmedNewGroupName);
            setNewGroupName("");
            addGroupInputRef.current?.blur();
            requestAnimationFrame(() => addGroupInputRef.current?.focus());
          }
        }
      }}
      placeholder="Add new group"
      className={`flex-1 ${inputClass}`}
      style={{ color: "var(--color-text-primary)" }}
      enterKeyHint="send"
      autoCapitalize="words"
    />
    <button
      className="h-11 w-11 flex items-center justify-center rounded-xl text-white shrink-0 transition-all disabled:opacity-30 active:scale-[0.96] active:opacity-75"
      style={{ backgroundColor: "var(--color-brand-green)" }}
      disabled={trimmedNewGroupName.length === 0}
      onClick={() => {
        store.addGroup(trimmedNewGroupName);
        setNewGroupName("");
        addGroupInputRef.current?.blur();
        requestAnimationFrame(() => addGroupInputRef.current?.focus());
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  </div>
</SettingsCard>;
```

**Step 5.4 — Add group badge to each category row**

In the existing Categories `<li>` (around line 316), between the category name `<span>` and the rename pencil `<button>`, insert a group-assignment badge:

```tsx
{
  /* Group assignment badge — tapping opens ActionSheet */
}
{
  store.groups.length > 0 && (
    <button
      className="text-xs font-medium px-2 py-1 rounded-lg transition-all active:scale-[0.96] active:opacity-75 shrink-0"
      style={{
        color: "var(--color-brand-green)",
        backgroundColor: `rgba(var(--color-brand-green-rgb), 0.10)`,
      }}
      onClick={() =>
        setGroupAssignTarget({ id: category.id, name: category.name })
      }
    >
      {store.groups.find((g) => g.id === category.groupID)?.name ?? "—"}
    </button>
  );
}
```

This badge is only visible when groups exist (`store.groups.length > 0`). Its label shows the assigned group name or `—` for ungrouped. Tapping opens an `ActionSheet`.

**Step 5.5 — Add the group assignment `ActionSheet`**

Import `ActionSheet` at the top of the file:

```ts
import ActionSheet from "@/components/ui/action-sheet";
```

Then add the `ActionSheet` below the existing Rename Dialog (after the closing `</Dialog>` for category rename, around line 570):

```tsx
{
  /* Group Assignment ActionSheet */
}
<ActionSheet
  isOpen={groupAssignTarget !== null}
  onClose={() => setGroupAssignTarget(null)}
  title={groupAssignTarget?.name ?? ""}
  message="Assign to a group"
  actions={[
    ...store.groups.map((g) => ({
      label: g.name,
      onClick: () => {
        if (groupAssignTarget) {
          store.setCategoryGroup(groupAssignTarget.id, g.id);
        }
        setGroupAssignTarget(null);
      },
    })),
    {
      label: "Remove from group",
      onClick: () => {
        if (groupAssignTarget) {
          store.setCategoryGroup(groupAssignTarget.id, undefined);
        }
        setGroupAssignTarget(null);
      },
    },
  ]}
  cancelLabel="Cancel"
/>;
```

**Step 5.6 — Add Group Rename Dialog**

Add a second rename dialog below the category rename Dialog (around line 590). Reuse the exact same structure — only the title, bound state, and save handler differ:

```tsx
{
  /* Group Rename Dialog */
}
<Dialog
  open={groupToRename !== null}
  onOpenChange={(open) => {
    if (!open) {
      setGroupToRename(null);
      setRenameGroupName("");
    }
  }}
>
  <DialogContent showCloseButton={false} className="gap-3">
    <DialogHeader>
      <DialogTitle>Rename Group</DialogTitle>
    </DialogHeader>
    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
      Choose a new name for "{groupToRename?.name}".
    </p>
    <Input
      ref={renameGroupInputRef}
      value={renameGroupName}
      onChange={(e) => setRenameGroupName(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleRenameGroupSave();
        }
      }}
      className={inputClass}
      autoFocus
    />
    <DialogFooter className="flex-row gap-2 mt-1">
      <Button
        variant="ghost"
        className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
        style={{ color: "var(--color-text-secondary)" }}
        onClick={() => {
          setGroupToRename(null);
          setRenameGroupName("");
        }}
      >
        Cancel
      </Button>
      <Button
        variant="ghost"
        className="flex-1 rounded-xl font-semibold hover:!bg-[color:var(--color-surface-input)]"
        style={{ color: "var(--color-brand-green)" }}
        onClick={handleRenameGroupSave}
      >
        Save
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

**Step 5.7 — State wiring summary**

Store methods to destructure (via `const store = useCategoriesStore()`, already present):

| Method                                                     | Action dispatched    |
| ---------------------------------------------------------- | -------------------- |
| `store.addGroup(name)`                                     | `ADD_GROUP`          |
| `store.renameGroup(id, newName)`                           | `RENAME_GROUP`       |
| `store.deleteGroup(id)`                                    | `DELETE_GROUP`       |
| `store.moveGroups(from, to)`                               | `MOVE_GROUPS`        |
| `store.setCategoryGroup(categoryID, groupID \| undefined)` | `SET_CATEGORY_GROUP` |

All five must be added to `StoreContextValue` in Phase 1 Step 1.4.

---

### Phase 6 — Sync & Persistence Validation

**Step 6.1 — Manual sync test**

- After implementing Steps 1.2–1.3, open the app in two browser tabs with sync enabled.
- Create a group in one tab, verify it appears in the other.
- Assign a category to the group, verify the assignment syncs.
- Verify that an older "client" (tab without groups support — simulate by clearing `groups` from the Firestore payload) loads gracefully with `groups: []`.

**Step 6.2 — Offline test**

- Disable network. Create a group. Re-enable network. Verify the group syncs on reconnect (the existing debounced cloud-save will handle this).

---

### Phase 7 — Documentation Updates

**Step 7.1 — Update `docs/reference/data-models.md`**

- Add `CategoryGroup` interface documentation.
- Document `groupID?: string` addition to `Category`.

**Step 7.2 — Update `docs/reference/state-management.md`**

- Document all 6 new actions.
- Document `categoriesInSelectedGroup`, `hasGroups`, and `selectedGroupID`.

**Step 7.3 — Update `docs/snapshots/main-screen-ui-snapshot.md`**

- Add `GroupTabBar` to the HeaderBar layout tree.
- Document the conditional rendering rule (`hasGroups`).
- Document `GroupTabBar` component behavior (sliding indicator, drag-scroll, "All" tab).

---

## 12. Non-Goals / Out of Scope

- **Nested groups / sub-groups:** Groups are a single level of hierarchy. Categories cannot belong to more than one group.
- **Group-level statistics** (e.g. total items across a group): Out of scope for this feature.
- **Group color coding:** Could be added later as a `color?: string` field on `CategoryGroup`. Not planned here.
- **Onboarding for groups:** No changes to the onboarding flow. Groups are a power-user feature discoverable only via Settings.
- **Category duplication across groups:** A category can belong to at most one group. Cross-group "shortcuts" are not supported.

---

## 13. Risks & Mitigations

| Risk                                                                                      | Mitigation                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header height increase on small phones                                                    | `GroupTabBar` only renders when `hasGroups === true`. Users without groups see no change.                                                                                                                                                                                                                                                                                                   |
| Sync payload size increase                                                                | `CategoryGroup` objects are tiny (id, name, sortOrder). A user with 10 groups adds <1 KB to the Firestore document.                                                                                                                                                                                                                                                                         |
| Older synced clients receiving `groups` in payload                                        | `groups` field is optional in `SyncPayload`. Old clients that don't understand it will ignore it via the `?? []` fallback in `loadInitialState`.                                                                                                                                                                                                                                            |
| `selectedCategoryID` pointing to a category outside the selected group after group switch | Handled explicitly in the `SELECT_GROUP` reducer case (Step 1.4).                                                                                                                                                                                                                                                                                                                           |
| Drag-to-scroll conflict between `GroupTabBar` and `CategoryPicker`                        | Both components use independent Pointer Events handlers with `setPointerCapture`. They are vertically separated UI elements, so no gesture conflict.                                                                                                                                                                                                                                        |
| **`scheduleCloudSave` not forwarding `groups` to Firestore**                              | `scheduleCloudSave` signature and its trigger `useEffect` dependency array must both be updated (Step 1.4). Without this, all group mutations are silently dropped from cloud sync — groups exist locally but never reach other devices.                                                                                                                                                    |
| **`SYNC_LOAD` dispatch sites missing `groups`**                                           | Both dispatch sites in `StoreProvider` (the `loadState` initial fetch and the `subscribeToState` callback) must destructure and forward `groups` into the action (Step 1.4). Miss either site and real-time or initial sync will silently wipe the local groups state on every cloud update.                                                                                                |
| **`loadState` missing `?? []` fallback on return**                                        | The fallback must be applied on the `return` statement inside `loadState` itself, not delegated to the caller (Step 1.3). `data.groups` is `undefined` on any document written before groups existed; without the guard, `state.groups` becomes `undefined` and every downstream `.map`/`.filter`/`.length` on groups throws at runtime.                                                    |
| **`RELOAD` reducer case missing `groups` and `selectedGroupID`**                          | Once `StoreState` gains these fields, the `RELOAD` early return must include both, or TypeScript will flag a type error and the reload will discard all group state (Step 1.4).                                                                                                                                                                                                             |
| **User confusion: BottomBar chevrons scoped to active group**                             | A user in a specific group sees only N dots and can only chevron-navigate within that group. The existing BottomBar conditional (hide chevron when no adjacent category exists) naturally signals "end of context." No extra UI changes required, but implementers must ensure `canSelectNextCategory` / `canSelectPreviousCategory` operate on `categoriesInSelectedGroup`. See Section 9. |
| **Empty group state — blank CategoryPanel with no guidance**                              | If a group has no assigned categories, `CategoryPanel` receives `undefined`. The existing `undefined` guard renders a blank spacer. This reads as a crash, not a helpful state. Spec updated in Section 8: render an informational empty-state prompt when `hasGroups && categoriesInSelectedGroup.length === 0`.                                                                           |
| **Ungrouped categories silently disappear when switching to a specific group**            | Without the ungrouped-visibility spec (Section 4), a user who hasn't fully assigned their lists will find some lists unreachable from specific group tabs. Spec updated: ungrouped categories appear as dimmed trailing pills in `CategoryPicker` even when a specific group is active.                                                                                                     |

---

## 14. UI Mockup (ASCII)

### Main Screen — with groups (≥1 group created)

```
┌─────────────────────────────────────┐ ← safe-area-inset-top
│  Hey Spencer  ↺  ⚙                  │ ← greeting row
│                                     │ ← mt-1 (4px spacer above GroupTabBar)
│  All   Shopping   Work              │ ← GroupTabBar (flat text, no track bg)
│     ───                             │     └── 2px underline at bottom: 3px
│                                     │ ← mb-3 (12px) breathing room
│ ┌─────────────────────────────────┐ │
│ │ ● Groceries  │ Costco  │ Target │ │ ← CategoryPicker (tinted rounded-full track,
│ └─────────────────────────────────┘ │     floating card capsule on selected pill)
├─────────────────────────────────────┤
│  ☑ Milk                             │
│  ☑ Eggs                             │
│  ☐ Bread                            │  ← CategoryPanel
│  ☐ Butter                           │
├─────────────────────────────────────┤
│  ← ● ● ○ →    [+ Add item     ] [✓] │ ← BottomBar (dots + chevrons scoped to active group)
└─────────────────────────────────────┘ ← safe-area-inset-bottom
```

Visual hierarchy signals at a glance:

- `GroupTabBar`: larger text (14px), flat/open, underline indicator → reads as "section header nav"
- `CategoryPicker`: smaller text (12px), enclosed pill track, floating capsule → reads as "item picker within section"
- Clear breathing room (12px gap) between the two rows — they are related but visually distinct levels

### Main Screen — with groups, Shopping active, Costco ungrouped

```
│  All   Shopping   Work              │
│       ────────                      │ ← "Shopping" tab active
│ ┌─────────────────────────────────┐ │
│ │ ● Groceries  │ Target  ┆ Costco │ │ ← Costco shown dimmed (ungrouped, trailing)
│ └─────────────────────────────────┘ │     ┆ = subtle visual separator
```

The dimmed trailing pills communicate "these lists exist but don't belong to this group" — users can still tap them and they become fully functional.

### Main Screen — empty group (new group, no lists assigned yet)

```
│  All   Shopping   Work   New Group  │
│                          ─────────  │ ← "New Group" active
│ (no CategoryPicker track rendered)  │ ← pill track hidden when 0 pills
├─────────────────────────────────────┤
│                                     │
│    📂   No lists in this group      │ ← empty-state prompt
│    Assign lists in Settings         │ ← same visual pattern as empty category
│                                     │
└─────────────────────────────────────┘
```

### Main Screen — no groups (today's UI, completely unchanged)

```
┌─────────────────────────────────────┐
│  Hey Spencer  ↺  ⚙                  │
│ ┌─────────────────────────────────┐ │
│ │ ● Groceries  │ Tasks  │ Costco  │ │ ← CategoryPicker only (no GroupTabBar)
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│                                     │
│             (same as today)         │
│                                     │
└─────────────────────────────────────┘
```

### Settings Sheet — Groups section

```
── Groups ─────────────────────────────
  ≡  Shopping
  ≡  Work
  ─────────────────────────────────────
  [+ New group name___]        [Add]

── Categories ─────────────────────────
  ≡  Groceries              Shopping ›
  ≡  Costco                 Shopping ›
  ≡  Tasks                      Work ›
  ≡  Notes                         — ›
```

_(Tapping the group label on a category row opens an ActionSheet to assign/change group)_
