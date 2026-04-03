# Screens Catalog — April 2026

> **Purpose:** A reference snapshot of every screen component in `src/screens/`. For each screen, this document records its route path, entry condition, local state, key behaviors, side effects, and navigation targets. Use this when diagnosing regressions, tracing user flows, or planning changes.

---

## Table of Contents

- [SplashScreen](#splashscreen)
- [OnboardingInstallScreen](#onboardinginstallscreen)
- [OnboardingWelcomeScreen](#onboardingwelcomescreen)
- [OnboardingSetupScreen](#onboardingsetupscreen)
- [OnboardingSyncScreen](#onboardingsyncscreen)
- [MainScreen](#mainscreen)
- [SettingsSheet](#settingssheet)

---

## Route Map

The full routing table as defined in `App.tsx`:

| Route path | Component                 | Entry condition                                                 |
| ---------- | ------------------------- | --------------------------------------------------------------- |
| `/welcome` | `OnboardingWelcomeScreen` | Default redirect for all new users                              |
| `/setup`   | `OnboardingSetupScreen`   | Navigated to by `OnboardingWelcomeScreen` CTA                   |
| `/sync`    | `OnboardingSyncScreen`    | Navigated to by `OnboardingSetupScreen` for all users           |
| `/install` | `OnboardingInstallScreen` | Navigated to by `OnboardingSyncScreen` for non-standalone users |
| `/`        | `MainScreen`              | `hasCompletedOnboarding === true`                               |

All routes are wrapped by `PageTransitionWrapper` in `App.tsx`, which provides push/pop slide animations. `HashRouter` is used throughout — required for GitHub Pages static hosting.

The splash screen (`SplashScreen`) is not a route. It is rendered conditionally in `App.tsx` based on `isSplashVisible` local state, overlaid on top of the router outlet.

---

## `SplashScreen`

**File:** `src/screens/SplashScreen.tsx`  
**Route:** None (not a route — rendered by `App.tsx` as an overlay)

### Entry condition

`isSplashVisible` is initialized in `App.tsx` as:

```ts
const [isSplashVisible, setIsSplashVisible] = useState(
  () => settings.hasCompletedOnboarding,
);
```

It is `true` (splash shown) for all users on app launch. The splash always displays before routing begins.

### Props

| Prop              | Type         | Required | Description                                                                              |
| ----------------- | ------------ | -------- | ---------------------------------------------------------------------------------------- |
| `onFinished`      | `() => void` | Yes      | Called when the exit animation completes; `App.tsx` sets `isSplashVisible = false`       |
| `isReturningUser` | `boolean`    | Yes      | Whether this is a returning user; affects splash duration (1000ms new, 1400ms returning) |

### Local state

| Variable    | Type      | Description                                   |
| ----------- | --------- | --------------------------------------------- |
| `isEntered` | `boolean` | `true` after 40ms — triggers enter animations |
| `isFading`  | `boolean` | `true` after 1400ms — triggers fade-out       |

### Animation sequence

1. Mount: screen is fully opaque, app icon and wordmark are at `opacity: 0, scale: 0.85, translateY: 12px`.
2. After **40 ms**: `isEntered = true` → icon and wordmark spring into view (`opacity: 1, scale: 1, translateY: 0`, `cubic-bezier(0.34,1.56,0.64,1)`).
3. After **1000-1400 ms** (based on `isReturningUser`): `isFading = true` → entire screen fades to `opacity: 0` over `420ms ease-out`.
4. After **duration + 420 ms** (in the same timer block): `onFinished()` is called, unmounting the splash.

### Visual design

- Full-screen gradient: `deep-green → green → teal` (matching the brand palette).
- App icon: `w-24 h-24`, rounded corners, shadow.
- Wordmark: `"ListMaster"` in bold white at `text-3xl`.
- `position: fixed, inset: 0, z-index: 50` — covers everything behind it.

---

## `OnboardingInstallScreen`

**File:** `src/screens/OnboardingInstallScreen.tsx`  
**Route:** `/install`

### Entry condition

Navigated to by `OnboardingSetupScreen` for users who are not running in standalone (installed PWA) mode. This screen provides a celebratory completion experience for browser-based users.

### Props

None. Uses `useSettingsStore()` internally.

### Local state

| Variable       | Type      | Description                                                   |
| -------------- | --------- | ------------------------------------------------------------- |
| `isStandalone` | `boolean` | Whether the app is running in standalone (installed PWA) mode |

### Standalone detection

```ts
const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as any).standalone === true;
```

`navigator.standalone` is an Apple proprietary property available only on iOS Safari. The `matchMedia` check covers all other platforms.

### Behavior

**If standalone (installed):**

- Automatically calls `settings.completeOnboarding()` to complete the onboarding process.
- No UI is rendered (returns `null`).

**If not standalone (browser tab):**

- Renders a celebratory "You're All Set!" screen with a checkmark icon and welcoming message.
- Provides a "Get Started" button that calls `settings.completeOnboarding()` when clicked.

### Navigation

- → Main app (when onboarding completes via `settings.completeOnboarding()`)

---

## `OnboardingWelcomeScreen`

**File:** `src/screens/OnboardingWelcomeScreen.tsx`  
**Route:** `/welcome`

### Entry condition

This is the default redirect for users who have not yet completed onboarding (`hasCompletedOnboarding === false`). It is the starting screen for all new users after the splash screen.

### Props

None. Uses `useNavigate()` internally.

### Local state

| Variable    | Type      | Description                                   |
| ----------- | --------- | --------------------------------------------- |
| `isEntered` | `boolean` | `true` after 80ms — triggers entry animations |

### Behavior

Renders a full-screen welcome view with:

- App icon and "Welcome to ListMaster" heading.
- Brief marketing copy explaining the app.
- A "Get Started" CTA button.

All elements animate in via `opacity`/`translateY` when `isEntered` becomes `true`. The "Get Started" button navigates to `/setup`.

### Navigation

- → `/setup` (on "Get Started" tap)

---

## `OnboardingSetupScreen`

**File:** `src/screens/OnboardingSetupScreen.tsx`  
**Route:** `/setup`

### Entry condition

Navigated to from `/welcome`. The user has not yet entered their name or categories.

### Props

None. Uses `useCategoriesStore()`, `useSettingsStore()`, and `useNavigate()` internally.

### Local state

| Variable            | Type       | Description                                    |
| ------------------- | ---------- | ---------------------------------------------- |
| `name`              | `string`   | The user's typed name (controlled input)       |
| `pendingCategories` | `string[]` | Category names added so far                    |
| `categoryInput`     | `string`   | The controlled input for adding a new category |
| `isEntered`         | `boolean`  | `true` after 60ms — triggers entry animation   |

### Behavior

#### Name input

A single `<Input>` for the user's name. Drives `name` local state. Required before the form can be submitted.

#### Category management

- Users type a category name and tap the `+` button (or press Enter) to add it to `pendingCategories`.
- Duplicate names (case-insensitive) are rejected silently.
- Each pending category appears as a pill with a remove button.
- At least one category is required to proceed.

#### Form submission (`finishSetup`)

1. Calls `settings.setUserName(name.trim())`.
2. Calls `store.setCategories(pendingCategories)` — creates `Category` objects with UUIDs and empty item arrays.
3. After **350 ms** delay (`setTimeout`):
   - If standalone: calls `settings.completeOnboarding()` directly
   - If not standalone: navigates to `/install`

The 350 ms delay waits for the iOS software keyboard to dismiss before the route changes. Without it, navigation while the keyboard is still animating can cause layout jank.

### Navigation

- → `/sync` (for all users after `finishSetup()`)
- → Main app (for standalone users after `settings.completeOnboarding()`)

---

## `OnboardingSyncScreen`

**File:** `src/screens/OnboardingSyncScreen.tsx`  
**Route:** `/sync`

### Entry condition

Navigated to from `/setup` for all users. Offers cloud sync before the user finishes onboarding.

### Props

None. Uses `useSyncStore()`, `useSettingsStore()`, and `useNavigate()` internally.

### Local state

| Variable    | Type      | Initial | Description                                                              |
| ----------- | --------- | ------- | ------------------------------------------------------------------------ |
| `isLoading` | `boolean` | `false` | `true` while `enableSync()` is in flight — disables both buttons         |
| `isEntered` | `boolean` | `false` | `true` after 60ms — drives entry animations                              |
| `hasError`  | `boolean` | `false` | `true` when `enableSync()` fails — shows inline error, re-enables button |

### `isSyncEnabled` early-exit behaviour

If `sync.isSyncEnabled` is `true` on mount (user joined sync via a code on `/setup`), a mount-only `useEffect` calls `navigateForward()` immediately, and the component returns `null`. One blank frame is visible before the effect fires — this is acceptable and matches the existing pattern in `OnboardingInstallScreen`.

### `handleEnable` flow

1. Sets `hasError = false`, `isLoading = true`.
2. Calls `await sync.enableSync()`.
3. A watcher `useEffect` on `[sync.syncStatus, isLoading]` detects the settled state:
   - `"synced"` → sets `isLoading = false`, calls `navigateForward()`.
   - `"error"` → sets `isLoading = false`, sets `hasError = true`.
4. Reading `syncStatus` inline after `await` is unsafe (stale closure) — the watcher is the correct pattern.

### `navigateForward` targets

| Mode       | Action                          |
| ---------- | ------------------------------- |
| Standalone | `settings.completeOnboarding()` |
| Browser    | `navigate("/install")`          |

### Navigation targets

- → `/install` (on enable success or skip, browser mode)
- → Main app (on enable success or skip, standalone mode)
- → Stays on screen (on `enableSync()` error — shows inline error for retry)

---

## `MainScreen`

**File:** `src/screens/MainScreen.tsx`  
**Route:** `/`

### Entry condition

Rendered when `hasCompletedOnboarding === true`. This is the primary app screen.

### Props

None. Uses `useCategoriesStore()`, `useSettingsStore()`, and `useNavigate()` internally.

### Local state

| Variable         | Type      | Description                                                                        |
| ---------------- | --------- | ---------------------------------------------------------------------------------- |
| `isSettingsOpen` | `boolean` | Controls `SettingsSheet` open/close                                                |
| `scrolled`       | `boolean` | `true` when the category list is scrolled > 20px (drives `HeaderBar` title shrink) |

### Layout

A full-screen fixed layout using `h-dvh overflow-hidden`. See `docs/snapshots/main-screen-ui-snapshot.md` for the complete layout tree and scroll chain documentation.

Two `position: fixed` background divs render outside the layout shell:

- Solid color fill (`var(--color-surface-background)`) extended into safe areas.
- Brand gradient (`var(--gradient-brand-wide)`) with the same extension.

### Key behaviors

#### Mount scroll reset

On mount, `window.scrollTo(0, 0)`, `document.documentElement.scrollTop = 0`, and `document.body.scrollTop = 0` are called to clear any residual scroll position from onboarding screens.

#### `onScroll` / header shrink

`onScroll={handleScrollWithPosition}` is attached to the content container div. The handler reads `(e.target as HTMLElement).scrollTop` — `e.target` is the inner `overflow-y-auto` scroll container inside `CategoryPanel` (React's `onScroll` bubbles). When `scrollTop > 20`, `setScrolled(true)` drives the `HeaderBar` compact-title animation.

#### Foreground reload

`App.tsx` attaches a `visibilitychange` listener that calls `window.location.reload()` when the document becomes visible (app returns from background). This ensures fresh data after the PWA is backgrounded for an extended period.

#### Settings sheet

`isSettingsOpen` is toggled by the settings gear button in `HeaderBar`. `SettingsSheet` is a direct child of `MainScreen`.

### Child components

| Component       | Purpose                                                                    |
| --------------- | -------------------------------------------------------------------------- |
| `HeaderBar`     | Greeting title, refresh button, settings button, `CategoryPicker` pill row |
| `CategoryPanel` | Full content area for the selected category                                |
| `BottomBar`     | Navigation chevrons and "Clear Checked" action                             |
| `SettingsSheet` | Slide-up settings drawer                                                   |

---

## `SettingsSheet`

**File:** `src/screens/SettingsSheet.tsx`  
**Route:** None (rendered as a child of `MainScreen`, not a route)

> Note: `SettingsSheet` lives in `src/screens/` because it is a full-featured screen-level view — it contains its own dialogs, drag-reorder gesture, and significant business logic — even though it is not a route component.

### Props

| Prop           | Type                      | Required | Description                                |
| -------------- | ------------------------- | -------- | ------------------------------------------ |
| `isOpen`       | `boolean`                 | Yes      | Controls the shadcn `Sheet` open state     |
| `onOpenChange` | `(open: boolean) => void` | Yes      | Called when the sheet should open or close |

### Local state

| Variable             | Type               | Description                                                       |
| -------------------- | ------------------ | ----------------------------------------------------------------- |
| `swipeTranslateY`    | `number`           | Current drag offset for swipe-to-dismiss gesture                  |
| `isDismissDragging`  | `boolean`          | Whether a swipe-to-dismiss gesture is in progress                 |
| `dragIndex`          | `number \| null`   | Index of the category currently being dragged in the reorder list |
| `overIndex`          | `number \| null`   | Index of the drop target during category reorder drag             |
| `isRenameDialogOpen` | `boolean`          | Controls the Rename Category dialog                               |
| `renameTarget`       | `Category \| null` | The category being renamed                                        |
| `renameValue`        | `string`           | Controlled input value for the rename field                       |
| `isResetDialogOpen`  | `boolean`          | Controls the Reset to Factory Settings confirmation dialog        |

### Behaviors

#### Swipe-to-dismiss

`onPointerDown`/`onPointerMove`/`onPointerUp` on the sheet's drag handle bar track a vertical drag. If the drag exceeds 120px downward, `onOpenChange(false)` is called, dismissing the sheet. During the drag, `swipeTranslateY` is applied as a `translateY` inline style on the sheet panel. On release below threshold, `swipeTranslateY` resets to 0 with a spring transition.

The `isDismissDraggingRef` ensures that `pointermove` events during an established dismiss-drag continue to update `swipeTranslateY` even if the pointer leaves the drag handle.

#### Focus sentinel

`sheetFocusSentinelRef` — a visually hidden `<div tabIndex={0}>` at the top of the sheet panel. This element absorbs the automatic focus that shadcn's `Sheet` assigns on open, preventing the first interactive element (typically the name input) from receiving focus and triggering the iOS keyboard.

#### Drag-to-reorder categories

Category rows in the Settings panel support drag-to-reorder via Pointer Events. `itemRects` ref stores the bounding rects of all rows at drag start. As the pointer moves, `overIndex` updates based on which rect the pointer center overlaps. On `pointerup`, `store.moveCategory(dragIndex, overIndex)` dispatches a `MOVE_CATEGORIES` action if the indices differ.

`canDeleteCategories` (`store.categories.length > 1`) gates the delete button on each row — the last category cannot be deleted.

#### Settings cards

| Card           | Controls                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------- |
| **Your Name**  | Rename button → Rename Dialog (Input + confirm)                                          |
| **Your Lists** | Drag-to-reorder rows + delete buttons per category + "Add List" button                   |
| **Appearance** | `ToggleGroup` for `"light" \| "system" \| "dark"` — calls `settings.setAppearanceMode()` |
| **Text Size**  | `ToggleGroup` for `"xs" \| "s" \| "m" \| "l" \| "xl"` — calls `settings.setTextSize()`   |

A **Data Management** section at the bottom contains a destructive "Reset to Factory Settings" button, which opens the Reset Confirmation Dialog. On confirm, `settings.resetToNewUser()` is called (clears all `localStorage`, resets all store state, reapplies DOM defaults) and the app navigates to `/install`.

#### Dialogs

Two `<Dialog>` components are rendered inside `SettingsSheet`:

1. **Rename Category Dialog** — an input pre-filled with the current category name. Submitting calls `store.renameCategory(renameTarget.id, renameValue.trim())`.
2. **Reset Confirmation Dialog** — a warning message with a destructive confirm button. On confirm, calls `settings.resetToNewUser()` and navigates to `/install`.
