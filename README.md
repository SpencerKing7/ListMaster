# ListMaster PWA

🚀 **[See the deployed app here →](https://spencerking7.github.io/ListMaster/)**

ListMaster is a Progressive Web App (PWA) that serves as the web port of the ListMaster iOS app. It provides a mobile-first, iOS-feel interface for managing checklists and categories, allowing users to organize their tasks and items efficiently.

## Features

- **Category Management**: Create, edit, reorder, and organize categories of checklist items.
- **Group Tabs**: Organize categories into groups with a tab bar for quick filtering.
- **Swipe Gestures**: Navigate between category panels with horizontal swipe gestures and swipe-to-delete on items.
- **Drag-to-Scroll Picker**: Smooth scrolling category picker with drag support.
- **Theme Support**: Light, dark, and system appearance modes with CSS custom property tokens.
- **Onboarding Flow**: Multi-step guided setup for new users, including category creation and cloud sync opt-in.
- **Cloud Sync**: Optional Firebase-backed sync across devices using a shareable sync code.
- **Persistent Storage**: Data saved locally via a `PersistenceService` singleton wrapping `localStorage`.
- **PWA Capabilities**: Installable on mobile and desktop, works offline via Workbox service worker.
- **Haptic Feedback**: Vibration API integration for tactile responses on supported devices.

## Tech Stack

| Layer             | Technology                                                        |
| ----------------- | ----------------------------------------------------------------- |
| **Framework**     | React 19 with TypeScript ~5.8 (strict mode)                       |
| **Build**         | Vite 6                                                            |
| **Styling**       | Tailwind CSS v4 + CSS custom properties (`src/styles/tokens.css`) |
| **UI Components** | shadcn/ui via `@base-ui/react` ^1.3.0                             |
| **Routing**       | React Router v7 — `HashRouter` (required for GitHub Pages)        |
| **State**         | React Context + `useReducer` / `useState`                         |
| **Persistence**   | `localStorage` via `PersistenceService` singleton                 |
| **Cloud Sync**    | Firebase Firestore + Firebase Auth (anonymous)                    |
| **PWA**           | `vite-plugin-pwa` + Workbox                                       |
| **Icons**         | Lucide React                                                      |
| **Gestures**      | Pointer Events API                                                |
| **Deployment**    | GitHub Pages via `gh-pages`                                       |

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/SpencerKing7/ListMaster.git
   cd ListMasterPWA
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173` (or the port shown in the terminal).

### Build for Production

```bash
npm run build
```

This runs `tsc --noEmit` followed by `vite build`. The output is written to the `dist/` directory.

### Preview the Production Build

```bash
npm run preview
```

### Deploy to GitHub Pages

> **Note:** Deployment is a manual, human-only step.

```bash
npm run deploy
```

## Project Structure

```
src/
├── App.tsx                      # Routing + top-level layout
├── main.tsx                     # createRoot entry point + provider nesting
├── index.css                    # Tailwind imports, @theme aliases, global resets
├── vite-env.d.ts                # Vite type declarations
├── models/types.ts              # All interface/type declarations (no logic)
├── store/                       # React Context + useReducer hooks (global state)
├── screens/                     # One file per route (thin composition of components)
├── components/                  # Reusable UI components
│   └── ui/                      # shadcn/ui primitives (read-only, never edit)
├── features/settings/           # Settings feature module (components, hooks, utils)
├── services/                    # Stateless I/O singletons (persistence, sync, haptics)
├── styles/tokens.css            # CSS custom property definitions (all color tokens)
├── lib/                         # Pure utility functions
└── assets/                      # Static assets (icons, images)
```

### Key Screens

| Screen                    | Route                 | Description                                 |
| ------------------------- | --------------------- | ------------------------------------------- |
| `SplashScreen`            | —                     | Brief branded splash on app launch          |
| `OnboardingWelcomeScreen` | `/onboarding`         | First-run welcome page                      |
| `OnboardingSetupScreen`   | `/onboarding/setup`   | Category creation during onboarding         |
| `OnboardingSyncScreen`    | `/onboarding/sync`    | Cloud sync opt-in                           |
| `OnboardingInstallScreen` | `/onboarding/install` | Add-to-homescreen instructions              |
| `MainScreen`              | `/`                   | Primary checklist view with category picker |
| `SettingsSheet`           | —                     | Bottom sheet overlay for settings           |

## Development Notes

- **Mobile-First Design**: Optimized for iPhone Safari with safe-area insets for the notch and home indicator.
- **Gestures**: Uses the Pointer Events API exclusively (`onPointerDown`, `onPointerMove`, `onPointerUp`) — no mouse-specific events.
- **Theming**: Applied via a `data-theme` attribute on `document.documentElement`, using CSS custom properties defined in `src/styles/tokens.css`. Tailwind's `dark:` variant is not used for themed colors.
- **Routing**: `HashRouter` is required for GitHub Pages compatibility and must not be changed to `BrowserRouter`.
- **Linting**: ESLint configured for TypeScript and React.
- **No Test Suite**: Validation is done via `npm run build` (`tsc --noEmit && vite build`).

## Documentation

Detailed reference documentation lives in `docs/reference/`:

- `getting-started.md` — Setup and deployment
- `architecture-overview.md` — App entry flow, layer contracts
- `project-structure.md` — Folder rules, naming conventions
- `state-management.md` — Stores, reducers, actions
- `data-models.md` — TypeScript types and interfaces
- `services.md` — PersistenceService, SettingsService, HapticService
- `theming-and-colors.md` — Appearance modes, CSS tokens
- `ui-patterns.md` — iOS-feel patterns, gestures, animations
- `pwa-configuration.md` — Service worker, manifest, icons

Design plans and UI snapshots are in `docs/plans/` and `docs/snapshots/`.

## Contributing

1. Follow the strict change discipline outlined in `.github/copilot-instructions.md`.
2. Use the specified naming conventions and folder structure.
3. Ensure mobile-first, iOS-feel UI/UX.
4. Run `npm run build` and fix all errors before submitting changes.
