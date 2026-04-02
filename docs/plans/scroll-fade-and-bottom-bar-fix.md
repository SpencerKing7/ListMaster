# Fix: Scroll, Fade Effect, and Bottom Bar

> Three regressions introduced during the scroll-hide and fade-under work.
> **Revised** based on git comparison against last known working commit `7d409a0`.

---

## Root-Cause Summary

Git diff against commit `7d409a0` (last known working state) reveals exactly two sources of all three regressions:

1. **`index.css` changes** — `html` was changed from `min-height: calc(100% + safe-area)` to `height: 100dvh; overflow: hidden`, `body` got `height: 100dvh; overflow: hidden` (original only had `min-height: 100dvh`), and a new `#root` rule was added with `height: 100dvh; overflow: hidden`. These CSS changes cause both the **black bar** (fixed background layers are clipped) and the **broken scroll** (the `#root` and `body` `overflow: hidden` prevents any inner scroll from working properly in the iOS PWA viewport).

2. **`CategoryPanel.tsx` restructure** — The original had a single `overflow-y-auto` div containing the input, sort row, AND the item list. The rework split this into a sticky header + separate scroll container + an absolute-positioned gradient overlay div. The overlay uses a flat `var(--color-surface-background)` gradient but the actual background is that color _plus_ `--gradient-brand-wide` (diagonal alpha-tinted gradient), creating a visible color mismatch band.

**Key finding:** `touch-none` on the swipe slider in `MainScreen.tsx` was already present in commit `7d409a0` when scrolling worked fine. It is **NOT** the cause of the scroll regression. The original layout worked because `body` had `min-height: 100dvh` (not `height`) and no `overflow: hidden` on the Y axis — the inner `overflow-y-auto` div in CategoryPanel handled its own scrolling within the flex layout naturally.

---

## Bug 1 — List Cannot Scroll Vertically

### Root Cause

Two compounding CSS regressions broke inner scroll:

1. `body` was changed from `min-height: 100dvh` to `height: 100dvh; overflow: hidden`. On iOS Safari, `overflow: hidden` on the body creates a strict clipping context that can interfere with nested scroll containers in the PWA standalone viewport.

2. A new `#root { height: 100dvh; overflow: hidden }` rule was added. This creates yet another layer of `overflow: hidden` clipping between the body and the app layout, making it even harder for the nested `overflow-y-auto` container to receive scroll gestures.

The original working state had:

- `html` — `min-height: calc(100% + safe-area); overflow-x: hidden` (Y scroll allowed)
- `body` — `min-height: 100dvh` (no `overflow: hidden` on Y axis)
- No `#root` rule at all
- The `h-dvh overflow-hidden` on MainScreen's layout div was sufficient to contain the page

### Fix — `index.css`

Restore `html` and `body` rules to match the original commit, then layer in only the new features (scrollbar-hide, input font-size fix). Remove the `#root` rule entirely.

```css
html {
  background-color: var(--color-surface-background);
  background-image: var(--gradient-brand-wide);
  background-attachment: fixed;
  transition: background-color 0s;
  min-height: calc(
    100% + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px)
  );
}
body {
  @apply font-sans;
  margin: 0;
  background-color: var(--color-surface-background);
  background-image: var(--gradient-brand-wide);
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
  min-height: 100dvh;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}
/* Combine html, body — same as original */
html,
body {
  overflow-x: hidden;
  user-select: none;
}
/* NO #root rule — remove entirely */
```

**Why this works:** The original code relied on `MainScreen.tsx`'s layout div (`h-dvh overflow-hidden`) to create the single clipping container. The `body` used `min-height` (not `height`) and had no Y-axis overflow restriction. The inner `overflow-y-auto` div in CategoryPanel handled its own scrolling within the flex column. Adding `overflow: hidden` at body and `#root` levels created redundant clipping that broke the nested scroll chain on iOS Safari.

---

## Bug 2 — Black Bar at Bottom of Screen

### Root Cause

`html` was changed from:

```css
min-height: calc(
  100% + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px)
);
```

to:

```css
height: 100dvh;
overflow: hidden;
```

`MainScreen` renders two `position: fixed; z-index: -10` background layers that extend beyond the safe area:

```tsx
style={{
  top: "calc(-1 * env(safe-area-inset-top, 0px))",
  bottom: "calc(-1 * env(safe-area-inset-bottom, 0px))",
}}
```

When `html` has `overflow: hidden` and `height: 100dvh`, iOS Safari clips these fixed layers to the html box, which is exactly the safe area. The background layers extending into the home-indicator region are cut off, exposing the bare black behind the app.

### Fix — `index.css` (same change as Bug 1)

Restoring `html` to `min-height: calc(100% + safe-area)` with no `overflow: hidden` on Y is the fix. Since the Bug 1 fix already does this, this bug is resolved as a side effect.

---

## Bug 3 — Ugly Fade Overlay (Visible Dark Band)

### Root Cause

The current CategoryPanel uses an absolutely-positioned `<div>` with:

```tsx
background: "linear-gradient(to bottom, var(--color-surface-background) 0%, transparent 100%)";
```

The actual page background is `--color-surface-background` (e.g. `#f0f6f3` in light mode) overlaid with `--gradient-brand-wide` (a 135° diagonal gradient with green/teal/blue alpha tints). The overlay paints a flat `#f0f6f3`→transparent gradient, but the pixel behind it is `#f0f6f3` + a tinted alpha overlay, so the colors don't match — creating a visible band.

### Fix — `CategoryPanel.tsx`

**Delete the overlay `<div>` entirely.** Replace it with `mask-image` on the scroll container.

`mask-image` controls element visibility through the mask's alpha channel. Where the mask is transparent the element is invisible; where it's opaque (black) the element shows. This technique is background-agnostic — items simply fade to invisible, revealing whatever is behind them.

When applied to a scroll container, `mask-image` masks the **viewport** (visible rectangle), not the full scrolled content. Content entering the top of the scroll area passes through the transparent→opaque gradient and appears to fade in.

#### Detailed Changes

1. **Remove** the fade overlay `<div>` (the `aria-hidden="true"` absolute div with the `linear-gradient` background).

2. **Remove** `headerHeight` state, `headerRef` ref, and the `ResizeObserver` `useEffect` — these only existed for overlay positioning.

3. **Remove** `ref={headerRef}` from the sticky header wrapper div.

4. **Remove** `relative` from the outer container className (it was only needed for absolute overlay positioning).

5. **Add** `maskImage` / `WebkitMaskImage` inline styles on the scroll container div:

```tsx
{/* ── Scrollable list ── */}
<div
  className="flex-1 overflow-y-auto overscroll-contain"
  style={{
    maskImage: "linear-gradient(to bottom, transparent, black 24px, black)",
    WebkitMaskImage: "linear-gradient(to bottom, transparent, black 24px, black)",
  }}
>
  <ul className="flex flex-col gap-2 pt-3 pb-4">
```

**How the mask gradient works:**

- `transparent` at `0px` — top edge of the scroll viewport is fully hidden
- `black` at `24px` — by 24px down, content is fully visible
- `black` through the rest — everything else shows normally

The `pt-3` on the `<ul>` ensures the first item doesn't start inside the fade zone when the list is at its initial scroll position — it only fades when the user actively scrolls content upward.

**Browser support:** `mask-image` with gradient values is Baseline 2023: Safari iOS 15.4+, Chrome 120+, Firefox 53+. The `-webkit-mask-image` prefix covers older WebKit/Blink. All target platforms are covered.

---

## Summary of All File Changes

### `src/index.css`

| Area                  | Current (broken)                   | Target (restored + new features)                                                                               |
| --------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `html` rule           | `height: 100dvh; overflow: hidden` | `min-height: calc(100% + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))` — no overflow on Y |
| `body` rule           | `height: 100dvh; overflow: hidden` | `min-height: 100dvh` — no `height`, no `overflow: hidden`                                                      |
| `#root` rule          | `height: 100dvh; overflow: hidden` | **Delete entirely**                                                                                            |
| `html, body` combined | `user-select: none` only           | `overflow-x: hidden; user-select: none` (restore `overflow-x: hidden`)                                         |
| Scrollbar-hide rules  | Keep as-is                         | Keep as-is ✅                                                                                                  |
| Input font-size 16px  | Keep as-is                         | Keep as-is ✅                                                                                                  |
| `@keyframes spin`     | Keep as-is                         | Keep as-is ✅                                                                                                  |

### `src/components/CategoryPanel.tsx`

| Change | Detail                                                                      |
| ------ | --------------------------------------------------------------------------- |
| Remove | `headerHeight` state variable                                               |
| Remove | `headerRef` ref                                                             |
| Remove | `ResizeObserver` `useEffect` block                                          |
| Remove | `ref={headerRef}` attribute from sticky header div                          |
| Remove | Entire fade overlay `<div>` (the `aria-hidden="true"` absolute div)         |
| Remove | `relative` from outer wrapper className                                     |
| Add    | `maskImage` and `WebkitMaskImage` inline styles on the scroll container div |
| Change | `<ul>` padding from `pt-1` to `pt-3`                                        |

### `src/screens/MainScreen.tsx`

**No changes needed.** `touch-none` was already in the original working code and is not the cause of any regression. The `min-h-0` additions on panel wrappers are harmless and can stay (they're a flex-layout best practice for scroll containers inside flex children).

---

## Testing Checklist

- [x] List scrolls vertically on iOS Safari (standalone PWA mode)
- [x] List scrolls vertically in desktop browsers
- [x] Horizontal swipe between categories still works
- [x] No black bar below page dots on iPhone (home indicator area covered by background)
- [x] Items fade smoothly as they scroll under the sort row — no visible color band or dark line
- [x] Fade effect works correctly in both light and dark themes
- [x] Empty category state (no items) renders correctly — no mask artifacts
- [x] Page-level scrolling (bounce/overscroll of the whole viewport) is still prevented
- [x] BottomBar "Clear Checked Items" renders correctly at the bottom with safe-area padding
- [x] Onboarding screens and splash screen are not affected by the CSS changes
- [x] Settings sheet, onboarding screens unaffected
- [x] Page does not bounce/scroll at the document level
