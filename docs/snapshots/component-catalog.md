# Component Catalog — April 2026

> **Purpose:** A reference snapshot of every component in `src/components/`. For each component, this document records its props interface, key behaviors, implementation details, and where it is used. Use this when diagnosing regressions, planning changes, or onboarding to the codebase.

---

## Table of Contents

- [HeaderBar](#headerbar)
- [CategoryPicker](#categorypicker)
- [CategoryPanel](#categorypanel)
- [BottomBar](#bottombar)
- [SwipeableRow](#swipeablerow)
- [PageIndicator](#pageindicator)
- [PageTransitionWrapper](#pagetransitionwrapper)
- [UI Primitives (shadcn/ui)](#ui-primitives-shadcnui)
  - [ActionSheet](#actionsheet)
  - [Button](#button)
  - [Dialog](#dialog)
  - [Input](#input)
  - [Sheet](#sheet)
  - [Toggle / ToggleGroup](#toggle--togglegroup)

---

## `HeaderBar`

**File:** `src/components/HeaderBar.tsx`  
**Used by:** `MainScreen`

### Props

| Prop             | Type         | Required | Description                                             |
| ---------------- | ------------ | -------- | ------------------------------------------------------- |
| `scrolled`       | `boolean`    | No       | When `true`, shrinks the greeting title to compact form |
| `onOpenSettings` | `() => void` | Yes      | Called when the settings gear icon is tapped            |
| `onRefresh`      | `() => void` | No       | Called ~800 ms after the refresh button is tapped       |

### Behavior

The header is a `<header>` element with `sticky top-0 z-10`. Its `paddingTop` is set inline to `calc(env(safe-area-inset-top, 0px) + 8px)` to clear the iOS notch, overriding the Tailwind `pt-2` class. A downward gradient fades list content scrolling below.

#### Greeting title (scroll-shrink animation)

The greeting reads `"Good morning, {userName}"` (or `"Good evening"` / `"Good afternoon"` depending on the hour). When `scrolled` is `true`, the title transitions:

- Size: `text-2xl` → `text-base opacity-60`
- Transform: `scale(1)` → `scale(0.88) translateX(-6%)` (keeps the text visually left-aligned)
- Letter spacing: `-0.01em` → `0`
- Duration: `220ms ease-out`

The `scrolled` prop is driven by the `onScroll` handler in `MainScreen`, which monitors the `CategoryPanel` scroll container.

#### Refresh button

A circular `w-9 h-9` button tinted with `rgba(var(--color-brand-green-rgb), 0.15)`. On tap:

1. `isRefreshing` local state is set to `true` — applies `animation: spin 0.7s linear infinite` to the icon.
2. After 800 ms, `onRefresh?.()` is called.

`@keyframes spin` is defined in `index.css`. The delay gives tactile confirmation before the reload happens.

#### Settings button

A circular `w-9 h-9` button with a gear icon. Calls `onOpenSettings` on tap.

#### `CategoryPicker` placement

`CategoryPicker` renders as the last child of the `<header>`, below the greeting row, inside `HeaderBar`. `HeaderBar` passes the `categories`, `selectedCategoryID`, and `onSelectCategory` props through to it.

---

## `CategoryPicker`

**File:** `src/components/CategoryPicker.tsx`  
**Used by:** `HeaderBar`

### Props

| Prop                 | Type                   | Required | Description                                         |
| -------------------- | ---------------------- | -------- | --------------------------------------------------- |
| `categories`         | `Category[]`           | Yes      | Full list of categories                             |
| `selectedCategoryID` | `string \| null`       | Yes      | ID of the currently selected category               |
| `onSelectCategory`   | `(id: string) => void` | Yes      | Called when a pill is tapped (and no drag occurred) |

### Behavior

Renders a horizontally scrollable row of pill buttons — one per category. Lives inside `HeaderBar`.

#### Layout

```
<div class="rounded-full px-1 py-1 w-full" style="background: rgba(--color-brand-deep-green-rgb, 0.12)">
  └── <div ref={scrollRef} class="overflow-x-auto cursor-grab w-full">
        └── <div class="flex gap-1 p-0.5">
              └── <button> × N   (one per category)
```

Native horizontal scroll is enabled on `scrollRef`. Scrollbars are globally hidden (`* { scrollbar-width: none }` in `index.css`).

#### Pill styles

- Selected: `backgroundColor: var(--color-surface-card)`, `color: var(--color-brand-green)`
- Unselected: `backgroundColor: transparent`, `color: var(--color-text-secondary)`
- Both: `transition: background-color 200ms ease-out, color 200ms ease-out, box-shadow 200ms ease-out`
- `flex-1 min-w-max` — pills fill the row when few categories exist; overflow to enable drag-scroll when many exist
- `active:scale-[0.97]` — press feedback

#### Selection-follow behavior

A `useEffect` on `selectedCategoryID` calls `selectedEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })`. This fires on both direct pill tap and store-driven category changes (e.g., from `BottomBar` chevrons).

#### Drag-to-scroll (`hasDraggedRef`)

Pointer Events (`onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerLeave`) drive manual `scrollLeft` updates on `scrollRef.current`. Once pointer movement exceeds 5px, `hasDraggedRef.current` is set to `true`. The `onClick` handler on each pill reads `hasDraggedRef.current` and returns early if `true`, preventing a drag from accidentally selecting a category. `hasDraggedRef` is reset to `false` in `onPointerUp`/`onPointerLeave` (after the `onClick` fires).

---

## `CategoryPanel`

**File:** `src/components/CategoryPanel.tsx`  
**Used by:** `MainScreen` (single instance, passed `store.selectedCategory`)

### Props

| Prop       | Type                    | Required | Description                                          |
| ---------- | ----------------------- | -------- | ---------------------------------------------------- |
| `category` | `Category \| undefined` | Yes      | The category to render; `undefined` renders a spacer |

### Behavior

#### Three render paths

| Condition                     | Output                                                                    |
| ----------------------------- | ------------------------------------------------------------------------- |
| `category` is `undefined`     | `<div className="flex-1" />` — empty spacer                               |
| `category.items.length === 0` | Empty-state view with icon, heading, subtext, and `AddItemInput`          |
| `category.items.length > 0`   | Full layout: sticky header (input + sort controls) + scrollable item list |

#### Full layout structure

The outer column is `flex-1 flex flex-col min-h-0 px-4 pt-1`. The `min-h-0` is load-bearing — without it the flex item refuses to shrink and the scroll container inside never gets a bounded height.

The **sticky header** (`shrink-0`) contains:

- `AddItemInput` sub-component (always visible above the keyboard)
- Sort meta row: item count + `SortOrder` toggle (date / alpha) + `SortDirection` toggle (asc / desc) + check-all button

The **scroll container** (`flex-1 overflow-y-auto overscroll-contain`) contains a `<ul>` of `<SwipeableRow>` wrappers, with `pt-3 pb-10` spacing. CSS mask fades are applied:

```ts
maskImage: "linear-gradient(to bottom, transparent, black 24px, black calc(100% - 32px), transparent)";
```

This dissolves the top 24px (under the header) and bottom 32px (approaching the page indicator) of list content.

#### `AddItemInput` sub-component

Declared as a local function component inside `CategoryPanel.tsx`. Maintains a `value` string in local state. On submit (Enter key or `+` button tap), calls `store.addItem(category.id, trimmedValue)` if the value is non-empty. Input `font-size` is forced to `16px` by a global rule in `index.css` to suppress iOS Safari's auto-zoom.

#### Sort logic

`sortOrder` defaults to `"date"` and `sortDirection` defaults to `"asc"` if not set on the category (supports legacy data). Sort algorithm:

1. Unchecked items before checked items.
2. Within each group: sort by `createdAt` (Unix ms) ascending/descending, or by `name.localeCompare()` ascending/descending.

#### Check-all toggle

A button in the sort meta row. If any item is unchecked, it calls `store.checkAll(category.id)`. If all are checked, it calls `store.uncheckAll(category.id)`. Icon and label update to reflect the current state.

#### Item tap feedback

`tappedId` (local state) is set on `pointerdown` and cleared after 150 ms on `pointerup`/`pointercancel`. While set, the item row applies `scale-[0.97] opacity-80` with `transition: none` (instant press), then springs back with `transform 200ms ease-out` after release.

Vertical row padding is driven by `var(--row-padding-y)`, which scales with the user's text size setting (see `src/store/useTheme.ts`).

---

## `BottomBar`

**File:** `src/components/BottomBar.tsx`  
**Used by:** `MainScreen`

### Props

None. Reads all state directly from `useCategoriesStore()`.

### Behavior

Renders a `<footer>` element that always mounts (ensuring the gradient and safe-area padding are always present at the bottom of the screen).

```
<footer class="sticky bottom-0 z-10 px-4 pt-2"
  style="padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 10px);
         background: linear-gradient(to bottom, transparent 0%, var(--color-surface-background) 40%, ...)">
  └── <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        ├── [left cell]    prev chevron + category name
        ├── [centre cell]  "Clear N" button
        └── [right cell]   category name + next chevron
```

#### Grid columns

| Column        | Content                                     | Render condition                  |
| ------------- | ------------------------------------------- | --------------------------------- |
| Left `1fr`    | `ChevronLeft` icon + previous category name | `store.canSelectPreviousCategory` |
| Centre `auto` | "Clear N" button → `ActionSheet`            | Checked items exist               |
| Right `1fr`   | Next category name + `ChevronRight` icon    | `store.canSelectNextCategory`     |

When a column's condition is false, an empty `<div>` placeholder preserves the grid layout.

#### Interaction

- Chevron tap → `store.selectPreviousCategory()` / `store.selectNextCategory()` + `HapticService.selection()`
- "Clear N" tap → opens `ActionSheet` asking "Clear N checked items?"
- ActionSheet confirm → `store.clearCheckedItems()` + `HapticService.impact()`

#### Known issue

The gradient's opaque stop is `var(--color-surface-background)`, which does not account for the `--gradient-brand-wide` diagonal alpha tint on the actual page background. This can produce a subtle color mismatch on some devices. See `docs/snapshots/main-screen-ui-snapshot.md` — Known Issues.

---

## `SwipeableRow`

**File:** `src/components/SwipeableRow.tsx`  
**Used by:** `CategoryPanel` (wraps each `<li>` item)

### Props

| Prop       | Type         | Required | Description                                                    |
| ---------- | ------------ | -------- | -------------------------------------------------------------- |
| `onDelete` | `() => void` | Yes      | Called when the red delete button is tapped after swiping open |
| `children` | `ReactNode`  | Yes      | The item row content                                           |

### Behavior

#### Structure

```
<div class="relative overflow-hidden rounded-[14px]">   ← clipping shell
  ├── [Delete strip]   position:absolute right-0, w-20, background: var(--color-danger)
  └── [Content row]   translateX(offsetX px)
```

The delete strip is always in the DOM, translated `+80px` off the right edge when closed. As `offsetX` decreases toward `-80`, the strip slides into view: `translate3d(${80 + offsetX}px, 0, 0)`.

#### Swipe mechanics

- `offsetX` is clamped to `[-80, 0]`.
- On `pointerdown`, `offsetAtDragStartRef.current` captures the current `offsetX`. Delta during the drag is applied relative to this starting value, enabling right-swipe-to-close from a fully-open state.
- On `pointerup`: if `offsetX < -40` → snap to `-80` (open); otherwise → snap to `0` (closed).
- Snap transition: `300ms cubic-bezier(0.34,1.56,0.64,1)` (spring with slight overshoot).
- During drag: `transition: none` for zero-latency tracking.

#### Gesture arbitration

On the first `pointermove`, if `|dy| > |dx|`, `isLockedOutRef.current = true` and all subsequent pointer events are ignored for this gesture. If `|dx| > |dy|`, `setPointerCapture` is called, claiming the pointer.

#### Content click guard

`handleContentClick` is attached to the content row wrapper. If the row is currently open (`offsetX < 0`), it calls `e.stopPropagation()` and snaps closed, preventing the underlying item from being toggled when the user taps to close the swipe.

---

## `PageIndicator`

**File:** `src/components/PageIndicator.tsx`  
**Used by:** `MainScreen`

### Props

| Prop      | Type     | Required | Description                               |
| --------- | -------- | -------- | ----------------------------------------- |
| `count`   | `number` | Yes      | Total number of categories                |
| `current` | `number` | Yes      | Zero-based index of the selected category |

### Behavior

Renders `count` dots in a horizontal row. The active dot expands to an 18px pill; inactive dots are 6px circles with 40% opacity.

```ts
// Active dot
width: "18px", height: "6px", borderRadius: "999px",
backgroundColor: "var(--color-brand-green)", opacity: 1,
transition: "width 280ms cubic-bezier(0.34,1.56,0.64,1), ..."

// Inactive dot
width: "6px", height: "6px",
backgroundColor: "var(--color-text-secondary)", opacity: 0.4,
```

`willChange: "width, background-color, opacity"` pre-promotes the layer for GPU-accelerated animation. The component is `aria-hidden="true"` — it is decorative only.

Only rendered when `count > 1`. The wrapper `<div>` adds `paddingBottom: calc(env(safe-area-inset-bottom, 0px) + 4px)`.

---

## `PageTransitionWrapper`

**File:** `src/components/PageTransitionWrapper.tsx`  
**Used by:** `App.tsx` (wraps all `<Route>` children)

### Props

| Prop       | Type        | Required | Description                            |
| ---------- | ----------- | -------- | -------------------------------------- |
| `children` | `ReactNode` | Yes      | The current route's rendered component |

### Behavior

Provides iOS-style push/pop slide animations on route changes. This component does not render any visible chrome — it only manages transition CSS classes.

#### Route depth

`getRouteDepth(pathname: string): number` maps route paths to depth integers:

| Route      | Depth |
| ---------- | ----- |
| `/install` | 0     |
| `/welcome` | 1     |
| `/setup`   | 2     |
| `/` (main) | 3     |

A higher depth means navigating forward (push); lower means navigating backward (pop).

#### Animation classes

When the route changes, the wrapper compares old depth to new depth and applies CSS classes:

| Direction      | Incoming screen         | Outgoing screen      |
| -------------- | ----------------------- | -------------------- |
| Forward (push) | `page-enter-from-right` | `page-exit-to-left`  |
| Backward (pop) | `page-enter-from-left`  | `page-exit-to-right` |

`prevChildren` is snapshotted at the start of the transition and kept in the DOM until the animation completes (380 ms, matching `--duration-page` in `tokens.css`). After 380 ms, `prevChildren` is cleared and the outgoing screen is unmounted.

All four CSS animation keyframes are defined in `index.css`. The easing used is `var(--spring-page)` (`cubic-bezier(0.25, 0.46, 0.45, 0.94)`).

---

## UI Primitives (shadcn/ui)

The files in `src/components/ui/` are generated shadcn/ui primitives. **Do not hand-edit these files.** To update or re-generate a primitive, use the shadcn CLI. The following is a usage reference only.

### `ActionSheet`

**File:** `src/components/ui/action-sheet.tsx`  
**Used by:** `BottomBar`

An iOS-style bottom action sheet used for destructive confirmations. Not generated by shadcn — this is a custom primitive built to match UIAlertController's appearance.

#### Props

| Prop      | Type                  | Required | Description                                          |
| --------- | --------------------- | -------- | ---------------------------------------------------- |
| `isOpen`  | `boolean`             | Yes      | Whether the sheet is visible                         |
| `onClose` | `() => void`          | Yes      | Called when backdrop is tapped or Cancel is selected |
| `title`   | `string`              | No       | Bold header text in the sheet                        |
| `message` | `string`              | No       | Secondary description text                           |
| `actions` | `ActionSheetAction[]` | Yes      | Array of `{ label, style, onPress }` action buttons  |

`ActionSheetAction.style` is `"default" | "destructive" | "cancel"`.

#### Implementation notes

- `isMounted` state keeps the DOM node alive during the exit animation. `isVisible` drives the CSS opacity/translate transition.
- A module-level `overlayCount` integer tracks how many `ActionSheet` instances are currently open. This prevents premature re-enabling of `document.body` overflow when multiple sheets are stacked.
- The backdrop is a `position: fixed` overlay; tapping it calls `onClose`.
- `paddingBottom: env(safe-area-inset-bottom)` on the sheet panel clears the iPhone home indicator.

---

### `Button`

**File:** `src/components/ui/button.tsx`

Standard shadcn `Button` primitive with `variant` and `size` props. Variants available: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. Used throughout `SettingsSheet` and onboarding screens.

---

### `Dialog`

**File:** `src/components/ui/dialog.tsx`

Standard shadcn `Dialog` primitive (modal overlay). Used in `SettingsSheet` for the Rename Category dialog and the Reset to Factory Settings confirmation dialog.

---

### `Input`

**File:** `src/components/ui/input.tsx`

Standard shadcn `Input` primitive. A global rule in `index.css` sets `input { font-size: 16px !important }` to prevent iOS Safari auto-zoom on focus.

---

### `Sheet`

**File:** `src/components/ui/sheet.tsx`

Standard shadcn `Sheet` primitive. Used by `SettingsSheet` with `side="bottom"` to render a bottom drawer. `SettingsSheet` adds its own swipe-to-dismiss gesture layer on top of the sheet's native behavior via `onPointerDown`/`onPointerMove`/`onPointerUp` handlers.

---

### `Toggle` / `ToggleGroup`

**Files:** `src/components/ui/toggle.tsx`, `src/components/ui/toggle-group.tsx`

Standard shadcn `Toggle` and `ToggleGroup` primitives. Used in `SettingsSheet` for the Appearance mode selector (light / system / dark) and in `CategoryPanel`'s sort controls (date / alpha, asc / desc).
