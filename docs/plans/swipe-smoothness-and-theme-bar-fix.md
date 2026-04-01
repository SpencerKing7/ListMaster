# Plan: Fix Choppy Category Swipe & Theme Bar Flash

**Goal:** Eliminate two polish issues that make the app feel unfinished:

1. Choppy / janky page transitions when swiping between categories on the Main Screen.
2. A visible colored bar (or flash) at the top of the app during launch and when switching themes.

---

## Issue 1 — Choppy Category Swipe

### Root Cause Analysis

The swipe-between-categories system in `MainScreen.tsx` uses a **three-panel sliding layout** — the previous, current, and next category panels rendered side-by-side, translated via CSS `transform`. The transition logic lives in `performSlideTransition()`.

The choppiness comes from multiple compounding problems:

#### Problem A: `setTimeout` ↔ `requestAnimationFrame` race condition

```ts
// Current flow in performSlideTransition():
setIsAnimating(true);
setDragOffset(target); // ① Animate strip off-screen

setTimeout(() => {
  store.selectNextCategory(); // ② 380ms later — switch category (heavy re-render)
  setIsAnimating(false); // ③ Disable transition
  requestAnimationFrame(() => {
    setDragOffset(0); // ④ Snap back to center
    isTransitioningRef.current = false;
  });
}, 380);
```

Steps ②→③→④ all fire in rapid succession. React batches ② and ③ into one render, but ④ is deferred to the next frame via `requestAnimationFrame`. The problem:

- After step ②, React re-renders all three `CategoryPanel` components with **new data** (the previous/current/next panels shift). This is an expensive render.
- Step ③ sets `isAnimating = false` in the same batch, removing the CSS transition. But the browser may have already committed a frame with the panels at the old animated offset (because the DOM hasn't flushed yet).
- Step ④ runs in the **next** animation frame — meaning there's at least **one painted frame** where the new panels are visible at the wrong position (the old `dragOffset` value). The user sees a single-frame flash/jump.

#### Problem B: No `will-change` hint for GPU compositing

The sliding `div` uses inline `transform` + `transition` but does not declare `will-change: transform`. Without this, the browser may not promote the element to its own compositing layer, causing the transform to trigger expensive **main-thread repaints** instead of cheap **GPU composited** transforms.

#### Problem C: `touch-pan-y` allows browser scroll interference

The content div has `className="flex h-full touch-pan-y"`. `touch-pan-y` tells the browser to handle vertical panning natively — but the three-panel container is not a scroll container, so any vertical touch interaction may cause the browser to enter its own scroll gesture handling, briefly competing with the custom pointer-event swipe detection. This can cause micro-stutters when the browser's hit-testing machinery decides whether the gesture is a scroll vs. a horizontal drag.

#### Problem D: Conflict with SwipeableRow gestures

`SwipeableRow` also uses pointer events with `setPointerCapture`. When a swipe starts on a list item, both the row-level and page-level pointer handlers fire. The row's 5px intent-detection threshold is lower than the page-level 10px threshold. If the row handler decides the gesture is horizontal and captures the pointer **before** the page handler can evaluate, the page swipe is silently stolen. Conversely, the `isLockedOutRef` in SwipeableRow correctly defers to vertical gestures, but its horizontal detection may race with the page's horizontal detection, causing the first ~10px of a page swipe to be consumed by the row, making the page swipe start late and feel "sticky" or choppy.

### Fix Plan

#### Step 1: Replace `setTimeout` + `rAF` with `onTransitionEnd` in `MainScreen.tsx`

Instead of guessing when the CSS transition finishes (via a 380ms timeout), listen for the `transitionend` event on the sliding element. This guarantees:

- The animation fully completes before any state changes.
- No race conditions between setTimeout, rAF, and React rendering.

**File:** `src/screens/MainScreen.tsx`

Changes to `performSlideTransition()`:

1. Accept an additional parameter: the ref to the sliding element (`contentRef`).
2. Replace the `setTimeout` body with a one-shot `transitionend` handler on `contentRef.current`.
3. Inside the handler:
   - Call `store.selectNextCategory()` / `store.selectPreviousCategory()`.
   - **Immediately** set `isAnimating(false)` and `setDragOffset(0)` **in the same synchronous block** — React 19 batches these into a single render, so the offset resets before the browser paints.
   - Set `isTransitioningRef.current = false`.
4. Keep `isTransitioningRef.current = true` and the animation kickoff (`setIsAnimating(true); setDragOffset(target)`) at the start, same as today.
5. Add a safety `setTimeout` fallback (e.g., 500ms) that cleans up in case `transitionend` never fires (edge case: if the element is unmounted during animation).

```ts
function performSlideTransition(
  swipeLeft: boolean,
  contentWidth: number,
  setIsAnimating: (v: boolean) => void,
  setDragOffset: (v: number) => void,
  isTransitioningRef: React.MutableRefObject<boolean>,
  store: ReturnType<typeof useCategoriesStore>,
  contentEl: HTMLDivElement | null,
) {
  isTransitioningRef.current = true;
  const target = swipeLeft ? -contentWidth : contentWidth;

  setIsAnimating(true);
  setDragOffset(target);

  if (!contentEl) return;

  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    contentEl.removeEventListener("transitionend", onEnd);

    if (swipeLeft) {
      store.selectNextCategory();
    } else {
      store.selectPreviousCategory();
    }

    // All in one synchronous block — React 19 batches these into a single commit
    setIsAnimating(false);
    setDragOffset(0);
    isTransitioningRef.current = false;
  };

  const onEnd = (e: TransitionEvent) => {
    if (e.propertyName === "transform") settle();
  };
  contentEl.addEventListener("transitionend", onEnd);

  // Safety fallback
  setTimeout(settle, 500);
}
```

#### Step 2: Add `will-change: transform` to the sliding element in `MainScreen.tsx`

On the three-panel sliding `div`, add `willChange: "transform"` to the inline style. This promotes the element to a GPU compositing layer, ensuring smooth 60fps transforms.

**File:** `src/screens/MainScreen.tsx`

In the inline style of the sliding `div` (the one with `ref={contentRef}`):

```ts
style={{
  width: `${contentWidth * 3}px`,
  transform: `translateX(${-contentWidth + dragOffset}px)`,
  willChange: "transform",
  transition: isAnimating
    ? "transform var(--duration-page) var(--spring-page)"
    : "none",
}}
```

#### Step 3: Change `touch-pan-y` to `touch-action: none` on the swipe surface

The three-panel container should fully own all touch gestures. Replace `touch-pan-y` with `touch-action: none` (via Tailwind's `touch-none` class). The vertical scroll is handled by the inner `CategoryPanel` div (which has `overflow-y-auto`), so the outer container doesn't need browser-native pan.

**File:** `src/screens/MainScreen.tsx`

Change the className of the sliding div from:

```tsx
className = "flex h-full touch-pan-y";
```

to:

```tsx
className = "flex h-full touch-none";
```

#### Step 4: Prevent SwipeableRow from stealing page-swipe gestures

Add `stopPropagation()` calls in `SwipeableRow`'s pointer handlers so that once the row captures a horizontal swipe, the event doesn't also propagate to the page handler. Conversely, the row should **not** start capturing until its own 5px threshold is met — and if the page handler captures first (it won't, because it has a 10px threshold), the row should yield.

The cleanest fix: raise `SwipeableRow`'s horizontal intent threshold from 5px to **8px**, and lower the page's threshold from 10px to **8px** — making them equal. Then, add `e.stopPropagation()` in `SwipeableRow.handlePointerMove` once it captures. This ensures:

- Fast horizontal flicks are caught by whichever handler evaluates first (the row, since it's deeper in the DOM — events bubble).
- The row calls `stopPropagation` once it captures, preventing the page handler from double-processing.
- If the gesture is more vertical, the row locks out, and the event propagates naturally to the page.

**File:** `src/components/SwipeableRow.tsx`

1. In `handlePointerMove`, when the horizontal drag is confirmed (currently `if (absDy >= absDx)` check), also call `e.stopPropagation()` right after `setPointerCapture`:
   ```ts
   isDraggingRef.current = true;
   setIsDragging(true);
   e.currentTarget.setPointerCapture(e.pointerId);
   e.stopPropagation(); // prevent page-level handler from also processing
   ```
2. Also add `e.stopPropagation()` in the `isDraggingRef.current === true` branch (subsequent moves after capture).

**File:** `src/screens/MainScreen.tsx`

No changes needed to the page handler thresholds if `stopPropagation` is added to SwipeableRow — the page handler simply won't see pointer events that the row has claimed.

#### Step 5: Use `translateX` with sub-pixel rounding prevention

Add `translate3d(Xpx, 0, 0)` instead of `translateX(Xpx)` to force GPU acceleration on all browsers (some older WebKits only promote to a compositing layer with `translate3d`).

**File:** `src/screens/MainScreen.tsx`

Change the transform from:

```ts
transform: `translateX(${-contentWidth + dragOffset}px)`,
```

to:

```ts
transform: `translate3d(${-contentWidth + dragOffset}px, 0, 0)`,
```

Apply the same `translate3d` pattern in `SwipeableRow.tsx` for the main content div and the delete button div.

---

## Issue 2 — Black Bar at Top of Screen (Safe Area Gap)

### Root Cause Analysis (Confirmed via Screenshot)

The screenshot shows a **solid black bar** at the very top of the device screen, between the physical top edge (status bar / notch area) and the start of the SplashScreen's green gradient. This is visible on **every screen** — the SplashScreen just makes it most obvious because the gradient contrast against black is stark.

#### How iOS standalone PWA rendering works

When `viewport-fit=cover` is set (it is, in `index.html`), iOS extends the web viewport to include the safe area insets (behind the notch / status bar and home indicator). With `apple-mobile-web-app-status-bar-style: black-translucent`, the status bar is transparent and content is expected to render behind it.

However, **CSS `fixed inset-0` and `h-dvh` do NOT extend into the safe area** by default. `top: 0` in CSS corresponds to the top of the _safe area_, not the top of the physical screen. The space between the physical screen top and `top: 0` (i.e., `env(safe-area-inset-top)`) is filled by whatever is behind — which is the **`<html>` element's `background-color`**.

#### What's happening

1. `<html>` has `background-color: var(--color-surface-background)`.
2. In the default/system theme on a dark device, this resolves to `#0e1714` — near-black.
3. The SplashScreen uses `fixed inset-0`, meaning its gradient starts at the safe area boundary, not the physical screen top.
4. The safe area gap (≈47px on iPhone with Dynamic Island, ≈44px on notched iPhones) shows the `<html>` background — a black bar.
5. The **same issue exists on all screens** — on MainScreen, the HeaderBar uses `paddingTop: calc(env(safe-area-inset-top) + 8px)` and a gradient background that somewhat masks it, but the `<html>` background still peeks through.

#### Why theme switching makes it flash

When switching themes, `applyThemeToDOM()` sets `data-theme`, which changes `--color-surface-background`. The `<html>` background-color updates via CSS custom property, but there may be a 1-2 frame delay between the theme attribute change and the React tree re-rendering with new colors — causing a brief flash where the old `<html>` background shows in the safe area while the content has already switched.

### Fix Plan

The fix has **two complementary parts**: (A) make the safe area gap invisible on every screen by extending backgrounds behind it, and (B) prevent flashes during theme switching.

#### Step 1: Extend the SplashScreen to cover the full physical screen

The SplashScreen's `fixed inset-0` container must extend into the safe area. Use negative margins or explicit padding to fill the gap.

**File:** `src/screens/SplashScreen.tsx`

Change the root `<div>` from:

```tsx
<div
  className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5"
  style={{
    background: `linear-gradient(160deg, var(--color-brand-deep-green) 0%, var(--color-brand-green) 55%, var(--color-brand-teal) 100%)`,
    opacity: isFading ? 0 : 1,
    transition: "opacity 420ms ease-out",
  }}
>
```

to:

```tsx
<div
  className="fixed z-50 flex flex-col items-center justify-center gap-5"
  style={{
    top: "calc(-1 * env(safe-area-inset-top, 0px))",
    left: "calc(-1 * env(safe-area-inset-left, 0px))",
    right: "calc(-1 * env(safe-area-inset-right, 0px))",
    bottom: "calc(-1 * env(safe-area-inset-bottom, 0px))",
    background: `linear-gradient(160deg, var(--color-brand-deep-green) 0%, var(--color-brand-green) 55%, var(--color-brand-teal) 100%)`,
    opacity: isFading ? 0 : 1,
    transition: "opacity 420ms ease-out",
  }}
>
```

By using negative offsets equal to the safe area insets, the splash gradient extends to the true physical screen edges. The `flex items-center justify-center` keeps the content centered in the visible area.

#### Step 2: Extend the MainScreen background layers to cover the safe area

The MainScreen has two `absolute inset-0` background layers (solid color + gradient). These also stop at the safe area boundary.

**File:** `src/screens/MainScreen.tsx`

For both background `<div>` elements, replace `inset-0` with explicit negative-margin positioning:

```tsx
{
  /* Base background — extends behind safe area */
}
<div
  className="absolute -z-10"
  style={{
    top: "calc(-1 * env(safe-area-inset-top, 0px))",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "var(--color-surface-background)",
  }}
/>;
{
  /* Gradient overlay — extends behind safe area */
}
<div
  className="absolute -z-10"
  style={{
    top: "calc(-1 * env(safe-area-inset-top, 0px))",
    left: 0,
    right: 0,
    bottom: 0,
    background: "var(--gradient-brand-wide)",
  }}
/>;
```

This makes the background extend behind the status bar / notch area so no `<html>` background peeks through.

#### Step 3: Also extend backgrounds on Onboarding screens

The same `inset-0` background pattern exists on the onboarding screens. Apply the same negative safe-area-inset-top treatment.

**Files:**

- `src/screens/OnboardingInstallScreen.tsx`
- `src/screens/OnboardingWelcomeScreen.tsx`
- `src/screens/OnboardingSetupScreen.tsx`

For each screen's background/gradient overlay `<div>` elements, apply the same `top: calc(-1 * env(safe-area-inset-top, 0px))` positioning.

#### Step 4: Add an inline theme-init script to `index.html`

Even with the safe area fix, the `<html>` background should match the user's theme as early as possible — both for the safe area gap and for the brief moment before React renders.

**File:** `index.html`

Add a synchronous, blocking `<script>` in the `<head>`, after the `<meta name="theme-color">` tags and before any module scripts:

```html
<!-- Inline theme initializer — runs before first paint to prevent theme flash -->
<script>
  (function () {
    var mode = localStorage.getItem("appearanceMode") || "system";
    var lightBg = "#f0f6f3";
    var darkBg = "#0e1714";

    if (mode === "light" || mode === "dark") {
      document.documentElement.setAttribute("data-theme", mode);
      var bg = mode === "dark" ? darkBg : lightBg;
      var metas = document.querySelectorAll('meta[name="theme-color"]');
      for (var i = 0; i < metas.length; i++) {
        metas[i].setAttribute("content", bg);
      }
    }
    // 'system' mode: do nothing — the media-query meta tags handle it
  })();
</script>
```

This ensures `data-theme` is set on `<html>` before any CSS is parsed, so the correct token values are active from the very first paint.

#### Step 5: Update manifest `theme_color` and `background_color`

The PWA manifest has hardcoded dark-mode colors. Since the manifest is static and the majority of users will be on the default (system/light) theme, default to light.

**File:** `vite.config.ts`

Change:

```ts
theme_color: "#0e1714",
background_color: "#0e1714",
```

To:

```ts
theme_color: "#f0f6f3",
background_color: "#f0f6f3",
```

> **Note:** This is a trade-off. There is no perfect solution for a PWA that supports both light and dark themes — the manifest is static. Defaulting to light matches iOS convention.

#### Step 6: Ensure `applyThemeToDOM()` also updates `<html>` background-color inline

When the user switches themes at runtime, the CSS custom property change propagates immediately for most elements. But to guarantee the `<html>` element repaints instantly (especially for the safe area gap), explicitly set the inline `backgroundColor` on `document.documentElement`.

**File:** `src/store/useTheme.ts`

Add at the end of `applyThemeToDOM()`:

```ts
// Force immediate background repaint to prevent flash between old and new theme
root.style.backgroundColor =
  mode === "dark" ||
  (mode === "system" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches)
    ? SURFACE_BG_DARK
    : SURFACE_BG_LIGHT;
```

#### Step 7: Add `transition: background-color 0s` to `html` in CSS

Defensive: prevent any inherited or future transitions from causing a slow background change during theme switches.

**File:** `src/index.css`

In the `@layer base` block, update the `html` rule:

```css
html {
  background-color: var(--color-surface-background);
  transition: background-color 0s;
}
```

---

## Summary of Files to Modify

| File                                      | Changes                                                                                                                                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/screens/MainScreen.tsx`              | Replace `setTimeout`+`rAF` with `transitionend`; add `will-change: transform`; change `touch-pan-y` → `touch-none`; use `translate3d`; extend background layers behind safe area |
| `src/components/SwipeableRow.tsx`         | Add `e.stopPropagation()` after pointer capture; use `translate3d`                                                                                                               |
| `src/screens/SplashScreen.tsx`            | Extend root div to cover full physical screen (negative safe-area-inset offsets)                                                                                                 |
| `src/screens/OnboardingInstallScreen.tsx` | Extend background behind safe area                                                                                                                                               |
| `src/screens/OnboardingWelcomeScreen.tsx` | Extend background behind safe area                                                                                                                                               |
| `src/screens/OnboardingSetupScreen.tsx`   | Extend background behind safe area                                                                                                                                               |
| `index.html`                              | Add inline theme-init `<script>` in `<head>`                                                                                                                                     |
| `vite.config.ts`                          | Change manifest `theme_color` / `background_color` to light defaults                                                                                                             |
| `src/store/useTheme.ts`                   | Explicitly set `html` background-color in `applyThemeToDOM()`                                                                                                                    |
| `src/index.css`                           | Add `transition: background-color 0s` to `html` rule                                                                                                                             |

## Testing Checklist

- [ ] Swipe left/right between categories — should be butter-smooth with no frame skips or jumps.
- [ ] Swipe a row to reveal delete, then try swiping the page — page swipe should not be hijacked.
- [ ] Try a vertical scroll on items, then horizontal swipe — gestures should not conflict.
- [ ] **iOS standalone**: No black bar visible at top on SplashScreen — gradient extends edge-to-edge.
- [ ] **iOS standalone**: No black bar visible at top on MainScreen — background fills behind status bar.
- [ ] **iOS standalone**: No black bar visible at top on Onboarding screens.
- [ ] Switch between light/dark/system themes in Settings — no flash or bar at top.
- [ ] Force-quit and relaunch in light mode — no dark flash on iOS standalone launch splash.
- [ ] Force-quit and relaunch in dark mode — verify theme applies before first paint.
- [ ] Test on both iOS Safari and Chrome on Android.
