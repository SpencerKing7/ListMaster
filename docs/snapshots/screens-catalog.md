# Screens Catalog — April 2026# Screens Catalog — April 2026

> **Purpose:** A reference snapshot of every screen component in `src/screens/`. For each screen, this document records its route path, entry condition, local state, key behaviors, side effects, and navigation targets. Use this when diagnosing regressions, tracing user flows, or planning changes.> **Purpose:** A reference snapshot of every screen component in `src/screens/`. For each screen, this document records its route path, entry condition, local state, key behaviors, side effects, and navigation targets. Use this when diagnosing regressions, tracing user flows, or planning changes.

---

## Table of Contents## Table of Contents

- [SplashScreen](#splashscreen)- [SplashScreen](#splashscreen)

- [OnboardingWelcomeScreen](#onboardingwelcomescreen)- [OnboardingInstallScreen](#onboardinginstallscreen)

- [OnboardingSetupScreen](#onboardingsetupscreen)- [OnboardingWelcomeScreen](#onboardingwelcomescreen)

- [OnboardingSyncScreen](#onboardingsyncscreen)- [OnboardingSetupScreen](#onboardingsetupscreen)

- [OnboardingInstallScreen](#onboardinginstallscreen)- [OnboardingSyncScreen](#onboardingsyncscreen)

- [MainScreen](#mainscreen)- [MainScreen](#mainscreen)

- [SettingsSheet](#settingssheet)- [SettingsSheet](#settingssheet)

---

## Route Map## Route Map

The full routing table as defined in `App.tsx`:The full routing table as defined in `App.tsx`:

### When `hasCompletedOnboarding === true`| Route path | Component | Entry condition |

| ---------- | ------------------------- | --------------------------------------------------------------- |

| Route path | Component | Notes || `/welcome` | `OnboardingWelcomeScreen` | Default redirect for all new users |

| ---------- | ----------- | ---------------------------------------------------- || `/setup` | `OnboardingSetupScreen` | Navigated to by `OnboardingWelcomeScreen` CTA |

| `/` | `MainScreen`| Primary app screen || `/sync` | `OnboardingSyncScreen` | Navigated to by `OnboardingSetupScreen` for all users |

| `*` | → `/` | Catch-all redirect via `<Navigate to="/" replace />` || `/install` | `OnboardingInstallScreen` | Navigated to by `OnboardingSyncScreen` for non-standalone users |

| `/` | `MainScreen` | `hasCompletedOnboarding === true` |

### When `hasCompletedOnboarding === false`

All routes are wrapped by `PageTransitionWrapper` in `App.tsx`, which provides push/pop slide animations. `HashRouter` is used throughout — required for GitHub Pages static hosting.

| Route path | Component | Notes |

| ---------- | ------------------------- | ------------------------------------------------ |The splash screen (`SplashScreen`) is not a route. It is rendered conditionally in `App.tsx` based on `isSplashVisible` local state, overlaid on top of the router outlet.

| `/` | `OnboardingWelcomeScreen` | Default landing for new users |

| `/setup` | `OnboardingSetupScreen` | Name + categories + optional sync code input |---

| `/sync` | `OnboardingSyncScreen` | Cloud sync opt-in before onboarding completes |

| `/install` | `OnboardingInstallScreen` | Browser-mode "You're All Set" / auto-complete |## `SplashScreen`

| `*` | → `/` | Catch-all redirect via `<Navigate to="/" replace />` |

**File:** `src/screens/SplashScreen.tsx`

All routes are wrapped by `PageTransitionWrapper` in `App.tsx`, which provides iOS-style push/pop slide animations. `HashRouter` is used throughout — required for GitHub Pages static hosting.**Route:** None (not a route — rendered by `App.tsx` as an overlay)

The splash screen (`SplashScreen`) is not a route. It is rendered conditionally in `App.tsx` before the `HashRouter` mounts, gated by the `isSplashVisible` local state.### Entry condition

---`isSplashVisible` is initialized in `App.tsx` as:

## `App.tsx` — Router Host```ts

const [isSplashVisible, setIsSplashVisible] = useState(

**File:** `src/App.tsx` () => settings.hasCompletedOnboarding,

);

`App` is not a screen itself but hosts the routing logic. Key details:```

### `isSplashVisible`It is `true` (splash shown) for all users on app launch. The splash always displays before routing begins.

Initialized to `true` unconditionally. While `true`, `SplashScreen` renders and the router does not mount. When `SplashScreen` calls `onFinished`, `isSplashVisible` becomes `false` and routing begins.### Props

### Foreground reload| Prop | Type | Required | Description |

| ----------------- | ------------ | -------- | ---------------------------------------------------------------------------------------- |

A `visibilitychange` listener calls `store.reload()` when the document becomes visible after being backgrounded. The very first `visibilitychange` event (the initial hidden → visible transition during page load) is intentionally skipped via `hasHandledFirstVisibility` ref.| `onFinished` | `() => void` | Yes | Called when the exit animation completes; `App.tsx` sets `isSplashVisible = false` |

| `isReturningUser` | `boolean` | Yes | Whether this is a returning user; affects splash duration (1000ms new, 1400ms returning) |

### Google Analytics — standalone session tracking

### Local state

On the first visibility event (the skipped one), if `isStandalone && hasCompletedOnboarding`, a `pwa_session` GA event is fired. This acts as a proxy for tracking PWA installs. Guarded by `typeof gtag === "function"` in case GA is blocked.

| Variable | Type | Description |

### `isStandalone` memo| ----------- | --------- | --------------------------------------------- |

| `isEntered` | `boolean` | `true` after 40ms — triggers enter animations |

Computed once via `useMemo`: `(display-mode: standalone)` media query or `navigator.standalone` (Apple-specific). Used to decide whether onboarding navigates to `/install` or completes directly.| `isFading` | `boolean` | `true` after 1400ms — triggers fade-out |

---### Animation sequence

## `SplashScreen`1. Mount: screen is fully opaque, app icon and wordmark are at `opacity: 0, scale: 0.85, translateY: 12px`.

2. After **40 ms**: `isEntered = true` → icon and wordmark spring into view (`opacity: 1, scale: 1, translateY: 0`, `cubic-bezier(0.34,1.56,0.64,1)`).

**File:** `src/screens/SplashScreen.tsx`3. After **1000-1400 ms** (based on `isReturningUser`): `isFading = true` → entire screen fades to `opacity: 0` over `420ms ease-out`.

**Route:** None (not a route — rendered by `App.tsx` as an overlay)4. After **duration + 420 ms** (in the same timer block): `onFinished()` is called, unmounting the splash.

### Entry condition### Visual design

`isSplashVisible` is initialized to `true` in `App.tsx` for **all** users (both new and returning). The splash always displays before routing begins.- Full-screen gradient: `deep-green → green → teal` (matching the brand palette).

- App icon: `w-24 h-24`, rounded corners, shadow.

### Props- Wordmark: `"ListMaster"` in bold white at `text-3xl`.

- `position: fixed, inset: 0, z-index: 50` — covers everything behind it.

| Prop | Type | Required | Description |

| ----------------- | ------------ | -------- | ---------------------------------------------------------------------------------------- |---

| `onFinished` | `() => void` | Yes | Called when the exit animation completes; `App.tsx` sets `isSplashVisible = false` |

| `isReturningUser` | `boolean` | Yes | Whether the user has completed onboarding; affects splash duration (1000ms new, 1400ms returning) |## `OnboardingInstallScreen`

### Local state**File:** `src/screens/OnboardingInstallScreen.tsx`

**Route:** `/install`

| Variable | Type | Description |

| ----------- | --------- | --------------------------------------------- |### Entry condition

| `isEntered` | `boolean` | `true` after 40ms — triggers enter animations |

| `isFading` | `boolean` | `true` after duration — triggers fade-out |Navigated to by `OnboardingSetupScreen` for users who are not running in standalone (installed PWA) mode. This screen provides a celebratory completion experience for browser-based users.

### Animation sequence### Props

1. **Mount:** Screen is fully opaque. App icon and wordmark are at `opacity: 0`, scaled down.None. Uses `useSettingsStore()` internally.

2. **After 40 ms:** `isEntered = true` → icon springs into view (`scale(0.78) → scale(1)`, `600ms cubic-bezier(0.34,1.56,0.64,1)`). Wordmark fades in with 80ms stagger.

3. **After 1000 ms** (new user) / **1400 ms** (returning): `isFading = true` → entire screen fades to `opacity: 0` over `420ms ease-out`.### Local state

4. **After fade completes** (duration + 420 ms): `onFinished()` is called, unmounting the splash.

| Variable | Type | Description |

### Visual design| -------------- | --------- | ------------------------------------------------------------- |

| `isStandalone` | `boolean` | Whether the app is running in standalone (installed PWA) mode |

- Full-screen gradient: `linear-gradient(160deg, deep-green 0%, green 55%, teal 100%)`.

- Extends into safe areas via negative `calc()` insets on all four sides.### Standalone detection

- App icon: `w-20 h-20 rounded-[22px]`, semi-transparent white background, checklist SVG.

- Wordmark: `"List Master"` in bold white at `text-3xl` + "YOUR CHECKLIST COMPANION" subtitle.```ts

- `position: fixed, z-50` — covers everything.const isStandalone =

  window.matchMedia("(display-mode: standalone)").matches ||

--- (navigator as any).standalone === true;

````

## `OnboardingWelcomeScreen`

`navigator.standalone` is an Apple proprietary property available only on iOS Safari. The `matchMedia` check covers all other platforms.

**File:** `src/screens/OnboardingWelcomeScreen.tsx`

**Route:** `/` (when `hasCompletedOnboarding === false`)### Behavior



### Entry condition**If standalone (installed):**



Default landing for users who have not completed onboarding. This is the first screen new users see after the splash.- Automatically calls `settings.completeOnboarding()` to complete the onboarding process.

- No UI is rendered (returns `null`).

### Props

**If not standalone (browser tab):**

None. Uses `useNavigate()` internally.

- Renders a celebratory "You're All Set!" screen with a checkmark icon and welcoming message.

### Local state- Provides a "Get Started" button that calls `settings.completeOnboarding()` when clicked.



| Variable    | Type      | Description                                   |### Navigation

| ----------- | --------- | --------------------------------------------- |

| `isEntered` | `boolean` | `true` after 80ms — triggers entry animations |- → Main app (when onboarding completes via `settings.completeOnboarding()`)



### Behavior---



Renders a full-screen welcome view with:## `OnboardingWelcomeScreen`



- App icon and "Welcome to ListMaster" heading.**File:** `src/screens/OnboardingWelcomeScreen.tsx`

- Brief marketing copy explaining the app.**Route:** `/welcome`

- A "Get Started" CTA button.

### Entry condition

All elements animate in via `opacity`/`translateY` when `isEntered` becomes `true`. The "Get Started" button navigates to `/setup`.

This is the default redirect for users who have not yet completed onboarding (`hasCompletedOnboarding === false`). It is the starting screen for all new users after the splash screen.

### Navigation

### Props

- → `/setup` (on "Get Started" tap)

None. Uses `useNavigate()` internally.

---

### Local state

## `OnboardingSetupScreen`

| Variable    | Type      | Description                                   |

**File:** `src/screens/OnboardingSetupScreen.tsx`| ----------- | --------- | --------------------------------------------- |

**Route:** `/setup`| `isEntered` | `boolean` | `true` after 80ms — triggers entry animations |



### Entry condition### Behavior



Navigated to from `/` (Welcome). The user has not yet entered their name or categories.Renders a full-screen welcome view with:



### Props- App icon and "Welcome to ListMaster" heading.

- Brief marketing copy explaining the app.

None. Uses `useCategoriesStore()`, `useSettingsStore()`, `useSyncStore()`, and `useNavigate()` internally.- A "Get Started" CTA button.



### Local stateAll elements animate in via `opacity`/`translateY` when `isEntered` becomes `true`. The "Get Started" button navigates to `/setup`.



| Variable            | Type       | Description                                      |### Navigation

| ------------------- | ---------- | ------------------------------------------------ |

| `nameText`          | `string`   | The user's typed name (controlled input)         |- → `/setup` (on "Get Started" tap)

| `pendingCategories` | `string[]` | Category names added so far (seeded from store)  |

| `syncCodeText`      | `string`   | Sync code input value                            |---



### Derived values## `OnboardingSetupScreen`



| Value                  | Formula                                | Purpose                             |**File:** `src/screens/OnboardingSetupScreen.tsx`

| ---------------------- | -------------------------------------- | ----------------------------------- |**Route:** `/setup`

| `trimmedName`          | `nameText.trim()`                      | Used in validation and submission   |

| `trimmedSyncCode`      | `syncCodeText.trim()`                  | Used in validation and submission   |### Entry condition

| `isFormValid`          | sync code present OR (name + ≥1 cat)   | Gates the "Next" button             |

| `isManualSectionDimmed`| `trimmedSyncCode.length > 0`           | Dims the name/category section      |Navigated to from `/welcome`. The user has not yet entered their name or categories.



### Behavior### Props



The screen is split into two mutually exclusive input modes, separated by an "or" divider:None. Uses `useCategoriesStore()`, `useSettingsStore()`, and `useNavigate()` internally.



#### Mode 1: Manual setup (name + categories)### Local state



- Name `<Input>` with auto-focus on mount. `autoCapitalize="words"`.| Variable            | Type       | Description                                    |

- `OnboardingCategoryInput` component for managing `pendingCategories`.| ------------------- | ---------- | ---------------------------------------------- |

- When a sync code is entered, this section dims to 40% opacity and becomes non-interactive.| `name`              | `string`   | The user's typed name (controlled input)       |

| `pendingCategories` | `string[]` | Category names added so far                    |

#### Mode 2: Sync code| `categoryInput`     | `string`   | The controlled input for adding a new category |

| `isEntered`         | `boolean`  | `true` after 60ms — triggers entry animation   |

- `OnboardingSyncCodeInput` component for entering a sync code.

- When a sync code is present, it takes priority over manual setup.### Behavior



#### Form submission (`finishSetup`)#### Name input



1. Blurs the active element (dismisses keyboard).A single `<Input>` for the user's name. Drives `name` local state. Required before the form can be submitted.

2. If sync code present: calls `await sync.adoptSyncCode(trimmedSyncCode)`.

3. If manual: calls `settings.setUserName(trimmedName)` and `store.setCategories(pendingCategories)`.#### Category management

4. After **350 ms** delay (`setTimeout`): scrolls to top, then:

   - Standalone mode: `settings.completeOnboarding()` directly.- Users type a category name and tap the `+` button (or press Enter) to add it to `pendingCategories`.

   - Browser mode: `navigate("/sync")`.- Duplicate names (case-insensitive) are rejected silently.

- Each pending category appears as a pill with a remove button.

The 350 ms delay waits for the iOS software keyboard to dismiss before the route changes. Without it, navigation while the keyboard is still animating causes layout jank.- At least one category is required to proceed.



### Navigation#### Form submission (`finishSetup`)



- → `/sync` (browser mode, after setup)1. Calls `settings.setUserName(name.trim())`.

- → Main app (standalone mode, after `settings.completeOnboarding()`)2. Calls `store.setCategories(pendingCategories)` — creates `Category` objects with UUIDs and empty item arrays.

3. After **350 ms** delay (`setTimeout`):

---   - If standalone: calls `settings.completeOnboarding()` directly

   - If not standalone: navigates to `/install`

## `OnboardingSyncScreen`

The 350 ms delay waits for the iOS software keyboard to dismiss before the route changes. Without it, navigation while the keyboard is still animating can cause layout jank.

**File:** `src/screens/OnboardingSyncScreen.tsx`

**Route:** `/sync`### Navigation



### Entry condition- → `/sync` (for all users after `finishSetup()`)

- → Main app (for standalone users after `settings.completeOnboarding()`)

Navigated to from `/setup` for browser-mode users. Offers cloud sync before the user finishes onboarding.

---

### Props

## `OnboardingSyncScreen`

None. Uses `useSyncStore()`, `useSettingsStore()`, and `useNavigate()` internally.

**File:** `src/screens/OnboardingSyncScreen.tsx`

### Local state**Route:** `/sync`



| Variable    | Type      | Initial | Description                                                              |### Entry condition

| ----------- | --------- | ------- | ------------------------------------------------------------------------ |

| `isLoading` | `boolean` | `false` | `true` while `enableSync()` is in flight — disables both buttons         |Navigated to from `/setup` for all users. Offers cloud sync before the user finishes onboarding.

| `isEntered` | `boolean` | `false` | `true` after 60ms — drives entry animations                              |

| `hasError`  | `boolean` | `false` | `true` when `enableSync()` fails — shows inline error, re-enables button |### Props



### `isSyncEnabled` early-exitNone. Uses `useSyncStore()`, `useSettingsStore()`, and `useNavigate()` internally.



If `sync.isSyncEnabled` is `true` on mount (user joined sync via a code on `/setup`), a mount-only `useEffect` calls `navigateForward()` immediately, and the component returns `null`. One blank frame is visible before the effect fires — this matches the pattern in `OnboardingInstallScreen`.### Local state



### `handleEnable` flow| Variable    | Type      | Initial | Description                                                              |

| ----------- | --------- | ------- | ------------------------------------------------------------------------ |

1. Sets `hasError = false`, `isLoading = true`.| `isLoading` | `boolean` | `false` | `true` while `enableSync()` is in flight — disables both buttons         |

2. Calls `await sync.enableSync()`.| `isEntered` | `boolean` | `false` | `true` after 60ms — drives entry animations                              |

3. A watcher `useEffect` on `[sync.syncStatus, isLoading]` detects the settled state:| `hasError`  | `boolean` | `false` | `true` when `enableSync()` fails — shows inline error, re-enables button |

   - `"synced"` → `isLoading = false`, calls `navigateForward()`.

   - `"error"` → `isLoading = false`, sets `hasError = true`.### `isSyncEnabled` early-exit behaviour

4. Reading `syncStatus` inline after `await` is unsafe (stale closure) — the watcher is the correct pattern.

If `sync.isSyncEnabled` is `true` on mount (user joined sync via a code on `/setup`), a mount-only `useEffect` calls `navigateForward()` immediately, and the component returns `null`. One blank frame is visible before the effect fires — this is acceptable and matches the existing pattern in `OnboardingInstallScreen`.

### `navigateForward` targets

### `handleEnable` flow

| Mode       | Action                          |

| ---------- | ------------------------------- |1. Sets `hasError = false`, `isLoading = true`.

| Standalone | `settings.completeOnboarding()` |2. Calls `await sync.enableSync()`.

| Browser    | `navigate("/install")`          |3. A watcher `useEffect` on `[sync.syncStatus, isLoading]` detects the settled state:

   - `"synced"` → sets `isLoading = false`, calls `navigateForward()`.

### Navigation   - `"error"` → sets `isLoading = false`, sets `hasError = true`.

4. Reading `syncStatus` inline after `await` is unsafe (stale closure) — the watcher is the correct pattern.

- → `/install` (enable success or skip, browser mode)

- → Main app (enable success or skip, standalone mode)### `navigateForward` targets

- → Stays on screen (on `enableSync()` error — shows inline error for retry)

| Mode       | Action                          |

---| ---------- | ------------------------------- |

| Standalone | `settings.completeOnboarding()` |

## `OnboardingInstallScreen`| Browser    | `navigate("/install")`          |



**File:** `src/screens/OnboardingInstallScreen.tsx`### Navigation targets

**Route:** `/install`

- → `/install` (on enable success or skip, browser mode)

### Entry condition- → Main app (on enable success or skip, standalone mode)

- → Stays on screen (on `enableSync()` error — shows inline error for retry)

Navigated to by `OnboardingSyncScreen` for users who are not running in standalone mode. Provides a celebratory completion experience for browser-based users.

---

### Props

## `MainScreen`

None. Uses `useSettingsStore()` internally.

**File:** `src/screens/MainScreen.tsx`

### Standalone detection**Route:** `/`



```ts### Entry condition

const isStandalone =

  window.matchMedia("(display-mode: standalone)").matches ||Rendered when `hasCompletedOnboarding === true`. This is the primary app screen.

  (navigator as { standalone?: boolean }).standalone === true;

```### Props



### BehaviorNone. Uses `useCategoriesStore()`, `useSettingsStore()`, and `useNavigate()` internally.



**If standalone (installed):**### Local state



- Automatically calls `settings.completeOnboarding()` to complete the onboarding process.| Variable         | Type      | Description                                                                        |

- No UI is rendered (returns `null`).| ---------------- | --------- | ---------------------------------------------------------------------------------- |

| `isSettingsOpen` | `boolean` | Controls `SettingsSheet` open/close                                                |

**If not standalone (browser tab):**| `scrolled`       | `boolean` | `true` when the category list is scrolled > 20px (drives `HeaderBar` title shrink) |



- Renders a celebratory "You're All Set!" screen with a checkmark icon and welcoming message.### Layout

- Provides a "Get Started" button that calls `settings.completeOnboarding()` when clicked.

A full-screen fixed layout using `h-dvh overflow-hidden`. See `docs/snapshots/main-screen-ui-snapshot.md` for the complete layout tree and scroll chain documentation.

### Navigation

Two `position: fixed` background divs render outside the layout shell:

- → Main app (when onboarding completes via `settings.completeOnboarding()`)

- Solid color fill (`var(--color-surface-background)`) extended into safe areas.

---- Brand gradient (`var(--gradient-brand-wide)`) with the same extension.



## `MainScreen`### Key behaviors



**File:** `src/screens/MainScreen.tsx`#### Mount scroll reset

**Route:** `/` (when `hasCompletedOnboarding === true`)

On mount, `window.scrollTo(0, 0)`, `document.documentElement.scrollTop = 0`, and `document.body.scrollTop = 0` are called to clear any residual scroll position from onboarding screens.

### Entry condition

#### `onScroll` / header shrink

Rendered when `hasCompletedOnboarding === true`. This is the primary app screen.

`onScroll={handleScrollWithPosition}` is attached to the content container div. The handler reads `(e.target as HTMLElement).scrollTop` — `e.target` is the inner `overflow-y-auto` scroll container inside `CategoryPanel` (React's `onScroll` bubbles). When `scrollTop > 20`, `setScrolled(true)` drives the `HeaderBar` compact-title animation.

### Props

#### Foreground reload

None. Uses `useCategoriesStore()` internally.

`App.tsx` attaches a `visibilitychange` listener that calls `window.location.reload()` when the document becomes visible (app returns from background). This ensures fresh data after the PWA is backgrounded for an extended period.

### Local state

#### Settings sheet

| Variable         | Type      | Description                                                                        |

| ---------------- | --------- | ---------------------------------------------------------------------------------- |`isSettingsOpen` is toggled by the settings gear button in `HeaderBar`. `SettingsSheet` is a direct child of `MainScreen`.

| `isSettingsOpen` | `boolean` | Controls `SettingsSheet` open/close                                                |

| `scrolled`       | `boolean` | `true` when the category list is scrolled > 20px (drives `HeaderBar` title shrink) |### Child components



### Layout| Component       | Purpose                                                                    |

| --------------- | -------------------------------------------------------------------------- |

A full-screen fixed layout using `h-dvh overflow-hidden`. See `docs/snapshots/main-screen-ui-snapshot.md` for the complete layout tree and scroll chain documentation.| `HeaderBar`     | Greeting title, refresh button, settings button, `CategoryPicker` pill row |

| `CategoryPanel` | Full content area for the selected category                                |

Two `position: fixed` background divs render outside the layout shell:| `BottomBar`     | Navigation chevrons and "Clear Checked" action                             |

| `SettingsSheet` | Slide-up settings drawer                                                   |

- Solid color fill (`var(--color-surface-background)`) extended into safe areas via negative `calc()` insets.

- Brand gradient (`var(--gradient-brand-wide)`) with the same extension.---



### Key behaviors## `SettingsSheet`



#### Mount scroll reset**File:** `src/screens/SettingsSheet.tsx`

**Route:** None (rendered as a child of `MainScreen`, not a route)

On mount, `window.scrollTo(0, 0)`, `document.documentElement.scrollTop = 0`, and `document.body.scrollTop = 0` are called to clear any residual scroll position from onboarding screens.

> Note: `SettingsSheet` lives in `src/screens/` because it is a full-featured screen-level view — it contains its own dialogs, drag-reorder gesture, and significant business logic — even though it is not a route component.

#### Keyboard dismiss on scroll

### Props

`handleScroll` calls `(document.activeElement as HTMLElement | null)?.blur()` — dismissing the iOS keyboard whenever the user scrolls the content area.

| Prop           | Type                      | Required | Description                                |

#### `onScroll` / header shrink| -------------- | ------------------------- | -------- | ------------------------------------------ |

| `isOpen`       | `boolean`                 | Yes      | Controls the shadcn `Sheet` open state     |

`handleScrollWithPosition` is attached to the content container div. It calls `handleScroll` (keyboard dismiss), then reads `(e.target as HTMLElement).scrollTop`. When `scrollTop > 20`, `setScrolled(true)` drives the `HeaderBar` compact-title animation.| `onOpenChange` | `(open: boolean) => void` | Yes      | Called when the sheet should open or close |



#### Refresh button### Local state



`onRefresh` is `() => window.location.reload()` — a hard page reload used as a simple data-refresh mechanism.| Variable             | Type               | Description                                                       |

| -------------------- | ------------------ | ----------------------------------------------------------------- |

#### Settings sheet| `swipeTranslateY`    | `number`           | Current drag offset for swipe-to-dismiss gesture                  |

| `isDismissDragging`  | `boolean`          | Whether a swipe-to-dismiss gesture is in progress                 |

`isSettingsOpen` is toggled by the settings gear button in `HeaderBar`. `SettingsSheet` is a direct child of `MainScreen`, rendered as a sibling to the layout `<div>`.| `dragIndex`          | `number \| null`   | Index of the category currently being dragged in the reorder list |

| `overIndex`          | `number \| null`   | Index of the drop target during category reorder drag             |

### Child components| `isRenameDialogOpen` | `boolean`          | Controls the Rename Category dialog                               |

| `renameTarget`       | `Category \| null` | The category being renamed                                        |

| Component       | Purpose                                                                             || `renameValue`        | `string`           | Controlled input value for the rename field                       |

| --------------- | ----------------------------------------------------------------------------------- || `isResetDialogOpen`  | `boolean`          | Controls the Reset to Factory Settings confirmation dialog        |

| `HeaderBar`     | Greeting title, refresh button, settings button, `GroupTabBar`, `CategoryPicker`    |

| `CategoryPanel` | Full content area for the selected category (adds `AddItemInput`, items, meta bar)  |### Behaviors

| `BottomBar`     | Navigation chevrons and "Clear Checked" action                                      |

| `SettingsSheet` | Slide-up settings drawer (composed from `features/settings/` section components)    |#### Swipe-to-dismiss



---`onPointerDown`/`onPointerMove`/`onPointerUp` on the sheet's drag handle bar track a vertical drag. If the drag exceeds 120px downward, `onOpenChange(false)` is called, dismissing the sheet. During the drag, `swipeTranslateY` is applied as a `translateY` inline style on the sheet panel. On release below threshold, `swipeTranslateY` resets to 0 with a spring transition.



## `SettingsSheet`The `isDismissDraggingRef` ensures that `pointermove` events during an established dismiss-drag continue to update `swipeTranslateY` even if the pointer leaves the drag handle.



**File:** `src/screens/SettingsSheet.tsx`#### Focus sentinel

**Route:** None (rendered as a child of `MainScreen`, not a route)

`sheetFocusSentinelRef` — a visually hidden `<div tabIndex={0}>` at the top of the sheet panel. This element absorbs the automatic focus that shadcn's `Sheet` assigns on open, preventing the first interactive element (typically the name input) from receiving focus and triggering the iOS keyboard.

> Note: `SettingsSheet` lives in `src/screens/` because it is a full-featured screen-level composition — even though it is not a route component. The actual section implementations live in `src/features/settings/`.

#### Drag-to-reorder categories

### Props

Category rows in the Settings panel support drag-to-reorder via Pointer Events. `itemRects` ref stores the bounding rects of all rows at drag start. As the pointer moves, `overIndex` updates based on which rect the pointer center overlaps. On `pointerup`, `store.moveCategory(dragIndex, overIndex)` dispatches a `MOVE_CATEGORIES` action if the indices differ.

| Prop           | Type                      | Required | Description                                |

| -------------- | ------------------------- | -------- | ------------------------------------------ |`canDeleteCategories` (`store.categories.length > 1`) gates the delete button on each row — the last category cannot be deleted.

| `isOpen`       | `boolean`                 | Yes      | Controls the shadcn `Sheet` open state     |

| `onOpenChange` | `(open: boolean) => void` | Yes      | Called when the sheet should open or close  |#### Settings cards



### Architecture| Card           | Controls                                                                                 |

| -------------- | ---------------------------------------------------------------------------------------- |

`SettingsSheet` is a **thin composition layer**. All section UI and business logic are delegated to the `features/settings/` module:| **Your Name**  | Rename button → Rename Dialog (Input + confirm)                                          |

| **Your Lists** | Drag-to-reorder rows + delete buttons per category + "Add List" button                   |

#### Section components (from `@/features/settings`)| **Appearance** | `ToggleGroup` for `"light" \| "system" \| "dark"` — calls `settings.setAppearanceMode()` |

| **Text Size**  | `ToggleGroup` for `"xs" \| "s" \| "m" \| "l" \| "xl"` — calls `settings.setTextSize()`   |

| Component                | Purpose                                                     |

| ------------------------ | ----------------------------------------------------------- |A **Data Management** section at the bottom contains a destructive "Reset to Factory Settings" button, which opens the Reset Confirmation Dialog. On confirm, `settings.resetToNewUser()` is called (clears all `localStorage`, resets all store state, reapplies DOM defaults) and the app navigates to `/install`.

| `CategoriesGroupsSection`| Category/group management with drag-to-reorder              |

| `AppearanceSection`      | Light / System / Dark toggle group                          |#### Dialogs

| `TextSizeSection`        | Text size selector (xs / s / m / l / xl)                    |

| `NameSection`            | User name display and edit                                  |Two `<Dialog>` components are rendered inside `SettingsSheet`:

| `SyncSection`            | Cloud sync enable/disable, sync code display, adopt code    |

| `DataSection`            | Reset to factory settings                                   |1. **Rename Category Dialog** — an input pre-filled with the current category name. Submitting calls `store.renameCategory(renameTarget.id, renameValue.trim())`.

| `SettingsDialogPortal`   | All confirmation dialogs (rename, delete, reset, add, assign group) |2. **Reset Confirmation Dialog** — a warning message with a destructive confirm button. On confirm, calls `settings.resetToNewUser()` and navigates to `/install`.


#### Hooks (from `@/features/settings`)

| Hook                 | Purpose                                                           |
| -------------------- | ----------------------------------------------------------------- |
| `useCategoryDrag`    | Drag-to-reorder state and handlers for category rows              |
| `useGroupDrag`       | Drag-to-reorder state and handlers for group rows + expand/collapse |
| `useSettingsDialogs` | Dialog open/close state, targets, and action handlers             |

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
````
