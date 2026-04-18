<!-- Status: In Progress | Last updated: April 2026 -->
# Plan: Settings Sheet — Sticky Header Fade + Groups Collapsed by Default

**Date:** April 2026  
**Scope:** Two focused UX improvements to `SettingsSheet` and its group row components.

---

## Feature 1 — Sticky Title/Done Header with Scroll Fade

### Goal

The "Settings" title and "Done" button should remain pinned to the top of the sheet at all times. When the user scrolls content upward, that content should visually fade behind the header rather than abruptly pass under it, matching the blur/fade pattern used by `HeaderBar` on `MainScreen`.

### Current structure (relevant excerpt)

```
<SheetContent>
  <div className="overflow-y-auto max-h-[90dvh]">          ← single scroll container
    <SheetHeader ...>                                       ← title + Done button (scrolls away)
    <div className="flex flex-col gap-4 ...">              ← section content
  </div>
</SheetContent>
```

The `SheetHeader` is **inside** the scroll container, so it scrolls off the top. There is no sticky pinning or fade.

### Chosen approach — lift header out of scroll container, add gradient fade overlay

Pull the `SheetHeader` **above** the scroll container so it sits outside the scrollable area. The `SheetContent` already renders as `flex flex-col` (confirmed in `src/components/ui/sheet.tsx` — its base className includes `flex flex-col gap-4`), so no additional wrapper div is needed. The scroll container just needs `flex-1 overflow-y-auto` to fill the remaining height beneath the header.

A thin absolutely-positioned gradient overlay div is placed at the bottom edge of the sticky header to fade content as it scrolls up beneath it. `SheetContent` is already a `position: fixed` element and serves as the positioning root — no extra `relative` wrapper is required.

No `onScroll` listener or JS state is required — this is a pure CSS layout change with a single fixed-size gradient overlay div.

**Pros:** Zero JS, zero runtime state, works on every scroll position, consistent with how iOS navigation bars fade content.  
**No scroll-state boolean needed** — unlike `MainScreen`'s header shrink (which uses `scrolled` state to drive a title animation), the settings header has no animated content to drive, so CSS-only is sufficient.

> **Scope clarification:** The sticky header only needs to be visible while the settings sheet itself is the active surface. When any dialog or action sheet (rename, delete, add, group assignment, etc.) is open on top of the sheet, the entire sheet — including the sticky header — is already dimmed/faded behind the dialog overlay by the existing `SettingsDialogPortal` and shadcn sheet backdrop. No special handling is needed; this is already correct behaviour.

### Step-by-step

#### Step 1 — `src/screens/SettingsSheet.tsx`

1. Remove `overflow-y-auto max-h-[90dvh]` from the wrapper `<div>` that currently wraps both the header and content — that `<div>` becomes a `flex flex-col overflow-hidden max-h-[90dvh]` clip container. Do **not** add another wrapper inside `SheetContent`; it already provides the `flex flex-col` context.
2. Move `<SheetHeader>` to be the **first direct child** of this wrapper div, before the scroll div.
3. Give the scroll `<div>` `flex-1 overflow-y-auto` so it fills all remaining height beneath the header.
4. Immediately after `</SheetHeader>`, insert the fade overlay `<div>`. Because `SheetContent` is `position: fixed`, the parent wrapper just needs `relative` so the overlay positions against it:

```tsx
{
  /* Gradient fade — blends content scrolling under the sticky header */
}
<div
  aria-hidden
  className="pointer-events-none absolute left-0 right-0 z-10"
  style={{
    top: "60px",
    height: "28px",
    background:
      "linear-gradient(to bottom, var(--color-surface-background) 0%, transparent 100%)",
  }}
/>;
```

The `top: "60px"` value matches the header's fixed rendered height (padding-top 16px + 28px title row + padding-bottom 12px = 56px; round up to 60px for safety). This is a **CSS constant** — do not use `useState`/`useEffect` to measure it at runtime. `offsetHeight` reads `0` during the sheet's open animation on iOS Safari, making dynamic measurement unreliable. The header height will not change in practice.

> **Import change:** No new imports required. `useRef` is the only hook needed (already present for `sheetFocusSentinelRef`).

#### Step 2 — Verify line count ceiling

`SettingsSheet.tsx` is currently 146 lines. Adding ~6 lines of JSX restructure = ~152 lines total. Within the **180-line hard ceiling**. No extraction needed.

---

## Feature 2 — Groups Collapsed by Default + Chevron Repositioned/Resized

### Goal

- When the settings sheet opens, all groups should be **collapsed** (not expanded).
- The expand/collapse chevron should be **moved to the right side of the group name** and made **slightly larger** (current: `width="11" height="11"`; target: `width="14" height="14"`).

### Affected files

| File                                                  | Change                                    |
| ----------------------------------------------------- | ----------------------------------------- |
| `src/features/settings/hooks/useExpandedGroups.ts`    | Default all groups to collapsed           |
| `src/features/settings/components/GroupRowHeader.tsx` | Move chevron right of name; increase size |

---

### 2a — Default collapsed in `useExpandedGroups.ts`

#### Current behaviour

The `useEffect` that syncs group IDs runs on mount and on every `groups` change. It auto-adds every group ID to `expandedGroupIDs`:

```ts
for (const id of currentGroupIDs) {
  if (!next.has(id)) next.add(id); // ← auto-expands every group
}
```

This means on first open all groups appear expanded.

#### Fix

The `useEffect` should only **remove stale IDs** (deleted groups) and **not auto-add new groups**. New groups will be collapsed by default; the user must tap to expand.

Replace the inner loop:

```ts
// BEFORE
for (const id of currentGroupIDs) {
  if (!next.has(id)) next.add(id);
}

// AFTER — remove stale only; do not auto-expand new groups
// (new groups start collapsed)
```

Keep only the stale-removal loop:

```ts
for (const id of next) {
  if (!currentGroupIDs.has(id)) next.delete(id);
}
```

> **Note:** The initial `useState` value is already `new Set()` (empty = all collapsed), so on mount the sheet opens with everything collapsed. The effect just ensures deleted groups are cleaned up.

> **Drag interaction compatibility:** `useGroupDrag` collapses all groups on drag start (saving expanded state to `savedExpandedGroupIDsRef`) and calls `setExpandedGroupIDs(savedExpandedGroupIDsRef.current)` on pointer-up to restore them. When groups default to collapsed, `savedExpandedGroupIDsRef.current` will be an empty set — so after a drag the groups will remain collapsed. This is the correct behaviour.

#### Line count

`useExpandedGroups.ts` is currently 68 lines. Removing 3 lines = 65 lines. Well within the **120-line ceiling**.

---

### 2b — Move chevron + resize in `GroupRowHeader.tsx`

#### Current layout order (left → right)

```
[drag handle] [chevron button] [name button] [badge] [rename] [delete]
```

#### Target layout order

```
[drag handle] [name button] [chevron button] [badge] [rename] [delete]
```

The chevron `<button>` block should be cut from its current position (between drag handle and name) and pasted **immediately after** the name `<button>` block.

The SVG dimensions should change from `width="11" height="11"` to `width="14" height="14"`.

#### Line count

`GroupRowHeader.tsx` is currently 140 lines. Moving a ~12-line block (no net addition) = still 140 lines. Within the **180-line ceiling**.

---

## Files to Edit

| #   | File                                                  | Change summary                                                                                                                                                                          |
| --- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/screens/SettingsSheet.tsx`                       | Lift `SheetHeader` out of scroll container; restructure wrapper to `flex flex-col overflow-hidden`; add gradient fade overlay div at hardcoded `top: 60px` (no new hook imports needed) |
| 2   | `src/features/settings/hooks/useExpandedGroups.ts`    | Remove the auto-add loop inside `useEffect` so groups default to collapsed; drag restore remains correct (restores to empty set = still collapsed)                                      |
| 3   | `src/features/settings/components/GroupRowHeader.tsx` | Move chevron button to right of name button; increase SVG size to 14×14                                                                                                                 |

---

## Validation

After all edits: `npm run build` (`tsc --noEmit && vite build`). Fix any errors before marking complete.
