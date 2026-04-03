# Plan: Onboarding Sync Screen

## What This Plan Is

This plan adds a single new screen, `OnboardingSyncScreen`, to the onboarding flow. It sits between `/setup` and `/install`. The screen offers cloud sync to new users before they finish onboarding.

Read the full plan before writing any code. Every constraint and gotcha is documented inline with the relevant code snippet. Do not skip sections.

---

## Route Map — After This Change

| Route      | Component                 | Renders when                 |
| ---------- | ------------------------- | ---------------------------- |
| —          | `SplashScreen`            | Always, before router mounts |
| `/`        | `OnboardingWelcomeScreen` | `!hasCompletedOnboarding`    |
| `/setup`   | `OnboardingSetupScreen`   | `!hasCompletedOnboarding`    |
| `/sync`    | `OnboardingSyncScreen`    | `!hasCompletedOnboarding`    |
| `/install` | `OnboardingInstallScreen` | `!hasCompletedOnboarding`    |
| `/`        | `MainScreen`              | `hasCompletedOnboarding`     |

## User Flows — After This Change

```
New user, browser tab:   Splash → / → /setup → /sync → /install → MainScreen
New user, standalone:    Splash → / → /setup → /sync → MainScreen (skips /install)
Returning user:          Splash → MainScreen
```

The standalone shortcut in `/sync` works the same way as the one already in `/setup`: detect `window.matchMedia("(display-mode: standalone)").matches` and call `settings.completeOnboarding()` instead of navigating to `/install`.

---

## Files to Change

| #   | File                                      | Action | What changes                                               |
| --- | ----------------------------------------- | ------ | ---------------------------------------------------------- |
| 1   | `src/screens/OnboardingSyncScreen.tsx`    | Create | New screen — full implementation                           |
| 2   | `src/App.tsx`                             | Modify | Add import + `/sync` route between `/setup` and `/install` |
| 3   | `src/screens/OnboardingSetupScreen.tsx`   | Modify | Change `navigate("/install")` to `navigate("/sync")`       |
| 4   | `src/screens/OnboardingInstallScreen.tsx` | Modify | Update stale header comment only — no logic change         |
| 5   | `docs/snapshots/screens-catalog.md`       | Modify | Document the new screen and updated route map              |

---

## Step 1 — Create `src/screens/OnboardingSyncScreen.tsx`

### Imports required

```ts
import { useState, useEffect, useMemo, useCallback } from "react";
import type { JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSyncStore } from "@/store/useSyncStore";
import { useSettingsStore } from "@/store/useSettingsStore";
```

### Local state

| Variable    | Type      | Initial | Description                                                              |
| ----------- | --------- | ------- | ------------------------------------------------------------------------ |
| `isLoading` | `boolean` | `false` | `true` while `enableSync()` is in flight — disables both buttons         |
| `isEntered` | `boolean` | `false` | `true` after 60ms — drives entry animations                              |
| `hasError`  | `boolean` | `false` | `true` when `enableSync()` fails — shows inline error, re-enables button |

### Computed values (define after state, before callbacks)

```ts
const isStandalone = useMemo(
  () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true,
  [],
);
```

### Component body — mandatory ordering

The body of the component must follow this exact order. This order is a hard requirement, not a suggestion. `navigateForward` is a `useCallback` that must be defined before the `useEffect` that calls it. Do not use a `function` declaration and rely on hoisting — the codebase convention is `const` arrow functions, and hoisting here would be a latent defect.

```
1. Store hooks         (useSyncStore, useSettingsStore, useNavigate)
2. State declarations  (isLoading, isEntered, hasError)
3. Memos               (isStandalone)
4. navigateForward     (useCallback — defined here, not duplicated below)
5. Early-exit effect   (isSyncEnabled mount check)
6. Entry animation     (isEntered timer)
7. Sync status watcher (useEffect on [sync.syncStatus, isLoading])
8. handleEnable        (async function)
9. Early-exit guard    (if sync.isSyncEnabled return null)
10. JSX return
```

### 4 · `navigateForward` — define this first

```ts
const navigateForward = useCallback((): void => {
  if (isStandalone) {
    settings.completeOnboarding();
  } else {
    navigate("/install");
  }
}, [isStandalone, settings, navigate]);
```

Do not call `navigate("/")` here. When `settings.completeOnboarding()` flips `hasCompletedOnboarding` to `true`, `App.tsx` re-renders and swaps the route tree to `MainScreen` automatically. An explicit `navigate("/")` would race against that re-render.

### 5 · Early-exit effect — user already joined sync on `/setup`

If the user entered a sync code on `/setup`, `sync.isSyncEnabled` is already `true` when this screen mounts. Skip the offer and navigate forward immediately.

```ts
useEffect(() => {
  if (sync.isSyncEnabled) {
    navigateForward();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // runs once on mount only — navigateForward is stable
```

**Known behaviour:** The `return null` guard below (step 9) fires synchronously on first render, so one frame of blank screen appears before the effect fires and calls `navigateForward()`. This matches the existing pattern in `OnboardingInstallScreen` and is acceptable.

### 6 · Entry animation effect

```ts
useEffect(() => {
  const t = setTimeout(() => setIsEntered(true), 60);
  return () => clearTimeout(t);
}, []);
```

### 7 · Sync status watcher — CRITICAL, read before modifying

`enableSync()` in `useSyncStore` **does not re-throw on failure**. It catches errors internally and sets `syncStatus = "error"`. Reading `sync.syncStatus` inline after `await sync.enableSync()` returns a stale value — the React state update has not propagated to this component's render yet. The watcher `useEffect` is the correct pattern.

**The dependency array must be `[sync.syncStatus, isLoading]` — not `[sync.syncStatus]` alone.**

With only `[sync.syncStatus]`, the `isLoading` binding inside the closure is frozen at the initial `false` value. The guard `if (!isLoading) return` always exits early. The watcher is completely inert. The spinner runs forever and nothing navigates. This is the single breaking defect if the dep array is wrong.

**Why `isLoading` must also be in the dep array for retry to work:**
On a second consecutive failure, `syncStatus` stays `"error"`. Same value → effect does not re-trigger → `hasError` is never set again. Including `isLoading` in the dep array means the effect re-runs when `isLoading` flips back to `true` (new attempt), correctly resetting the cycle.

**Expected `"syncing"` intermediate transition:**
`enableSync()` sets `syncStatus = "syncing"` synchronously before its async work begins. The watcher fires with `"syncing"` — neither `"synced"` nor `"error"` — and falls through silently. This is correct and expected. Do not remove the `if (!isLoading) return` guard; it prevents spurious fires on initial mount when `isLoading` is `false`.

```ts
useEffect(() => {
  if (!isLoading) return; // guard: ignore mount fire and "syncing" intermediate
  if (sync.syncStatus === "synced") {
    setIsLoading(false);
    navigateForward();
  } else if (sync.syncStatus === "error") {
    setIsLoading(false);
    setHasError(true);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [sync.syncStatus, isLoading]); // BOTH deps required — see note above
```

### 8 · `handleEnable` — primary CTA handler

```ts
async function handleEnable(): Promise<void> {
  setHasError(false);
  setIsLoading(true);
  await sync.enableSync();
  // Do NOT call navigateForward() here.
  // syncStatus is stale at this point — the watcher useEffect handles navigation.
}
```

### 9 · Early-exit render guard

```ts
if (sync.isSyncEnabled) return null;
```

Place this immediately before the JSX return, after all hooks.

### 10 · JSX structure

```
<div className="relative min-h-dvh flex flex-col">

  {/* Background layer 1 — solid fill, extended into safe areas */}
  <div className="absolute -z-10" style={{
    top: "calc(-1 * env(safe-area-inset-top, 0px))", left: 0, right: 0,
    bottom: "calc(-1 * env(safe-area-inset-bottom, 0px))",
    backgroundColor: "var(--color-surface-background)",
  }} />

  {/* Background layer 2 — brand gradient overlay */}
  <div className="absolute -z-10" style={{
    top: "calc(-1 * env(safe-area-inset-top, 0px))", left: 0, right: 0,
    bottom: "calc(-1 * env(safe-area-inset-bottom, 0px))",
    background: "var(--gradient-brand-wide)",
  }} />

  <div className="flex-1" />

  {/* Header — animated with isEntered, 0ms delay */}
  <div className="flex flex-col items-center gap-4 px-8" style={{
    opacity: isEntered ? 1 : 0,
    transform: isEntered ? "translateY(0)" : "translateY(12px)",
    transition: "opacity 480ms cubic-bezier(0,0,0.2,1), transform 480ms cubic-bezier(0,0,0.2,1)",
  }}>
    {/* Cloud SVG icon, stroke="var(--color-brand-green)", 56×56 */}
    <h1 style={{ color: "var(--color-brand-green)" }}>Sync Across Devices</h1>
    <p className="text-text-secondary text-center text-sm">
      Back up your lists to the cloud and access them from any device.
    </p>
  </div>

  {/* Feature card — animated with isEntered, 60ms delay */}
  <div className="mx-8 mt-8 rounded-2xl px-5 py-4" style={{
    backgroundColor: "var(--color-surface-card)",
    boxShadow: "var(--elevation-card)",
    opacity: isEntered ? 1 : 0,
    transform: isEntered ? "translateY(0)" : "translateY(12px)",
    transition: "opacity 480ms 60ms cubic-bezier(0,0,0.2,1), transform 480ms 60ms cubic-bezier(0,0,0.2,1)",
  }}>
    {/* Three feature rows — each: flex items-center gap-3 */}
    {/* Row 1: cloud-upload icon + "Automatic cloud backup" */}
    {/* Row 2: smartphone icon   + "Access from any device" */}
    {/* Row 3: lock icon         + "Private to you — no account needed" */}
    {/* Icon stroke: var(--color-brand-teal), 22×22 */}
    {/* Title: font-semibold text-text-primary */}
    {/* Subtitle: text-sm text-text-secondary */}
  </div>

  <div className="flex-1" />

  {/* CTA stack — pinned to bottom with safe-area inset */}
  <div className="px-8 flex flex-col gap-3" style={{
    paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)",
  }}>

    {/* Primary button */}
    <Button
      className="w-full h-14 rounded-2xl text-base font-semibold text-white press-scale"
      style={{
        background: "linear-gradient(135deg, var(--color-brand-green) 0%, var(--color-brand-teal) 100%)",
        boxShadow: "0 6px 24px rgba(57,179,133,0.35)",
        opacity: isLoading ? 0.7 : 1,
      }}
      disabled={isLoading}
      onClick={handleEnable}
    >
      {/* When isLoading: show inline CSS spinner + label */}
      {/* When hasError and not loading: label = "Try Again" */}
      {/* Otherwise: label = "Enable Cloud Sync" */}
    </Button>

    {/* Inline error message — only renders when hasError is true */}
    {hasError && (
      <p className="text-xs text-center" style={{ color: "var(--color-danger)" }}>
        Couldn't connect. Check your connection and try again.
      </p>
    )}

    {/* Ghost skip button */}
    <Button
      variant="ghost"
      className="w-full h-12 rounded-2xl text-sm font-medium"
      style={{ color: "var(--color-text-secondary)" }}
      disabled={isLoading}
      onClick={navigateForward}
    >
      Skip for Now
    </Button>

  </div>
</div>
```

### Inline spinner implementation

Do not import a spinner library. Use this CSS border trick inside the primary button when `isLoading` is `true`:

```tsx
<div className="flex items-center justify-center gap-2">
  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
  <span>{hasError ? "Try Again" : "Enable Cloud Sync"}</span>
</div>
```

When `isLoading` is `false`, render the label string directly with no wrapper div.

### File size constraint

Target ≤ 150 lines. Hard ceiling is 200 lines. If the JSX for feature rows pushes past 150, extract a `SyncFeatureRow` component as a local `const` above the export — do not create a new file in `components/` for a single-use primitive.

---

## Step 2 — Modify `src/App.tsx`

### 2a. Add import alongside the other onboarding screen imports

```ts
import { OnboardingSyncScreen } from "./screens/OnboardingSyncScreen";
```

### 2b. Add route inside the `!hasCompletedOnboarding` branch

```tsx
// BEFORE
<Route path="/" element={<OnboardingWelcomeScreen />} />
<Route path="/setup" element={<OnboardingSetupScreen />} />
<Route path="/install" element={<OnboardingInstallScreen />} />
<Route path="*" element={<Navigate to="/" replace />} />

// AFTER
<Route path="/" element={<OnboardingWelcomeScreen />} />
<Route path="/setup" element={<OnboardingSetupScreen />} />
<Route path="/sync" element={<OnboardingSyncScreen />} />
<Route path="/install" element={<OnboardingInstallScreen />} />
<Route path="*" element={<Navigate to="/" replace />} />
```

---

## Step 3 — Modify `src/screens/OnboardingSetupScreen.tsx`

One change only. Inside the `350ms setTimeout` body in `finishSetup()`:

```ts
// BEFORE
navigate("/install");

// AFTER
navigate("/sync");
```

No other changes to this file.

---

## Step 4 — Modify `src/screens/OnboardingInstallScreen.tsx`

No logic changes. If the file header comment references the old route structure or describes this screen as the first onboarding screen, update the comment to say it is the final step reached from `/sync`.

---

## Step 5 — Modify `docs/snapshots/screens-catalog.md`

- Insert `/sync → OnboardingSyncScreen` into the route map table between `/setup` and `/install`.
- Add an `OnboardingSyncScreen` section documenting: entry condition, props (none), local state table, `isSyncEnabled` early-exit behaviour, `handleEnable` flow, `navigateForward` targets, navigation targets.
- In the `OnboardingSetupScreen` section, update the navigation note to say `/sync` (was `/install`).

---

## Transition Depth Verification

`PageTransitionWrapper` uses `getRouteDepth(pathname) = pathname.split("/").filter(Boolean).length`. Direction is forward when `currentDepth >= prevDepth`.

| Transition           | From depth | To depth | Result          |
| -------------------- | ---------- | -------- | --------------- |
| `/setup` → `/sync`   | 1          | 1        | Forward push ✅ |
| `/sync` → `/install` | 1          | 1        | Forward push ✅ |

No changes to `PageTransitionWrapper` required.

---

## Decisions Log

| #   | Question                                           | Answer                                                                                                                                                                                           |
| --- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Where in the flow?                                 | After `/setup`, before `/install`. User has data entered; sync offer is contextually meaningful at this point.                                                                                   |
| 2   | `enableSync()` or `adoptSyncCode()`?               | `enableSync()` — generates a new code and authenticates anonymously. The join-existing-device path (`adoptSyncCode`) stays on `/setup`.                                                          |
| 3   | Loading indicator style?                           | Inline CSS spinner inside the button. No library. Label stays visible alongside the spinner.                                                                                                     |
| 4   | Show sync code to user?                            | No. The code is surfaced in Settings post-onboarding. This screen only confirms the feature is on.                                                                                               |
| 5   | Block back navigation?                             | No. `PageTransitionWrapper` handles the pop animation automatically.                                                                                                                             |
| 6   | `enableSync()` failure handling?                   | `enableSync()` does not re-throw. Detect failure via `useEffect` on `[sync.syncStatus, isLoading]`. Show inline error. Keep user on screen to retry.                                             |
| 7   | User already synced via `/setup` join-code?        | `isSyncEnabled` is `true` on mount. Call `navigateForward()` in a mount-only `useEffect` and return `null`.                                                                                      |
| 8   | Is reading `syncStatus` inline after `await` safe? | No — stale closure. `syncStatus` is React state in `SyncProvider`; the updated value hasn't propagated yet. Use a `useEffect` watching `[sync.syncStatus, isLoading]` to read the settled value. |
