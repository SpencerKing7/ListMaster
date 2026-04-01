# Plan: Eliminate the Bottom Safe-Area Bar on iOS & Android

**Goal:** Remove the visible colored/black bar that appears at the very bottom of the screen (below the app's content, in the home-indicator / navigation-bar region) on both iOS and Android devices, so the app fills the full physical screen edge-to-edge and feels like a polished native app.

---

## Deep Root-Cause Analysis

### What the User Sees

In the attached screenshot, a red arrow points to a **solid-colored bar** at the very bottom of the device screen — below the `PageIndicator` dots and the `BottomBar` component. This bar sits in the area occupied by the **iOS home indicator** (the swipe-up bar) or the **Android system navigation bar**.

This is the **exact same class of problem** that was identified and fixed for the **top** of the screen in `swipe-smoothness-and-theme-bar-fix.md` — but that plan only addressed the **top safe area** (`env(safe-area-inset-top)`). The bottom was never fixed.

### How `viewport-fit=cover` Works

The `index.html` has:

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"
/>
```

`viewport-fit=cover` tells the browser to extend the layout viewport to the **full physical screen**, including behind the notch/Dynamic Island at the top and the home indicator at the bottom. The browser exposes `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` so developers can add padding to keep interactive content out of those zones.

**Critically:** when `viewport-fit=cover` is active, CSS `top: 0` / `bottom: 0` / `inset: 0` / `h-dvh` etc. map to the **safe area boundary**, not the physical screen edge. The region **between the safe area edge and the physical screen edge** is filled by whatever is behind — which is the `<html>` element's `background-color`.

### What's Actually Rendering in That Bottom Strip

1. **`<html>` has** `background-color: var(--color-surface-background)` (set in `index.css` at the base layer, and also set inline by `applyThemeToDOM()` in `useTheme.ts`).
2. **`<body>` has** `background-color: var(--color-surface-background)` + `background-image: var(--gradient-brand-wide)`.
3. **MainScreen** root div uses `h-dvh` (`height: 100dvh`), meaning it fills exactly the **dynamic viewport height** — which is the safe area, not the full physical screen.
4. **MainScreen's two background layers** use `absolute inset-0`, meaning they are positioned within the `h-dvh` container — they stop at the safe area bottom boundary.

So the gap below the app content shows the `<html>` / `<body>` background. On dark mode, this is `#0e1714` — near-black, creating a visible **dark bar** that doesn't match the app's gradient. On light mode, it's `#f0f6f3`, which may be less noticeable but is still a flat color without the gradient, creating a visual seam.

### Why the Previous Fix (Top Bar) Didn't Cover the Bottom

The `swipe-smoothness-and-theme-bar-fix.md` plan only extended backgrounds upward using `top: calc(-1 * env(safe-area-inset-top, 0px))`. The bottom was implicitly left at `bottom: 0` (the safe area boundary). The SplashScreen was the only component that used negative offsets on all four sides. Every other screen only addressed the top.

### The Two Distinct Sub-Problems

#### Sub-Problem A: MainScreen's Background Doesn't Fill Behind the Home Indicator

The MainScreen's two background `<div>` layers (`absolute inset-0`) stop at the safe area bottom. The area behind the home indicator shows the raw `<html>` background.

**Current code** (`MainScreen.tsx` lines 188-195):

```tsx
{
  /* Base background */
}
<div
  className="absolute inset-0 -z-10"
  style={{ backgroundColor: "var(--color-surface-background)" }}
/>;
{
  /* Gradient overlay */
}
<div
  className="absolute inset-0 -z-10"
  style={{ background: "var(--gradient-brand-wide)" }}
/>;
```

Both use `inset-0` which doesn't extend past the safe area.

#### Sub-Problem B: The `h-dvh` Container Doesn't Extend Behind the Home Indicator

The MainScreen root is `<div className="relative h-dvh flex flex-col overflow-hidden">`. `h-dvh` = `height: 100dvh`, which equals the safe area height. The entire app layout — including backgrounds — is clipped to this height.

Since the background layers are `absolute` children of this `h-dvh` container, even if we give them negative bottom offsets, they'd be clipped by the parent's `overflow-hidden`.

#### Sub-Problem C: Onboarding Screens Have the Same Issue

`OnboardingInstallScreen`, `OnboardingWelcomeScreen`, and `OnboardingSetupScreen` all use `min-h-dvh` and `inset-0` background layers, exhibiting the same bottom gap.

#### Sub-Problem D: The `<body>` Background Gradient Doesn't Match

Even though `<body>` has `background-image: var(--gradient-brand-wide)`, the `<body>` element's height is `min-height: 100dvh` — also constrained to the safe area. The gradient on `<body>` doesn't extend behind the home indicator either. Below the body, only the `<html>` solid `background-color` is visible.

#### Sub-Problem E: Android Navigation Bar Behavior

On Android:

- **Gesture navigation** (Android 10+): The system navigation bar is a thin horizontal swipe indicator, similar to iOS. With `viewport-fit=cover`, Chrome extends the viewport behind it and provides `env(safe-area-inset-bottom)` values (~20-48px depending on device).
- **3-button / 2-button navigation**: The system draws an opaque bar. The PWA manifest `display: "standalone"` hides the browser chrome but the system navigation bar remains. The `theme_color` from the manifest controls the color of this bar on some Android versions, but the bottom system bar color is usually controlled by `background_color` or falls back to the `<html>` background.

On Android with gesture navigation and `viewport-fit=cover`, the exact same issue occurs — the gap behind the system gesture bar shows `<html>` background instead of the app's gradient.

---

## Platform-Specific Considerations

### iOS (Safari / WebKit Standalone)

- `apple-mobile-web-app-capable: yes` + `apple-mobile-web-app-status-bar-style: black-translucent` already makes the status bar area transparent and lets content render behind it.
- iOS does **not** have a manifest-level way to control the home indicator bar color. It's always overlaid on top of whatever the web page renders in that area.
- The home indicator area (`env(safe-area-inset-bottom)` ≈ 34px on Face ID iPhones) must be filled by extending the app's background into that zone.

### Android (Chrome)

- `display: "standalone"` removes browser chrome.
- `theme_color` controls the status bar color.
- On Android 11+ with gesture navigation, Chrome respects `viewport-fit=cover` and the behavior is similar to iOS — the system gesture bar is a semi-transparent overlay and web content must extend behind it.
- On Android with button navigation, the system nav bar color is influenced by `theme_color` and the `background_color` in the manifest. However, the best approach is still to extend the web content behind it using the same technique.

---

## Fix Plan

### Strategy

The cleanest fix is a **two-pronged approach**:

1. **Extend `<html>` and `<body>` backgrounds to cover the full physical screen** — this provides the safety net for any screen/component that doesn't explicitly handle the bottom safe area.
2. **Extend each screen's background layers behind the bottom safe area** — so the gradient (not just a flat color) fills the home indicator zone.

### Step 1: Fix `<html>` and `<body>` in `index.css` to Cover Full Physical Screen

**File:** `src/index.css`

The `<body>` currently has `min-height: 100dvh`. Change it to `min-height: 100%` with `<html>` set to `height: 100%`. Additionally, ensure the body background gradient is set in a way that it covers the full physical viewport.

However, the most reliable approach is actually simpler: since `<html>` already has `background-color: var(--color-surface-background)`, **also add the gradient to `<html>`**. The `<html>` element naturally fills the full physical viewport (including behind safe areas) when `viewport-fit=cover` is set. This provides a universal fallback.

In the `@layer base` block, update:

```css
html {
  background-color: var(--color-surface-background);
  background-image: var(--gradient-brand-wide);
  transition: background-color 0s;
  min-height: 100%;
}
body {
  /* ...existing styles... */
  min-height: 100dvh;
  /* body can keep its background-image too for layering, but html covers the gap */
}
```

**Why this works:** The `<html>` element is rendered by the browser to fill the entire physical viewport, including safe area insets. By putting the gradient on `<html>`, the home indicator area will show the same gradient as the app content — not a flat color.

### Step 2: Extend MainScreen Background Layers Behind the Bottom Safe Area

**File:** `src/screens/MainScreen.tsx`

The previous plan already extended the background layers upward behind the top safe area. Now extend them downward too.

Change the two background `<div>` elements from `inset-0` to explicit positioning with negative safe-area offsets on **both** top and bottom:

```tsx
{
  /* Base background */
}
<div
  className="absolute -z-10"
  style={{
    top: "calc(-1 * env(safe-area-inset-top, 0px))",
    left: 0,
    right: 0,
    bottom: "calc(-1 * env(safe-area-inset-bottom, 0px))",
    backgroundColor: "var(--color-surface-background)",
  }}
/>;
{
  /* Gradient overlay */
}
<div
  className="absolute -z-10"
  style={{
    top: "calc(-1 * env(safe-area-inset-top, 0px))",
    left: 0,
    right: 0,
    bottom: "calc(-1 * env(safe-area-inset-bottom, 0px))",
    background: "var(--gradient-brand-wide)",
  }}
/>;
```

**Important:** These `absolute` positioned children with negative offsets will extend beyond their `overflow-hidden` parent. Since `overflow-hidden` clips to the padding box, and the children have negative positions, they **would be clipped**. To solve this, we need to either:

- **(Option A)** Move the backgrounds **outside** the `h-dvh` container — make them direct children of a wrapper that doesn't clip, OR
- **(Option B)** Remove `overflow-hidden` from the root and put it only on the content area, OR
- **(Option C)** Use `::before` / `::after` pseudo-elements on the `<html>` or `<body>` with `position: fixed` and negative safe area offsets.

**Recommended approach — Option A:** Restructure MainScreen so the backgrounds are outside the clipping container:

```tsx
return (
  <>
    {/* Background layers — outside the overflow-hidden layout box */}
    <div
      className="fixed -z-10"
      style={{
        top: "calc(-1 * env(safe-area-inset-top, 0px))",
        left: 0,
        right: 0,
        bottom: "calc(-1 * env(safe-area-inset-bottom, 0px))",
        backgroundColor: "var(--color-surface-background)",
      }}
    />
    <div
      className="fixed -z-10"
      style={{
        top: "calc(-1 * env(safe-area-inset-top, 0px))",
        left: 0,
        right: 0,
        bottom: "calc(-1 * env(safe-area-inset-bottom, 0px))",
        background: "var(--gradient-brand-wide)",
      }}
    />

    {/* App layout — clipped to safe area */}
    <div className="relative h-dvh flex flex-col overflow-hidden">
      <HeaderBar ... />
      {/* ...rest of content... */}
    </div>
  </>
);
```

Using `position: fixed` ensures the backgrounds are positioned relative to the viewport (including behind safe areas) and are not clipped by any parent's `overflow-hidden`.

### Step 3: Apply the Same Fix to Onboarding Screens

**Files:**

- `src/screens/OnboardingInstallScreen.tsx`
- `src/screens/OnboardingWelcomeScreen.tsx`
- `src/screens/OnboardingSetupScreen.tsx`

Each of these screens has background `<div>` layers with `absolute inset-0`. Apply the same pattern — either move backgrounds to `position: fixed` with negative safe-area offsets, or ensure the gradient covers the bottom safe area.

For onboarding screens that use `min-h-dvh` (not `h-dvh` with `overflow-hidden`), the simpler approach of using `absolute` with negative offsets may work directly since there's no `overflow-hidden` on their root container. Verify each screen and apply the appropriate pattern.

### Step 4: Update `applyThemeToDOM()` to Set Gradient on `<html>`

**File:** `src/store/useTheme.ts`

Currently, `applyThemeToDOM()` sets `root.style.backgroundColor` and `document.body.style.backgroundColor` inline for instant theme switches. For full coverage, also set the gradient:

```ts
// After setting backgroundColor:
const gradient = getComputedStyle(root)
  .getPropertyValue("--gradient-brand-wide")
  .trim();
if (gradient) {
  root.style.backgroundImage = gradient;
}
```

Actually, since `--gradient-brand-wide` is the same in both light and dark themes (it uses rgba values that work on both backgrounds), and it's already declared in CSS on `<html>`, this may not be strictly necessary. The `background-color` change is the main concern. But setting it explicitly guarantees there's no flash of flat color during theme transitions.

### Step 5: Verify the `<body>` Gradient Extends Fully

**File:** `src/index.css`

Ensure the `<body>` height doesn't constrain the gradient to only the safe area:

Currently:

```css
body {
  min-height: 100dvh;
}
```

Change to use `100%` so it inherits from `<html>` which fills the full physical viewport:

```css
body {
  min-height: 100%;
}
```

However, note that `100dvh` on body with `viewport-fit=cover` should already mean the body covers the safe area. The real issue is that `100dvh` doesn't include the safe-area inset space. So switching to `min-height: calc(100dvh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))` would be one option, but it's fragile. The `<html>` background approach from Step 1 is the more reliable solution.

### Step 6: Ensure the Inline Theme Initializer in `index.html` Handles This

**File:** `index.html`

The existing inline `<script>` in `<head>` sets `data-theme` before first paint. No changes needed here — the CSS custom property approach means as long as `data-theme` is set correctly, `--color-surface-background` and `--gradient-brand-wide` will resolve to the right theme values, and the `<html>` background will be correct from first paint.

### Step 7 (Optional): Add `display_override` to the Manifest for Fullscreen on Android

**File:** `vite.config.ts`

For the most immersive experience on Android, consider adding `display_override: ["standalone"]` or even `fullscreen` as a preferred mode. However, `standalone` is already the `display` value, so `display_override` isn't needed unless we want to try `fullscreen` first:

```ts
display_override: ["standalone"],
display: "standalone",
```

This is optional and primarily a future consideration. The main fix is the CSS approach above.

---

## Why Previous Attempts Didn't Fix This

The `swipe-smoothness-and-theme-bar-fix.md` plan correctly diagnosed and fixed the **top** safe area gap by:

1. Extending the SplashScreen to use negative safe-area offsets on all four sides ✅
2. Extending MainScreen backgrounds with `top: calc(-1 * env(safe-area-inset-top))` ✅
3. Setting `<html>` `background-color` inline via `applyThemeToDOM()` ✅

But it **only used negative offsets on `top`**, not on `bottom`. The MainScreen backgrounds were extended upward but not downward. The `<html>` background-color was matched to the theme, but it's still a **flat color** — not the gradient — so the bottom strip looks visually different from the gradient-covered app area above it.

The SplashScreen was correctly fixed with all four negative offsets, which is why it doesn't show the bottom bar. But MainScreen and the onboarding screens were only half-fixed.

---

## Summary of Files to Modify

| File                                      | Changes                                                                                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.css`                           | Add `background-image: var(--gradient-brand-wide)` to `html` rule; consider adjusting `body` min-height                                 |
| `src/screens/MainScreen.tsx`              | Move background layers to `position: fixed` with negative safe-area offsets on all four sides (outside the `overflow-hidden` container) |
| `src/screens/OnboardingInstallScreen.tsx` | Extend background layers behind bottom safe area                                                                                        |
| `src/screens/OnboardingWelcomeScreen.tsx` | Extend background layers behind bottom safe area                                                                                        |
| `src/screens/OnboardingSetupScreen.tsx`   | Extend background layers behind bottom safe area                                                                                        |
| `src/store/useTheme.ts`                   | (Optional) Set gradient on `<html>` inline during theme switch                                                                          |

---

## Testing Checklist

- [ ] **iOS standalone (Face ID iPhone):** No visible bar/seam at the bottom of the screen on MainScreen — gradient extends seamlessly behind the home indicator.
- [ ] **iOS standalone (Face ID iPhone):** No visible bar/seam at the bottom on all three onboarding screens.
- [ ] **iOS standalone:** SplashScreen still fills edge-to-edge (already fixed — verify no regression).
- [ ] **iOS standalone:** No visible bar at the top (already fixed — verify no regression).
- [ ] **iOS Safari (not installed):** App looks correct in browser tab (safe area insets may be 0 in browser, so no gap expected — but verify no overflow).
- [ ] **Android Chrome (gesture nav):** No visible bar at the bottom in standalone PWA mode.
- [ ] **Android Chrome (3-button nav):** System nav bar color matches app theme.
- [ ] **Theme switching:** Toggle between light/dark/system — no flash of flat color in the bottom safe area during transition.
- [ ] **Keyboard open:** When the soft keyboard is open, the bottom safe area is irrelevant (keyboard covers it) — verify no visual glitch when keyboard opens/closes.
- [ ] **Landscape (optional):** If rotated, safe area insets shift — verify the backgrounds still fill correctly.
- [ ] **BottomBar visible state:** When checked items exist and the `BottomBar` "Clear Checked" button renders, verify it sits properly above the home indicator with correct padding and the gradient background extends behind it.
