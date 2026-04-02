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
├── store/                # React Context + useReducer stores (global state)
│   ├── useCategoriesStore.ts
│   ├── useSettingsStore.ts
│   └── useTheme.ts
├── screens/              # Full-screen route components (one per route)
│   ├── MainScreen.tsx
│   ├── OnboardingInstallScreen.tsx
│   ├── OnboardingWelcomeScreen.tsx
│   ├── OnboardingSetupScreen.tsx
│   ├── SettingsSheet.tsx
│   └── SplashScreen.tsx
├── components/           # Reusable UI building blocks
│   ├── BottomBar.tsx
│   ├── CategoryPanel.tsx
│   ├── CategoryPicker.tsx
│   ├── HeaderBar.tsx
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
├── services/             # Side-effectful singletons (localStorage, vibration, etc.)
│   ├── hapticService.ts
│   ├── persistenceService.ts
│   └── settingsService.ts
├── styles/               # CSS design token files imported by index.css
│   └── tokens.css
└── lib/
    └── utils.ts          # Shared pure utility functions (cn(), etc.)
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
