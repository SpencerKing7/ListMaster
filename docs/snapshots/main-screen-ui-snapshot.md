# Main Screen UI Snapshot — April 2026

> **Purpose:** This document captures the exact current state of every UI component that makes up the main screen — its HTML structure, layout mechanics, scrolling behavior, known quirks, and what is confirmed working for every main screen component. Use it as a reference baseline when diagnosing regressions or planning changes.
>
> **Last updated:** April 2026. The three-panel slider architecture has been replaced with a single-panel layout. See the Architecture Change note in the layout tree section.

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
        │     └── <CategoryPicker>               overflow-x:auto pill row
        ├── <div> content area                   flex-1 overflow-hidden relative flex flex-col min-h-0
        │     └── <CategoryPanel>                category={store.selectedCategory}
        ├── <BottomBar>                           sticky bottom-0, z-10  (3-column grid)
        └── <SettingsSheet>                       Sheet side="bottom", conditionally open
```

> **Architecture change (April 2026):** The three-panel slider architecture (previous + current + next `CategoryPanel` instances always mounted side-by-side, driven by a `translate3d` animation and Pointer Events gesture handler) has been **removed**. `MainScreen` now renders a single `<CategoryPanel>` with `category={store.selectedCategory}`. Category switching is driven at the store level (`selectNextCategory` / `selectPreviousCategory`). The `contentRef`, `containerRef`, `dragOffset`, `isAnimating`, `contentWidth`, `ResizeObserver`, and all swipe gesture state variables from the old architecture no longer exist in `MainScreen`.

---

## Component Details

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

| Variable         | Type      | Purpose                                                          |
| ---------------- | --------- | ---------------------------------------------------------------- |
| `isSettingsOpen` | `boolean` | Controls `SettingsSheet` open/close                              |
| `scrolled`       | `boolean` | Whether the list has been scrolled > 20px (drives header shrink) |

#### Mount scroll reset

On mount, `window.scrollTo(0, 0)`, `document.documentElement.scrollTop = 0`, and `document.body.scrollTop = 0` are called. This clears residual scroll offset from onboarding screens that may have had the software keyboard open.

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
- The gradient fades list content underneath.

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

When `scrolled` is `true`, the title transitions from `text-2xl` (large iOS-style nav title) to `text-base opacity-60` (compact title). `scale(0.88) translateX(-6%)` keeps the text visually left-aligned during the scale.

#### Refresh button

A circular `w-9 h-9` tinted button. On tap, `isRefreshing` is set to `true`, applying `animation: spin 0.7s linear infinite` to the icon SVG. After 800 ms, `onRefresh?.()` is called (which invokes `window.location.reload()` in `MainScreen`). `@keyframes spin` is defined in `index.css`.

#### `CategoryPicker` placement

`CategoryPicker` is the last child of the `<header>` element, below the greeting row.

---

### `CategoryPicker` (`src/components/CategoryPicker.tsx`)

Renders the horizontal pill bar for switching categories. Lives inside `HeaderBar`.

#### Outer shell

```tsx
<div className="rounded-full px-1 py-1 w-full"
  style={{ background: `rgba(var(--color-brand-deep-green-rgb), 0.12)` }}>
```

A pill-shaped tinted container.

#### Scroll track

```tsx
<div
  ref={scrollRef}
  className="overflow-x-auto cursor-grab w-full"
  onPointerDown={handlePointerDown}
  onPointerMove={handlePointerMove}
  onPointerUp={handlePointerUp}
  onPointerLeave={handlePointerUp}
>
```

- `overflow-x: auto` — native horizontal scroll, scrollbars hidden app-wide via `* { scrollbar-width: none }` in `index.css`.
- No `touch-action` is set here; the parent `MainScreen` swiper has `touch-none` which blocks browser-native pan on the outer layer. The `CategoryPicker`'s own Pointer Events handler manually drives `container.scrollLeft` during a drag.

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

This fires both when the user taps a pill directly and when category changes from a swipe gesture in `MainScreen`.

#### Drag-to-scroll guard (`hasDraggedRef`)

`hasDraggedRef` is set to `true` when pointer movement exceeds 5px. The `onClick` handler on each pill checks `hasDraggedRef.current` and returns early if it is `true`, preventing a drag gesture from accidentally selecting a category.

---

### `CategoryPanel` (`src/components/CategoryPanel.tsx`)

Renders the full content area for a single category. `MainScreen` renders exactly one instance, passing `store.selectedCategory` as the `category` prop. When the selected category changes in the store, the prop updates and the component re-renders in place.

#### Three render paths

| Condition                      | Renders                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| `category` prop is `undefined` | An empty `<div className="flex-1" />` spacer                         |
| `category.items.length === 0`  | Empty-state view with icon, heading, subtext, and the add-item input |
| `category.items.length > 0`    | Full layout: sticky header (input + sort row) + scrollable list      |

#### Full layout structure (non-empty category)

```
<div className="flex-1 flex flex-col min-h-0 px-4 pt-1">   ← outer column
  ├── <div className="shrink-0 pb-1">                        ← sticky header
  │     ├── <AddItemInput />
  │     └── sort meta row (item count + order/direction toggles)
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

This fades the top 24px and bottom 32px of the list content. The top fade prevents items from abruptly appearing under the sticky header. The bottom fade dissolves content before it reaches the page indicator dots, creating a seamless visual transition. At rest (scroll position 0), the `pt-3` on the `<ul>` keeps the first item below the top fade zone, and `pb-10` ensures the last item can scroll into the fully-opaque middle zone above the bottom fade.

> **Why mask instead of an overlay div:** An earlier implementation used an absolutely positioned `<div>` with a background gradient to fake a fade. This created a visible color mismatch because the true app background is `var(--color-surface-background)` **plus** `var(--gradient-brand-wide)` (a diagonal alpha tint), whereas the overlay div could only approximate the solid color. CSS masking operates on transparency, not paint, so it works correctly regardless of what is visually behind the container.

#### Sort logic

```ts
const sortOrder = category.sortOrder ?? "date";
const sortDirection = category.sortDirection ?? "asc";
```

Legacy data may not have `sortOrder` or `sortDirection` fields — they default to `"date"` / `"asc"`. The sort algorithm:

1. Unchecked items always sort before checked items.
2. Within each group, items sort by `createdAt` (Unix ms) or `name.localeCompare()`.
3. If `sortDirection === "desc"`, the within-group comparison is negated.

#### `AddItemInput` sub-component

The input is declared as a local sub-component within `CategoryPanel.tsx` and lives **inside the sticky header**, not inside the scroll container. This is deliberate: it means the `+` button is always visible and the keyboard scroll-into-view behavior handled by the browser does not need to fight a fixed header.

The input font size is forced to `16px` by the global `input { font-size: 16px !important }` rule in `index.css` to prevent iOS Safari's auto-zoom on focus.

#### Item tap feedback

```tsx
className={`... ${tappedId === item.id ? "scale-[0.97] opacity-80" : ""}`}
style={{
  paddingTop: "var(--row-padding-y)",
  paddingBottom: "var(--row-padding-y)",
  transition: tappedId === item.id
    ? "none"
    : "transform 200ms ease-out, opacity 200ms ease-out, background-color 250ms ease-out, box-shadow 250ms ease-out",
}}
```

`tappedId` is set on `pointerdown` and cleared on `pointerup` / `pointercancel` with a 150ms delay. Transition is suppressed during the press-down (instant snap) and re-enabled on release (spring back). Vertical padding scales with the text size setting via `var(--row-padding-y)` for proportional row density.

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
- The `isLockedOutRef` flag: on `pointerdown`, the component checks early movement direction. If the gesture is determined to be **vertical** (scroll or page-swipe) before the horizontal threshold is reached, `isLockedOutRef` is set to `true` and the row stops processing pointer events for that gesture, yielding control to the parent.

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

**`min-h-0` is load-bearing.** Without it on `CategoryPanel`'s outer column, the flexbox layout calculates that the column's minimum height equals the full height of all content (all list items), forces the parent to expand past the viewport, and the `overflow-y-auto` container never gets a bounded height — so it never actually scrolls. This has bitten the project before; see `docs/plans/scroll-fade-and-bottom-bar-fix.md`.

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
- ✅ `SwipeableRow` swipe-to-delete works without conflicting with vertical scroll
- ✅ `SwipeableRow` correctly resumes from partially-open state via `offsetAtDragStartRef`
- ✅ Delete button springs open/closed with iOS-like overshoot easing
- ✅ CSS mask fade at the top and bottom of the scroll container works in all themes
- ✅ No visible color-mismatch band between list content and sticky header (mask approach)
- ✅ Row vertical padding scales proportionally with text size setting via `--row-padding-y` (xs: 0.45rem → xl: 1.25rem)
- ✅ `AddItemInput` stays above keyboard on iOS (keyboard pushes the viewport; input is in flow above the scroll container)
- ✅ 16px font-size override prevents iOS Safari auto-zoom on input focus
- ✅ Check-all / uncheck-all toggle in `CategoryPanel` header works; icon and label update to reflect state
- ✅ Sort order (date / alpha) and direction (asc / desc) toggles work per-category
- ✅ Item check/uncheck moves items between unchecked (top) and checked (bottom) groups correctly
- ✅ Item tap press feedback (`tappedId` scale + opacity) fires instantly and releases with spring easing
- ✅ `CategoryPicker` scrolls selected pill into view with `scrollIntoView` when category changes
- ✅ `CategoryPicker` drag-scroll works; `hasDraggedRef` prevents accidental category select after a drag
- ✅ `PageIndicator` dots animate with spring width expansion when category changes
- ✅ `BottomBar` previous/next chevrons navigate categories and trigger haptic feedback
- ✅ `BottomBar` "Clear N" button opens `ActionSheet` confirmation before deleting checked items
- ✅ `BottomBar` `<footer>` always renders, maintaining safe-area padding and gradient at bottom
- ✅ `HeaderBar` refresh button spins for 800 ms then triggers `window.location.reload()`
- ✅ `HeaderBar` and `BottomBar` padding respects `env(safe-area-inset-top/bottom)` on notched iPhones
- ✅ `SettingsSheet` opens from bottom with shadcn `Sheet` component
- ✅ `SettingsSheet` swipe-to-dismiss gesture works (tracks `swipeTranslateY`, dismisses at 120px)
- ✅ `SettingsSheet` drag-to-reorder categories updates live via `MOVE_CATEGORIES` action
- ✅ `SplashScreen` enter/fade/finish sequence completes correctly for returning users
- ✅ `PageTransitionWrapper` push/pop animations fire on route changes
- ✅ Foreground reload fires on `visibilitychange` when app returns from background
- ✅ Overscroll bounce at the document level is suppressed (`overscroll-behavior-y: contain` on body)
- ✅ `resetToNewUser()` clears all localStorage and resets all store state correctly
- ✅ Theme switching (light / dark / system) applies flash-free via synchronous `applyThemeToDOM()` in store initializer
- ✅ Text size setting applies flash-free via synchronous `applyTextSizeToDOM()` in store initializer
