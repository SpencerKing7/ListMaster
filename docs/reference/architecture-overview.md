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
  └── Providers (CategoriesProvider, SettingsProvider) wrap the whole tree
        └── App.tsx
              ├── SplashScreen          (returning users only — hasCompletedOnboarding = true)
              └── HashRouter
                    ├── Onboarding route tree   (hasCompletedOnboarding = false)
                    │     ├── OnboardingInstallScreen
                    │     ├── OnboardingWelcomeScreen
                    │     └── OnboardingSetupScreen
                    └── Main route tree         (hasCompletedOnboarding = true)
                          └── MainScreen
```

### Onboarding Flow

First-time users are routed into the onboarding sequence:

1. `OnboardingInstallScreen` — prompts the user to add the app to their home screen
2. `OnboardingWelcomeScreen` — introductory welcome
3. `OnboardingSetupScreen` — collects the user's name and creates the first category

After `OnboardingSetupScreen` sets `hasCompletedOnboarding = true`, the app reroutes to `MainScreen` and the onboarding route tree is no longer accessible.

The `hasCompletedOnboarding` flag is persisted via `SettingsService` and read back on every launch — see `src/store/useSettingsStore.ts`.

### Splash Screen

`SplashScreen` is rendered synchronously for returning users (when `hasCompletedOnboarding` is `true`) before the `HashRouter` mounts. It plays a brief branded animation, then unmounts, revealing `MainScreen`. This mirrors the iOS launch screen / `LaunchScreen.storyboard` pattern.

### Foreground Reload

`App.tsx` attaches a `document.visibilitychange` listener. When the document transitions from hidden to visible (the user returns to the tab or re-opens the PWA), `store.reload()` is called on the categories store to re-read `localStorage`. This mirrors `scenePhase == .active` in SwiftUI and ensures the app reflects changes made in another tab or after a service worker cache update.

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
