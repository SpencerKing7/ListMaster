# Install Toast for Existing Browser Users

## Objective

Show existing browser users a dismissible toast nudging them to install the PWA. Tapping the toast opens a bottom sheet with install instructions and sync code.

---

## Execution Order

Complete steps 1 → 2 → 3 → 4 → 5 sequentially. Each step produces one file. Do not skip steps.

---

## STEP 1 — Create `src/services/installPromptService.ts`

**Action:** CREATE new file.
**Line budget:** ≤60 lines. Service ceiling = 150.

### Exact API to implement

```ts
// src/services/installPromptService.ts

const DISMISSED_AT_KEY = "installToastDismissedAt";
const SHOW_COUNT_KEY = "installToastShowCount";
const PERMANENTLY_DISMISSED_KEY = "installToastPermanentlyDismissed";

/** Stateless I/O singleton for install-toast persistence. */
export const InstallPromptService = {
  // ── Dismissed At ──
  getDismissedAt(): string {
    return localStorage.getItem(DISMISSED_AT_KEY) ?? "";
  },
  setDismissedAt(timestamp: string): void {
    localStorage.setItem(DISMISSED_AT_KEY, timestamp);
  },

  // ── Show Count ──
  getShowCount(): number {
    return parseInt(localStorage.getItem(SHOW_COUNT_KEY) ?? "0", 10) || 0;
  },
  setShowCount(count: number): void {
    localStorage.setItem(SHOW_COUNT_KEY, String(count));
  },

  // ── Permanently Dismissed ──
  getPermanentlyDismissed(): boolean {
    return localStorage.getItem(PERMANENTLY_DISMISSED_KEY) === "true";
  },
  setPermanentlyDismissed(value: boolean): void {
    localStorage.setItem(PERMANENTLY_DISMISSED_KEY, String(value));
  },

  // ── Convenience ──
  /** Returns true if all persistence checks pass (not permanently dismissed,
   *  show count < 3, 7-day cooldown elapsed). Does NOT check standalone mode
   *  or keyboard state — those are component-level concerns. */
  shouldShow(): boolean {
    if (this.getPermanentlyDismissed()) return false;
    if (this.getShowCount() >= 3) return false;

    const raw = this.getDismissedAt();
    if (raw) {
      const ms = Date.now() - new Date(raw).getTime();
      if (Number.isNaN(ms)) return true; // corrupted date → treat as never dismissed
      if (ms < 7 * 24 * 60 * 60 * 1000) return false; // within cooldown
    }
    return true;
  },

  /** Records a dismissal: saves timestamp + increments show count. */
  recordDismissal(): void {
    this.setDismissedAt(new Date().toISOString());
    this.setShowCount(this.getShowCount() + 1);
  },

  /** Clears all three keys. Called from resetToNewUser(). */
  clearAll(): void {
    localStorage.removeItem(DISMISSED_AT_KEY);
    localStorage.removeItem(SHOW_COUNT_KEY);
    localStorage.removeItem(PERMANENTLY_DISMISSED_KEY);
  },
};
```

### Rules

- Use `localStorage` directly — this is a `services/` file.
- `Number.isNaN()` guard on date math — prevents corrupted ISO string from suppressing toast forever.
- JSDoc on every exported method.
- No React imports. No `any`.

---

## STEP 2 — Create `src/components/InstallToast.tsx`

**Action:** CREATE new file.
**Line budget:** ≤130 lines. Component ceiling = 180.

### Props

```ts
interface InstallToastProps {
  /** Called when user taps the toast body (not ×). Parent opens InstallSheet. */
  onOpenInstallSheet: () => void;
  /** When true, the toast must not show (a sheet is already open). */
  isSuppressed: boolean;
}
```

### Behavior specification

**Mount logic (single `useEffect`, runs once `[]`):**

1. Call `InstallPromptService.shouldShow()`. If false → bail (store `false` in `shouldShowRef`).
2. Check standalone: `window.matchMedia("(display-mode: standalone)").matches || (navigator as {standalone?: boolean}).standalone === true`. If true → bail.
3. Store `true` in `shouldShowRef`.
4. Start a 2-second `setTimeout` (store ID in `delayTimerRef`).
5. When timer fires: check `document.activeElement?.tagName`. If `"INPUT"` or `"TEXTAREA"` → attach a one-shot `focusout` listener on `document` (store in `focusListenerRef`) that calls `showToast()` when active element is no longer an input. Otherwise call `showToast()` immediately.
6. `showToast()`: if `isSuppressed` → do nothing (timer will re-check is handled by the `isSuppressed` prop guard in JSX, so just set `isVisible` true). Set `isVisible` state to `true`.

**isSuppressed prop:** When `isSuppressed` is `true` and `isVisible` is `true`, add `display: none` to the toast's wrapper style. This keeps the toast mounted (preserving timer state) but invisible while a sheet is open.

**Render (when `shouldShowRef.current === false`):** Return `null`.

**Render (when visible):**

```
fixed left-4 right-4 z-40
bottom: calc(env(safe-area-inset-bottom) + 92px)    ← inline style
```

Layout: `flex items-center gap-3 p-4 rounded-2xl`
Background: `var(--color-surface-card)` — inline style
Border: `1px solid var(--color-border-subtle)` — inline style
Shadow: `var(--elevation-card)` — inline style
Touch: `touch-action: manipulation` on wrapper and × button

**Children:**

- Left: 24×24 SVG download icon, `stroke="var(--color-brand-green)"`, `strokeWidth="1.75"`. Use exact SVG from `OnboardingInstallScreen` lines 73-83:
  ```html
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  <polyline points="7 10 12 15 17 10" />
  <line x1="12" y1="15" x2="12" y2="3" />
  ```
- Center: flex-col, `flex-1 min-w-0`
  - `<span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Install List Master</span>`
  - `<span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Add to home screen for offline access</span>`
- Right: × dismiss button, 32×32 tap target, 20×20 icon, `stroke="var(--color-text-secondary)"`, `active:scale-[0.9]`, `touch-action: manipulation`. `e.stopPropagation()` to prevent body tap handler.

**Tap handlers:**

- **Body tap:** Guard `if (isExitingRef.current) return`. Set `isExitingRef.current = true`. Set `pointer-events: none` on wrapper. Animate: scale 1→0.95 + opacity 1→0, `ease-out`, 150ms (via state toggling a CSS class). After `transitionend` on the wrapper, `setTimeout(() => onOpenInstallSheet(), 100)` to sequence after animation. Clear auto-dismiss timer.
- **× tap:** Guard `if (isExitingRef.current) return`. Set `isExitingRef.current = true`. Call `InstallPromptService.recordDismissal()`. Animate: `translateY(0) → translateY(120%)`, `ease-out`, 280ms (via state toggling a CSS class). After `transitionend`, set `isVisible` to `false`.
- **Auto-dismiss (20s):** Start `autoDismissTimerRef` when toast becomes visible. If timer fires: fade opacity 1→0, 400ms. After `transitionend`, set `isVisible` to `false`. Does NOT call `recordDismissal()` — shows again next session.

**Entrance animation:** `translateY(100%) → translateY(0)`, `transition: transform 380ms var(--spring-snap)`. Apply by toggling an `isEntered` state from `false` → `true` via `requestAnimationFrame` after mount.

**Cleanup (`useEffect` return):**

- `clearTimeout(delayTimerRef.current)`
- `clearTimeout(autoDismissTimerRef.current)`
- Remove `focusout` listener from `document` if attached

### Refs needed

| Ref                   | Type                                    | Purpose                             |
| --------------------- | --------------------------------------- | ----------------------------------- |
| `shouldShowRef`       | `boolean`                               | One-time mount check result         |
| `isExitingRef`        | `boolean`                               | Double-tap guard                    |
| `delayTimerRef`       | `ReturnType<typeof setTimeout> \| null` | 2s delay timer                      |
| `autoDismissTimerRef` | `ReturnType<typeof setTimeout> \| null` | 20s auto-dismiss                    |
| `focusListenerRef`    | `(() => void) \| null`                  | Stored focusout handler for cleanup |
| `toastRef`            | `HTMLDivElement \| null`                | For `transitionend` listener        |

### Imports

```ts
import { useState, useEffect, useRef, useCallback } from "react";
import type { JSX } from "react";
import { InstallPromptService } from "@/services/installPromptService";
```

---

## STEP 3 — Create `src/components/InstallSheet.tsx`

**Action:** CREATE new file.
**Line budget:** ≤160 lines. Component ceiling = 180.

### Props

```ts
interface InstallSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### Imports

```ts
import { useState, useRef } from "react";
import type { JSX } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { InstallInstructions } from "@/components/InstallInstructions";
import { useSyncStore } from "@/store/useSyncStore";
import { detectPlatform } from "@/lib/detectPlatform";
import type { PlatformDetection } from "@/lib/detectPlatform";
import { InstallPromptService } from "@/services/installPromptService";
```

### Structure (top to bottom inside SheetContent)

**1. Focus sentinel** (matches SettingsSheet pattern exactly):

```tsx
const sheetFocusSentinelRef = useRef<HTMLDivElement>(null);
// Inside SheetContent:
<div
  ref={sheetFocusSentinelRef}
  tabIndex={-1}
  className="sr-only"
  aria-hidden
/>;
```

Pass `initialFocus={sheetFocusSentinelRef}` to `<SheetContent>`.

**2. Header row** — mirror `SettingsSheet` header:

```tsx
<SheetHeader className="flex flex-row items-center justify-between px-5 pb-3 pt-4">
  <SheetTitle
    className="text-2xl font-bold"
    style={{ color: "var(--color-brand-green)" }}
  >
    Install List Master
  </SheetTitle>
  <Button
    variant="ghost"
    className="font-semibold text-sm rounded-full px-4 hover:!bg-[color:var(--color-surface-input)] focus-visible:!border-[color:var(--color-brand-green)] focus-visible:!ring-[color:var(--color-brand-green)]/30"
    style={{
      color: "var(--color-brand-green)",
      backgroundColor: "rgba(var(--color-brand-green-rgb), 0.12)",
      touchAction: "manipulation",
    }}
    onClick={() => onOpenChange(false)}
  >
    Done
  </Button>
</SheetHeader>
```

**3. Gradient fade** — same as SettingsSheet:

```tsx
<div
  aria-hidden
  className="pointer-events-none absolute left-0 right-0 z-10"
  style={{
    top: "60px",
    height: "28px",
    background:
      "linear-gradient(to bottom, var(--color-surface-background) 0%, transparent 100%)",
  }}
/>
```

**4. Scrollable content** — `<div className="flex-1 overflow-y-auto"><div className="flex flex-col gap-5 px-5 pb-10 pt-2">`

Inside:

**4a. Hero section:**

- Same download SVG icon (24×24), `stroke="var(--color-brand-green)"`
- Text: `"Works offline, feels like a native app, launches from your home screen."`
- Style: `text-sm`, `var(--color-text-secondary)`

**4b. Sync code card (conditional):**

- Read from `useSyncStore()`: `const { syncCode, isSyncEnabled } = useSyncStore();`
- **If `isSyncEnabled && syncCode`:** Render card with `var(--color-surface-input)` background, `rounded-xl`, `p-4`:
  - Label: `"Your Sync Code"` — `text-xs font-semibold`, `var(--color-text-secondary)`
  - Code display: `font-mono text-lg font-bold tracking-wider`, `var(--color-text-primary)`
  - Copy button: `text-xs font-semibold`, `var(--color-brand-green)`. Local state `isCopied`. Handler:
    ```ts
    async function handleCopy(): Promise<void> {
      try {
        await navigator.clipboard.writeText(syncCode);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch {
        // Clipboard API may fail on iOS — code is visible for manual copy
      }
    }
    ```
  - Subtitle: `"Save this code — you'll need it to sync on your new install."` — `text-xs`, `var(--color-text-secondary)`
- **If `!isSyncEnabled`:** Render fallback tip card, same card styling:
  - `"💡 Enable cloud sync in Settings to keep your lists backed up across devices."` — `text-xs`, `var(--color-text-secondary)`

**4c. Device mode toggle + install instructions:**

```ts
const [platform] = useState<PlatformDetection>(detectPlatform);
const [deviceMode, setDeviceMode] = useState(platform.deviceMode);
```

- Render a mobile/desktop toggle (two buttons, same style as `InstallInstructions` `PlatformToggle`):
  - Mobile selected → `<InstallInstructions deviceMode="mobile" initialMobileBrowser={platform.mobileBrowser} isIos={platform.isIos} />`
  - Desktop selected → `<InstallInstructions deviceMode="desktop" initialDesktopBrowser={platform.desktopBrowser} />`

**4d. Tip text:**

- `"After installing, close this tab and open List Master from your home screen."` — `text-xs`, `var(--color-text-secondary)`, `text-center`

**4e. "Don't remind me" link:**

- `<button>` styled as `text-xs underline`, `var(--color-text-secondary)`, `touch-action: manipulation`, centered.
- Handler: `InstallPromptService.setPermanentlyDismissed(true)` then `onOpenChange(false)`.

### SheetContent props

```tsx
<SheetContent
  side="bottom"
  showCloseButton={false}
  className="rounded-t-3xl max-h-[90dvh]"
  initialFocus={sheetFocusSentinelRef}
  style={{
    backgroundColor: "var(--color-surface-background)",
    boxShadow: "var(--elevation-sheet)",
  }}
>
```

### onOpenChange handler

**Critical:** All dismissal persistence lives here, NOT on the Done button:

```ts
function handleOpenChange(open: boolean): void {
  if (!open) {
    InstallPromptService.recordDismissal();
  }
  onOpenChange(open);
}
```

Pass `handleOpenChange` to `<Sheet open={isOpen} onOpenChange={handleOpenChange}>`.

---

## STEP 4 — Modify `src/screens/MainScreen.tsx`

**Action:** EDIT existing file.
**Current line count:** 87. After edit: ~97. Ceiling = 200. ✅

### Changes

**4a. Add imports** (after existing imports, before component):

```ts
import { InstallToast } from "@/components/InstallToast";
import { InstallSheet } from "@/components/InstallSheet";
```

**4b. Add state** (after `const [scrolled, setScrolled] = useState(false);`):

```ts
const [isInstallSheetOpen, setIsInstallSheetOpen] = useState(false);
```

**4c. Add components** (after `</SettingsSheet>`, before the closing `</div>` and `</>`):

```tsx
<InstallToast
  onOpenInstallSheet={() => setIsInstallSheetOpen(true)}
  isSuppressed={isSettingsOpen || isInstallSheetOpen}
/>
<InstallSheet
  isOpen={isInstallSheetOpen}
  onOpenChange={setIsInstallSheetOpen}
/>
```

The `isSuppressed` prop prevents the toast from being visible while any sheet is open.

---

## STEP 4b — Modify `src/store/useSettingsStore.ts`

**Action:** EDIT existing file.
**Current line count:** 134. After edit: ~136. Ceiling = 150. ✅

### Changes

**Add import** (after the existing `SettingsService` import):

```ts
import { InstallPromptService } from "@/services/installPromptService";
```

**Add call inside `resetToNewUser()`** (after `SettingsService.clearAll();`):

```ts
InstallPromptService.clearAll();
```

---

## STEP 5 — Validate

Run `npm run build` (executes `tsc --noEmit && vite build`). Fix ALL errors before considering the task complete.

---

## File Summary

| #   | File                                   | Action | Est. Lines |
| --- | -------------------------------------- | ------ | ---------- |
| 1   | `src/services/installPromptService.ts` | CREATE | ~60        |
| 2   | `src/components/InstallToast.tsx`      | CREATE | ~130       |
| 3   | `src/components/InstallSheet.tsx`      | CREATE | ~160       |
| 4   | `src/screens/MainScreen.tsx`           | EDIT   | +10        |
| 5   | `src/store/useSettingsStore.ts`        | EDIT   | +2         |

---

## Critical Bug Prevention Checklist

The agent MUST verify each of these after implementation:

- [ ] All `setTimeout` IDs stored in refs and cleared in `useEffect` cleanup
- [ ] `isExitingRef` guard on both tap handlers in `InstallToast`
- [ ] `pointer-events: none` set on toast wrapper during exit animation
- [ ] Toast uses `z-40` (below Sheet's `z-50`)
- [ ] `focusout` listener attached to `document`, not specific element, and removed on cleanup
- [ ] `navigator.clipboard.writeText` wrapped in try/catch in `InstallSheet`
- [ ] `InstallPromptService.recordDismissal()` called in `onOpenChange`, not individual buttons
- [ ] `InstallPromptService.clearAll()` called in `resetToNewUser()`
- [ ] `detectPlatform()` called in `useState` initializer, not component body
- [ ] Focus sentinel ref passed to `SheetContent initialFocus`
- [ ] `Number.isNaN()` guard in `shouldShow()` date math
- [ ] No `any` types anywhere
- [ ] No direct `localStorage` calls in components (only in `installPromptService.ts`)
- [ ] All colors use `var(--color-*)` tokens — no hex values
- [ ] `touch-action: manipulation` on all interactive elements
- [ ] `@/` alias imports only — no `../` relative imports
- [ ] JSDoc on all exported functions, components, and types
- [ ] `npm run build` passes with zero errors
