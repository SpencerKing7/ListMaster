# UI Patterns & iOS Feel

ListMaster targets a **mobile-first, iOS-feel** UX. Every interaction pattern is chosen to feel native on an iPhone — the same decisions the iOS app makes in UIKit/SwiftUI are replicated here using CSS and the Pointer Events API.

For the full design rationale and step-by-step implementation notes, see `docs/plans/ios-feel-overhaul.md`.

---

## Safe-Area Insets

The iPhone notch and home indicator occupy space that app content must not overlap. Safe-area insets are applied via inline styles (not Tailwind classes, because the values are dynamic):

```tsx
style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
```

- `HeaderBar` applies `paddingTop` with `env(safe-area-inset-top)`.
- `BottomBar` applies `paddingBottom` with `env(safe-area-inset-bottom)`.
- The two `position: fixed` background divs in `MainScreen` extend with negative offsets into both safe areas to ensure the background color covers the full screen during overscroll bounce.

---

## Press Feedback

Interactive elements use `active:scale-[0.96]` or `active:scale-[0.97]` (Tailwind) to simulate a physical press-down. The `.press-scale` utility class in `index.css` adds a spring-back transition:

```css
.press-scale {
  transition:
    transform 120ms ease-out,
    opacity 120ms ease-out;
}
.press-scale:active {
  transform: scale(0.96);
  opacity: 0.75;
}
```

Apply `press-scale` to any button-like element. Avoid hover-only states — they have no meaning on touch devices.

---

## Animation Easings

| Use case                                                | Easing                | CSS value                                       |
| ------------------------------------------------------- | --------------------- | ----------------------------------------------- |
| Snap / spring (category swipe, dot expansion, row snap) | Spring with overshoot | `cubic-bezier(0.34, 1.56, 0.64, 1)`             |
| Page slide transitions                                  | Spring page           | `var(--spring-page)` (alias for the same curve) |
| Dismissals, fade-outs                                   | Decelerate            | `ease-out` / `cubic-bezier(0, 0, 0.2, 1)`       |
| Press-scale release                                     | Fast ease-out         | `120ms ease-out`                                |

The spring curve (`0.34, 1.56, 0.64, 1`) overshoots slightly past the target and bounces back — this matches UIKit's spring animations.

---

## Swipe Gestures (Pointer Events API)

All drag and swipe interactions use the **Pointer Events API** (`onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`). Do not use mouse-specific events (`onMouseDown`, etc.) — Pointer Events handle touch, stylus, and mouse uniformly.

### Standard Pattern

1. On `pointerdown`: record `startX`, `startY`, `startTime`. Do not claim the pointer yet.
2. On `pointermove`: compute `dx` and `dy`. Once a drag intent is confirmed (typically `|dx| > 5px`), call `e.currentTarget.setPointerCapture(e.pointerId)` to claim the pointer.
3. On `pointerup` / `pointercancel`: finalize the gesture, release capture.

### `touch-action`

- The `SettingsSheet` category list uses `touch-action: none` (`touch-none`) on drag handles to give React full pointer ownership during reorder drags.
- Individual buttons and interactive elements use `touch-action: manipulation` to eliminate the 300ms tap delay without fully disabling browser gestures.
- The `CategoryPicker` scroll track does not need explicit `touch-action` because it relies on the global `* { scrollbar-width: none }` and manually drives `scrollLeft` rather than relying on browser scroll.

### Rubber-Band Resistance

When the user drags `SwipeableRow` past its maximum travel (`-80px`), the clamp in `Math.max(newOffset, -80)` acts as a hard stop rather than a rubber band. The rubber-band resistance pattern (0.25 dampening factor) is used by `SettingsSheet`'s swipe-to-dismiss — offsets below zero (upward drag) are simply ignored since `dy > 0` is required before `setSwipeTranslateY` is called.

---

## Gesture Arbitration

Multiple gesture handlers coexist in the component tree. The arbitration rule is: **whichever handler detects clear directional intent first and calls `setPointerCapture` wins.** Other handlers must respect this.

- `SwipeableRow` (row swipe) checks if `|dy| >= |dx|` on early movement. If vertical wins or it's ambiguous, `isLockedOutRef` is set and the row stops processing pointer events for that gesture, yielding to the vertical scroll container.
- `CategoryPicker` (horizontal scroll) sets pointer capture once `|dx| > 5px`.
- `SettingsSheet` drag-to-reorder captures the pointer immediately on `pointerdown` of the drag handle.
- `SettingsSheet` swipe-to-dismiss captures the pointer on `pointermove` once vertical intent (`|dy| > 5px`) is confirmed, but only if a real drag has been confirmed (`isDismissDraggingRef`).

---

## Key Components

### `CategoryPicker`

Horizontally scrollable pill row for switching between categories. Lives inside `HeaderBar` (sticky).

- Container: `overflow-x: auto`, scrollbars hidden globally via `* { scrollbar-width: none }` in `index.css`.
- Drag-to-scroll: Pointer Events manually drive `container.scrollLeft`. `hasDraggedRef` prevents `onClick` from firing after a drag gesture.
- Selection follow: `scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })` is called on the active pill's DOM element whenever `selectedCategoryID` changes.
- Pills expand to fill the row (`flex-1 min-w-max`) when few categories exist, and overflow (enabling drag-scroll) when many exist.

### `SwipeableRow`

Wraps each checklist item to reveal a red "Delete" action on swipe-left, mirroring iOS `UITableView` trailing swipe actions.

- The delete strip is always in the DOM behind the right edge of an `overflow-hidden` clipping container.
- `offsetAtDragStartRef` captures the `offsetX` value at drag start so both left-swipe-to-open and right-swipe-to-close work correctly from any starting position.
- Snap threshold: if `offsetX < -40px` (more than half revealed) on release, snap to fully open (`-80px`). Otherwise snap closed.
- Tapping the content row while the delete strip is open closes it (preventing the underlying `onClick` from firing) via `handleContentClick`.
- Spring easing on snap: `cubic-bezier(0.34, 1.56, 0.64, 1)` gives a slight overshoot matching UIKit's row swipe feel.
- Haptic feedback: `HapticService.medium()` on snap-open, `HapticService.light()` on snap-close.

### `SettingsSheet`

Slides up from the bottom using the shadcn `Sheet` component with `side="bottom"`. It is not a page navigation — the URL does not change when it opens.

**Swipe-to-dismiss:** A grab pill at the top of the sheet is the drag target. Dragging down more than 80px, or flicking with velocity > 0.5 px/ms, dismisses the sheet. `isDismissDraggingRef` prevents mouse hover or non-primary-button events from triggering the dismiss.

**Category drag-to-reorder:** Each category row has a drag handle. On `pointerdown` of the handle, the component snapshots all item rects and begins tracking `dragIndex` and `overIndex`. The visual order is recalculated on every `pointermove` by computing a new order array and re-rendering. On `pointerup`, if `dragIndex !== overIndex`, `store.moveCategories(from, to)` is dispatched.

**Focus sentinel:** A hidden `div` with `tabIndex={-1}` is passed as `initialFocus` to `SheetContent`. This absorbs the auto-focus that shadcn applies on sheet open, preventing any visible button from appearing focused on entry.

**Sections:**

- **Name** — inline editable text field (writes to `useSettingsStore.setUserName` on change)
- **Categories** — drag-to-reorder list with inline add, rename (via `Dialog`), and delete per row
- **Appearance** — three-segment `ToggleGroup` (`system` / `light` / `dark`)
- **Text Size** — five-segment `ToggleGroup` (`XS` / `S` / `M` / `L` / `XL`)
- **Data Management** — "Reset to New User" button with a confirmation `Dialog`

### `PageTransitionWrapper`

Wraps all route components and applies iOS-style push/pop CSS animations between screens. Architecture:

- React keys each page by `location.key`, so every navigation mounts a fresh element.
- The outgoing page is captured in `prevChildren` state before `children` updates, and rendered simultaneously with the new page during the 380 ms animation window.
- Direction is determined by `getRouteDepth(pathname)`: a deeper path = forward push (`page-enter-from-right` / `page-exit-to-left`); shallower = backward pop (`page-enter-from-left` / `page-exit-to-right`).
- After 380 ms (matching `--duration-page`), `prevChildren` is cleared and `isTransitioning` is reset.

### `PageIndicator`

A row of dots indicating current category index, matching `UIPageControl`. Only rendered when `categories.length > 1`.

- The active dot stretches from `6px` to `18px` width via the spring easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
- `willChange: "width, background-color, opacity"` is set on each dot to pre-promote the layer.
- The component is `aria-hidden` — it is a purely decorative indicator.

### `BottomBar`

The bottom footer bar has three logical areas laid out in a **3-column CSS grid** (`1fr auto 1fr`):

- **Left cell** — `previousCategory` chevron button (only rendered when `canSelectPreviousCategory` is `true`). Shows the previous category's name truncated to 100px.
- **Centre cell** — "Clear N checked" button (only rendered when checked items exist). Tapping opens an `ActionSheet` for confirmation before dispatching `clearCheckedItemsInSelectedCategory()`.
- **Right cell** — `nextCategory` chevron button (only rendered when `canSelectNextCategory` is `true`). Shows the next category's name truncated to 100px.

The 3-column grid ensures the centre button is always mathematically centred regardless of whether the chevrons are present.

`BottomBar` uses `sticky bottom-0` and applies `env(safe-area-inset-bottom)` for iPhone home indicator clearance. It renders nothing (returns `null` before the `<footer>`) only if no chevrons and no checked items exist — otherwise the `<footer>` element is always in the DOM to hold the gradient and safe-area padding.

### `ActionSheet`

An iOS-style bottom sheet alert that mimics `UIAlertController` action sheets. Props:

| Prop           | Type                                      | Notes                                       |
| -------------- | ----------------------------------------- | ------------------------------------------- |
| `isOpen`       | `boolean`                                 | Controls visibility                         |
| `onClose`      | `() => void`                              | Called when backdrop or Cancel is tapped    |
| `title?`       | `string`                                  | Optional bold heading                       |
| `message?`     | `string`                                  | Optional body text below the title          |
| `actions`      | `Array<{ label, onClick, destructive? }>` | Action buttons rendered above the separator |
| `cancelLabel?` | `string`                                  | Defaults to `"Cancel"`                      |

Uses `isMounted` + `isVisible` states to keep the DOM alive during exit animation, then removes after 300 ms. A module-level `overlayCount` prevents premature `body.style.overflow` restoration when multiple sheets open/close in quick succession.

### `HeaderBar`

The sticky top header. Props:

| Prop             | Type         | Notes                                  |
| ---------------- | ------------ | -------------------------------------- |
| `onOpenSettings` | `() => void` | Called when the gear icon is tapped    |
| `scrolled?`      | `boolean`    | Drives greeting title shrink animation |
| `onRefresh?`     | `() => void` | Called after a 800ms animation delay   |

Contains:

- **Greeting title** — "Welcome, `{userName}`" with `scrolled` animation (compact/large).
- **Refresh button** — circular tinted button with a spinning SVG animation during the 800 ms delay before `onRefresh()` is called. The `@keyframes spin` animation is defined in `index.css`.
- **Settings button** — circular tinted gear icon.
- **`CategoryPicker`** — always the last child.

### `CategoryPanel`

Renders the content area for a single category. Receives `category: Category | null` as its only prop. Three render paths:

| Condition                     | Renders                                                                   |
| ----------------------------- | ------------------------------------------------------------------------- |
| `category` is `null`          | An empty `<div className="flex-1" />` spacer                              |
| `category.items.length === 0` | Empty-state view with animated icon, heading, subtext, and `AddItemInput` |
| `category.items.length > 0`   | Full layout: sticky header (input + sort row) + scrollable list           |

The sort row includes a **check-all/uncheck-all toggle button** (an `allChecked` boolean derived from unchecked items count) and per-category sort controls (order and direction `ToggleGroup`s using shadcn primitives).

See `docs/snapshots/main-screen-ui-snapshot.md` for the full structural breakdown of `CategoryPanel`.

---

## Preventing iOS Safari Quirks

| Quirk                            | Fix                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 300ms tap delay                  | `touch-action: manipulation` on buttons and `[role="button"]` elements (set globally in `index.css`)     |
| Viewport zoom on input focus     | `input { font-size: 16px !important }` in `index.css` — Safari zooms when focused input font-size < 16px |
| Document-level overscroll bounce | `overscroll-behavior-y: contain` on `body`                                                               |
| Text selection during drag       | `user-select: none` on `html, body`; re-enabled on `input, textarea, [contenteditable]`                  |
