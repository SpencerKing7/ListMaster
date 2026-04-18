<!-- Status: In Progress | Last updated: April 2026 -->
# Plan: iOS-Feel UI Overhaul

**Goal:** Make ListMaster feel as close to a native SwiftUI / UIKit iOS app as possible through typography, animation, interaction physics, haptics, gesture handling, and layout conventions.

---

## Audit of Current State

| Area                   | Current Behaviour                              | iOS Expectation                                                         |
| ---------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| Page swipe             | Spring easing partially done; 300ms transition | iOS uses ~0.35s spring with natural overshoot                           |
| Item tap               | Immediate toggle, no visual feedback           | Instant highlight flash (`.opacity` scale pulse)                        |
| Clear checked          | Full-width ghost button always visible         | iOS-style destructive action sheet OR a swipe-to-delete                 |
| Category picker        | Pill tabs with tap                             | Scrollable tab bar with spring scale on selection                       |
| Settings sheet         | Slides up from bottom — close to iOS           | Needs iOS pull-down-to-dismiss gesture & drag indicator                 |
| Haptics                | None                                           | Light / medium / error `UIImpactFeedbackGenerator` on every interaction |
| Typography             | -apple-system font already used ✅             | Needs large-title hierarchy, `.caption2` labels                         |
| Onboarding transitions | Instant React Router navigation                | Should slide in from the right (push), back slides left                 |
| Scroll bounce          | Browser default                                | `-webkit-overflow-scrolling: touch` + overscroll bounce                 |
| Buttons                | `hover:` states only                           | `active:scale-[0.96]` press-down feedback                               |
| Add-item keyboard      | Input at bottom, keyboard pushes screen        | `env(keyboard-inset-height)` or `visualViewport` resize detection       |
| Item delete            | None                                           | Swipe-left-to-reveal red "Delete" action                                |
| Empty state            | Static icon + text                             | Subtle bounce-in entrance animation                                     |
| Dialog/alerts          | shadcn Dialog (fade in from centre)            | iOS-style sheet alert: scale + fade from 1.1 → 1                        |

---

## Step-by-Step Implementation Plan

### Step 1 — Global iOS Body / Scroll Behaviour

**File:** `src/index.css`

1. Add `-webkit-overflow-scrolling: touch` to `body`.
2. Add `overscroll-behavior-y: contain` to `body` so the whole page doesn't rubber-band (the inner scroll containers will handle that themselves).
3. Add `touch-action: manipulation` to `button, [role=button]` to eliminate the 300 ms tap delay on older WebKit.
4. Add a global `user-select: none` to everything except inputs, so accidental text selection does not occur during swipe gestures.
5. Add a utility class `.ios-scroll` in `@layer utilities`:
   ```css
   .ios-scroll {
     overflow-y: auto;
     -webkit-overflow-scrolling: touch;
     overscroll-behavior-y: contain;
   }
   ```
6. Add a `.press-scale` utility:
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

---

### Step 2 — Haptics Service

**File:** `src/services/hapticService.ts` _(new file)_

Create a singleton `HapticService` that wraps the **Vibration API** (`navigator.vibrate`) with iOS-equivalent presets. This is the closest web equivalent to `UIImpactFeedbackGenerator`.

```ts
export const HapticService = {
  light: () => navigator.vibrate?.(8),
  medium: () => navigator.vibrate?.(15),
  heavy: () => navigator.vibrate?.(25),
  success: () => navigator.vibrate?.([8, 40, 8]),
  error: () => navigator.vibrate?.(40),
  selection: () => navigator.vibrate?.(4),
};
```

**Usage points (to be wired up in later steps):**

- `selection` — category pill tap, category swipe page change
- `light` — checklist item toggle, Add button tap
- `medium` — "Clear Checked" tap
- `heavy` — delete category / reset user (destructive)
- `error` — rubber-band edge resistance snap-back

---

### Step 3 — iOS Spring Animation Tokens

**File:** `src/styles/tokens.css`

Add custom property animation easing tokens that mirror iOS `UISpringTimingParameters`:

```css
:root {
  /* iOS spring — used for page swipe commits */
  --spring-page: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  /* iOS standard ease — used for small element state changes */
  --spring-standard: cubic-bezier(0.4, 0, 0.2, 1);
  /* iOS decelerate — used for sheet entrance */
  --ease-decelerate: cubic-bezier(0, 0, 0.2, 1);
  /* iOS snap-back rubber-band */
  --spring-snap: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Durations */
  --duration-page: 380ms;
  --duration-element: 220ms;
  --duration-micro: 120ms;
}
```

---

### Step 4 — iOS Page Swipe Physics (MainScreen)

**File:** `src/screens/MainScreen.tsx`

The current swipe uses `cubic-bezier(0.4, 0, 0.2, 1)` at 300ms. Upgrade it:

1. **Threshold**: Lower swipe commit threshold from `60px` to `40px`, matching the iOS default directional threshold.
2. **Velocity detection**: Add `startTimeRef` alongside `startXRef`. On `pointerUp`, compute `velocity = dx / (Date.now() - startTime)`. If `Math.abs(velocity) > 0.3 px/ms`, commit the swipe regardless of distance threshold — this replicates iOS flick-to-navigate.
3. **Transition timing**: Change the inline `transition` from `"transform 300ms cubic-bezier(0.4, 0, 0.2, 1)"` to `"transform var(--duration-page) var(--spring-page)"`.
4. **Snap-back timing**: For the rejected snap-back case, use `"transform 280ms var(--spring-snap)"` to produce a slight overshoot bounce.
5. **Rubber-band coefficient**: Increase resistance from `0.15` to `0.25` — iOS uses ~0.25 for edge resistance.
6. **Haptics**: Call `HapticService.selection()` when the swipe commits; `HapticService.error()` on the snap-back rubber-band.
7. **Page indicator**: Add a row of 3 dots (or N dots for N categories) below the content area but above the `BottomBar`. The active dot is larger/brighter. This is the standard `UIPageControl`. Animate dot scale/opacity changes with a `var(--duration-micro)` transition.

**New component:** `src/components/PageIndicator.tsx`

- Props: `{ count: number; activeIndex: number }`
- Renders `count` dot `<span>` elements; active dot uses `--color-brand-green` fill and `scale(1.4)`.

---

### Step 5 — Swipe-to-Delete on Checklist Items

**File:** `src/components/CategoryPanel.tsx`

Implement a swipe-left-to-reveal destructive action, mirroring `UITableView` trailing swipe actions.

1. Wrap each `<li>` in a new `SwipeableRow` component (`src/components/SwipeableRow.tsx`).
2. `SwipeableRow` maintains local state: `offsetX` (number), `isRevealed` (boolean).
3. **Pointer handlers** on the row's inner container:
   - `pointerDown` — record `startX`, `startY`
   - `pointerMove` — if `|dx| > |dy|` and `dx < 0`, translate the row left up to a max of `-80px` (the delete button width). Apply `cubic-bezier` resistance beyond `–80px`.
   - `pointerUp` — if released past `-40px` snap to `-80px` (revealed state); otherwise snap back to `0`. Use `var(--spring-snap)` easing.
4. Render a red **Delete** button (`–80px` wide, full row height) behind the row, revealed by the slide. On tap: call `store.deleteItemFromSelectedCategory(item.id)` (see Step 10 for store action), trigger `HapticService.heavy()`, then animate the row out with `height → 0` over `200ms`.
5. Tapping anywhere else on a revealed row or beginning a new swipe should snap it closed.
6. Only one row should be open at a time — use a `RevealedItemContext` or pass a shared `revealedId` + setter from `CategoryPanel`.

> **Note:** `deleteItemFromSelectedCategory` does not yet exist in the store — add it in Step 10.

---

### Step 6 — Item Toggle Tap Feedback

**File:** `src/components/CategoryPanel.tsx`

Replace the plain `onClick` on each `<li>` with a micro-animation:

1. Add a local `tappedId` state (`string | null`).
2. On tap, set `tappedId = item.id`, then `setTimeout(() => setTappedId(null), 120)`.
3. Apply a CSS class when `tappedId === item.id`:
   ```css
   transform: scale(0.97);
   opacity: 0.8;
   transition:
     transform 80ms ease-out,
     opacity 80ms ease-out;
   ```
4. Call `HapticService.light()` on toggle.

This replicates the `UITableViewCell` selection flash.

---

### Step 7 — "Clear Checked" as an iOS-Style Action Sheet

**File:** `src/components/BottomBar.tsx`  
**New component:** `src/components/ui/action-sheet.tsx`

iOS never uses a ghost button inline for destructive bulk actions. It uses an **Action Sheet** (bottom popover with distinct buttons). Implement:

1. Create `src/components/ui/action-sheet.tsx` — a portal-rendered bottom sheet with:
   - A "Cancel" button (always bottom, rounded full, separately grouped exactly like iOS).
   - One or more action buttons above it.
   - Backdrop overlay that dismisses on tap.
   - Entrance animation: `translateY(100%) → translateY(0)` over `280ms var(--ease-decelerate)`.
   - Exit animation reverse.
2. In `BottomBar.tsx`, replace the inline "Clear Checked Items" ghost `Button` with a new icon button (trash icon or a broom icon) in the input row.
3. Tapping the icon opens the `ActionSheet` with:
   - Title: `"Clear Checked Items?"`
   - Message: `"This will remove all checked items from this list."`
   - Destructive action: `"Clear"` (red)
   - Cancel button.
4. On confirm: call `store.clearCheckedItemsInSelectedCategory()` + `HapticService.medium()`.

---

### Step 8 — Settings Sheet: Pull-to-Dismiss & Drag Indicator

**File:** `src/screens/SettingsSheet.tsx`  
**File:** `src/components/ui/sheet.tsx`

1. Add a **drag indicator** pill (the grey capsule `UISheetPresentationController` always shows) at the very top of the `SheetContent`. Style: `w-9 h-1 rounded-full bg-text-secondary/30 mx-auto mb-3`.
2. Implement **pull-to-dismiss**: track a `dragY` state inside the sheet. When the user drags downward from the indicator (or the top of the sheet), translate the sheet `translateY(dragY)` and reduce backdrop opacity proportionally. On release, if `dragY > 100` or velocity `> 0.5 px/ms`, dismiss by calling `onOpenChange(false)`. Otherwise spring back to `0`.
3. Add these transitions to `SheetContent`:
   - Entrance: `data-starting-style:translate-y-[100%]` → `translate-y-0` using `var(--ease-decelerate)`.
   - Exit: `data-ending-style:translate-y-[100%]` using a fast `220ms`.

> The `sheet.tsx` already uses `data-starting-style` / `data-ending-style` via `@base-ui/react/dialog`. Adjust the duration and easing values to match the new tokens rather than restructuring the component.

---

### Step 9 — Onboarding Push/Pop Navigation Transitions

**File:** `src/App.tsx`  
**New file:** `src/components/PageTransitionWrapper.tsx`

React Router's `<HashRouter>` does not animate route changes by default. Add iOS-style push/pop slide transitions:

1. Create `src/components/PageTransitionWrapper.tsx` — a component that:
   - Listens to `useLocation()` to detect route changes.
   - Maintains an `enterClass` and `exitClass`.
   - Forward navigation (e.g., `"/"` → `"/setup"`): new page slides in from the **right** (`translateX(100%) → 0`), old page slides out to the **left** (`0 → translateX(-30%)`), mimicking iOS `UINavigationController.push`.
   - Back navigation (e.g., `"/setup"` → `"/"`): new page slides in from the **left** (`translateX(-30%) → 0`), old page slides out to the **right** (`0 → translateX(100%)`), mimicking `pop`.
   - Use `var(--duration-page)` + `var(--spring-page)` for both.
2. Wrap the `<Routes>` output in `App.tsx` with `<PageTransitionWrapper>`.
3. Detect direction by comparing route depth (e.g., `"/"` = depth 0, `"/setup"` = depth 1).
4. Use `React.cloneElement` or a key-based `AnimatePresence`-style pattern with CSS transitions (no external animation library needed — use `requestAnimationFrame` + class toggling or a simple `useTransitionState` custom hook).

---

### Step 10 — Per-Item Delete Action (Store Extension)

**File:** `src/store/useCategoriesStore.ts`

The swipe-to-delete in Step 5 requires a new store action:

1. Add action type: `| { type: "DELETE_ITEM"; itemID: string }` to `StoreAction`.
2. Add reducer case:
   ```ts
   case "DELETE_ITEM": {
     const updated = state.categories.map((c) =>
       c.id === state.selectedCategoryID
         ? { ...c, items: c.items.filter((i) => i.id !== action.itemID) }
         : c
     );
     next = { ...state, categories: updated };
     break;
   }
   ```
3. Expose `deleteItemFromSelectedCategory(itemID: string)` on the context value and implement the dispatch + `PersistenceService.save()` call (matching the existing pattern for all other mutations).

---

### Step 11 — Category Picker: iOS Segmented / Tab Selection Feel

**File:** `src/components/CategoryPicker.tsx`

1. On pill tap, call `HapticService.selection()`.
2. Animate the selected pill highlight with `transition: background-color var(--duration-micro) var(--spring-standard), transform var(--duration-micro) var(--spring-standard)`.
3. Add a tiny `scale(0.97)` press-down on `active:` for non-selected pills.
4. When a new category is selected via swipe (not tap), animate the pill scroll into view using `scrollIntoView({ behavior: "smooth" })` — already in place, just ensure it triggers on every selection change including swipe-driven ones.

---

### Step 12 — Button & Interactive Element Press States

**Files:** `src/components/ui/button.tsx`, `src/components/BottomBar.tsx`, `src/screens/SettingsSheet.tsx`

1. Add the `.press-scale` utility class (from Step 1) to the `Add` button in `BottomBar`.
2. Add `active:scale-[0.96]` and `active:opacity-75` Tailwind classes to all primary action buttons.
3. In `button.tsx`, add `transition-transform duration-[120ms] active:scale-[0.96]` to the base `Button` variant class via `cva`.
4. Specifically in `SettingsSheet.tsx`, add press feedback to the drag handle and all row buttons.

---

### Step 13 — Large Title Header (iOS Navigation Bar Style)

**File:** `src/components/HeaderBar.tsx`

iOS uses a large-title navigation bar that collapses to inline title on scroll. Approximate this:

1. Add a `scrolled` state to `MainScreen` — listen to scroll events on the inner `CategoryPanel` scroll container via `onScroll`. Set `scrolled = true` when `scrollTop > 20`.
2. Pass `scrolled` as a prop to `HeaderBar`.
3. In `HeaderBar`, animate the "Welcome, {name}" greeting:
   - When `scrolled = false`: `text-xl font-semibold` (large title).
   - When `scrolled = true`: `text-base font-medium opacity-70` (inline title shrinks).
   - Transition: `font-size` changes don't animate in CSS cleanly — instead use `transform: scale(0.85)` + `opacity` with `transition: all var(--duration-element) var(--spring-standard)`.
4. The `CategoryPicker` (tab bar) should remain sticky and not scroll away — this is already handled by the `sticky top-0` on the `<header>`.

---

### Step 14 — iOS-Style Empty State Entrance Animation

**File:** `src/components/CategoryPanel.tsx`

When the empty state is shown (category has no items):

1. Animate the icon and text in on mount using a `useEffect` + CSS class toggle:
   - Initial state: `opacity: 0; transform: translateY(12px) scale(0.92)`
   - Animate to: `opacity: 1; transform: translateY(0) scale(1)`
   - Duration: `var(--duration-element)` with `var(--ease-decelerate)`.
2. Add a `mounted` state that is set `true` after the first paint via `useEffect(() => setMounted(true), [])`.

---

### Step 15 — Add-Item Input: Keyboard-Safe Layout

**File:** `src/components/BottomBar.tsx`

The iOS software keyboard can obscure the add-item bar. Fix:

1. Add a `useEffect` in `BottomBar` (or hoist to `MainScreen`) that listens to `window.visualViewport?.resize`:
   ```ts
   useEffect(() => {
     const vv = window.visualViewport;
     if (!vv) return;
     const update = () => {
       const offset = window.innerHeight - vv.height - vv.offsetTop;
       document.documentElement.style.setProperty(
         "--keyboard-inset",
         `${offset}px`,
       );
     };
     vv.addEventListener("resize", update);
     vv.addEventListener("scroll", update);
     return () => {
       vv.removeEventListener("resize", update);
       vv.removeEventListener("scroll", update);
     };
   }, []);
   ```
2. Add a CSS variable `--keyboard-inset: 0px` to `:root` in `tokens.css`.
3. In `BottomBar`, set `paddingBottom: "calc(var(--keyboard-inset) + 12px)"` instead of the hardcoded `12px`.

> This ensures the input bar floats above the iOS virtual keyboard, exactly as SwiftUI `.safeAreaInset(edge: .bottom)` does.

---

## Summary of Files Changed / Created

| Action     | File                                                                        |
| ---------- | --------------------------------------------------------------------------- |
| **Modify** | `src/index.css`                                                             |
| **Modify** | `src/styles/tokens.css`                                                     |
| **Create** | `src/services/hapticService.ts`                                             |
| **Create** | `src/components/PageIndicator.tsx`                                          |
| **Create** | `src/components/SwipeableRow.tsx`                                           |
| **Create** | `src/components/ui/action-sheet.tsx`                                        |
| **Create** | `src/components/PageTransitionWrapper.tsx`                                  |
| **Modify** | `src/screens/MainScreen.tsx`                                                |
| **Modify** | `src/screens/SettingsSheet.tsx`                                             |
| **Modify** | `src/screens/OnboardingWelcomeScreen.tsx` _(wrap in PageTransitionWrapper)_ |
| **Modify** | `src/screens/OnboardingSetupScreen.tsx` _(wrap in PageTransitionWrapper)_   |
| **Modify** | `src/components/HeaderBar.tsx`                                              |
| **Modify** | `src/components/BottomBar.tsx`                                              |
| **Modify** | `src/components/CategoryPanel.tsx`                                          |
| **Modify** | `src/components/CategoryPicker.tsx`                                         |
| **Modify** | `src/components/ui/button.tsx`                                              |
| **Modify** | `src/components/ui/sheet.tsx`                                               |
| **Modify** | `src/store/useCategoriesStore.ts`                                           |
| **Modify** | `src/App.tsx`                                                               |

---

## Recommended Implementation Order

1. **Step 1** (CSS globals) — no logic, immediate visual improvement
2. **Step 2** (HapticService) — pure utility, no UI changes, unblocks all future steps
3. **Step 3** (Animation tokens) — unblocks Steps 4, 5, 7, 8, 9
4. **Step 10** (Store: delete item) — unblocks Step 5
5. **Step 4** (Page swipe physics) — highest visual impact
6. **Step 6** (Item tap feedback) — fast, high-impact
7. **Step 11** (Category picker feel) — fast, high-impact
8. **Step 12** (Button press states) — fast
9. **Step 5** (Swipe-to-delete rows) — most complex interaction
10. **Step 7** (ActionSheet for clear) — moderate complexity
11. **Step 8** (Settings sheet pull-to-dismiss) — moderate complexity
12. **Step 9** (Onboarding transitions) — moderate complexity
13. **Step 13** (Large title header) — moderate complexity
14. **Step 14** (Empty state animation) — polish pass
15. **Step 15** (Keyboard safe area) — polish pass
