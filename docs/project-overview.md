# ListMaster PWA — Project Overview

> **Audience:** Human developers new to this codebase. For AI agent reference docs, see the other files in `docs/reference/`.

---

## What is this app?

**ListMaster PWA** is a mobile-first progressive web app that ports the ListMaster iOS checklist app to the browser. It is designed to feel and behave like a native iOS app — smooth spring animations, haptic feedback patterns, swipe gestures, safe-area insets, and an add-to-home-screen install flow.

Users create named checklists ("categories"), add items to them, check items off, and optionally sync across devices using a shared code instead of an account. No sign-up required.

---

## Tech stack at a glance

| Concern       | Technology                                              |
| ------------- | ------------------------------------------------------- |
| UI            | React 19 + TypeScript 5 (strict)                        |
| Build         | Vite 6                                                  |
| Styling       | Tailwind CSS v4 + CSS custom properties (`tokens.css`)  |
| Component lib | shadcn/ui via `@base-ui/react`                          |
| Routing       | React Router v7 — `HashRouter` only (GitHub Pages)      |
| State         | React Context + `useReducer` / `useState`               |
| Persistence   | `localStorage` via `PersistenceService` singleton       |
| Cloud sync    | Firebase Firestore (anonymous auth, opt-in)             |
| PWA           | `vite-plugin-pwa` + Workbox service worker              |
| Deployment    | GitHub Pages (`gh-pages` — human-only, never automated) |

---

## Why `HashRouter`?

GitHub Pages serves static files from a single directory. It cannot rewrite clean URLs (e.g. `/setup`) to `index.html` — any direct navigation to a path returns 404. `HashRouter` prefixes all paths with `#`, which the browser never sends to the server, so every URL resolves to `index.html`. **Do not switch to `BrowserRouter`.**

---

## `src/` folder map — what lives where and why

| Folder / File                | Contents                             | Why it exists                                                                                       |
| ---------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `App.tsx`                    | Routing + top-level providers        | Single entry point for all routes. Guards onboarding vs main app. Houses the splash screen overlay. |
| `main.tsx`                   | `createRoot` + provider nesting      | Wraps the app in `SettingsProvider → SyncProvider → StoreProvider`. Provider order matters.         |
| `index.css`                  | Tailwind imports, `@theme` aliases   | Maps CSS custom properties to Tailwind utility class names.                                         |
| `models/types.ts`            | TypeScript interfaces and types only | Inert model file — no functions, no imports. Shared type contract for the whole app.                |
| `store/`                     | React Context + reducers + hooks     | All global mutable state. Three stores: `useCategoriesStore`, `useSettingsStore`, `useSyncStore`.   |
| `screens/`                   | One file per route                   | Thin compositions of components. No business logic inline. Not reusable — screen-specific.          |
| `components/`                | Reusable UI building blocks          | Any component used in more than one screen, or logically independent of a specific route.           |
| `components/ui/`             | shadcn/ui generated primitives       | **Read-only.** Never edit these. Regenerate via `shadcn` CLI if needed.                             |
| `features/settings/`         | Settings feature module              | All settings UI, dialogs, hooks, and drag logic. Imported exclusively by `SettingsSheet`.           |
| `services/`                  | Stateless I/O singletons             | The only files that touch `localStorage`, Firebase, or `navigator.vibrate`.                         |
| `styles/tokens.css`          | CSS custom property definitions      | All color tokens, elevation, gradients. Four rule blocks: `:root`, dark media, forced light/dark.   |
| `lib/utils.ts`               | `cn()` — Tailwind class merging      | shadcn/ui `clsx` + `tailwind-merge` helper. Used everywhere.                                        |
| `lib/detectPlatform.ts`      | UA-sniff for device/browser          | Used by install flow to show the correct add-to-home-screen steps.                                  |
| `lib/installSteps.ts`        | Mobile install step data             | Pure step arrays for Safari, Chrome, Firefox on mobile.                                             |
| `lib/installStepsDesktop.ts` | Desktop install step data            | Pure step arrays for Chrome, Edge, Safari on desktop.                                               |
| `assets/`                    | Static images and icons              | App icon SVGs and any other static assets bundled by Vite.                                          |

---

## Three stores — what each owns

| Store                | File                          | Manages                                                                              |
| -------------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| `useSettingsStore`   | `store/useSettingsStore.ts`   | User name, onboarding completion, appearance mode, text size, color theme            |
| `useSyncStore`       | `store/useSyncStore.tsx`      | Sync code, sync enabled/disabled, sync status, device count                          |
| `useCategoriesStore` | `store/useCategoriesStore.ts` | All checklist data: categories, items, groups, selection state; cloud sync lifecycle |

Provider nesting (outermost → innermost): `SettingsProvider → SyncProvider → StoreProvider`. `StoreProvider` must be innermost because it reads from both other stores.

---

## How data flows

```
User action
    ↓
Component calls store action (e.g. store.addItemToSelectedCategory("milk"))
    ↓
useCategoryActions dispatches StoreAction to categoriesReducer
    ↓
categoriesReducer delegates to handler module (e.g. itemHandlers.ts)
    ↓
Handler returns new StoreState
    ↓
PersistenceService.save() writes to localStorage
    ↓
(if sync enabled) useCloudSync schedules debounced Firestore save (1 s)
    ↓
React re-renders affected components
```

Cloud sync works in the opposite direction via a Firestore `onSnapshot` listener — incoming changes dispatch `SYNC_LOAD` into the reducer, which replaces all data and persists to `localStorage`.

---

## Key constraints to remember

1. **Never call `localStorage` directly** in a component, store, or hook. Use `PersistenceService`, `SettingsService`, or `InstallPromptService`.
2. **Never edit `src/components/ui/`** — those are shadcn/ui generated files.
3. **Never switch to `BrowserRouter`** — GitHub Pages requires `HashRouter`.
4. **Never hard-code hex colors** — use `var(--color-*)` tokens.
5. **Never create files at `src/` root** other than the four that already exist.
6. **Never run `npm run deploy`** — human-only.

---

## Running the app locally

```bash
npm install       # install dependencies
npm run dev       # start Vite dev server (http://localhost:5173)
npm run build     # type-check + production build
npm run preview   # preview the production build locally
```

The build command (`npm run build`) runs `tsc --noEmit` followed by `vite build`. There is no test suite — the build is the only automated validation gate.

---

## Further reading

| Document                                  | What it covers                                           |
| ----------------------------------------- | -------------------------------------------------------- |
| `docs/reference/architecture-overview.md` | App entry flow, routing, provider setup, reload-on-focus |
| `docs/reference/state-management.md`      | All three stores, actions, reducers, derived state       |
| `docs/reference/data-models.md`           | Every type in `models/types.ts`                          |
| `docs/reference/services.md`              | Every service singleton and its full API                 |
| `docs/reference/theming-and-colors.md`    | CSS token system, color themes, appearance modes         |
| `docs/reference/ui-patterns.md`           | iOS feel guidelines, gestures, animations                |
| `docs/reference/sync.md`                  | Firebase sync architecture, Firestore document shape     |
| `docs/snapshots/`                         | Point-in-time catalogs of components, screens, stores    |
