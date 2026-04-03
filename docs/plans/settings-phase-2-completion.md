# Settings — Phase 2: Completion, Bug Fixes & Add Button Redesign

**Date:** April 2, 2026  
**Branch:** `db-storage-research`  
**Status:** Ready for implementation  
**Scope:** `src/screens/SettingsSheet.tsx`, `src/styles/tokens.css`, `src/services/syncService.ts`, `src/store/useSyncStore.tsx`

---

## Part 1 — Sync Behavior Answers

### 1.1 Is the user's name synced across devices?

**Short answer: No. The user's name is device-local and is never included in the sync payload.**

**Evidence from the codebase:**

The `SyncPayload` interface in `syncService.ts` is:

```typescript
interface SyncPayload {
  lists: Category[];
  selectedCategoryID: string | null;
  groups?: CategoryGroup[];
  updatedAt: number;
}
```

`userName` is absent. The `settingsService.ts` stores `userName` under the localStorage key `"userName"` independently of `PersistenceService` (which stores categories/groups under `"grocery-lists-state"`). The `saveState` call in `useCategoriesStore.ts` only passes `categories`, `selectedCategoryID`, and `groups` — not any settings values.

**Implications:**

- When a user enters a sync code on a new device, their name does **not** transfer. They will see the default name (empty string, showing no greeting or a generic greeting).
- This is a deliberate omission in the current architecture — settings (`userName`, `appearanceMode`, `textSize`) are considered per-device preferences, not shared data.

**Should `userName` be added to sync?** See §1.3 below.

---

### 1.2 Which settings are per-device vs synced?

| Setting                  | Storage location                 | Included in sync payload? | Behavior on new device after code entry               |
| ------------------------ | -------------------------------- | ------------------------- | ----------------------------------------------------- |
| `userName`               | `localStorage` (settingsService) | ❌ No                     | Empty — not transferred                               |
| `appearanceMode`         | `localStorage` (settingsService) | ❌ No                     | Defaults to `"system"`                                |
| `textSize`               | `localStorage` (settingsService) | ❌ No                     | Defaults to `"m"`                                     |
| `sortOrder`              | `localStorage` (settingsService) | ❌ No                     | Defaults to `"date"`                                  |
| `hasCompletedOnboarding` | `localStorage` (settingsService) | ❌ No                     | Set to `false` — triggers onboarding on fresh install |
| Categories (lists)       | `localStorage` + Firestore       | ✅ Yes (`lists`)          | Fully synced                                          |
| Checklist items          | Embedded in categories           | ✅ Yes (via `lists`)      | Fully synced                                          |
| Groups                   | `localStorage` + Firestore       | ✅ Yes (`groups`)         | Fully synced                                          |
| `selectedCategoryID`     | `localStorage` + Firestore       | ✅ Yes                    | Synced (device that adopts opens same list)           |
| `syncCode`               | `localStorage` (settingsService) | N/A (is the code itself)  | User enters it manually                               |
| `isSyncEnabled`          | `localStorage` (settingsService) | N/A                       | Set when user enables/adopts                          |

**Summary:** All content data (categories, items, groups, selected list) is synced. All appearance/UX preferences (name, theme, text size, sort order) are per-device. This is the correct and intentional design — preferences are personal to the device; list content is shared.

---

### 1.3 Should `userName` be added to the sync payload?

**Recommendation: Yes, add `userName` to the sync payload with a merge strategy.**

**Rationale:** The name is used to personalize the app's greeting. A user who sets up ListMaster on their phone with their name, then opens it on an iPad and enters the same sync code, will see an impersonal greeting on the iPad. This is a noticeable UX gap.

**Proposed merge strategy:**

- When adopting a sync code, if the cloud payload contains a `userName` AND the local `userName` is empty (or hasn't been set since onboarding), adopt the cloud name.
- If the local device already has a name set, do **not** overwrite it — device-local name takes precedence. This prevents two users sharing a sync code from overwriting each other's names.
- On save, always write the local `userName` to the payload.

**Proposed payload field name:** `userName` (optional for backwards compatibility with existing documents that don't have it).

This is a **separate implementation task** and is explicitly called out in the implementation steps below (§3, Step 0).

---

## Part 2 — Gaps from Phase 1 Plan vs Current Implementation

Comparing `settings-categories-groups-ux-redesign.md` against the current `SettingsSheet.tsx`:

### ✅ Implemented

| Item                                                                      | Status                                                  |
| ------------------------------------------------------------------------- | ------------------------------------------------------- |
| §3 — Single unified "Categories & Groups" card                            | ✅ Done                                                 |
| §6.1 — Group header with chevron, drag handle, rename, delete             | ✅ Done                                                 |
| §6.1 — Expand/collapse animation with `max-height`                        | ✅ Done                                                 |
| §6.1 — `expandedGroupIDs` state with `useEffect` to seed new groups       | ✅ Done                                                 |
| §6.1 — Category count badge on group header                               | ✅ Done                                                 |
| §6.2 — Category sub-rows indented under groups                            | ✅ Done                                                 |
| §6.2 — No `📁` folder button (replaced by position)                       | ✅ Done                                                 |
| §6.3 — "No Group" divider section                                         | ✅ Done                                                 |
| §6.3 — `"+ Assign"` chip on ungrouped categories                          | ✅ Done                                                 |
| §6.4 — Scoped drag with `dragContext` ref                                 | ✅ Done                                                 |
| §6.4 — Flat-index translation algorithm                                   | ✅ Done                                                 |
| §9 step 0 — `--color-brand-teal-rgb` token (light default `:root`)        | ✅ Done                                                 |
| §9 step 0 — `--color-brand-teal-rgb` in dark media query                  | ✅ Done                                                 |
| §9 step 0 — `--color-brand-teal-rgb` in `:root[data-theme="light"]`       | ✅ Done                                                 |
| §9 step 0 — `--color-brand-teal-rgb` in `:root[data-theme="dark"]`        | ✅ Done                                                 |
| §9 step 0 — `--color-brand-deep-green-rgb` in `:root[data-theme="light"]` | ✅ Done                                                 |
| §9 step 0 — `--color-brand-deep-green-rgb` in `:root[data-theme="dark"]`  | ✅ Done                                                 |
| §6.6 — Two stacked add-input rows at bottom                               | ✅ Done (to be replaced by new Add button — see Part 3) |
| Groups discoverability caption                                            | ✅ Done                                                 |

---

### ❌ Not Implemented (Phase 1 gaps)

#### GAP-1: `--color-danger-rgb` token is missing from `:root` (light default) and `:root[data-theme="light"]`

**Evidence:** `tokens.css` `:root` block has `--color-brand-green-rgb`, `--color-brand-teal-rgb`, and `--color-brand-deep-green-rgb` but **no `--color-danger-rgb`**. The dark media query block and the `[data-theme="dark"]` block both have it, but the light contexts don't.

**Impact:** Three places in `SettingsSheet.tsx` use the hardcoded `rgba(212, 75, 74, 0.08)` for danger tint backgrounds (the "Disable" sync button, the "Delete cloud data" option, and the "Reset to New User" button). These will not theme-aware — they won't update properly in dark mode via the `--color-danger-rgb` token path.

Plan §11.3 specifically calls for adding `--color-danger-rgb` to all four blocks. Currently it exists in the two dark blocks but not the two light blocks.

**Fix:** Add `--color-danger-rgb: 212, 75, 74` to `:root` and `:root[data-theme="light"]` in `tokens.css`. Then replace all three `rgba(212, 75, 74, 0.08)` literals in `SettingsSheet.tsx` with `rgba(var(--color-danger-rgb), 0.08)`.

---

#### GAP-2: Sections 11.1–11.9 (Additional Settings UX Improvements) not implemented

All nine additional improvements from the plan are absent from the current implementation:

| #    | What's missing                                                         | Priority |
| ---- | ---------------------------------------------------------------------- | -------- |
| 11.1 | Name card is first, not fourth; no helper text                         | 🔴 High  |
| 11.2 | Text Size labels all `text-xs`, not self-sized                         | 🔴 High  |
| 11.3 | No sync status badge in sync-enabled state                             | 🔴 High  |
| 11.4 | Category delete has no two-tap confirm                                 | 🟡 Med   |
| 11.5 | Section label reads "Account Management", not "Data"                   | 🟡 Med   |
| 11.6 | "Enter Code" in sync-enabled state (should be "Switch Code" + warning) | 🟡 Med   |
| 11.7 | "Done" button is ghost, no filled background                           | 🟠 Low   |
| 11.8 | Appearance toggle has no mode icons                                    | 🟠 Low   |
| 11.9 | Card order not updated to usage-frequency order                        | 🟠 Low   |

---

#### GAP-3: `max-height` ceiling for collapsed group sub-lists is too small

**Evidence:** The current implementation calculates `max-height` for expanded groups as:

```tsx
maxHeight: isExpanded ? `${Math.max(groupCategories.length, 1) * 56}px` : "0px",
```

This is proportional to category count, which is correct conceptually. However, the actual category row height inside a group is **not 56px** — it's `py-2` (8px top + 8px bottom = 16px padding) + `text-sm` line height (~20px) = ~36px per row. For groups with many items, the `56px` ceiling is actually too generous (clips nothing), but for a group with 0 items, `Math.max(1) * 56 = 56px` leaves visible empty space before the "No categories yet" message appears. More importantly, the plan specified a **fixed 600px ceiling** for groups, not a dynamic calculation — a fixed ceiling is more CSS-transition-friendly and prevents jank on group reorder (when item count changes between renders).

**Fix:** Replace `Math.max(groupCategories.length, 1) * 56` with a fixed `600px` ceiling as specified in §6.1 of the plan.

---

#### GAP-4: `pendingDeleteCategoryID` two-tap confirm (§11.4) not implemented

The single-tap delete is still in place on all category rows (both grouped and ungrouped). No `pendingDeleteCategoryID` state variable exists, and no visual confirm state is shown.

---

#### GAP-5: `selectedCategoryID` is NOT synced correctly on `adoptSyncCode`

**Evidence:** In `useSyncStore.tsx`, `adoptSyncCode` calls `ensureAnonymousAuth()`, sets the code, and sets `isSyncEnabled = true` — but it **never loads or applies the cloud state from the newly adopted code**. The cloud data only flows in via the `useEffect` in `useCategoriesStore.ts` that watches `isSyncEnabled` and `syncCode`, which triggers `subscribeToState` and `loadState`.

This means there is a race condition: the sync code is set before Firebase auth completes fully, and the categories store useEffect fires before Firestore returns data. In practice the `loadState` inside `setupSubscription` fills the gap. However, there's no loading state shown to the user while the adopt is in progress — the app simply shows whatever local state exists until the cloud loads, potentially for up to 5 seconds (the fetch timeout).

This is a pre-existing gap noted in the original plan's `db-sync-options.md`. **Deferring to a separate sync improvement pass** — it is out of scope for this plan but should be noted.

---

## Part 3 — Unified "Add" Button Design

### 3.1 Problem Statement

The current two-input-row approach ("Add new category" + "Add new group") at the bottom of the Categories & Groups card has two issues:

1. **Visual clutter:** Two full-width input rows with `[+]` buttons creates a dense, form-heavy bottom zone.
2. **Cognitive ambiguity:** New users don't know which input to use first, or whether they need a group at all.

### 3.2 Proposed Design: Single "+ Add" Button → Two-Step ActionSheet

Replace both add inputs with a single tappable pill button:

```
  ┌────────────────────────────────┐
  │  +  Add Category or Group       │
  └────────────────────────────────┘
```

Tapping it opens a small `ActionSheet` (already used elsewhere in the app) with two choices:

```
┌─────────────────────────────────────┐
│  Add a Category                     │  → Opens inline inline input flow
│  Add a Group                        │  → Opens inline inline input flow
│  Cancel                             │
└─────────────────────────────────────┘
```

**After "Add a Category" is tapped:**

Open a `Dialog` with:

- A text input: "Category name"
- If groups exist: a secondary optional control "Add to group" — a dropdown/selector showing all current groups plus "No Group (ungrouped)"
- [Cancel] [Add] buttons

This collapses the name entry + group assignment into a single atomic creation flow. When no groups exist, the dialog is minimal (just the name input), keeping the zero-groups experience clean.

**After "Add a Group" is tapped:**

Open a `Dialog` with:

- A text input: "Group name"
- [Cancel] [Create] buttons

No secondary options needed for group creation.

### 3.3 State Required

```typescript
// Add flow state
type AddMode = "category" | "group" | null;
const [addMode, setAddMode] = useState<AddMode>(null);
const [isAddActionSheetOpen, setIsAddActionSheetOpen] = useState(false);
const [addCategoryName, setAddCategoryName] = useState("");
const [addCategoryGroupID, setAddCategoryGroupID] = useState<string | null>(
  null,
); // null = ungrouped
const [addGroupName, setAddGroupName] = useState("");
```

The existing `newCategoryName`, `newGroupName`, `addCategoryInputRef` state and the two input rows are **removed** entirely.

### 3.4 Wire Diagrams

**Zero groups state:**

```
  [ + Add Category or Group ]
       ↓ tap
  ┌────────────────────────────┐
  │  Add a Category            │
  │  Add a Group               │
  │  ─────────────────────     │
  │  Cancel                    │
  └────────────────────────────┘
       ↓ "Add a Category"
  ┌────────────────────────────┐
  │ Add Category               │
  │                            │
  │ [ Category name...       ] │
  │                            │
  │     [Cancel]  [Add]        │
  └────────────────────────────┘
```

**Groups exist — adding a category:**

```
  [ + Add Category or Group ]
       ↓ tap → "Add a Category"
  ┌────────────────────────────┐
  │ Add Category               │
  │                            │
  │ [ Category name...       ] │
  │                            │
  │ Add to group (optional):   │
  │ ┌────────────────────────┐ │
  │ │ No Group (ungrouped) ▾ │ │  ← native <select> or custom
  │ └────────────────────────┘ │
  │                            │
  │     [Cancel]  [Add]        │
  └────────────────────────────┘
```

### 3.5 Group Selector Implementation

For the group selector inside the Add Category dialog: use a native `<select>` element, styled to match the app's input look. Native `<select>` on iOS renders a native picker sheet, which is exactly the right affordance for a short list of options. Avoid a custom dropdown component for this — the native control is perfectly functional and avoids introducing new complexity.

Style it to match `inputClass`:

```tsx
<select
  value={addCategoryGroupID ?? ""}
  onChange={(e) => setAddCategoryGroupID(e.target.value || null)}
  className={inputClass} // reuse existing class
  style={{ color: "var(--color-text-primary)" }}
>
  <option value="">No Group (ungrouped)</option>
  {store.groups.map((g) => (
    <option key={g.id} value={g.id}>
      {g.name}
    </option>
  ))}
</select>
```

### 3.6 Keyboard Flow

- The `Dialog` for Add Category autofocuses the name input (`autoFocus`).
- Pressing Enter in the name input moves focus to the group selector (if groups exist), or submits if no groups.
- The [Add] button is disabled while the name field is empty.
- On successful add, the dialog closes and the newly added category is visible in the list (the `addCategory` store action handles this).

### 3.7 Discovery for "groups" Feature

The discoverability caption `"Categories live inside groups. Create groups to organize your lists."` (shown when `store.groups.length === 0`) is retained above the Add button. This is the only hook that tells new users groups exist.

Additionally, after creating the first group, the caption disappears — the groups hierarchy is now self-evident in the UI.

---

## Part 4 — Implementation Plan

### Step 0 — Token fixes in `src/styles/tokens.css`

**File:** `src/styles/tokens.css`

Add `--color-danger-rgb` to the two missing blocks:

- In `:root` (light default) — after `--color-danger: #d44b4a;`:  
  `--color-danger-rgb: 212, 75, 74;`

- In `:root[data-theme="light"]` — after `--color-danger: #d44b4a;`:  
  `--color-danger-rgb: 212, 75, 74;`

> The dark media query and `[data-theme="dark"]` blocks already have `--color-danger-rgb: 231, 101, 96` — do not modify those.

---

### Step 1 — Fix hardcoded danger tint in `SettingsSheet.tsx`

**File:** `src/screens/SettingsSheet.tsx`

Replace all three occurrences of `rgba(212, 75, 74, 0.08)` with `rgba(var(--color-danger-rgb), 0.08)`:

1. The "Disable" sync button (`backgroundColor: "rgba(212, 75, 74, 0.08)"`)
2. The "Delete cloud data" disable dialog option (same)
3. The "Reset to New User" button in the Account Management card (same)

---

### Step 2 — Fix `max-height` ceiling for group sub-lists

**File:** `src/screens/SettingsSheet.tsx`

In the group section render, change the dynamic `max-height` calculation to a fixed ceiling:

```tsx
// Before:
maxHeight: isExpanded ? `${Math.max(groupCategories.length, 1) * 56}px` : "0px",

// After:
maxHeight: isExpanded ? "600px" : "0px",
```

---

### Step 3 — Implement two-tap confirm for category delete (§11.4)

**File:** `src/screens/SettingsSheet.tsx`

**Add state:**

```typescript
const [pendingDeleteCategoryID, setPendingDeleteCategoryID] = useState<
  string | null
>(null);
```

**Add `useEffect` for auto-revert timer:**

```typescript
useEffect(() => {
  if (!pendingDeleteCategoryID) return;
  const timer = setTimeout(() => setPendingDeleteCategoryID(null), 2000);
  return () => clearTimeout(timer);
}, [pendingDeleteCategoryID]);
```

**Modify all category delete buttons** (there are two: one inside grouped sub-rows, one inside the "No Group" section, and one in the flat no-groups layout — three total):

```tsx
// Delete button — two-tap confirm
<button
  className="p-1.5 rounded-md transition-all active:scale-[0.9] disabled:opacity-20"
  style={{
    opacity: pendingDeleteCategoryID === category.id ? 1 : 0.5,
    color:
      pendingDeleteCategoryID === category.id
        ? "var(--color-danger)"
        : undefined,
  }}
  disabled={!store.canDeleteCategories}
  onClick={(e) => {
    e.stopPropagation();
    if (pendingDeleteCategoryID === category.id) {
      store.deleteCategory(category.id);
      setPendingDeleteCategoryID(null);
    } else {
      if (!store.canDeleteCategories) return;
      setPendingDeleteCategoryID(category.id);
    }
  }}
>
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke={
      pendingDeleteCategoryID === category.id
        ? "var(--color-danger)"
        : "var(--color-danger)"
    }
    strokeWidth={pendingDeleteCategoryID === category.id ? "2.5" : "2"}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
</button>
```

The visual differentiation between "pending" and "default" states: in the pending state, the icon stroke is thicker (`strokeWidth="2.5"`) and opacity is `1` vs `0.5` for default. The danger color is already present in both states, so the main signal is the opacity/weight change.

---

### Step 4 — Rename "Account Management" → "Data" (§11.5)

**File:** `src/screens/SettingsSheet.tsx`

Change `<SectionLabel>Account Management</SectionLabel>` → `<SectionLabel>Data</SectionLabel>`.

---

### Step 5 — Rename "Enter Code" → "Switch Code" in sync-enabled state + warning (§11.6)

**File:** `src/screens/SettingsSheet.tsx`

In the `sync.isSyncEnabled` branch:

```tsx
// Before:
<button ... onClick={() => setIsAdoptingCode(true)}>
  Enter Code
</button>

// After:
<button ... onClick={() => setIsAdoptingCode(true)}>
  Switch Code
</button>
```

Add a `text-xs` warning note beneath the button row:

```tsx
<p className="text-xs mt-2" style={{ color: "var(--color-text-secondary)" }}>
  Switching to a different code will replace your current data.
</p>
```

---

### Step 6 — Text Size labels render in own sizes (§11.2)

**File:** `src/screens/SettingsSheet.tsx`

Add a size class lookup:

```typescript
const TEXT_SIZE_CLASS: Record<string, string> = {
  xs: "text-xs",
  s: "text-sm",
  m: "text-base",
  l: "text-lg",
  xl: "text-xl",
};
```

Update each `ToggleGroupItem` in the Text Size toggle to use its own size class instead of the shared `text-xs` in the className string. Since the className currently applies `text-xs` via the shared class string, each item must **override** that with its own size. The cleanest approach is to move the font size out of the shared className and into a `style` prop (or individual className) per item:

```tsx
{(["xs", "s", "m", "l", "xl"] as const).map((size) => (
  <ToggleGroupItem
    key={size}
    value={size}
    className="flex-1 !rounded-lg font-semibold hover:!bg-transparent aria-pressed:!bg-[var(--color-surface-card)] aria-pressed:!text-[var(--color-brand-green)] aria-pressed:shadow-sm aria-pressed:!opacity-100 opacity-75 transition-all"
    style={{ color: "var(--color-text-primary)", fontSize: TEXT_SIZE_CLASS... }}
  >
```

> **Important:** Since Tailwind classes `text-xs` through `text-xl` are utilities that set `font-size` via CSS, you cannot override them in the shared className string with per-item values from a variable. The correct approach is: remove `text-xs` from the shared className string, and instead add `className={TEXT_SIZE_CLASS[size]}` merged via `cn()`, or use an inline `style={{ fontSize: ... }}` with explicit rem values. Using a Tailwind class per item merged with `cn()` is preferred:

```tsx
const TEXT_SIZE_TAILWIND: Record<string, string> = {
  xs: "text-xs",
  s: "text-sm",
  m: "text-base",
  l: "text-lg",
  xl: "text-xl",
};

// In JSX:
<ToggleGroupItem
  key={size}
  value={size}
  className={cn(
    "flex-1 !rounded-lg font-semibold hover:!bg-transparent aria-pressed:!bg-[var(--color-surface-card)] aria-pressed:!text-[var(--color-brand-green)] aria-pressed:shadow-sm aria-pressed:!opacity-100 opacity-75 transition-all",
    TEXT_SIZE_TAILWIND[size],
  )}
  style={{ color: "var(--color-text-primary)" }}
>
  {size.toUpperCase()}
</ToggleGroupItem>;
```

`cn` is already imported from `@/lib/utils` in the project.

---

### Step 7 — Sync status badge in sync-enabled state (§11.3)

**File:** `src/screens/SettingsSheet.tsx`

In the `sync.isSyncEnabled` branch, update the "Sync Code" label row from:

```tsx
<div className="flex items-center justify-between">
  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
    Sync Code
  </span>
  <button ... >Copy</button>
</div>
```

To include an inline status badge between the label and copy button:

```tsx
<div className="flex items-center justify-between gap-2">
  <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
    Sync Code
  </span>
  {/* Sync status badge */}
  {sync.syncStatus === "synced" && (
    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ color: "var(--color-brand-green)", backgroundColor: "rgba(var(--color-brand-green-rgb), 0.1)" }}>
      <span style={{ fontSize: "10px" }}>●</span> Synced
    </span>
  )}
  {sync.syncStatus === "syncing" && (
    <span className="text-[11px] font-medium animate-spin"
      style={{ color: "var(--color-text-secondary)" }}>
      ◌
    </span>
  )}
  {sync.syncStatus === "error" && (
    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ color: "var(--color-danger)", backgroundColor: "rgba(var(--color-danger-rgb), 0.08)" }}>
      ⚠ Sync failed
    </span>
  )}
  {/* idle: no badge */}
  <button ... >Copy</button>
</div>
```

---

### Step 8 — "Done" button elevated visual weight (§11.7)

**File:** `src/screens/SettingsSheet.tsx`

Update the Done button:

```tsx
// Before:
<Button
  variant="ghost"
  className="font-semibold text-sm rounded-full px-4 hover:!bg-[color:var(--color-surface-input)] !border-[color:var(--color-brand-green)]/40 focus-visible:!border-[color:var(--color-brand-green)] focus-visible:!ring-[color:var(--color-brand-green)]/30"
  style={{ color: "var(--color-brand-green)" }}
  onClick={() => onOpenChange(false)}
>
  Done
</Button>

// After:
<Button
  variant="ghost"
  className="font-semibold text-sm rounded-full px-4 hover:!bg-[color:var(--color-surface-input)] focus-visible:!border-[color:var(--color-brand-green)] focus-visible:!ring-[color:var(--color-brand-green)]/30 active:scale-[0.96] transition-all"
  style={{
    color: "var(--color-brand-green)",
    backgroundColor: "rgba(var(--color-brand-green-rgb), 0.12)",
    touchAction: "manipulation",
  }}
  onClick={() => onOpenChange(false)}
>
  Done
</Button>
```

Remove the `!border-[color:var(--color-brand-green)]/40` class — the filled background makes the border redundant.

---

### Step 9 — Appearance toggle mode icons (§11.8)

**File:** `src/screens/SettingsSheet.tsx`

Add inline SVG icons (12×12) before each label in the Appearance toggle:

```tsx
const APPEARANCE_ICONS: Record<string, React.ReactNode> = {
  system: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  light: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  dark: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
};
```

Then in each `ToggleGroupItem`:

```tsx
<ToggleGroupItem key={mode} value={mode} className="...">
  <span className="flex items-center gap-1.5">
    {APPEARANCE_ICONS[mode]}
    {mode === "system" ? "System" : mode === "light" ? "Light" : "Dark"}
  </span>
</ToggleGroupItem>
```

---

### Step 10 — Card ordering by usage frequency (§11.9)

**File:** `src/screens/SettingsSheet.tsx`

Reorder the `SettingsCard` blocks. New order:

1. **Categories & Groups** (currently 2nd)
2. **Appearance** (currently 4th)
3. **Text Size** (currently 5th)
4. **Name** (currently 1st)
5. **Sync & Backup** (currently 6th)
6. **Data** (Reset) (currently 7th — renamed from "Account Management")

This is purely a JSX block reordering — no logic changes.

---

### Step 11 — Replace two add-inputs with unified "Add" button

**File:** `src/screens/SettingsSheet.tsx`

**A) Remove state:**

- Remove `const [newCategoryName, setNewCategoryName] = useState("")`
- Remove `const [newGroupName, setNewGroupName] = useState("")`
- Remove `const addCategoryInputRef` ref
- Remove `const trimmedNewCategoryName` derived value
- Remove the `addCategory()` function
- Remove the `addGroup()` function

**B) Add new state:**

```typescript
const [isAddActionSheetOpen, setIsAddActionSheetOpen] = useState(false);
const [addMode, setAddMode] = useState<"category" | "group" | null>(null);
const [addCategoryName, setAddCategoryName] = useState("");
const [addCategoryGroupID, setAddCategoryGroupID] = useState<string | null>(
  null,
);
const [addGroupDialogName, setAddGroupDialogName] = useState("");
```

**C) Add handlers:**

```typescript
function handleAddCategoryConfirm() {
  const trimmed = addCategoryName.trim();
  if (!trimmed) return;
  store.addCategory(trimmed);
  // If a group was selected, assign it immediately after creation
  if (addCategoryGroupID) {
    // Find the newly created category (will be last in the array after add)
    // addCategory dispatches synchronously; we must use a post-dispatch lookup
    // This is done via a useEffect watching store.categories, OR we can rely on
    // store.categories being updated before the next render. Because this is
    // called from a button handler, store.categories is stale here.
    // SOLUTION: Instead of using store.addCategory + store.setCategoryGroup in sequence,
    // add a new store action ADD_CATEGORY_TO_GROUP that combines both atomically.
    // See Note A below.
  }
  setAddMode(null);
  setAddCategoryName("");
  setAddCategoryGroupID(null);
}

function handleAddGroupConfirm() {
  const trimmed = addGroupDialogName.trim();
  if (!trimmed) return;
  store.addGroup(trimmed);
  setAddMode(null);
  setAddGroupDialogName("");
}
```

> **Note A — Atomic category+group creation:** The current `ADD_CATEGORY` reducer action does not accept a `groupID`. Creating a category and then assigning its group requires two dispatches. Because React batches state updates in event handlers, both dispatches will trigger a single re-render — so `store.categories` after `addCategory()` in the handler body is the **stale** closure value. The safe solution is to add a new `ADD_CATEGORY_WITH_GROUP` action to the `useCategoriesStore.ts` reducer:
>
> ```typescript
> // In StoreAction union:
> | { type: "ADD_CATEGORY_WITH_GROUP"; name: string; groupID: string }
>
> // In reducer:
> case "ADD_CATEGORY_WITH_GROUP": {
>   const trimmed = normalizedName(action.name);
>   if (!trimmed || !isNameAvailable(state.categories, trimmed)) return state;
>   const newCategory: Category = {
>     id: uuidv4(),
>     name: trimmed,
>     items: [],
>     groupID: action.groupID,
>   };
>   next = {
>     ...state,
>     categories: [...state.categories, newCategory],
>     selectedCategoryID: newCategory.id,
>   };
>   break;
> }
> ```
>
> Add a corresponding `addCategoryWithGroup(name: string, groupID: string)` callback and expose it on `StoreContextValue`.
>
> `handleAddCategoryConfirm` then becomes:
>
> ```typescript
> function handleAddCategoryConfirm() {
>   const trimmed = addCategoryName.trim();
>   if (!trimmed) return;
>   if (addCategoryGroupID) {
>     store.addCategoryWithGroup(trimmed, addCategoryGroupID);
>   } else {
>     store.addCategory(trimmed);
>   }
>   setAddMode(null);
>   setAddCategoryName("");
>   setAddCategoryGroupID(null);
> }
> ```

**D) Replace the two-input block in the JSX** with:

```tsx
{
  /* ── Add controls ── */
}
<div className="flex flex-col gap-2 pt-1">
  <div
    className="border-t"
    style={{ borderColor: "var(--color-text-secondary)", opacity: 0.1 }}
  />

  <button
    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
    style={{
      color: "var(--color-brand-green)",
      backgroundColor: "rgba(var(--color-brand-green-rgb), 0.08)",
      touchAction: "manipulation",
    }}
    onClick={() => setIsAddActionSheetOpen(true)}
  >
    <svg
      width="16"
      height="16"
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
    Add Category or Group
  </button>
</div>;
```

**E) Add the ActionSheet** (after the existing Group Assignment ActionSheet in the returned JSX):

```tsx
{
  /* Add Category or Group ActionSheet */
}
<ActionSheet
  isOpen={isAddActionSheetOpen}
  onClose={() => setIsAddActionSheetOpen(false)}
  title="What would you like to add?"
  actions={[
    {
      label: "Add a Category",
      onClick: () => {
        setIsAddActionSheetOpen(false);
        setAddMode("category");
        setAddCategoryGroupID(null);
        setAddCategoryName("");
      },
    },
    {
      label: "Add a Group",
      onClick: () => {
        setIsAddActionSheetOpen(false);
        setAddMode("group");
        setAddGroupDialogName("");
      },
    },
  ]}
/>;
```

**F) Add the Add Category Dialog** (after the ActionSheet):

```tsx
{
  /* Add Category Dialog */
}
<Dialog
  open={addMode === "category"}
  onOpenChange={(open) => {
    if (!open) {
      setAddMode(null);
      setAddCategoryName("");
      setAddCategoryGroupID(null);
    }
  }}
>
  <DialogContent showCloseButton={false} className="gap-3">
    <DialogHeader>
      <DialogTitle>Add Category</DialogTitle>
    </DialogHeader>
    <Input
      value={addCategoryName}
      onChange={(e) => setAddCategoryName(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleAddCategoryConfirm();
        }
      }}
      placeholder="Category name"
      className={inputClass}
      autoFocus
      autoCapitalize="words"
    />
    {store.groups.length > 0 && (
      <div className="flex flex-col gap-1.5">
        <label
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--color-brand-teal)" }}
        >
          Add to Group (optional)
        </label>
        <select
          value={addCategoryGroupID ?? ""}
          onChange={(e) => setAddCategoryGroupID(e.target.value || null)}
          className={inputClass}
          style={{ color: "var(--color-text-primary)" }}
        >
          <option value="">No Group (ungrouped)</option>
          {store.groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
    )}
    <DialogFooter className="flex-row gap-2 mt-1">
      <Button
        variant="ghost"
        className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
        style={{ color: "var(--color-text-secondary)" }}
        onClick={() => {
          setAddMode(null);
          setAddCategoryName("");
          setAddCategoryGroupID(null);
        }}
      >
        Cancel
      </Button>
      <Button
        variant="ghost"
        className="flex-1 rounded-xl font-semibold hover:!bg-[color:var(--color-surface-input)]"
        style={{ color: "var(--color-brand-green)" }}
        disabled={!addCategoryName.trim()}
        onClick={handleAddCategoryConfirm}
      >
        Add
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

**G) Add the Add Group Dialog:**

```tsx
{
  /* Add Group Dialog */
}
<Dialog
  open={addMode === "group"}
  onOpenChange={(open) => {
    if (!open) {
      setAddMode(null);
      setAddGroupDialogName("");
    }
  }}
>
  <DialogContent showCloseButton={false} className="gap-3">
    <DialogHeader>
      <DialogTitle>Add Group</DialogTitle>
    </DialogHeader>
    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
      Groups help you organize categories together.
    </p>
    <Input
      value={addGroupDialogName}
      onChange={(e) => setAddGroupDialogName(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleAddGroupConfirm();
        }
      }}
      placeholder="Group name"
      className={inputClass}
      autoFocus
      autoCapitalize="words"
    />
    <DialogFooter className="flex-row gap-2 mt-1">
      <Button
        variant="ghost"
        className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
        style={{ color: "var(--color-text-secondary)" }}
        onClick={() => {
          setAddMode(null);
          setAddGroupDialogName("");
        }}
      >
        Cancel
      </Button>
      <Button
        variant="ghost"
        className="flex-1 rounded-xl font-semibold hover:!bg-[color:var(--color-surface-input)]"
        style={{ color: "var(--color-brand-green)" }}
        disabled={!addGroupDialogName.trim()}
        onClick={handleAddGroupConfirm}
      >
        Create
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

---

### Step 12 — Add `userName` to sync payload

This step spans **three files**: `syncService.ts`, `useSettingsStore.ts`, and `useCategoriesStore.ts`. All three must be updated together — partial application will leave TypeScript call-site errors.

#### 12a — `src/services/syncService.ts`

Update `SyncPayload`:

```typescript
interface SyncPayload {
  lists: Category[];
  selectedCategoryID: string | null;
  groups?: CategoryGroup[]; // optional for backwards compatibility with older clients
  userName?: string; // optional — absent in documents written before this field was added
  updatedAt: number; // Unix ms — used to detect stale writes
}
```

Update `saveState` signature and body:

```typescript
export async function saveState(
  syncCode: string,
  categories: Category[],
  selectedCategoryID: string | null,
  groups: CategoryGroup[],
  userName: string,
): Promise<void> {
  const payload: SyncPayload = {
    lists: categories,
    selectedCategoryID,
    groups,
    userName: userName || undefined, // don't persist empty string
    updatedAt: Date.now(),
  };
  await setDoc(syncDocRef(syncCode), payload);
}
```

Update `loadState` return type and body:

```typescript
export async function loadState(syncCode: string): Promise<{
  categories: Category[];
  selectedCategoryID: string | null;
  groups: CategoryGroup[];
  userName?: string;
} | null>;
// ... in fetchPromise:
return {
  categories: data.lists,
  selectedCategoryID: data.selectedCategoryID,
  groups: data.groups ?? [],
  userName: data.userName,
};
```

Update `subscribeToState` callback signature:

```typescript
callback: (
  categories: Category[],
  selectedCategoryID: string | null,
  groups: CategoryGroup[],
  userName: string | undefined,
) =>
  void (
    // ... in onSnapshot:
    callback(
      data.lists,
      data.selectedCategoryID,
      data.groups ?? [],
      data.userName,
    )
  );
```

#### 12b — `src/store/useSettingsStore.ts`

Add a `syncUserName` method to the `SettingsState` interface and its implementation in `SettingsProvider`. This method applies the merge strategy (only sets the name if local is currently empty) and updates both `localStorage` and React state so the change is immediately visible in the UI:

```typescript
// Add to SettingsState interface:
/**
 * Sets the user's name only if no name is currently stored locally.
 * Called by the sync system when a cloud-originated name is received.
 * Does nothing if the user has already set a local name.
 */
syncUserName: (name: string) => void;

// Implementation in SettingsProvider:
function syncUserName(name: string) {
  // Merge strategy: device-local name takes precedence.
  // Only adopt the cloud name if this device has never set one.
  if (!name || SettingsService.getUserName()) return;
  SettingsService.setUserName(name);
  setUserNameState(name);
}

// Add syncUserName to the context value object.
```

#### 12c — `src/store/useCategoriesStore.ts`

**A) Import `useSettingsStore`** at the top of the file (it is not currently imported):

```typescript
import { useSettingsStore } from "./useSettingsStore";
```

**B) In `StoreProvider`, consume `useSettingsStore`** and add a `userNameRef` kept in sync:

```typescript
const settings = useSettingsStore();
const userNameRef = useRef(settings.userName);
useEffect(() => {
  userNameRef.current = settings.userName;
}, [settings.userName]);
```

**C) Update `scheduleCloudSave`** to pass `userNameRef.current` to `saveState`:

```typescript
// Inside the setTimeout callback, change:
await saveState(syncCode, categories, selectedCategoryID, groups);
// To:
await saveState(
  syncCode,
  categories,
  selectedCategoryID,
  groups,
  userNameRef.current,
);
```

**D) Update the `subscribeToState` callback** in `setupSubscription` to receive and apply `cloudUserName`:

```typescript
unsubscribe = subscribeToState(
  syncCode,
  (categories, selectedCategoryID, groups, cloudUserName) => {
    isLoadingFromSync.current = true;
    dispatch({ type: "SYNC_LOAD", categories, selectedCategoryID, groups });
    // Apply merge strategy via settings store — updates both localStorage and React state
    if (cloudUserName) {
      settings.syncUserName(cloudUserName);
    }
  },
);
```

**E) Update the `loadState` call** in `setupSubscription` (the initial one-shot fetch) to also apply the merge:

```typescript
const cloudState = await loadState(syncCode);
if (cloudState) {
  isLoadingFromSync.current = true;
  dispatch({
    type: "SYNC_LOAD",
    categories: cloudState.categories,
    selectedCategoryID: cloudState.selectedCategoryID,
    groups: cloudState.groups,
  });
  if (cloudState.userName) {
    settings.syncUserName(cloudState.userName);
  }
}
```

> **Note on hook call order:** `useSettingsStore()` must be called unconditionally at the top level of `StoreProvider`, not inside `setupSubscription` or any callback — React's rules of hooks require this. The `settings` object is already in scope for the async `setupSubscription` closure via the outer `StoreProvider` function scope.

---

### Step 13 — Remove orphaned refs and state

After removing the two add-input rows in Step 11, remove:

- `const addCategoryInputRef = useRef<HTMLInputElement>(null)` — no longer used.
- The `enterKeyHint="send"` add input ref attachment — removed with the inputs.

---

## Part 5 — File Change Summary

| File                              | Steps            | Change type                                                                                                                                                                                                       |
| --------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/styles/tokens.css`           | 0                | Add `--color-danger-rgb` to `:root` and `[data-theme="light"]`                                                                                                                                                    |
| `src/screens/SettingsSheet.tsx`   | 1–11, 13         | Multiple targeted edits                                                                                                                                                                                           |
| `src/store/useCategoriesStore.ts` | 11 (Note A), 12c | Add `ADD_CATEGORY_WITH_GROUP` action + `addCategoryWithGroup` callback; import `useSettingsStore`; add `userNameRef`; thread `userName` to `saveState`; apply merge in `subscribeToState` and initial `loadState` |
| `src/store/useSettingsStore.ts`   | 12b              | Add `syncUserName(name: string)` method to interface and provider                                                                                                                                                 |
| `src/services/syncService.ts`     | 12a              | Add `userName` to `SyncPayload`, `saveState`, `loadState`, `subscribeToState`                                                                                                                                     |

---

## Part 6 — Implementation Order (Agent)

Execute in this order to minimize broken intermediate states:

1. **Step 0** — `tokens.css` token fix (unblocks Step 7's danger-rgb badge)
2. **Step 1** — Replace hardcoded danger tint (safe cosmetic fix, no logic)
3. **Step 2** — Fix `max-height` ceiling (safe one-liner)
4. **Step 4** — Rename "Account Management" → "Data" (trivial)
5. **Step 5** — "Switch Code" rename + warning (low risk)
6. **Step 6** — Text Size self-sized labels (isolated to one ToggleGroup)
7. **Step 7** — Sync status badge (additive, no state changes)
8. **Step 8** — Done button elevated style (cosmetic)
9. **Step 9** — Appearance icons (additive)
10. **Step 10** — Card reorder (JSX block move only)
11. **Step 3** — Two-tap delete confirm (adds state, touches 3 buttons)
12. **Step 11 (Note A)** — `ADD_CATEGORY_WITH_GROUP` action in store
13. **Step 11** — Replace add inputs with unified Add button + dialogs
14. **Step 12a** — `syncService.ts` payload + function signature changes
15. **Step 12b** — `useSettingsStore.ts` — add `syncUserName()` method
16. **Step 12c** — `useCategoriesStore.ts` — import settings store, add `userNameRef`, thread through `saveState` and `subscribeToState`
17. **Step 13** — Remove orphaned refs

---

## Part 7 — Known Deferred Items

| Item                                                | Reason deferred                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| GAP-5: `adoptSyncCode` loading state                | Requires dedicated sync UX pass (spinner overlay, error recovery) |
| §11.8 Appearance icons — custom SVG path refinement | Paths above are functional but may benefit from design review     |
| Cross-group drag (v2)                               | Explicitly deferred in the original plan                          |
