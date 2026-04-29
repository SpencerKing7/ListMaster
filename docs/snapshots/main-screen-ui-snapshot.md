# Main Screen UI Snapshot — April 2026

> **Purpose:** This document captures the exact current state of every UI component that makes up the main screen — its HTML structure, layout mechanics, scrolling behavior, known quirks, and what is confirmed working. Use it as a reference baseline when diagnosing regressions or planning changes.

> **Last updated:** April 2026. The three-panel slider architecture has been replaced with a single-panel layout. Several components have been extracted into standalone files. `InstallToast` and `InstallSheet` have been added to `MainScreen`. See the Architecture Change note below.

---

## High-Level Layout Tree

The `MainScreen` render tree, from outermost to innermost:

```
<> (Fragment)
  ├── [fixed background div — solid color]       position:fixed, extends into safe areas
  ├── [fixed background div — brand gradient]    position:fixed, extends into safe areas
  └── <div> layout shell                         relative h-dvh flex flex-col overflow-hidden
        ├── <HeaderBar>                           sticky top-0, z-10
        │     ├── greeting row (title + refresh icon + settings icon)
        │     ├── <GroupTabBar>                  conditional: only rendered when store.hasGroups
        │     └── <CategoryPicker>               overflow-x:auto pill row
        ├── <div> content area                   flex-1 overflow-hidden relative flex flex-col min-h-0
        │     └── <CategoryPanel>                category={store.selectedCategory}
        │           ├── <AddItemInput>           extracted standalone component
        │           ├── <ListMetaBar>            sort controls + check-all
        │           ├── <SwipeableRow> × N       swipe-to-delete wrapper
        │           │     └── <ChecklistItemRow> individual item row
        │           └── <EmptyState>             contextual empty state
        ├── <BottomBar>                           sticky bottom-0, z-10  (3-column grid)
        ├── <SettingsSheet>                       Sheet side="bottom", conditionally open
        ├── <InstallToast>                        install nudge banner (conditionally visible)
        └── <InstallSheet>                        full install instructions sheet
```

> **Architecture change (April 2026):** The three-panel slider architecture (previous + current + next `CategoryPanel` instances always mounted side-by-side, driven by a `translate3d` animation and Pointer Events gesture handler) has been **removed**. `MainScreen` now renders a single `<CategoryPanel>` with `category={store.selectedCategory}`. Category switching is driven at the store level (`selectNextCategory` / `selectPreviousCategory`). The `contentRef`, `containerRef`, `dragOffset`, `isAnimating`, `contentWidth`, `ResizeObserver`, and all swipe gesture state variables from the old architecture no longer exist in `MainScreen`.

---

## Component Details

> **Extraction change (April 2026):** `AddItemInput` (formerly an inline sub-component of `CategoryPanel`) has been extracted to `src/components/AddItemInput.tsx`. `ChecklistItemRow` has been extracted to `src/components/ChecklistItemRow.tsx`. `EmptyState` has been extracted to `src/components/EmptyState.tsx`. `ListMetaBar` (sort controls + check-all) has been extracted to `src/components/ListMetaBar.tsx`.

---

### `MainScreen` (`src/screens/MainScreen.tsx`)

#### Layout shell

```tsx
<div className="relative h-dvh flex flex-col overflow-hidden">
```

- `h-dvh` — full dynamic viewport height. This is the **single vertical clip container** for the entire screen.
- `flex flex-col` — children stack vertically: header → content area → bottom bar.
- `overflow-hidden` — clips child overflow so the panel occupies exactly the available height.
- `relative` — establishes a stacking context.

#### Background layers

Two `position: fixed` divs render **before** the layout shell inside the fragment:

1. **Solid color fill** — `backgroundColor: var(--color-surface-background)`. Extended with `top: calc(-1 * env(safe-area-inset-top, 0px))` and `bottom: calc(-1 * env(safe-area-inset-bottom, 0px))` to fill behind the notch and home indicator during overscroll bounce.
2. **Brand gradient** — `background: var(--gradient-brand-wide)`. Same negative-inset extent.

These are outside the `overflow-hidden` layout shell so they always cover the full screen.

#### Content area

```tsx
<div
  className="flex-1 overflow-hidden relative flex flex-col min-h-0"
  onScroll={handleScrollWithPosition}
>
  <CategoryPanel category={store.selectedCategory} />
</div>
```

`flex-1` consumes all space between header and bottom bar. `flex flex-col min-h-0` passes the flex constraint down so `CategoryPanel` can establish a bounded height for its scroll container. The `onScroll` handler reads `(e.target as HTMLElement).scrollTop` to drive `scrolled` state for the `HeaderBar` title animation.

#### State variables

| Variable             | Type      | Purpose                                                          |
| -------------------- | --------- | ---------------------------------------------------------------- |
| `isSettingsOpen`     | `boolean` | Controls `SettingsSheet` open/close                              |
| `isInstallSheetOpen` | `boolean` | Controls `InstallSheet` open/close                               |
| `scrolled`           | `boolean` | Whether the list has been scrolled > 20px (drives header shrink) |

#### Mount scroll reset

On mount, `window.scrollTo(0, 0)`, `document.documentElement.scrollTop = 0`, and `document.body.scrollTop = 0` are called. This clears residual scroll offset from onboarding screens that may have had the software keyboard open.

#### Keyboard dismiss on scroll

`handleScroll` calls `(document.activeElement as HTMLElement | null)?.blur()` to dismiss the iOS keyboard whenever the list is scrolled — this is called before `handleScrollWithPosition` updates `scrolled`.

#### Settings sheet

`isSettingsOpen` is toggled by the settings gear button in `HeaderBar`. `SettingsSheet` is a direct child of `MainScreen`, rendered as a sibling to the layout `<div>`.

#### Install toast / Install sheet

`InstallToast` is a non-intrusive banner that nudges browser-mode users to install the PWA. It is suppressed when `isSettingsOpen` or `isInstallSheetOpen` is `true`. Tapping the toast's CTA opens `InstallSheet` (a bottom sheet with full install instructions) by setting `isInstallSheetOpen = true`.

#### Child components

| Component       | Purpose                                                                          |
| --------------- | -------------------------------------------------------------------------------- |
| `HeaderBar`     | Greeting title, refresh button, settings button, `GroupTabBar`, `CategoryPicker` |
| `CategoryPanel` | Full content area for the selected category                                      |
| `BottomBar`     | Navigation chevrons and "Clear Checked" action                                   |
| `SettingsSheet` | Slide-up settings drawer                                                         |
| `InstallToast`  | Non-intrusive install nudge banner                                               |
| `InstallSheet`  | Full-screen bottom sheet with platform-specific install instructions             |

---

### `HeaderBar` (`src/components/HeaderBar.tsx`)

```html
<header
  class="sticky top-0 z-10 px-4 pt-2 pb-4"
  style="padding-top: calc(env(safe-area-inset-top, 0px) + 8px);
         background: linear-gradient(to top, transparent 0%, var(--color-surface-background) 35%, var(--color-surface-background) 100%)"
></header>
```

- `sticky top-0 z-10` — sticks to the top of the layout shell (not the document, because the ancestor has `overflow-hidden`).
- `paddingTop` overrides Tailwind's `pt-2` to clear the iOS notch.
- The gradient fades list content scrolling underneath.

#### Greeting title — scroll-shrink animation

Props: `scrolled?: boolean` (passed from `MainScreen`).

```tsx
className={`font-bold flex-1 min-w-0 truncate transition-all duration-220 ease-out ${
  scrolled ? "text-base opacity-60" : "text-2xl"
}`}
style={{
  letterSpacing: scrolled ? "0" : "-0.01em",
  transform: scrolled ? "scale(0.88) translateX(-6%)" : "scale(1)",
  transformOrigin: "left center",
}}
```

When `scrolled` is `true`, the title transitions from `text-2xl` (large iOS-style nav title) to `text-base opacity-60` (compact title). `scale(0.88) translateX(-6%)` keeps the text visually left-aligned during the scale. If `trimmedName` is empty, a flex spacer replaces the greeting.

The greeting reads `"Welcome, {userName}"` with the name rendered in `var(--color-brand-green)`.

#### Refresh button

A circular `w-9 h-9` button tinted with `rgba(var(--color-brand-deep-green-rgb), 0.10)`. Uses the `.press-scale` utility class for press feedback. On tap:

1. `isRefreshing` local state is set to `true` — applies `animation: spin 0.7s linear infinite` to the icon SVG.
2. After 800 ms, `onRefresh?.()` is called (which invokes `window.location.reload()` in `MainScreen`).

`@keyframes spin` is defined in `index.css`.

#### Settings button

A circular `w-9 h-9` button with a gear icon filled with `var(--color-brand-teal)`. Same tinted background as the refresh button. Calls `onOpenSettings` on tap.

#### Internal store access

`HeaderBar` directly reads `useSettingsStore()` for `userName` and `useCategoriesStore()` for `hasGroups`, `groups`, `selectedGroupID`, and `selectGroup`. It passes these to `GroupTabBar` as props and renders `CategoryPicker` as its last child (which reads the store internally).

#### `GroupTabBar` placement

`GroupTabBar` is conditionally rendered between the greeting row and `CategoryPicker` when `hasGroups` is `true`. It receives `groups`, `selectedGroupID`, and `onSelectGroup` as props from `HeaderBar`.

#### `CategoryPicker` placement

`CategoryPicker` is the last child of the `<header>` element. It takes no props — it reads all data from `useCategoriesStore()` internally.

---

### `GroupTabBar` (`src/components/GroupTabBar.tsx`)

Renders a horizontal tab bar with an "All" tab followed by one tab per user-defined group, sorted by `sortOrder`. Conditionally mounted in `HeaderBar` only when `store.hasGroups` is `true`.

#### Outer shell

```tsx
<div
  ref={containerRef}
  role="tablist"
  className="relative flex overflow-x-auto cursor-grab px-2"
  style={{ scrollbarWidth: "none" }}
>
```

- `overflow-x: auto` — native horizontal scroll. Scrollbars suppressed inline (`scrollbarWidth: "none"`) since the global `scrollbar-width: none` rule only applies in some browsers.
- `relative` — establishes stacking context for the absolutely positioned underline indicator.
- `role="tablist"` — ARIA landmark for accessibility.

#### Tab buttons

Tabs use `role="tab"` with `aria-selected`. Active tab text: `var(--color-brand-green)`. Inactive tab text: `var(--color-text-secondary)`. `touchAction: "manipulation"` kills the 300ms tap delay.

#### Sliding underline indicator

`useLayoutEffect` on `selectedGroupID` reads `getBoundingClientRect()` on the active button and container, writes `left` and `width` to the underline `ref`'s inline style. Transition: `var(--duration-element) var(--spring-snap)` — must stay in inline `style`, not Tailwind classes.

#### Drag-to-scroll

Pointer Events handler on the container drives `container.scrollLeft` directly. `hasDraggedRef` is set to `true` when cumulative pointer movement exceeds 5px. Reset via `setTimeout(..., 0)` in `onPointerUp`/`onPointerCancel`. `onClick` on each tab checks `hasDraggedRef.current` before calling `store.selectGroup(id)`.

---

### `CategoryPicker` (`src/components/CategoryPicker.tsx`)

Horizontal scrollable row of category pills. Reads store data via `useCategoriesStore()` internally — no props.

#### Scroll container

```tsx
<div
  ref={containerRef}
  className="overflow-x-auto flex items-center px-4 py-3 gap-2"
  style={{ scrollbarWidth: "none" }}
>
```

- `overflow-x: auto` — native horizontal scroll, scrollbars hidden app-wide via `* { scrollbar-width: none }` in `index.css`.

#### Pill buttons

```tsx
className={`flex-1 min-w-max rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap active:scale-[0.97]`}
style={{
  backgroundColor: isSelected ? "var(--color-surface-card)" : "transparent",
  color: isSelected ? "var(--color-brand-green)" : "var(--color-text-secondary)",
  transition: "background-color 200ms ease-out, color 200ms ease-out, box-shadow 200ms ease-out",
}}
```

- `flex-1 min-w-max` — pills expand to fill the row when there are few categories, and overflow (enabling drag-scroll) when there are many.
- `active:scale-[0.97]` — press-down feedback.

#### Selection-follow behavior

A `useEffect` on `selectedCategoryID` calls:

```ts
selectedEl.scrollIntoView({
  behavior: "smooth",
  inline: "center",
  block: "nearest",
});
```

This fires both when the user taps a pill directly and when category changes from store navigation.

#### Drag-to-scroll guard (`hasDraggedRef`)

`hasDraggedRef` is set to `true` when pointer movement exceeds 5px. The `onClick` handler on each pill checks `hasDraggedRef.current` and returns early if it is `true`, preventing a drag gesture from accidentally selecting a category.

---

### `CategoryPanel` (`src/components/CategoryPanel.tsx`)

Renders the full content area for a single category. `MainScreen` renders exactly one instance, passing `store.selectedCategory` as the `category` prop. When the selected category changes in the store, the prop updates and the component re-renders in place.

#### Four render paths

| Condition                                                         | Renders                                                                                 |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `store.hasGroups && store.categoriesInSelectedGroup.length === 0` | Empty-group state: folder icon + "No lists in this group" + "Assign lists in Settings." |
| `category` prop is `undefined`                                    | An empty `<div className="flex-1" />` spacer                                            |
| `category.items.length === 0`                                     | Empty-state view with icon, heading, subtext, and the add-item input                    |
| `category.items.length > 0`                                       | Full layout: sticky header (input + sort row) + scrollable list                         |

The empty-group check must come **before** the generic `!category` guard, because when a group has no assigned (or ungrouped) categories, `categoriesInSelectedGroup` is empty and `selectedCategoryID` remains `""` — meaning `category` will also be `undefined`. Without the group-specific check first, the generic spacer would silently render instead of informing the user that the group is empty.

#### Full layout structure (non-empty category)

```
<div className="flex-1 flex flex-col min-h-0 px-4 pt-1">   ← outer column
  ├── <div className="shrink-0 pb-1">                        ← sticky header
  │     ├── <AddItemInput />
  │     └── <ListMetaBar ... />
  └── <div className="flex-1 overflow-y-auto overscroll-contain"   ← scroll container
            style={{ maskImage: ..., WebkitMaskImage: ... }}>
        └── <ul className="flex flex-col gap-2 pt-3 pb-10">
              └── <SwipeableRow> × N
                    └── <li> item row
```

**Critical layout values:**

- `flex-1 flex flex-col min-h-0` on the outer column — `min-h-0` overrides flexbox's default `min-height: auto`, which would otherwise force the column to grow to fit all content and make the scroll container never actually scroll.
- `shrink-0` on the header — prevents the sticky header from compressing as the flex column tries to fit the scroll area.
- `flex-1 overflow-y-auto overscroll-contain` on the scroll container — `flex-1` takes all remaining vertical space; `overflow-y-auto` enables native scroll; `overscroll-contain` prevents the scroll from leaking to the parent and triggering whole-page bounce.

#### Scroll fade mask

The scroll container has inline CSS mask properties:

```ts
maskImage: "linear-gradient(to bottom, transparent, black 24px, black calc(100% - 32px), transparent)",
WebkitMaskImage: "linear-gradient(to bottom, transparent, black 24px, black calc(100% - 32px), transparent)",
```

This fades the top 24px and bottom 32px of the list content. The top fade prevents items from abruptly appearing under the sticky header. The bottom fade dissolves content before it reaches the `BottomBar`. At rest, `pt-3` on the `<ul>` keeps the first item below the top fade zone, and `pb-10` ensures the last item can scroll into the fully-opaque middle zone.

> **Why mask instead of an overlay div:** An earlier implementation used an absolutely positioned `<div>` with a background gradient. This created a visible color mismatch because the true app background is `var(--color-surface-background)` **plus** `var(--gradient-brand-wide)` (a diagonal alpha tint). CSS masking operates on transparency, not paint, so it works correctly regardless of what is visually behind the container.

#### Sort logic

```ts
const sortOrder = category.sortOrder ?? "date";
const sortDirection = category.sortDirection ?? "asc";
```

Legacy data may not have `sortOrder` or `sortDirection` fields — they default to `"date"` / `"asc"`. The sort algorithm:

1. Unchecked items always sort before checked items.
2. Within each group, items sort by `createdAt` (Unix ms) or `name.localeCompare()`.
3. If `sortDirection === "desc"`, the within-group comparison is negated.

#### Item tap feedback

`tappedId` is set on `pointerdown` and cleared on `pointerup` / `pointercancel` with a 150ms delay. Transition is suppressed during the press-down (instant snap) and re-enabled on release (spring back). Vertical padding scales with the text size setting via `var(--row-padding-y)` for proportional row density.

---

### `AddItemInput` (`src/components/AddItemInput.tsx`)

Standalone inline input row for adding new checklist items. Reads `useCategoriesStore()` internally. `newItemName` local state drives the controlled input. On submit: calls `store.addItemToSelectedCategory(trimmedValue)`, clears input, triggers `HapticService.light()`, and blur→refocus cycle to reset iOS auto-capitalize. Card styling: `rounded-[16px]`, `var(--color-surface-card)`, `var(--elevation-card)`.

The input is located **inside the sticky header**, not inside the scroll container. This is deliberate: it means the `+` button is always visible and keyboard scroll-into-view behavior does not need to fight a fixed header.

The input font size is forced to `16px` by the global `input { font-size: 16px !important }` rule in `index.css` to prevent iOS Safari's auto-zoom on focus.

---

### `ChecklistItemRow` (`src/components/ChecklistItemRow.tsx`)

Standalone checklist item row with checked/unchecked visual states. Props: `item`, `isTapped`, `onTap`. Unchecked: card background + shadow + circle outline. Checked: subtle tint background + no shadow + filled checkmark + strikethrough text. Text size via `var(--text-size-base)`. Row padding via `var(--row-padding-y)`.

---

### `EmptyState` (`src/components/EmptyState.tsx`)

Animated empty-state card. Props: `icon`, `title`, `subtitle?`. Mount animation: fade + slide up over 220ms.

---

### `ListMetaBar` (`src/components/ListMetaBar.tsx`)

Sort controls + item count + check-all toggle. Props: `itemCount`, `allChecked`, `sortOrder`, `sortDirection`, plus callbacks. Haptics: `HapticService.medium()` for check-all, `HapticService.light()` for sort toggles.

---

### `SwipeableRow` (`src/components/SwipeableRow.tsx`)

Wraps each `<li>` item in the list to provide swipe-left-to-delete behavior.

#### Structure

```
<div className="relative overflow-hidden rounded-[14px]">   ← clipping shell
  ├── [Delete action strip]     absolute right-0, w-20 (80px), backgroundColor: var(--color-danger)
  └── [Content row wrapper]     translateX(offsetX)
```

- The delete strip is always in the DOM, hidden behind the right edge of the clipping shell.
- `translate3d(${80 + offsetX}px, 0, 0)` on the strip means: when `offsetX = 0` (closed), the strip is translated `+80px` (exactly off the right edge). When `offsetX = -80` (fully open), `80 + (-80) = 0`, bringing the strip flush with the right edge and fully in view.
- The content row uses `translate3d(${offsetX}px, 0, 0)`.

#### Swipe thresholds

- Maximum swipe travel: `offsetX` is clamped to `[-80, 0]` — exactly the width of the delete button.
- Snap threshold on release: if `offsetX < -40` (more than half open), snap to fully open (`-80`). Otherwise, snap closed (`0`).
- The `isLockedOutRef` flag: on `pointerdown`, the component checks early movement direction. If the gesture is determined to be **vertical** before the horizontal threshold is reached, `isLockedOutRef` is set to `true` and the row stops processing pointer events for that gesture, yielding control to the parent.

#### Gesture arbitration

Both `SwipeableRow` (row swipe) and `CategoryPanel`'s scroll container (vertical scroll) share the same pointer stream. The arbitration works as follows:

1. On the first move event, `SwipeableRow` checks whether `|dy| > |dx|`. If vertical movement wins, `isLockedOutRef` is set to `true` and the row stops processing pointer events for that gesture, yielding to the native vertical scroll.
2. If horizontal movement wins, `SwipeableRow` calls `e.currentTarget.setPointerCapture(e.pointerId)`, claiming the pointer exclusively.

`offsetAtDragStartRef` captures the content row's current `offsetX` at the moment `pointerdown` fires. This allows right-swipe-to-close from a fully-open state: if the row is at `offsetX = -80` and the user drags right, the delta is applied relative to `-80` rather than `0`, so the row smoothly closes instead of jumping.

#### Transitions

When `isDragging` is `false`:

```ts
transition: "transform 300ms cubic-bezier(0.34,1.56,0.64,1)";
```

The spring easing (`0.34, 1.56, 0.64, 1`) gives the snap a slight overshoot, matching iOS's UIKit row-swipe physics. During an active drag, `transition` is set to `"none"` so the row tracks the finger with zero latency.

---

### `PageIndicator` (`src/components/PageIndicator.tsx`)

A row of dots reflecting the current category index relative to all categories. Only rendered when `categories.length > 1`.

```tsx
style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)" }}
```

The wrapper div adds bottom padding that respects the iOS home indicator.

Each dot:

```ts
width: isActive ? "18px" : "6px",
height: "6px",
borderRadius: "999px",
backgroundColor: isActive ? "var(--color-brand-green)" : "var(--color-text-secondary)",
opacity: isActive ? 1 : 0.4,
transition: "width 280ms cubic-bezier(0.34,1.56,0.64,1), background-color 280ms ease-out, opacity 280ms ease-out",
willChange: "width, background-color, opacity",
```

The active dot stretches to an 18px pill via the spring easing, matching iOS `UIPageControl`'s look. `willChange` is set so the browser pre-promotes the layer and avoids a repaint during the width transition. The component is `aria-hidden` — it is purely decorative; category selection feedback is handled by `CategoryPicker` pill highlight and the `HeaderBar` greeting title.

---

### `BottomBar` (`src/components/BottomBar.tsx`)

The bottom navigation and utility bar. Renders a 3-column CSS grid (`grid-cols-[1fr_auto_1fr]`) within a `<footer>` element.

```tsx
className="sticky bottom-0 z-10 px-4 pt-2"
style={{
  paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
  background: "linear-gradient(to bottom, transparent 0%, var(--color-surface-background) 40%, var(--color-surface-background) 100%)",
}}
```

- `sticky bottom-0` — sticks to the bottom of the layout shell. Because the scroll container is a sibling inside `CategoryPanel` (not an ancestor of `BottomBar`), `sticky` holds position correctly as the list scrolls above.
- The gradient fades from transparent at the top to solid `var(--color-surface-background)` at 40%, masking list content scrolling underneath.
- `paddingBottom` includes `env(safe-area-inset-bottom)` to clear the iPhone home indicator.

#### Grid columns

| Column          | Content                                   | Condition                                |
| --------------- | ----------------------------------------- | ---------------------------------------- |
| Left (`1fr`)    | Previous-category chevron + category name | `canSelectPreviousCategory`              |
| Centre (`auto`) | "Clear N" button                          | Checked items exist in selected category |
| Right (`1fr`)   | Next-category name + chevron              | `canSelectNextCategory`                  |

- `canSelectPreviousCategory` and `canSelectNextCategory` are exposed by `useCategoriesStore`. When a column's condition is false, the cell renders an empty `<div>` placeholder to preserve the grid layout.
- Each chevron tap calls `store.selectPreviousCategory()` or `store.selectNextCategory()` and triggers `HapticService.selection()` for haptic feedback.
- The "Clear N" button (`N` = count of checked items) opens an `ActionSheet` confirmation. On confirm, `store.clearCheckedItems()` is called and `HapticService.impact()` fires.
- The `<footer>` element always renders (even when no grid content is shown) to maintain the gradient and safe-area padding at the bottom of every screen.

---

## Scroll Chain — How It Actually Works

The entire scrolling architecture depends on this chain being intact:

```
#root (position:fixed, overflow:hidden — set in index.css)
  └── MainScreen layout shell (h-dvh overflow-hidden)
        └── content container (flex-1 overflow-hidden)
              └── CategoryPanel outer column (flex-1 flex flex-col min-h-0)
                    └── scroll container (flex-1 overflow-y-auto overscroll-contain)  ← ONLY SCROLLABLE ELEMENT
```

**The scroll container in `CategoryPanel` is the only element in this chain that scrolls.** Every ancestor clips but does not scroll. If any ancestor gains `overflow-y: auto` or `overflow-y: scroll`, it will intercept scroll events before they reach the intended container and the list will stop scrolling.

**`min-h-0` is load-bearing.** Without it on `CategoryPanel`'s outer column, the flexbox layout calculates that the column's minimum height equals the full height of all content (all list items), forces the parent to expand past the viewport, and the `overflow-y-auto` container never gets a bounded height — so it never actually scrolls.

**`onScroll` reads `e.target`, not `e.currentTarget`.** The `onScroll` handler is attached to the content container div in `MainScreen`. React's `onScroll` bubbles up from the inner `overflow-y-auto` element inside `CategoryPanel`. The handler correctly casts `e.target as HTMLElement` and reads `.scrollTop` from that element — not `e.currentTarget`, whose `scrollTop` is always `0`.

---

## Known Issues (As of April 2026)

### 1. `BottomBar` gradient does not include `--gradient-brand-wide`

**Component:** `BottomBar`

**Symptom:** On devices where `--gradient-brand-wide` is visually prominent, the `BottomBar` gradient masks list content with a flat solid color that does not blend seamlessly with the background. The mismatch is subtle in light mode and more visible in dark mode.

**Root cause:** The `background` inline style on `BottomBar` uses `var(--color-surface-background)` as its opaque stop. The actual app background is a composite of that color plus `var(--gradient-brand-wide)` (a diagonal alpha-tint overlay). Replicating this exact composite in a CSS gradient is not possible without the same diagonal alpha-tint approach the background layers use. The same root cause previously affected the fade overlay on `CategoryPanel` (resolved by switching to CSS masking). `BottomBar` still uses the old solid-stop approach.

---

## What Is Confirmed Working (April 2026)

- ✅ List scrolls vertically on iOS Safari in standalone PWA mode
- ✅ List scrolls vertically in desktop Chrome, Firefox, and Safari
- ✅ `onScroll` correctly reads `e.target.scrollTop` — header shrink animation triggers at 20px scroll
- ✅ Keyboard dismisses on scroll via `document.activeElement?.blur()`
- ✅ `SwipeableRow` swipe-to-delete works without conflicting with vertical scroll
- ✅ `SwipeableRow` correctly resumes from partially-open state via `offsetAtDragStartRef`
- ✅ Delete button springs open/closed with iOS-like overshoot easing
- ✅ Haptic feedback fires on swipe open, close, and delete
- ✅ CSS mask fade at the top and bottom of the scroll container works in all themes
- ✅ No visible color-mismatch band between list content and sticky header (mask approach)
- ✅ Row vertical padding scales proportionally with text size setting via `--row-padding-y` (xs: 0.45rem → xl: 1.25rem)
- ✅ `AddItemInput` stays above keyboard on iOS (keyboard pushes the viewport; input is in flow above the scroll container)
- ✅ `AddItemInput` blur→refocus cycle resets iOS auto-capitalize correctly
- ✅ 16px font-size override prevents iOS Safari auto-zoom on input focus
- ✅ Check-all / uncheck-all toggle in `ListMetaBar` works; icon and label update to reflect state
- ✅ Sort order (date / alpha) and direction (asc / desc) toggles work per-category
- ✅ Item check/uncheck moves items between unchecked (top) and checked (bottom) groups correctly
- ✅ Item tap press feedback (`tappedId` scale + opacity) fires via `ChecklistItemRow`
- ✅ `CategoryPicker` scrolls selected pill into view with `scrollIntoView` when category changes
- ✅ `CategoryPicker` drag-scroll works; `hasDraggedRef` prevents accidental category select after a drag
- ✅ `CategoryPicker` shows "No lists in this group yet" when group has no categories
- ✅ `CategoryPicker` haptic feedback fires on pill tap
- ✅ `GroupTabBar` shows "All" tab plus user-defined group tabs with sliding underline
- ✅ `GroupTabBar` drag-to-scroll works with same pattern as `CategoryPicker`
- ✅ `BottomBar` previous/next chevrons navigate categories and trigger haptic feedback
- ✅ `BottomBar` "Clear N" button opens `ActionSheet` confirmation before deleting checked items
- ✅ `BottomBar` `<footer>` always renders, maintaining safe-area padding and gradient at bottom
- ✅ `HeaderBar` refresh button spins for 800 ms then triggers `window.location.reload()`
- ✅ `HeaderBar` and `BottomBar` padding respects `env(safe-area-inset-top/bottom)` on notched iPhones
- ✅ `SettingsSheet` opens from bottom with shadcn `Sheet` component
- ✅ `SettingsSheet` composes extracted feature sections from `features/settings/`
- ✅ `InstallToast` appears for browser-mode users and respects persistence throttling
- ✅ `InstallToast` suppressed when `SettingsSheet` or `InstallSheet` is open
- ✅ `InstallSheet` opens from `InstallToast` CTA; records dismissal on close
- ✅ `EmptyState` mount animation plays correctly for both empty-category and empty-group states
- ✅ `SplashScreen` enter/fade/finish sequence completes correctly for returning users
- ✅ `PageTransitionWrapper` push/pop animations fire on route changes
- ✅ Foreground reload fires on `visibilitychange` when app returns from background
- ✅ Overscroll bounce at the document level is suppressed (`overscroll-behavior-y: contain` on body)
- ✅ `resetToNewUser()` clears all localStorage and resets all store state correctly
- ✅ Theme switching (light / dark / system) applies flash-free via synchronous `applyThemeToDOM()` in store initializer
- ✅ Text size setting applies flash-free via synchronous `applyTextSizeToDOM()` in store initializer
