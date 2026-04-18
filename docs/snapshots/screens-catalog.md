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

### When `hasCompletedOnboarding === false`

| Route path | Component                 | Entry condition                                                |
| ---------- | ------------------------- | -------------------------------------------------------------- |
| `/`        | `OnboardingInstallScreen` | Default landing for all new users                              |
| `/welcome` | `OnboardingWelcomeScreen` | Navigated to by `OnboardingInstallScreen` (standalone or skip) |
| `/setup`   | `OnboardingSetupScreen`   | Navigated to by `OnboardingWelcomeScreen` CTA                  |
| `/sync`    | `OnboardingSyncScreen`    | Navigated to by `OnboardingSetupScreen` for all users          |
| `*`        | → `/`                     | Catch-all redirect via `<Navigate to="/" replace />`           |

### When `hasCompletedOnboarding === true`

| Route path | Component    | Entry condition                                      |
| ---------- | ------------ | ---------------------------------------------------- |
| `/`        | `MainScreen` | Primary app screen                                   |
| `*`        | → `/`        | Catch-all redirect via `<Navigate to="/" replace />` |

All routes are wrapped by `PageTransitionWrapper` in `App.tsx`, which provides push/pop slide animations. `HashRouter` is used throughout — required for GitHub Pages static hosting.

The splash screen (`SplashScreen`) is not a route. It is rendered conditionally in `App.tsx` based on `isSplashVisible` local state, before the router mounts.

---

## `SplashScreen`

**File:** `src/screens/SplashScreen.tsx`
**Route:** None (not a route — rendered by `App.tsx` as an overlay)

### Entry condition

`isSplashVisible` is initialized to `true` unconditionally in `App.tsx`. The splash always displays before routing begins on every app launch.

### Props

| Prop              | Type         | Required | Description                                                                                       |
| ----------------- | ------------ | -------- | ------------------------------------------------------------------------------------------------- |
| `onFinished`      | `() => void` | Yes      | Called when the exit animation completes; `App.tsx` sets `isSplashVisible = false`                |
| `isReturningUser` | `boolean`    | Yes      | Whether the user has completed onboarding; affects splash duration (1000ms new, 1400ms returning) |

### Local state

| Variable    | Type      | Description                                   |
| ----------- | --------- | --------------------------------------------- |
| `isEntered` | `boolean` | `true` after 40ms — triggers enter animations |
| `isFading`  | `boolean` | `true` after duration — triggers fade-out     |

### Animation sequence

1. **Mount:** Screen is fully opaque. App icon and wordmark are at `opacity: 0`, scaled down.
2. **After 40 ms:** `isEntered = true` — icon springs into view (`scale(0.78) → scale(1)`, `600ms cubic-bezier(0.34,1.56,0.64,1)`). Wordmark fades in with 80ms stagger.
3. **After 1000 ms** (new user) / **1400 ms** (returning): `isFading = true` — entire screen fades to `opacity: 0` over `420ms ease-out`.
4. **After fade completes** (duration + 420 ms): `onFinished()` is called, unmounting the splash.

### Visual design

- Full-screen gradient: `linear-gradient(160deg, deep-green 0%, green 55%, teal 100%)`.
- Extends into safe areas via negative `calc()` insets on all four sides.
- App icon: `w-20 h-20 rounded-[22px]`, semi-transparent white background, checklist SVG.
- Wordmark: `"List Master"` in bold white at `text-3xl` + "YOUR CHECKLIST COMPANION" subtitle.
- `position: fixed, z-50` — covers everything.

---

## `OnboardingInstallScreen`

**File:** `src/screens/OnboardingInstallScreen.tsx`
**Route:** `/` (when `hasCompletedOnboarding === false`)

### Entry condition

Default landing for users who have not completed onboarding. Provides platform-specific add-to-home-screen instructions.

### Props

None. Uses `useNavigate()` and `detectPlatform()` internally.

### Local state

| Variable       | Type                | Description                                                                   |
| -------------- | ------------------- | ----------------------------------------------------------------------------- |
| `isEntered`    | `boolean`           | `true` after 60ms — triggers enter animations                                 |
| `isStandalone` | `boolean`           | Whether the app is running in standalone (installed PWA) mode                 |
| `platform`     | `PlatformDetection` | Device/browser detection result from `detectPlatform()`                       |
| `deviceMode`   | `string`            | Derived from `platform.deviceMode` — controls which install instructions show |

### Standalone detection

```ts
const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as { standalone?: boolean }).standalone === true;
```

`navigator.standalone` is an Apple proprietary property available only on iOS Safari. The `matchMedia` check covers all other platforms.

### Behavior

**If standalone (installed):** A `useEffect` detects standalone mode and calls `navigate("/welcome")` immediately. The component returns `null` — no UI is shown.

**If not standalone (browser tab):** Renders platform-specific add-to-home-screen instructions via `InstallInstructions`. A "Skip" button in the top-right corner navigates directly to `/welcome`.

### Navigation

- → `/welcome` (if standalone on mount, or on "Skip" tap)

---

## `OnboardingWelcomeScreen`

**File:** `src/screens/OnboardingWelcomeScreen.tsx`
**Route:** `/welcome`

### Entry condition

Navigated to from `OnboardingInstallScreen` (standalone redirect or "Skip" tap). This is the first screen with real content that new users see.

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
3. After **350 ms** delay (`setTimeout`): navigates to `/sync` for all users.

The 350 ms delay waits for the iOS software keyboard to dismiss before the route changes. Without it, navigation while the keyboard is still animating can cause layout jank.

### Navigation

- → `/sync` (for all users after `finishSetup()`)

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

| Mode       | Action                                |
| ---------- | ------------------------------------- |
| Standalone | `settings.completeOnboarding()`       |
| Browser    | `navigate("/")` (install screen)      |

### Navigation targets

- → `/` (on enable success or skip, browser mode)
- → Main app (on enable success or skip, standalone mode)
- → Stays on screen (on `enableSync()` error — shows inline error for retry)

---

## `MainScreen`

**File:** `src/screens/MainScreen.tsx`
**Route:** `/` (when `hasCompletedOnboarding === true`)

### Entry condition

Rendered when `hasCompletedOnboarding === true`. This is the primary app screen.

### Props

None. Uses `useCategoriesStore()` internally.

### Local state

| Variable             | Type      | Description                                                                        |
| -------------------- | --------- | ---------------------------------------------------------------------------------- |
| `isSettingsOpen`     | `boolean` | Controls `SettingsSheet` open/close                                                |
| `scrolled`           | `boolean` | `true` when the category list is scrolled > 20px (drives `HeaderBar` title shrink) |
| `isInstallSheetOpen` | `boolean` | Controls `InstallSheet` open/close                                                 |

### Layout

A full-screen fixed layout using `h-dvh overflow-hidden`. See `docs/snapshots/main-screen-ui-snapshot.md` for the complete layout tree and scroll chain documentation.

Two `position: fixed` background divs render outside the layout shell:

- Solid color fill (`var(--color-surface-background)`) extended into safe areas via negative `calc()` insets on all four sides.
- Brand gradient (`var(--gradient-brand-wide)`) with the same extension.

### Key behaviors

#### Mount scroll reset

On mount, `window.scrollTo(0, 0)`, `document.documentElement.scrollTop = 0`, and `document.body.scrollTop = 0` are called to clear any residual scroll position from onboarding screens.

#### Keyboard dismiss on scroll

`handleScroll` calls `(document.activeElement as HTMLElement | null)?.blur()` — dismissing the iOS keyboard whenever the user scrolls the content area.

#### `onScroll` / header shrink

`handleScrollWithPosition` is attached to the content container div. It calls `handleScroll` (keyboard dismiss), then reads `(e.target as HTMLElement).scrollTop`. When `scrollTop > 20`, `setScrolled(true)` drives the `HeaderBar` compact-title animation.

#### Refresh button

`onRefresh` is `() => window.location.reload()` — a hard page reload used as a simple data-refresh mechanism.

#### Settings sheet

`isSettingsOpen` is toggled by the settings gear button in `HeaderBar`. `SettingsSheet` is a direct child of `MainScreen`, rendered as a sibling to the layout `<div>`.

#### Install toast / Install sheet

`InstallToast` is a non-intrusive banner that nudges browser-mode users to install. It is suppressed when `isSettingsOpen` or `isInstallSheetOpen` is `true`. Tapping the toast's CTA opens `InstallSheet` (a bottom sheet with full install instructions) by setting `isInstallSheetOpen = true`.

### Child components

| Component       | Purpose                                                                             |
| --------------- | ----------------------------------------------------------------------------------- |
| `HeaderBar`     | Greeting title, refresh button, settings button, `GroupTabBar`, `CategoryPicker`   |
| `CategoryPanel` | Full content area for the selected category (adds `AddItemInput`, items, meta bar) |
| `BottomBar`     | Navigation chevrons and "Clear Checked" action                                      |
| `SettingsSheet` | Slide-up settings drawer (composed from `features/settings/` section components)   |
| `InstallToast`  | Non-intrusive install nudge banner                                                  |
| `InstallSheet`  | Full-screen bottom sheet with platform-specific install instructions                |

---

## `SettingsSheet`

**File:** `src/screens/SettingsSheet.tsx`
**Route:** None (rendered as a child of `MainScreen`, not a route)

> Note: `SettingsSheet` lives in `src/screens/` because it is a full-featured screen-level composition — even though it is not a route component. The actual section implementations live in `src/features/settings/`.

### Props

| Prop           | Type                      | Required | Description                                |
| -------------- | ------------------------- | -------- | ------------------------------------------ |
| `isOpen`       | `boolean`                 | Yes      | Controls the shadcn `Sheet` open state     |
| `onOpenChange` | `(open: boolean) => void` | Yes      | Called when the sheet should open or close |

### Architecture

`SettingsSheet` is a **thin composition layer**. All section UI and business logic are delegated to the `features/settings/` module:

#### Section components (from `@/features/settings`)

| Component                | Purpose                                                                     |
| ------------------------ | --------------------------------------------------------------------------- |
| `CategoriesGroupsSection`| Category/group management with drag-to-reorder                              |
| `AppearanceSection`      | Light / System / Dark toggle group                                          |
| `TextSizeSection`        | Text size selector (xs / s / m / l / xl)                                    |
| `NameSection`            | User name display and edit                                                  |
| `SyncSection`            | Cloud sync enable/disable, sync code display, adopt code                    |
| `DataSection`            | Reset to factory settings                                                   |
| `SettingsDialogPortal`   | All confirmation dialogs (rename, delete, reset, add, assign group)         |

#### Hooks (from `@/features/settings`)

| Hook                 | Purpose                                                             |
| -------------------- | ------------------------------------------------------------------- |
| `useCategoryDrag`    | Drag-to-reorder state and handlers for category rows                |
| `useGroupDrag`       | Drag-to-reorder state and handlers for group rows + expand/collapse |
| `useSettingsDialogs` | Dialog open/close state, targets, and action handlers               |

### Store access

Reads from `useCategoriesStore()` (categories, groups, reorder), `useSettingsStore()` (appearance, text size, user name), and `useSyncStore()` (sync status, code, enable/disable).

### Key behaviors

#### Focus sentinel

`sheetFocusSentinelRef` — a visually hidden `<div tabIndex={-1}>` at the top of the sheet panel, passed to `SheetContent` as `initialFocus`. This prevents the first interactive element from receiving focus and triggering the iOS keyboard on open.

#### Gradient fade

A `pointer-events-none` absolute div at `top: 60px` provides a `28px` gradient from `var(--color-surface-background)` to transparent, blending content that scrolls under the sticky header.

#### Sheet chrome

- `SheetContent side="bottom"`, `rounded-t-3xl`, `max-h-[90dvh]`.
- Header: "Settings" title in `var(--color-brand-green)` + "Done" ghost button with green tint.
- Background: `var(--color-surface-background)`, shadow: `var(--elevation-sheet)`.
- Content scrolls in a `flex-1 overflow-y-auto` container, sections arranged in a `flex-col gap-4` column with `px-4 pb-10 pt-2`.
