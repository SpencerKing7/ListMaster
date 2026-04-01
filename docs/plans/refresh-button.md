# Plan: Refresh / Update Button on Main Screen

**Date:** 2026-04-01  
**Goal:** Add a refresh button to the `HeaderBar` that lets the user reload the page to pick up newly deployed updates. The button should be **smart** — it sits quietly in the header at all times but visually badges/pulses when the PWA service worker has detected a pending update, giving the user a clear signal that new content is available.

---

## Background & Feasibility

This is fully feasible with zero new dependencies. The project already uses `vite-plugin-pwa` with `registerType: "autoUpdate"`. The plugin ships a **virtual module** (`virtual:pwa-register/react`) that exports a `useRegisterSW` hook. This hook provides:

- `needRefresh` — a boolean ref/state that becomes `true` when the service worker has detected a new version is waiting to activate.
- `updateServiceWorker(reloadPage?: boolean)` — a function that tells the waiting SW to `skipWaiting` and then reloads the page.

When there is **no** pending update, clicking the button falls back to a plain `window.location.reload()`, which is perfectly useful for the "quick reload of the bookmark" use case the user described.

---

## Architecture Decisions

| Decision                                   | Choice                                                          | Reason                                                                                             |
| ------------------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Where to show the button                   | `HeaderBar`, left of the settings gear                          | Already has a flex row for icons; consistent with the iOS pattern of action buttons in the nav bar |
| What triggers a "badge"                    | `needRefresh[0] === true` from `useRegisterSW`                  | Reflects SW update detection without polling                                                       |
| What the button does when no update        | `window.location.reload()`                                      | Satisfies the "quick refresh the bookmark" use case                                                |
| What the button does when update available | `updateServiceWorker(true)`                                     | Activates the waiting SW and reloads in one step                                                   |
| Where the hook lives                       | A new `useAppUpdate` custom hook in `src/store/useAppUpdate.ts` | Keeps the virtual-module import isolated; `HeaderBar` stays presentational                         |
| Visual indicator                           | A small animated green dot badge on the button icon             | Non-intrusive; familiar iOS "badge" pattern                                                        |

---

## Step-by-Step Implementation Plan

### Step 1 — Create `src/store/useAppUpdate.ts`

Create a new custom hook that wraps the `vite-plugin-pwa` virtual module.

**File:** `src/store/useAppUpdate.ts`

- Import `useRegisterSW` from `"virtual:pwa-register/react"`.
- The hook returns a plain object:
  ```ts
  interface AppUpdateState {
    isUpdateAvailable: boolean;
    applyUpdate: () => void;
  }
  ```
- `isUpdateAvailable` is derived from `needRefresh[0]`.
- `applyUpdate` calls `updateServiceWorker(true)` when an update is available, or falls back to `window.location.reload()` otherwise.
- Add the TypeScript module declaration for the virtual module at the top of the file (or in `src/vite-env.d.ts`) so TypeScript doesn't complain:
  ```ts
  declare module "virtual:pwa-register/react" {
    export function useRegisterSW(options?: {
      onRegistered?: (
        registration: ServiceWorkerRegistration | undefined,
      ) => void;
      onRegisterError?: (error: unknown) => void;
    }): {
      needRefresh: [boolean, (v: boolean) => void];
      offlineReady: [boolean, (v: boolean) => void];
      updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
    };
  }
  ```
  Add this declaration to `src/vite-env.d.ts` (it already exists for Vite types — just append to it).

---

### Step 2 — Update `src/vite-env.d.ts`

Append the `virtual:pwa-register/react` module declaration so the TypeScript compiler resolves the import without errors.

**File:** `src/vite-env.d.ts`  
**Change:** Add the `declare module "virtual:pwa-register/react" { … }` block described in Step 1.

---

### Step 3 — Update `HeaderBarProps` interface and `HeaderBar` component

**File:** `src/components/HeaderBar.tsx`

1. Add two new optional props to `HeaderBarProps`:
   ```ts
   isUpdateAvailable?: boolean;
   onRefresh?: () => void;
   ```
2. Inside the flex row (the `div` that contains the welcome text and settings gear), add a new `<button>` element **to the left of** the existing settings gear `<Button>`. The button:
   - Uses a circular arrow / refresh SVG icon (24 × 24, same style as the gear).
   - Is always rendered (not conditionally mounted) so its presence doesn't cause layout shift.
   - Has `touch-action: manipulation` and `active:scale-[0.96]` press feedback.
   - Icon color: `var(--color-brand-teal)` (matches the gear).
   - `onClick` calls `onRefresh?.()`.
3. When `isUpdateAvailable === true`, render a small badge overlay on the button:
   - An absolute-positioned `<span>` — 8 × 8 px filled circle in `var(--color-brand-green)`.
   - Positioned at the top-right corner of the icon button (`top-0 right-0`).
   - Has a subtle `animate-pulse` Tailwind animation to draw attention.
   - Badge is only rendered when `isUpdateAvailable` is truthy (`{isUpdateAvailable && <span … />}`).

---

### Step 4 — Wire the hook into `MainScreen`

**File:** `src/screens/MainScreen.tsx`

1. Import `useAppUpdate` from `@/store/useAppUpdate`.
2. Call the hook at the top of the component:
   ```ts
   const { isUpdateAvailable, applyUpdate } = useAppUpdate();
   ```
3. Pass the two values down as props to `<HeaderBar>`:
   ```tsx
   <HeaderBar
     onOpenSettings={() => setIsSettingsOpen(true)}
     scrolled={scrolled}
     isUpdateAvailable={isUpdateAvailable}
     onRefresh={applyUpdate}
   />
   ```

---

## Files Modified

| File                           | Action                            | Reason                                   |
| ------------------------------ | --------------------------------- | ---------------------------------------- |
| `src/vite-env.d.ts`            | Edit — append type declaration    | TypeScript needs the virtual module type |
| `src/store/useAppUpdate.ts`    | **Create**                        | Isolates the PWA update hook logic       |
| `src/components/HeaderBar.tsx` | Edit — add refresh button + badge | UI entry point for the feature           |
| `src/screens/MainScreen.tsx`   | Edit — call hook, pass props      | Wires the update state into the header   |

No other files need to change.

---

## Visual Behaviour Summary

| State                        | Button appearance                                             |
| ---------------------------- | ------------------------------------------------------------- |
| No update available (normal) | Plain circular-arrow icon, same opacity as gear               |
| Update available             | Same icon + small pulsing green dot badge in top-right corner |
| Button tapped (either state) | `active:scale-[0.96]` press animation → page reloads          |

---

## Notes & Edge Cases

- **No update on first load**: `needRefresh` starts as `false`, so the badge never shows until a new SW is actually detected. Users who just installed the PWA won't see a spurious badge.
- **`autoUpdate` mode**: Because `registerType: "autoUpdate"` is already set, the SW will claim the new cache automatically in the background. The button simply triggers the page reload to switch the user onto the new cached assets.
- **Fallback reload**: When `isUpdateAvailable` is `false` (no SW update pending), `applyUpdate` calls `window.location.reload()` — this is the "quick refresh the bookmark" experience the user requested.
- **iOS PWA**: `window.location.reload()` works correctly inside iOS Safari's standalone (Add to Home Screen) mode. No special handling needed.
- **TypeScript strictness**: The virtual module declaration must be added before the build step, otherwise `tsc` will error on the unknown module.
