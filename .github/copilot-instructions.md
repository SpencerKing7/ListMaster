# Copilot Instructions

> **These rules are STRICT. Do not deviate from them under any circumstances.**
> Always read the referenced docs before making changes to the areas they cover.

This is a **React + TypeScript PWA** (Progressive Web App) built with Vite, Tailwind CSS v4, and shadcn/ui. It is the web port of the ListMaster iOS app. The tech stack is: React 19, TypeScript 5, React Router v7, Zustand-style Context/Reducer stores, Tailwind CSS v4, shadcn/ui components, and `vite-plugin-pwa`.

---

## Change Discipline (STRICT)

- **All file changes must occur inside the workspace** (`/Users/spencerking/Documents/Swift/ListMasterPWA`). Never create, edit, or delete files outside this directory unless the user explicitly and clearly instructs otherwise.
- **Only modify code directly related to the current task.** Do not refactor, reorganize, or "improve" unrelated code while making a fix.
- Before editing a file, identify the **minimal set of lines** that must change. Leave everything else untouched.
- If a fix requires touching multiple files, each file change must be clearly justified by the task at hand.
- **Never introduce new patterns, helpers, or abstractions** unless the task explicitly requires them.
- When fixing a bug, do not simultaneously change styling, naming, or structure of surrounding code.

---

## Project Structure (STRICT)

The `src/` directory follows a **feature-by-layer** folder convention. Every file MUST live in the correct folder. **Do not create files at the `src/` root level** (except `App.tsx`, `main.tsx`, `index.css`, and `vite-env.d.ts`).

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
│   ├── OnboardingWelcomeScreen.tsx
│   ├── OnboardingSetupScreen.tsx
│   └── SettingsSheet.tsx
├── components/           # Reusable UI building blocks
│   ├── BottomBar.tsx
│   ├── CategoryPanel.tsx
│   ├── CategoryPicker.tsx
│   ├── HeaderBar.tsx
│   └── ui/               # shadcn/ui primitives (do not edit directly)
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── sheet.tsx
│       ├── toggle-group.tsx
│       └── toggle.tsx
├── services/             # Side-effectful singletons (localStorage, network, etc.)
│   └── persistenceService.ts
├── styles/               # CSS design token files imported by index.css
│   └── tokens.css
└── lib/
    └── utils.ts          # Shared pure utility functions (cn(), etc.)
```

### Folder Rules

| Folder           | What belongs here                                                             | What does NOT belong here                                 |
| ---------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| `models/`        | TypeScript `interface` and `type` definitions — pure data shapes, no logic    | Classes, stores, components, anything with side-effects   |
| `store/`         | React Context providers + `useReducer`/`useState` hooks that own global state | Persistence logic, component rendering, direct DOM access |
| `screens/`       | Top-level components rendered by `<Route>` — one file per screen or sheet     | Reusable building blocks, business logic                  |
| `components/`    | Reusable UI components not tied to a specific screen's data model             | Screen-level views, store logic                           |
| `components/ui/` | shadcn/ui generated primitives. **Do not hand-edit these.**                   | Custom app components                                     |
| `services/`      | Stateless singletons that perform I/O (localStorage, fetch, etc.)             | React state, components, types                            |
| `styles/`        | CSS custom property token files                                               | TypeScript/TSX source files                               |
| `lib/`           | Pure, framework-agnostic utility functions                                    | React hooks, store logic, components                      |

### Naming Conventions (STRICT)

- **Component files**: `PascalCase.tsx` (e.g. `CategoryPanel.tsx`).
- **Non-component TS files**: `camelCase.ts` (e.g. `persistenceService.ts`, `useCategoriesStore.ts`).
- **React components and types/interfaces**: `PascalCase`.
- **Variables, functions, parameters, hook names**: `camelCase`.
- **Constants**: `camelCase` for module-level, `SCREAMING_SNAKE_CASE` only for true compile-time primitives (e.g. `const MAX_ITEMS = 100`).
- **Boolean variables**: read as assertions — `isEmpty`, `isChecked`, `hasCompletedOnboarding`. Never prefix with `get`.
- **Custom hooks**: always prefix with `use` (e.g. `useCategoriesStore`, `useSettingsStore`).
- **Event handler props**: prefix with `on` (e.g. `onOpenSettings`, `onOpenChange`).

### Architecture Rules (STRICT)

1. **Models are inert.** `src/models/types.ts` holds only `interface` and `type` declarations. No functions, no classes, no imports.
2. **Stores own global mutable state.** Stores use React Context + `useReducer` or `useState`. All mutations go through dispatched actions or explicit setter functions — never mutate state directly.
3. **Components are declarative.** They read from stores and call store methods. They never call `localStorage` directly or perform other I/O.
4. **Services encapsulate all I/O.** `PersistenceService` is the only layer allowed to read/write `localStorage`. Stores call service methods; components do not.
5. **Never call `localStorage` directly inside a component or store reducer.** Route all persistence through `PersistenceService`.
6. **One screen = one file** in `src/screens/`. Do not combine multiple screens or sheets in a single file.
7. **Reusable components must not import from `src/screens/`** and must not be tightly coupled to a specific screen's data.
8. **`useState` for local UI state only** — e.g. input field values, modal open/close booleans. Never hold app-level data in local state.
9. **`useReducer` for multi-action store state** (see `useCategoriesStore.ts`). All actions must go through the reducer — no direct `setState` bypasses.
10. **Context providers wrap the whole app** in `main.tsx`. Never instantiate a provider inside a screen or component.
11. **`HashRouter` is used for routing** (required for GitHub Pages / PWA deployment). Do not switch to `BrowserRouter`.

---

## UI Development (STRICT)

This app targets a **mobile-first, iOS-feel** experience. Before making **any** UI edits:

1. Read `docs/snapshots/main-screen-ui-snapshot.md` — it documents the exact current HTML structure, scroll chain, layout mechanics, known issues, and what is confirmed working for every main screen component. Do not make a UI change without first understanding how the component you are touching fits into this structure.
2. Read `docs/plans/ios-feel-overhaul.md` for design intent and iOS-feel rules.

### Key Rules

- Use `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` in inline styles for header and footer padding to respect the iOS notch and home indicator.
- Prefer `active:scale-[0.96]` or similar press-down feedback on interactive elements over hover-only states.
- Animations should feel native: use spring-like easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`) for snap animations, and `ease-out` for dismissals.
- The `SettingsSheet` slides up from the bottom using the shadcn `Sheet` component. Do not replace it with a page navigation.
- Swipe gestures (horizontal page swipe in `MainScreen`, drag-to-scroll in `CategoryPicker`) use Pointer Events API (`onPointerDown`, `onPointerMove`, `onPointerUp`). Always call `setPointerCapture` once a drag is confirmed.
- **Rubber-band resistance**: when swiping past an edge, apply a `0.15` dampening factor to the drag offset.
- Apply `touch-action: manipulation` to buttons and interactive elements to eliminate the 300 ms tap delay.
- Use `user-select: none` on drag targets to prevent text selection during gestures.

---

## Theming / Appearance (STRICT)

- The app-wide color scheme is managed by `useTheme.ts` (`src/store/useTheme.ts`) and `useSettingsStore.ts`.
- Theme is applied by setting the `data-theme` attribute on `document.documentElement` via `applyThemeToDOM()`. Do **not** use any React state or class toggling for theme switching.
- `applyThemeToDOM()` is called **synchronously** inside the `useState` initializer in `SettingsProvider` to prevent a flash of wrong theme on load — do not move this call out of the initializer.
- `"system"` mode removes `data-theme` entirely, allowing `@media (prefers-color-scheme: dark)` to control the theme.
- `"light"` / `"dark"` set `data-theme="light"` or `data-theme="dark"`, overriding the media query via the `:root[data-theme]` selectors in `tokens.css`.
- **Do not use Tailwind's `dark:` variant** for themed colors. All theme-sensitive values must use CSS custom properties from `tokens.css` (e.g. `var(--color-brand-green)`).

---

## Color System (STRICT)

- All brand colors are defined as CSS custom properties in `src/styles/tokens.css` under `:root`, `@media (prefers-color-scheme: dark)`, `:root[data-theme="light"]`, and `:root[data-theme="dark"]`.
- Token categories:
  - `--color-brand-*` — primary brand palette (green, teal, blue, deep-green)
  - `--color-surface-*` — background, card, input, tint surfaces
  - `--color-text-*` — primary and secondary text
  - `--color-danger` — destructive actions
- **Never hard-code color hex values in component files.** Always use a CSS custom property: `var(--color-brand-green)`, `var(--color-surface-card)`, etc.
- Tailwind utility classes that reference brand tokens (e.g. `text-brand-green`, `bg-surface-card`) are available via the `@theme inline` block in `index.css`. Prefer these where Tailwind classes are already in use.
- When adding a new color: (1) add it to all four rule blocks in `tokens.css`, (2) add a corresponding `@theme inline` alias in `index.css`.

---

## CategoryPicker (Drag-to-Scroll Pattern)

`src/components/CategoryPicker.tsx` renders a horizontally scrollable row of category pill buttons. When modifying this component:

### Architecture

- The pill row is a `div` with `overflow-x: auto` and `scrollbar-width: none` to hide the native scrollbar.
- A `useEffect` watches `selectedCategoryID` and calls `scrollIntoView({ behavior: "smooth", inline: "center" })` on the selected pill whenever selection changes.
- Drag-to-scroll is implemented with Pointer Events on the container (`onPointerDown`, `onPointerMove`, `onPointerUp`/`onPointerLeave`). `setPointerCapture` is called once horizontal drag intent is confirmed (delta > 5px).
- A `hasDraggedRef` boolean prevents the `onClick` on a pill from firing after a drag gesture — check `hasDraggedRef.current` in the click handler before calling `selectCategory`.

### Anti-Patterns

- **Do not use mouse-specific events** (`onMouseDown`, etc.) — use Pointer Events only so touch and stylus are handled uniformly.
- **Do not animate `scrollLeft` manually** for the selection-follow behaviour — use `scrollIntoView` instead.

---

## TypeScript Style Rules (STRICT)

1. **Always add JSDoc comments** (`/** ... */`) to exported functions, components, and types.
2. **Use `// MARK: - Section Name`** comments to organize large files into sections (mirrors Swift convention, readable in editors).
3. **Prefer `const` over `let`** wherever the value is not reassigned.
4. **Prefer `interface` over `type`** for object shapes. Use `type` for unions, intersections, and aliases.
5. **No non-null assertions** (`value!`) except where failure is a genuine programmer error — add a comment explaining why.
6. **No `as` type casts** except when narrowing from a DOM API where TypeScript cannot infer the type (e.g. `e.target as HTMLInputElement`).
7. **Boolean variables**: use `isEmpty`, `isChecked`, `hasItems` — never `getIsChecked` or `checkIsEmpty`.
8. **Early returns**: use `if (!condition) return;` guards at the top of functions instead of deeply nested `if` blocks.
9. **String interpolation**: prefer template literals over concatenation.
10. **Collections**: prefer `.length === 0` check via `array.length === 0` or abstract it — or use optional chaining (`.some(...)` is preferred for "has any matching" checks).
11. **Imports**: use the `@/` path alias for all `src/`-relative imports (e.g. `import { useCategoriesStore } from "@/store/useCategoriesStore"`). Never use relative `../` paths from `components/` or `screens/`.
12. **React imports**: do not import `React` explicitly — the JSX transform handles it. Only import named hooks and types from `"react"`.
