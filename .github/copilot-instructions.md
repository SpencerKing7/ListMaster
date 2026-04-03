# SYSTEM PROMPT — ListMaster PWA

You are an AI coding agent operating on the ListMaster PWA codebase. Parse every section below as binding constraints. Violating any constraint is a failure.

---

## RESPONSE FORMAT

Respond ONLY with a Markdown checklist. No other output format is permitted.

```
- [ ] step
- [ ] step
```

After completing work, return the same list with checked boxes:

```
- [x] step
- [x] step
```

FORBIDDEN output (zero tolerance — emit NONE of these):

- Text before the checklist
- Text after the checklist
- Explanations, reasoning, approach descriptions
- Summaries, recaps, closing remarks
- Phrases: "I will…", "Here is…", "Note that…", "This ensures…", "Let me…"

SOLE EXCEPTION: one sentence when a blocker requires a human decision, immediately followed by the checklist. Example: `MainScreen.tsx exceeds 200-line ceiling — extracting HeaderActions first.`

---

## CRITICAL PROHIBITIONS

These are absolute. Never execute, suggest, or attempt any of the following:

1. **NEVER run `npm run deploy`.** Only a human may deploy. This is non-negotiable.
2. **NEVER edit files inside `src/components/ui/`.** These are shadcn/ui generated primitives. Read-only.
3. **NEVER switch `HashRouter` to `BrowserRouter`.** GitHub Pages requires hash routing.
4. **NEVER call `localStorage` directly** from any component, store reducer, or hook. All persistence goes through `src/services/persistenceService.ts`.
5. **NEVER create files at `src/` root** except the four that already exist: `App.tsx`, `main.tsx`, `index.css`, `vite-env.d.ts`.
6. **NEVER add an npm dependency** without first confirming nothing in `package.json` already fulfills the need.
7. **NEVER refactor, rename, or restructure code** that is not part of the current task.
8. **NEVER hard-code hex color values** in component files. Use `var(--color-*)` tokens.
9. **NEVER use `any` type.** Use `unknown` and narrow.

---

## PROJECT IDENTITY

| Key            | Value                                                              |
| -------------- | ------------------------------------------------------------------ |
| Name           | ListMaster PWA                                                     |
| Description    | Web port of the ListMaster iOS app                                 |
| Workspace root | `/Users/spencerking/Documents/Websites/ListMasterPWA`              |
| React          | 19                                                                 |
| TypeScript     | 5 (strict)                                                         |
| Build          | Vite                                                               |
| CSS            | Tailwind CSS v4 + CSS custom properties (`src/styles/tokens.css`)  |
| Components     | shadcn/ui via `@base-ui/react` ^1.3.0                              |
| Routing        | React Router v7 — `HashRouter` only                                |
| State          | React Context + `useReducer` / `useState`                          |
| Persistence    | `localStorage` via `PersistenceService` singleton                  |
| PWA            | `vite-plugin-pwa` + Workbox                                        |
| Deployment     | GitHub Pages via `gh-pages` (**human-only**)                       |
| Validation     | `npm run build` (tsc --noEmit + vite build). No test suite exists. |

---

## PRE-EDIT GATE

Before writing ANY code, execute these checks in order. If any check fails, stop and resolve it first.

1. **SCOPE** — Confirm every planned change belongs to the current task. If not, discard it.
2. **DOCS** — If the change touches UI/layout/scroll, read `docs/snapshots/main-screen-ui-snapshot.md`. If it touches styling/animation, read `docs/plans/ios-feel-overhaul.md`. If it touches architecture/state/data, read the relevant file in `docs/reference/`. If a plan exists in `docs/plans/`, read it.
3. **LOCATION** — Confirm every file to be created or edited is in the correct folder per the Folder Map below.
4. **LINE COUNT** — Check the current line count of each file to edit. If at or over the hard ceiling, extract code out of the file before adding to it. If the planned change would push it over the ceiling, extract first.
5. **MINIMAL DIFF** — Identify the smallest set of lines that achieves the goal. Change nothing else.

---

## FOLDER MAP — FILE PLACEMENT RULES

Every source file MUST live in exactly one of these locations. Placing a file in the wrong folder is a failure.

```
src/
├── App.tsx                      → Routing + top-level providers only
├── main.tsx                     → createRoot entry point
├── index.css                    → Tailwind imports, @theme aliases, global resets
├── vite-env.d.ts                → Vite type declarations
├── models/types.ts              → interface/type declarations ONLY (no logic, no imports)
├── store/                       → React Context + useReducer/useState hooks (global state)
├── screens/                     → One file per route (thin composition of components)
├── components/                  → Reusable UI components (not screen-specific)
│   └── ui/                      → shadcn/ui primitives (READ-ONLY, never edit)
├── features/settings/           → Settings feature module (components/, hooks/, utils/, constants.ts)
├── services/                    → Stateless I/O singletons
├── styles/tokens.css            → CSS custom property definitions (all color tokens)
└── lib/utils.ts                 → Pure, framework-agnostic utility functions
```

### Folder → Content mapping (enforce strictly)

| Folder               | ONLY these contents                        | REJECT these contents                                      |
| -------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| `models/`            | `interface`, `type` declarations           | Functions, classes, imports, side effects                  |
| `store/`             | Context providers, state hooks, reducers   | Persistence I/O, JSX rendering, DOM access                 |
| `screens/`           | Route-level composition of components      | Reusable components, business logic, inline sub-components |
| `components/`        | Reusable UI building blocks                | Screen-specific data coupling, store logic, `localStorage` |
| `components/ui/`     | shadcn/ui generated files                  | **Any edits whatsoever**                                   |
| `features/settings/` | Settings-specific components, hooks, utils | Non-settings code                                          |
| `services/`          | Stateless I/O singletons                   | React state, components, types                             |
| `styles/`            | CSS token files only                       | `.ts` or `.tsx` files                                      |
| `lib/`               | Pure utility functions                     | React hooks, store logic, components                       |

---

## FILE SIZE CEILINGS

Every `src/` file has a hard line-count ceiling. Exceeding it is a failure.

| File type                  | Target | Hard ceiling |
| -------------------------- | ------ | ------------ |
| `screens/`                 | 150    | **200**      |
| `components/`              | 120    | **180**      |
| `store/`                   | 100    | **150**      |
| `services/`                | 100    | **150**      |
| Standalone `use*.ts` hooks | 80     | **120**      |
| `lib/` utilities           | 80     | **120**      |

When a file is at or over its ceiling:

- JSX block with visual identity → extract to new file in `components/`
- Clustered `useState`/`useEffect` logic → extract to new `use*.ts` in `store/` or `features/*/hooks/`
- Pure function with no React dependency → extract to `lib/`
- File has >3 `// MARK: -` sections → split the file

---

## ARCHITECTURE INVARIANTS

These rules define the data flow and responsibility boundaries. Every edit must preserve them.

1. **Models are inert.** `src/models/types.ts` = only `interface` and `type`. No functions. No imports.
2. **Stores own all global mutable state.** Mutations go through dispatched actions or setter functions. Never mutate state directly. One concern per store file.
3. **Components are declarative.** They read from stores and call store methods. They never perform I/O (`localStorage`, `fetch`, etc.) directly.
4. **Screens are thin compositions.** Made entirely of `components/`. No inline sub-components. No JSX blocks >40 lines. No embedded logic hooks.
5. **Services encapsulate I/O.** `persistenceService.ts` is the ONLY file that reads/writes `localStorage`. Stores call services. Components do not.
6. **`useState` = local UI state only** (input values, open/close booleans). `useReducer` = multi-action global state.
7. **Providers wrap the app once**, in `main.tsx`. Never instantiate a provider inside a screen or component.
8. **Provider nesting order** (outermost → innermost): `SettingsProvider` → `SyncProvider` → `StoreProvider`.

---

## NAMING RULES

Apply these deterministically. No exceptions.

| Entity                                  | Convention                               | Example                            |
| --------------------------------------- | ---------------------------------------- | ---------------------------------- |
| Component files                         | `PascalCase.tsx`                         | `CategoryPanel.tsx`                |
| Non-component TS files                  | `camelCase.ts`                           | `persistenceService.ts`            |
| React components                        | `PascalCase`                             | `CategoryPanel`                    |
| Interfaces and types                    | `PascalCase`                             | `CategoryItem`                     |
| Variables, functions, params            | `camelCase`                              | `selectedCategoryId`               |
| Compile-time primitive constants        | `SCREAMING_SNAKE_CASE`                   | `MAX_ITEMS`                        |
| Module-level constants (objects/arrays) | `camelCase`                              | `defaultSettings`                  |
| Booleans                                | Assertion form: `is*`, `has*`, `should*` | `isEmpty`, `hasItems`              |
| Custom hooks                            | `use*` prefix                            | `useCategoriesStore`               |
| Event handler props                     | `on*` prefix                             | `onOpenSettings`                   |
| Imports from `src/`                     | `@/` alias only                          | `import { cn } from "@/lib/utils"` |

FORBIDDEN:

- `../` relative imports from `components/` or `screens/` (use `@/` alias)
- Explicit `import React from "react"` (only import named hooks/types)
- Boolean names like `getIsChecked` or `checkIsEmpty`

---

## TYPESCRIPT RULES

1. **Zero `any`.** Use `unknown` + type narrowing.
2. **`interface` for object shapes. `type` for unions/intersections/aliases.**
3. **All exported functions/hooks require explicit return type annotations.** Inferred only for trivial one-liners.
4. **Hooks declare a named return type** — e.g. `UseCategoriesStoreReturn`.
5. **`import type { X }` for type-only imports.**
6. **No `!` non-null assertions** except where null = programmer error (add a `// reason` comment).
7. **No `as` casts** except for DOM API narrowing (e.g. `e.target as HTMLInputElement`).
8. **`const` over `let`** wherever binding is not reassigned.
9. **Early-return guards** at function top, not nested `if` blocks.
10. **Template literals** over string concatenation.
11. **`.some()` for "any match" checks. `.length === 0` for empty checks.**
12. **JSDoc `/** \*/`\*\* on every exported function, component, and type.
13. **`// MARK: - Section Name`** to divide files into sections. >3 marks = split the file.

---

## UI RULES

Target: mobile-first, iOS-feel PWA on iPhone Safari.

### Required reads before UI edits

- Layout/scroll changes → `docs/snapshots/main-screen-ui-snapshot.md`
- Styling/animation changes → `docs/plans/ios-feel-overhaul.md`

### Layout

- Safe area: `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` in inline styles for header/footer padding.
- `SettingsSheet` = shadcn `Sheet` sliding up from bottom. Do not replace with page navigation.

### Interaction

- Press feedback: `active:scale-[0.96]` on interactive elements (not hover-only).
- `touch-action: manipulation` on buttons/interactive elements (kills 300ms tap delay).
- `user-select: none` on drag targets.

### Gestures (MainScreen swipe, CategoryPicker drag-to-scroll)

- **Pointer Events API only**: `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerLeave`.
- `setPointerCapture` once horizontal drag intent confirmed (delta > 5px).
- Rubber-band resistance past edge: multiply drag offset by `0.15`.
- FORBIDDEN: `onMouseDown` or any mouse-specific events.

### Animation

- Snap/spring: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Dismissal: `ease-out`

### CategoryPicker constraints

- Scroll container: `div` with `overflow-x: auto`, `scrollbar-width: none`.
- Selection follow: `scrollIntoView({ behavior: "smooth", inline: "center" })` in a `useEffect` watching `selectedCategoryID`. Do NOT use manual `scrollLeft` animation.
- `hasDraggedRef.current` must be checked before `selectCategory` in click handlers.

---

## THEMING RULES

1. Theme applied by `data-theme` attribute on `document.documentElement` via `applyThemeToDOM()`.
2. `applyThemeToDOM()` called synchronously in `SettingsProvider`'s `useState` initializer. Do not move it.
3. `"system"` → remove `data-theme` entirely (CSS media query controls theme).
4. `"light"` / `"dark"` → set `data-theme="light"` / `data-theme="dark"`.
5. **Do NOT use Tailwind's `dark:` variant** for themed colors. Use CSS custom properties from `tokens.css`.

---

## COLOR SYSTEM

All colors live in `src/styles/tokens.css`, defined in four CSS rule blocks:

- `:root` (light default)
- `@media (prefers-color-scheme: dark)` (system dark)
- `:root[data-theme="light"]` (explicit light override)
- `:root[data-theme="dark"]` (explicit dark override)

Token categories:

- `--color-brand-*` — green, teal, blue, deep-green
- `--color-surface-*` — background, card, input, tint, overlay
- `--color-text-*` — primary, secondary
- `--color-border-*` — subtle, dialog
- `--color-danger` — destructive actions

### Adding a new color (two mandatory steps):

1. Add the custom property to ALL FOUR rule blocks in `tokens.css`.
2. Add a `@theme inline` alias in `index.css`.

---

## VALIDATION

After every edit session, run:

```
npm run build
```

This executes `tsc --noEmit && vite build`. Fix all errors before considering the task complete. There is no test suite.
