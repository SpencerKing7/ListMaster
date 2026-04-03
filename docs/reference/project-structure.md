# Project Structure & File Conventions

---

## Directory Layout

```
src/
├── App.tsx               # Root component — routing and top-level providers only
├── main.tsx              # ReactDOM.createRoot entry point
├── index.css             # Tailwind imports, @theme tokens, global resets
├── vite-env.d.ts         # Vite type declarations
├── assets/               # Static assets imported by components (images, SVGs)
├── models/               # Plain TypeScript interfaces and types — no logic, no I/O
│   └── types.ts
├── store/                # React Context + useReducer/useState stores (global state)
│   ├── useCategoriesStore.ts   # Provider + public hook
│   ├── categoriesReducer.ts    # Pure reducer + StoreAction union
│   ├── useCategoryActions.ts   # Stable dispatch wrappers
│   ├── useCategoryDerived.ts   # Computed/derived values
│   ├── useCloudSync.ts         # Firestore sync lifecycle
│   ├── categoryHandlers.ts     # Category domain reducer handlers
│   ├── itemHandlers.ts         # Item domain reducer handlers
│   ├── groupHandlers.ts        # Group domain reducer handlers
│   ├── reducerHelpers.ts       # Shared pure helpers for handlers
│   ├── useSettingsStore.ts     # Settings provider + hook
│   ├── useSyncStore.tsx        # Sync provider + hook
│   └── useTheme.ts             # DOM theme/text-size application utilities
├── screens/              # Full-screen route components (one per route)
│   ├── MainScreen.tsx
│   ├── OnboardingInstallScreen.tsx
│   ├── OnboardingWelcomeScreen.tsx
│   ├── OnboardingSetupScreen.tsx
│   ├── OnboardingSyncScreen.tsx
│   ├── SettingsSheet.tsx
│   └── SplashScreen.tsx
├── components/           # Reusable UI building blocks
│   ├── AddItemInput.tsx
│   ├── BottomBar.tsx
│   ├── CategoryPanel.tsx
│   ├── CategoryPicker.tsx
│   ├── ChecklistItemRow.tsx
│   ├── EmptyState.tsx
│   ├── GroupTabBar.tsx
│   ├── HeaderBar.tsx
│   ├── ListMetaBar.tsx
│   ├── OnboardingCategoryInput.tsx
│   ├── OnboardingSyncCodeInput.tsx
│   ├── PageIndicator.tsx
│   ├── PageTransitionWrapper.tsx
│   ├── SwipeableRow.tsx
│   └── ui/               # shadcn/ui primitives — do not hand-edit
│       ├── action-sheet.tsx
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── sheet.tsx
│       ├── toggle-group.tsx
│       └── toggle.tsx
├── features/             # Feature-scoped modules
│   └── settings/         # Settings feature (used by SettingsSheet)
│       ├── index.ts              # Barrel exports
│       ├── constants.ts          # Settings-specific constants
│       ├── components/           # Section components (CategoriesGroupsSection, etc.)
│       ├── hooks/                # useCategoryDrag, useGroupDrag, useSettingsDialogs
│       └── utils/                # Settings-specific utilities
├── services/             # Side-effectful singletons (localStorage, vibration, etc.)
│   ├── firebaseConfig.ts
│   ├── hapticService.ts
│   ├── persistenceService.ts
│   ├── settingsService.ts
│   └── syncService.ts
├── styles/               # CSS design token files imported by index.css
│   └── tokens.css
└── lib/
    └── utils.ts          # Shared pure utility functions (cn(), generateSyncCode(), etc.)
```

---

## Folder Rules

| Folder           | What belongs here                                                             | What does NOT belong here                                 |
| ---------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| `models/`        | TypeScript `interface` and `type` declarations — pure data shapes, no logic   | Classes, stores, components, anything with side-effects   |
| `store/`         | React Context providers + `useReducer`/`useState` hooks that own global state | Persistence logic, component rendering, direct DOM access |
| `screens/`       | Top-level components rendered by `<Route>` — one file per screen or sheet     | Reusable building blocks, business logic                  |
| `components/`    | Reusable UI components not tied to a specific screen's data model             | Screen-level views, store logic                           |
| `components/ui/` | shadcn/ui generated primitives. **Do not hand-edit these.**                   | Custom app components                                     |
| `features/`      | Feature-scoped modules with their own `components/`, `hooks/`, `utils/`       | Code not belonging to that feature                        |
| `services/`      | Stateless singletons that perform I/O (localStorage, fetch, etc.)             | React state, components, types                            |
| `styles/`        | CSS custom property token files                                               | TypeScript/TSX source files                               |
| `lib/`           | Pure, framework-agnostic utility functions                                    | React hooks, store logic, components                      |

---

## Naming Conventions

| Thing                            | Convention             | Example                                          |
| -------------------------------- | ---------------------- | ------------------------------------------------ |
| Component files                  | `PascalCase.tsx`       | `CategoryPanel.tsx`                              |
| Non-component TS files           | `camelCase.ts`         | `persistenceService.ts`                          |
| React components                 | `PascalCase`           | `CategoryPanel`                                  |
| Variables, functions, parameters | `camelCase`            | `selectedCategoryID`                             |
| Module-level constants           | `camelCase`            | `defaultSortOrder`                               |
| True compile-time primitives     | `SCREAMING_SNAKE_CASE` | `MAX_ITEMS`                                      |
| Boolean variables                | Assertion form         | `isEmpty`, `isChecked`, `hasCompletedOnboarding` |
| Custom hooks                     | `use` prefix           | `useCategoriesStore`                             |
| Event handler props              | `on` prefix            | `onOpenSettings`, `onOpenChange`                 |

---

## Import Path Alias

The `@/` alias maps to `src/`. Always use it for cross-folder imports:

```ts
// ✅ Correct
import { useCategoriesStore } from "@/store/useCategoriesStore";
import type { Category } from "@/models/types";

// ❌ Wrong — never use relative paths across folders
import { useCategoriesStore } from "../../store/useCategoriesStore";
```

---

## `components/ui/` — shadcn/ui Primitives

Files under `src/components/ui/` are generated and managed by the shadcn/ui CLI. **Do not hand-edit them.** To update or add a primitive, use the shadcn CLI and commit the generated output. Custom app components must never live in this folder.
