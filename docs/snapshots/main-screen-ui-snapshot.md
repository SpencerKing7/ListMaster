# Main Screen UI Snapshot — April 2026

> **Purpose:** This document captures the exact current state of every UI component that makes up the main screen — its HTML structure, layout mechanics, scrolling behavior, known quirks, and what is confirmed working. Use it as a reference baseline when diagnosing regressions or planning changes.

---

## High-Level Layout Tree

The `MainScreen` render tree, from outermost to innermost:

```
<> (Fragment)
  ├── [fixed background div — solid color]       position:fixed, extends into safe areas
  ├── [fixed background div — brand gradient]    position:fixed, extends into safe areas
  └── <div> layout shell                         h-dvh flex flex-col overflow-hidden  (relative)
        ├── <HeaderBar>                           sticky top-0, z-10
        │     ├── greeting + icon row
        │     └── <CategoryPicker>               overflow-x:auto pill row
        ├── <div> content container              flex-1 overflow-hidden relative       ← containerRef
        │     └── <div> three-panel slider       flex h-full touch-none               ← contentRef
        │           ├── <div> panel (previous)   flex flex-col h-full min-h-0
        │           │     └── <CategoryPanel>
        │           ├── <div> panel (current)    flex flex-col h-full min-h-0
        │           │     └── <CategoryPanel>    ← the one the user sees
        │           └── <div> panel (next)       flex flex-col h-full min-h-0
        │                 └── <CategoryPanel>
        ├── <PageIndicator>                       (only rendered when categories.length > 1)
        └── <BottomBar>                           sticky bottom-0, z-10
```

---

## Component Details

### `MainScreen` (`src/screens/MainScreen.tsx`)

#### Layout shell

```
<div className="relative h-dvh flex flex-col overflow-hidden">
```

- `h-dvh` — full dynamic viewport height. This is the **single clipping boundary** for the entire screen. Do not add `overflow:hidden` to `body`, `html`, or `#root`; the shell alone is the clip container.
- `flex flex-col` — children stack vertically: header → content area → page dots → bottom bar.
- `overflow-hidden` — clips the three-panel slider so only one panel is visible at a time.

#### Background layers

Two `position: fixed` divs sit **outside** the layout shell, behind everything:

1. **Solid color fill** — `backgroundColor: var(--color-surface-background)`, extended with negative `top` / `bottom` to fill behind the notch and home indicator.
2. **Brand gradient** — `background: var(--gradient-brand-wide)`, same extent.

These are separate from the shell so that `overflow-hidden` on the shell does not clip them, and they always cover the full screen including safe-area overscroll bounce.

#### Content area (`containerRef`)

```
className="flex-1 overflow-hidden relative"
onScroll={handleScrollWithPosition}
```

`flex-1` makes this area consume all vertical space between the header and bottom bar. `overflow-hidden` clips the sliding panels. The `onScroll` handler is placed here to catch scroll events bubbling up from the inner `CategoryPanel` scroll container — this is how the `scrolled` state (used by `HeaderBar`) is tracked.

> **Known quirk:** `onScroll` on the container div does not directly scroll — the scrollable element is the inner `overflow-y-auto` div inside `CategoryPanel`. React's synthetic `onScroll` does bubble, so this works correctly, but the `e.currentTarget.scrollTop` read inside `handleScrollWithPosition` reflects the **container** div's scroll position (always 0), not the panel's. The `scrollTop > 20` check driving the header shrink animation therefore **never fires** from this handler — `scrolled` stays `false` permanently. This is a latent bug, not a crash. See the Known Issues section below.

#### Three-panel slider (`contentRef`)

```
className="flex h-full touch-none"
style={{
  width: `${contentWidth * 3}px`,
  transform: `translate3d(${-contentWidth + dragOffset}px, 0, 0)`,
  willChange: "transform",
  transition: isAnimating ? "transform var(--duration-page) var(--spring-page)" : "none",
}}
```

- Three `CategoryPanel` instances (previous, current, next) are rendered side-by-side and always in the DOM. Only the middle panel is visible.
- `translate3d(-contentWidth + dragOffset)` keeps the current panel centered; dragging changes `dragOffset`.
- `will-change: transform` promotes the element to its own GPU compositing layer for smooth 60fps animation.
- `touch-none` (`touch-action: none`) gives the React Pointer Events handlers full ownership of all touch/mouse events. Vertical scroll within each panel is handled by the inner `overflow-y-auto` container in `CategoryPanel` — the outer container does not need browser-native pan.
- `contentWidth` is measured via a `ResizeObserver` on `containerRef` so it updates on resize.

#### Swipe gesture state machine

State variables:

| Variable      | Type      | Purpose                                                             |
| ------------- | --------- | ------------------------------------------------------------------- |
| `dragOffset`  | `number`  | Current horizontal drag offset in px                                |
| `isAnimating` | `boolean` | Whether a spring-back or slide transition CSS animation is running  |
| `scrolled`    | `boolean` | Whether the list has been scrolled past 20px (drives header shrink) |

Refs (not state, no re-render):

| Ref                      | Purpose                                                 |
| ------------------------ | ------------------------------------------------------- |
| `isTransitioningRef`     | Gate that blocks new gestures during a slide transition |
| `startXRef`, `startYRef` | Pointer coordinates at gesture start                    |
| `startTimeRef`           | Timestamp at gesture start, used to compute velocity    |
| `isDraggingRef`          | Whether a confirmed drag is in progress                 |

**`performSlideTransition()`** drives category changes. It:

1. Moves `dragOffset` to `±contentWidth` (off-screen).
2. Sets `isAnimating = true` so the CSS transition activates.
3. Waits for the `transitionend` DOM event on `contentRef.current` (with a 350 ms safety-net `setTimeout`).
4. In a single synchronous block: calls `store.selectNextCategory()` / `store.selectPreviousCategory()`, then sets `isAnimating = false` and `dragOffset = 0`.

React 19 batches those state updates into one commit, so the panel switch and animation reset happen atomically with no visible flash.

**Rubber-band resistance:** when dragging past an edge (no next or previous category), `dragOffset` is clamped to `dx * 0.25` — a 75% dampening factor that creates an elastic over-drag feel.

---

### `HeaderBar` (`src/components/HeaderBar.tsx`)

```
className="sticky top-0 z-10 px-4 pt-2 pb-4"
style={{
  paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
  background: "linear-gradient(to top, transparent 0%, var(--color-surface-background) 35%, var(--color-surface-background) 100%)",
}}
```

- `sticky top-0 z-10` — the header sticks to the top of the layout shell as the list scrolls. Because the layout shell has `overflow-hidden`, this `sticky` behavior is relative to the shell, not the document.
- `paddingTop` overrides Tailwind's `pt-2` to include `env(safe-area-inset-top)` so content clears the iOS notch.
- The gradient background (`transparent` at the bottom edge, solid at 35%+) fades the list content as items scroll underneath the header.

#### Greeting title — scroll-shrink animation

Props: `scrolled?: boolean` (passed from `MainScreen`).

```tsx
className={`font-bold flex-1 min-w-0 truncate transition-all duration-220 ease-out ${
  scrolled ? "text-base opacity-60" : "text-2xl"
}`}
style={{
  letterSpacing: scrolled ? "0" : "-0.01em",
  transform: scrolled ? "scale(0.88) translateX(-6%)" : "scale(1)",
}}
```

When `scrolled` is `true`, the title animates from `text-2xl` (large, iOS-style navigation title) to `text-base opacity-60` (compact inline title). The `scale(0.88) translateX(-6%)` is a manual geometric correction to keep the text visually left-aligned during the scale.

> **Known quirk:** `scrolled` never becomes `true` at runtime (see the `onScroll` bug above). The shrink animation is fully implemented and visually correct, but it is currently not triggered.

#### `CategoryPicker` placement

`CategoryPicker` is rendered as the last child inside `HeaderBar`, below the greeting row. It is part of the sticky header block.

---

### `CategoryPicker` (`src/components/CategoryPicker.tsx`)

Renders the horizontal pill bar for switching categories. It lives inside `HeaderBar` and inherits its `sticky` positioning.

#### Outer shell

```tsx
<div className="rounded-full px-1 py-1 w-full"
  style={{ background: `rgba(var(--color-brand-deep-green-rgb), 0.12)` }}>
```

A pill-shaped tinted container housing the scroll track.

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

Renders the full content area for a single category. Three instances always exist in the DOM (previous, current, next).

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

#### Gesture arbitration with `MainScreen`

Both `MainScreen` (page swipe) and `SwipeableRow` (row swipe) use Pointer Events. Because `MainScreen`'s sliding div has `touch-none`, the browser does not intervene. The arbitration is:

1. On the first move event, `SwipeableRow` checks `|dy| > |dx|` — if vertical wins, it locks out and stops responding.
2. If horizontal wins, `SwipeableRow` calls `e.currentTarget.setPointerCapture(e.pointerId)`, claiming the pointer.
3. `MainScreen`'s `handlePointerMove` checks `|dy| > |dx|` similarly before engaging the page swipe — so if `SwipeableRow` has already captured the pointer, `MainScreen` won't fire anyway.

#### Transitions

When `isDragging` is `false`:

```ts
transition: "transform 300ms cubic-bezier(0.34,1.56,0.64,1)";
```

The spring easing (`0.34, 1.56, 0.64, 1`) gives the snap a slight overshoot, matching iOS's UIKit row swipe physics. During an active drag, `transition` is set to `"none"` so the row tracks the finger with zero latency.

---

### `PageIndicator` (`src/components/PageIndicator.tsx`)

A row of dots reflecting the current category index. Only rendered when `categories.length > 1`.

```tsx
style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4px)" }}
```

The wrapper in `MainScreen` adds bottom padding that respects the iOS home indicator.

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

The active dot stretches to an 18px pill via the spring easing, matching iOS `UIPageControl`'s look. `willChange` is set so the browser pre-promotes the layer and avoids a paint during the width transition.

---

### `BottomBar` (`src/components/BottomBar.tsx`)

Renders the "Clear Checked Items" button when checked items exist in the selected category.

```tsx
className="sticky bottom-0 z-10 px-4 pt-2"
style={{
  paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
  background: "linear-gradient(to bottom, transparent 0%, var(--color-surface-background) 40%, var(--color-surface-background) 100%)",
}}
```

- `sticky bottom-0` — sticks to the bottom of the layout shell. Because the scroll container is a sibling (not an ancestor), the `sticky` works relative to the flex shell and holds position as the list scrolls above it.
- The gradient fades from transparent at the top to solid `var(--color-surface-background)` at 40%, masking list content that scrolls underneath.
- `paddingBottom` includes `env(safe-area-inset-bottom)` to clear the iPhone home indicator.
- When no checked items exist, the component returns `null`, collapsing the space entirely.

---

## Scroll Chain — How It Actually Works

The entire scrolling architecture depends on this chain being intact:

```
#root (position:fixed, overflow:hidden — set in index.css)
  └── MainScreen layout shell (h-dvh overflow-hidden)
        └── content container (flex-1 overflow-hidden)
              └── three-panel slider (flex h-full, no overflow)
                    └── CategoryPanel outer column (flex-1 flex flex-col min-h-0)
                          └── scroll container (flex-1 overflow-y-auto overscroll-contain)  ← ONLY SCROLLABLE ELEMENT
```

**The scroll container in `CategoryPanel` is the only element in this chain that scrolls.** Every ancestor clips but does not scroll. If any ancestor gains `overflow-y: auto` or `overflow-y: scroll`, it will intercept the scroll before it reaches the intended container and the list will stop scrolling.

**`min-h-0` is load-bearing.** Without it on `CategoryPanel`'s outer column, the flexbox layout calculates that the column's minimum height is the full height of its content (all list items), forces the parent to be taller than the viewport, and the `overflow-y-auto` container never gets a constrained height — so it never scrolls. This has bitten the project before (see `docs/plans/scroll-fade-and-bottom-bar-fix.md`).

---

## Known Issues (As of April 2026)

### 1. Header shrink animation never triggers

**Component:** `MainScreen`, `HeaderBar`

**Symptom:** The greeting title stays at `text-2xl` even after the user scrolls the list. The compact header state is never reached.

**Root cause:** `onScroll={handleScrollWithPosition}` is attached to the content container div (`flex-1 overflow-hidden`). Inside `handleScrollWithPosition`, the code reads `e.currentTarget.scrollTop` — but `e.currentTarget` is the container div, whose `scrollTop` is always `0` because it does not itself scroll. The actual scrollable element is the `overflow-y-auto` div inside `CategoryPanel`, which is a descendant, not `currentTarget`. React's synthetic `onScroll` does bubble from the inner scrollable div, so the event fires, but `e.currentTarget` always points to the div where the handler is registered — not the source of the scroll event. `scrollTop > 20` never becomes `true`, so `setScrolled(true)` is never called.

**Fix direction:** The `onScroll` handler needs to read `e.target` (cast as `HTMLElement`) rather than `e.currentTarget`, or the handler should be moved to an imperative event listener attached directly to the scroll container inside `CategoryPanel`.

### 2. `BottomBar` gradient does not include `--gradient-brand-wide`

**Component:** `BottomBar`

**Symptom:** On devices where `--gradient-brand-wide` is visually prominent, the `BottomBar` gradient masks list content with a flat solid color that does not match the background behind it. The mismatch is subtle in light mode and more visible in dark mode.

**Root cause:** The `background` inline style on `BottomBar` uses `var(--color-surface-background)` as its opaque stop. The actual app background is a composite of that color plus `var(--gradient-brand-wide)`. Matching this exactly in a CSS gradient is not possible without the same diagonal alpha-tint approach the background uses. The same root cause affected the previous fade overlay on `CategoryPanel` (resolved by switching to CSS masking). `BottomBar` still uses the old approach.

### 3. `CategoryPicker` drag-scroll conflicts with `MainScreen` page-swipe on short horizontal flicks

**Component:** `CategoryPicker`, `MainScreen`

**Symptom:** A fast, short horizontal flick starting on the `CategoryPicker` can sometimes trigger a page swipe (category change) instead of — or in addition to — scrolling the pill row. This occurs when the finger moves more than 5px horizontally before `MainScreen`'s gesture detector also sees 5px of horizontal movement.

**Root cause:** Both `CategoryPicker` and `MainScreen` use the same `> 5px horizontal delta` threshold to claim a gesture. `CategoryPicker` calls `e.currentTarget.setPointerCapture()` when it wins, but by the time pointer capture is set, `MainScreen` may have already incremented its own `dragOffset`. The two capture domains do not communicate.

---

## What Is Confirmed Working (April 2026)

- ✅ List scrolls vertically on iOS Safari in standalone PWA mode
- ✅ List scrolls vertically in desktop Chrome, Firefox, and Safari
- ✅ Horizontal swipe between categories works smoothly (no choppiness after `transitionend` fix)
- ✅ `will-change: transform` on the slider promotes GPU compositing — no jank during swipe animation
- ✅ Rubber-band resistance at category edges (no previous / no next)
- ✅ `SwipeableRow` swipe-to-delete works without conflicting with vertical scroll
- ✅ `SwipeableRow` does not interfere with page swipe for clearly horizontal gestures
- ✅ Delete button springs open/closed with iOS-like overshoot easing
- ✅ CSS mask fade at the top of the scroll container works correctly in light and dark themes
- ✅ CSS mask fade at the bottom of the scroll container prevents content from abruptly ending at the page indicator
- ✅ No visible color-mismatch band between list and sticky header (mask approach)
- ✅ Row vertical padding scales proportionally with text size setting (xs: 0.45rem, s: 0.6rem, m: 0.875rem, l: 1.0rem, xl: 1.25rem)
- ✅ `AddItemInput` stays above the keyboard on iOS (keyboard pushes the viewport, input is in the flow)
- ✅ 16px font-size override on inputs prevents iOS Safari auto-zoom on focus
- ✅ `CategoryPicker` scrolls selected pill into view with `scrollIntoView` after category changes
- ✅ `CategoryPicker` drag-scroll works; `hasDraggedRef` prevents accidental category tap after drag
- ✅ `PageIndicator` dots animate with spring easing when category changes
- ✅ `HeaderBar` and `BottomBar` padding respects `env(safe-area-inset-top/bottom)` on notched iPhones
- ✅ `BottomBar` renders only when checked items exist; collapses to zero height otherwise
- ✅ Overscroll bounce at the document level is suppressed (`overscroll-behavior-y: contain` on body)
- ✅ Three-panel layout: previous, current, and next panels always mounted — no remount flash on swipe
- ✅ React 19 batching of `setIsAnimating(false)` + `setDragOffset(0)` + store action prevents a two-render transition artifact
- ✅ Sort order (date / alpha) and direction (asc / desc) toggles work per-category
- ✅ Item check/uncheck moves items between unchecked (top) and checked (bottom) groups with correct visual state
