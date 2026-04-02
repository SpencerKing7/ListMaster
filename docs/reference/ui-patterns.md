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

- The three-panel slider in `MainScreen` uses `touch-action: none` (`touch-none` Tailwind class) to give React full pointer ownership — the browser does not scroll natively on this element.
- Individual buttons and interactive elements use `touch-action: manipulation` to eliminate the 300ms tap delay without fully disabling browser gestures.

### Rubber-Band Resistance

When the user drags past an edge (no next or previous category), the drag offset is dampened by a factor of `0.25` (75% resistance), creating an elastic over-drag feel that mirrors iOS's rubber-band scroll.

---

## Gesture Arbitration

Multiple gesture handlers coexist in the component tree. When a pointer event could be claimed by more than one handler, the system arbitrates by direction:

- `SwipeableRow` (row swipe) checks if `|dy| > |dx|` on early movement. If vertical wins, `isLockedOutRef` is set and the row yields the gesture to the vertical scroll container or the page swiper.
- `MainScreen` (page swipe) similarly checks direction before engaging its drag state.
- `CategoryPicker` (horizontal scroll) sets pointer capture once `|dx| > 5px`.

The rule is: **whichever handler detects clear directional intent first and calls `setPointerCapture` wins.** Other handlers must respect this.

---

## Key Components

### `CategoryPicker`

Horizontally scrollable pill row for switching between categories. Lives inside `HeaderBar` (sticky).

- Container: `overflow-x: auto`, scrollbars hidden globally via `* { scrollbar-width: none }`.
- Drag-to-scroll: Pointer Events manually drive `container.scrollLeft`. `hasDraggedRef` prevents `onClick` from firing after a drag gesture.
- Selection follow: `scrollIntoView({ behavior: "smooth", inline: "center" })` is called on the active pill whenever `selectedCategoryID` changes.

### `SwipeableRow`

Wraps each checklist item to reveal a red "Delete" action on swipe-left, mirroring iOS `UITableView` trailing swipe actions.

- The delete strip is always in the DOM behind the right edge of a `overflow-hidden` clipping container.
- Snap threshold: if `offsetX < -40px` (>50% revealed) on release, snap to fully open (`-80px`). Otherwise snap closed.
- Spring easing on snap: `cubic-bezier(0.34, 1.56, 0.64, 1)` gives a slight overshoot matching UIKit's row swipe feel.

### `SettingsSheet`

Slides up from the bottom using the shadcn `Sheet` component with `side="bottom"`. It is not a page navigation — the URL does not change when it opens.

### `PageTransitionWrapper`

Wraps route components and applies push/pop-style CSS animations between screens using the `page-enter-from-right`, `page-exit-to-left`, etc. utility classes defined in `index.css`.

### `PageIndicator`

A row of dots indicating current category index, matching `UIPageControl`. The active dot stretches from 6px to 18px via the spring easing. Only rendered when `categories.length > 1`.

---

## Preventing iOS Safari Quirks

| Quirk                            | Fix                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 300ms tap delay                  | `touch-action: manipulation` on buttons and `[role="button"]` elements (set globally in `index.css`)     |
| Viewport zoom on input focus     | `input { font-size: 16px !important }` in `index.css` — Safari zooms when focused input font-size < 16px |
| Document-level overscroll bounce | `overscroll-behavior-y: contain` on `body`                                                               |
| Text selection during drag       | `user-select: none` on `html, body`; re-enabled on `input, textarea, [contenteditable]`                  |
