# Plan: Add-Item Input Keyboard Fix & Splash Screen

> **⚠️ PLAN ONLY — DO NOT EXECUTE CODE CHANGES ⚠️**
>
> This document is a research-backed implementation plan. No source files should be modified during the planning phase. Hand this plan to the agent for execution.

---

## Table of Contents

1. [Task 1 — Add-Item Input Keyboard Layout Fix](#task-1--add-item-input-keyboard-layout-fix)
2. [Task 2 — Splash / Launch Screen](#task-2--splash--launch-screen)

---

## Task 1 — Add-Item Input Keyboard Layout Fix

### Problem Analysis

When the user taps the "Add an item" input in `BottomBar.tsx`, the virtual keyboard opens and the **entire app layout shifts, resizes, or moves off-screen**. This is caused by a perfect storm of three factors:

1. **`interactive-widget=resizes-content`** in `index.html`'s `<meta name="viewport">` tag tells the browser to resize the layout viewport when the virtual keyboard opens. This causes `100dvh` to shrink to the visible area above the keyboard.

2. **`h-dvh` on the MainScreen root** (`<div className="relative h-dvh flex flex-col overflow-hidden">`) makes the entire app's height equal to the dynamic viewport height. When the keyboard opens and `dvh` shrinks, the entire flex column (HeaderBar + content area + BottomBar) is violently compressed into a much smaller space.

3. **The three-panel sliding layout** inside the content area uses absolute pixel widths and `translateX` transforms. When the container height collapses, the panels reflow and the visual result is everything "moving off screen."

### Root Cause

The combination of `interactive-widget=resizes-content` + `h-dvh` means the keyboard literally steals vertical space from the app layout. This is the _opposite_ of what native iOS apps do — in SwiftUI, the keyboard is an overlay that pushes content up via safe-area insets, not a viewport resize.

### Solution Strategy: "Overlay Keyboard" Approach

The fix is to stop the keyboard from resizing the layout, and instead manually position the input above the keyboard using `visualViewport` API. This matches native iOS behavior exactly.

### Step 1 — Change the Viewport Meta Tag

**File:** `index.html`

Change `interactive-widget=resizes-content` to `interactive-widget=resizes-visual`:

```
Before: <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
After:  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-visual" />
```

**Why:** `resizes-visual` tells the browser that only the _visual_ viewport should shrink when the keyboard opens — the _layout_ viewport stays the same size. This means `h-dvh` / `100dvh` will **not** change when the keyboard appears, so the three-panel layout and HeaderBar stay exactly where they are.

### Step 2 — Add a `useKeyboardInset` Hook (or Inline Effect)

**File:** `src/components/BottomBar.tsx` (add `useEffect` inside the component)

Since the layout viewport no longer resizes, the BottomBar will now be **hidden behind the keyboard**. We need to detect the keyboard height and shift the BottomBar up.

Add a `useEffect` that listens to `window.visualViewport` resize events:

```ts
const [keyboardHeight, setKeyboardHeight] = useState(0);

useEffect(() => {
  const vv = window.visualViewport;
  if (!vv) return;

  const update = () => {
    // The keyboard height is the difference between layout and visual viewport
    const offset = window.innerHeight - vv.height;
    setKeyboardHeight(Math.max(0, offset));
  };

  vv.addEventListener("resize", update);
  vv.addEventListener("scroll", update);
  return () => {
    vv.removeEventListener("resize", update);
    vv.removeEventListener("scroll", update);
  };
}, []);
```

Then apply `keyboardHeight` to the BottomBar's `<footer>` as a `transform: translateY(-${keyboardHeight}px)` or as additional `paddingBottom` / `bottom` offset. The transform approach is preferred because it does not trigger a layout reflow:

Update the `<footer>` inline style:

```tsx
<footer
  className="sticky bottom-0 z-10 px-4 pt-5 pb-5"
  style={{
    paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
    background: "linear-gradient(to bottom, transparent 0%, var(--color-surface-background) 35%, var(--color-surface-background) 100%)",
    transform: keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : undefined,
    transition: "transform 0.25s ease-out",
  }}
>
```

**Note:** When `keyboardHeight > 0`, the safe-area-inset-bottom becomes irrelevant (keyboard covers the home indicator area), so the existing `paddingBottom` calc is fine — the `translateY` simply moves the bar above the keyboard.

### Step 3 — Scroll the Item List So Input Stays Visible

When the keyboard opens, the BottomBar floats up but the content area behind it doesn't automatically adjust. The `CategoryPanel` scroll area should still be fine because it has `overflow-y: auto` — the user can scroll. However, for polish:

**File:** `src/components/BottomBar.tsx`

When the input gains focus and the keyboard opens, scroll the parent container so the last few items are visible above the BottomBar. This can be done with a small `useEffect` that, when `keyboardHeight > 0` and the input is focused, calls `scrollIntoView` on the input or adjusts the CategoryPanel's scroll position.

A simpler approach: just ensure the CategoryPanel has enough bottom padding to account for the BottomBar height + keyboard. This can be done by adding a spacer div at the bottom of the CategoryPanel, or by dynamically adjusting its `paddingBottom`.

**File:** `src/screens/MainScreen.tsx`

Pass `keyboardHeight` as a CSS variable on the container or pass it via context so `CategoryPanel` can add bottom padding when the keyboard is open. Alternatively, keep it simple: the BottomBar already has a gradient background that overlaps the list — the list scrolls underneath. No change needed if the existing UX is acceptable.

### Step 4 — Remove the `--keyboard-inset` CSS Variable (Cleanup)

**File:** `src/styles/tokens.css`

The existing `--keyboard-inset: 0px` variable in `:root` was planned in the iOS-feel overhaul but the approach has changed. If it's unused, leave it. If Step 2 is implemented with a CSS variable approach instead of React state, update it accordingly.

### Step 5 — Test Scenarios

Test on:

- **iOS Safari (PWA installed to home screen)** — primary target
- **iOS Safari (in-browser)** — secondary
- **Android Chrome** — `interactive-widget=resizes-visual` is well-supported
- **Desktop browsers** — no virtual keyboard, should be unaffected

Verify:

- [ ] Tapping the add-item input opens the keyboard without layout shift
- [ ] The BottomBar smoothly translates above the keyboard
- [ ] The item list remains scrollable behind the BottomBar
- [ ] Dismissing the keyboard smoothly returns BottomBar to its original position
- [ ] The three-panel swipe gesture still works while the keyboard is open
- [ ] Typing and pressing Enter to add an item still works
- [ ] The input stays focused after adding an item (existing behavior via `inputRef.current?.focus()`)

### Alternative Considered: Moving the Input Elsewhere

One option considered was moving the add-item input to a different location (e.g., inside a floating action button that opens a dialog, or at the top of the list). However, the current bottom-bar placement is the most natural and iOS-native pattern (matching Apple's Reminders app). The `resizes-visual` + `visualViewport` fix is the correct solution — it's how all production PWAs handle this.

---

## Task 2 — Splash / Launch Screen

### Goal

When a returning user (not new — `hasCompletedOnboarding === true`) opens the app, show a branded splash screen for ~1.2 seconds before transitioning to the main screen. New users should still go straight to onboarding.

### Design Spec

- **Background:** Solid brand color — use `var(--color-brand-green)` (or the gradient `var(--gradient-brand-wide)` for extra polish on a white/dark base).
- **Content:** The app name "List Master" centered vertically and horizontally, in white, bold, ~28–32px font.
- **Duration:** 1.2 seconds (industry standard for splash screens: 1–2s; shorter feels abrupt, longer feels slow).
- **Exit transition:** Fade out over ~400ms, then navigate to MainScreen.
- **Theme-aware:** The splash background should respect the current theme. Use the brand green (which is already theme-aware in tokens.css).

### Architecture Decision

This should **not** be a separate route. Adding a `/splash` route would:

- Flash in the URL bar
- Complicate the router logic
- Be unnecessary since it's purely a visual transient

Instead, implement it as **state within `App.tsx`** — a conditional overlay that shows for 1.2s before revealing the routed content. This keeps routing clean and avoids flash-of-wrong-content issues.

### Step 1 — Create the SplashScreen Component

**File:** `src/screens/SplashScreen.tsx`

Create a new screen component:

```tsx
/** Full-screen branded splash shown to returning users on app launch. */
interface SplashScreenProps {
  onFinished: () => void;
}
```

- Renders a full-viewport div (`h-dvh w-full`) with `backgroundColor: var(--color-brand-green)`.
- Centers the app name "List Master" using flexbox.
- The text should be white, bold, ~text-3xl, with the same `-apple-system` font.
- On mount, starts a `setTimeout` of 1200ms, then triggers a fade-out animation (opacity 1 → 0 over 400ms), then calls `onFinished()`.
- Use a `useState` for the fade-out phase: initially `false`, set to `true` after the 1200ms timer fires. Apply `opacity: 0` with a CSS transition of `400ms ease-out` when fading. After the 400ms transition ends, call `onFinished`.
- Total time on screen: 1200ms visible + 400ms fade = 1600ms.

### Step 2 — Integrate into App.tsx

**File:** `src/App.tsx`

Add state to track whether the splash has been shown:

```tsx
const [isSplashVisible, setIsSplashVisible] = useState(
  () => hasCompletedOnboarding,
);
```

- If `hasCompletedOnboarding` is `true`, start with `isSplashVisible = true`.
- If `hasCompletedOnboarding` is `false` (new user), start with `isSplashVisible = false` — go straight to onboarding.

Render logic:

```tsx
if (isSplashVisible) {
  return <SplashScreen onFinished={() => setIsSplashVisible(false)} />;
}

return <HashRouter>{/* ... existing routing ... */}</HashRouter>;
```

**Important:** The splash renders _instead of_ the router, not alongside it. This means no route components mount until the splash finishes, which avoids any wasted work or flash of the main screen behind the splash.

### Step 3 — Add Subtle Polish (Optional Enhancement)

For extra native feel:

- Add a subtle scale animation to the app name: start at `scale(0.9)`, animate to `scale(1)` over the 1.2s display period using `ease-out`.
- Optionally include a small app icon/logo above the text if one exists in `src/assets/`.
- The fade-out could also slightly scale up (`scale(1.05)`) for a "zoom into the app" feel, similar to iOS app launch animations.

### Step 4 — Ensure No Flash on Subsequent Navigations

The splash should only show on initial app load, not when:

- The user navigates back to `/` from settings
- The tab regains visibility (`visibilitychange`)
- A hot-module reload occurs in dev

The `useState` initializer approach in Step 2 handles this naturally — `isSplashVisible` is only `true` on the very first render. Once set to `false`, it stays `false` for the lifetime of the app instance. HMR in development will re-mount `App`, which would re-show the splash — this is acceptable in dev, but if annoying, a `sessionStorage` flag can suppress it after the first show.

### Step 5 — Test Scenarios

Verify:

- [ ] Returning user sees splash for ~1.2s, then it fades out to the main screen
- [ ] New user goes directly to onboarding (no splash)
- [ ] After reset-to-new-user, the next app open shows onboarding (no splash)
- [ ] The splash respects light/dark theme (green color is theme-aware)
- [ ] No layout flash or content flicker when transitioning from splash to main screen
- [ ] The splash works correctly when the app is installed as a PWA (standalone mode)

---

## Summary of Files to Create / Modify

| Action | File                           | Reason                                                      |
| ------ | ------------------------------ | ----------------------------------------------------------- |
| Modify | `index.html`                   | Change `interactive-widget` to `resizes-visual`             |
| Modify | `src/components/BottomBar.tsx` | Add `visualViewport` keyboard height detection + translateY |
| Create | `src/screens/SplashScreen.tsx` | New splash screen component                                 |
| Modify | `src/App.tsx`                  | Conditionally render splash before router                   |

### Files NOT Modified

- `MainScreen.tsx` — no changes needed; the layout fix is in BottomBar + index.html
- `CategoryPanel.tsx` — no changes needed
- `tokens.css` — no new tokens required
- `index.css` — no new utilities required
- `useSettingsStore.ts` — no new state needed (splash uses existing `hasCompletedOnboarding`)

---

## Execution Order

1. **Task 1 first** — the keyboard fix is the higher-priority bug fix.
   - Step 1 (viewport meta) → Step 2 (BottomBar keyboard detection) → Step 3 (scroll adjustment if needed) → Step 5 (test)
2. **Task 2 second** — the splash screen is a new feature.
   - Step 1 (create SplashScreen) → Step 2 (integrate into App.tsx) → Step 3 (polish) → Step 5 (test)
