# Architecture Overview

ListMaster PWA is a **React 19 + TypeScript 5** Progressive Web App built with Vite and deployed to GitHub Pages. It is the web port of the ListMaster iOS app. Design decisions deliberately mirror Swift/UIKit/SwiftUI conventions — naming, patterns, and data shapes are chosen to stay close to the iOS original.

---

## Tech Stack

| Concern              | Technology                                |
| -------------------- | ----------------------------------------- |
| UI framework         | React 19                                  |
| Language             | TypeScript 5                              |
| Build tool           | Vite                                      |
| CSS                  | Tailwind CSS v4 + CSS custom properties   |
| Component primitives | shadcn/ui                                 |
| Routing              | React Router v7 (`HashRouter`)            |
| State management     | React Context + `useReducer` / `useState` |
| Persistence          | `localStorage` via service layer          |
| PWA                  | `vite-plugin-pwa` + Workbox               |
| Deployment           | GitHub Pages via `gh-pages` CLI           |

---

## Routing

`HashRouter` is used instead of `BrowserRouter`. GitHub Pages has no server-side routing — every URL that isn't an actual file returns a 404. Hash-based routing (`/#/path`) keeps navigation entirely client-side, which works on any static host. Routes are defined in `src/App.tsx`.

**Do not switch to `BrowserRouter`** — it will break navigation on GitHub Pages.

---

## App Entry Flow

```
main.tsx
  └── StrictMode
        └── SettingsProvider
              └── StoreProvider
                    └── App.tsx
                          ├── SplashScreen          (returning users only — hasCompletedOnboarding = true)
                          └── HashRouter
                                └── PageTransitionWrapper
                                      ├── Onboarding route tree   (hasCompletedOnboarding = false)
                                      │     ├── /         → OnboardingInstallScreen
                                      │     ├── /welcome  → OnboardingWelcomeScreen
                                      │     └── /setup    → OnboardingSetupScreen
                                      └── Main route tree         (hasCompletedOnboarding = true)
                                            └── /         → MainScreen
```

### Provider Naming

The context provider exported from `src/store/useCategoriesStore.ts` is named `StoreProvider` (not `CategoriesProvider`). The provider exported from `src/store/useSettingsStore.ts` is named `SettingsProvider`. Both are instantiated in `src/main.tsx`.

### Onboarding Flow

First-time users are routed into the onboarding sequence:

1. `OnboardingInstallScreen` (`/`) — prompts the user to add the app to their home screen. If the app is already running in standalone mode, it immediately redirects to `/welcome` without rendering anything.
2. `OnboardingWelcomeScreen` (`/welcome`) — introductory welcome with hero icon and "Get Started" CTA.
3. `OnboardingSetupScreen` (`/setup`) — collects the user's name and creates the initial category list.

After `OnboardingSetupScreen` calls `settings.completeOnboarding()`, `hasCompletedOnboarding` becomes `true`, and the app reroutes to `MainScreen`. The onboarding routes become inaccessible — any attempt to navigate to them is caught by the `<Navigate to="/" replace />` catch-all and redirected to `MainScreen`.

The `hasCompletedOnboarding` flag is persisted via `SettingsService` and read back on every launch — see `src/store/useSettingsStore.ts`.

### Splash Screen

`SplashScreen` is rendered by `App.tsx` **before** `HashRouter` mounts, for returning users only (`hasCompletedOnboarding = true`). `isSplashVisible` is initialized from `hasCompletedOnboarding` via a `useState` lazy initializer, so the splash shows synchronously on the first render with no flicker. It plays a branded enter animation (app icon + wordmark), then fades out over 420 ms and calls `onFinished()`, which sets `isSplashVisible = false` and unmounts the splash, revealing the `HashRouter` tree. This mirrors the iOS `LaunchScreen.storyboard` pattern.

### Page Transitions

`PageTransitionWrapper` wraps all `<Routes>`. It detects route changes via `useLocation` and applies CSS push/pop slide animations between screens using the classes `page-enter-from-right`, `page-exit-to-left`, etc. defined in `index.css`. It uses `getRouteDepth(pathname)` to determine direction — a deeper path triggers a forward push; a shallower path triggers a backward pop. The outgoing page is kept in a snapshot during the animation and removed after 380 ms (matching `--duration-page`).

### Foreground Reload

`App.tsx` attaches a `document.visibilitychange` listener. When the document transitions from hidden to visible (the user returns to the tab or re-opens the PWA), `store.reload()` is called on the categories store to re-read `localStorage`. This mirrors `scenePhase == .active` in SwiftUI and ensures the app reflects changes made in another tab or after a service worker cache update.

### Google Analytics

`OnboardingInstallScreen` fires a `pwa_session` GA event via `gtag()` when it detects the app is running in standalone mode. The `gtag` function is declared as a global in the component file and is loaded by a GA script tag in `index.html`. All calls are guarded by `typeof gtag === "function"` so the app works normally when GA is blocked or slow to load.

---

## Layer Responsibilities

```
src/
├── models/       Pure TypeScript types — no logic, no I/O
├── store/        React Context + reducer/state — owns all mutable app state
├── services/     Stateless singletons — the only layer that touches localStorage
├── screens/      Full-screen route components — one file per route
├── components/   Reusable UI — reads from stores, calls store methods
├── styles/       CSS custom property token files
└── lib/          Pure utility functions (framework-agnostic)
```

Each layer has a strict contract:

- **Models** never import anything.
- **Services** never import React.
- **Stores** call services; they never touch the DOM or `localStorage` directly.
- **Components** call stores; they never call services or `localStorage` directly.
- **Screens** are components rendered by `<Route>` — they follow the same rules as components.

See `docs/reference/project-structure.md` for the full file-by-file breakdown.
