# ListMaster PWA — Agent Instructions

## Output Format

Every response is a checklist. Nothing else.

Before doing any work, list every step as unchecked boxes. Complete the work. Return the same list with boxes checked. That is the entire response.

```
- [ ] Read docs/snapshots/main-screen-ui-snapshot.md
- [ ] Extract ItemRow into src/components/ItemRow.tsx
- [ ] Update MainScreen.tsx to import ItemRow
```

becomes:

```
- [x] Read docs/snapshots/main-screen-ui-snapshot.md
- [x] Extract ItemRow into src/components/ItemRow.tsx
- [x] Update MainScreen.tsx to import ItemRow
```

**These are banned in every response, without exception:**

- Preamble of any kind before the task list
- Explanations of what you are doing or why
- Descriptions of your approach or reasoning
- Summaries, recaps, or closing remarks
- Phrases like "I will...", "Here is...", "Note that...", "This ensures..."

**The only permitted prose** is a single sentence when a blocker requires a decision — e.g. `MainScreen.tsx exceeds 200-line ceiling — extracting HeaderActions first.` — followed immediately by the updated checklist. No other prose is ever acceptable.

---

## Project Identity

This is **ListMaster PWA** — a React + TypeScript Progressive Web App built with Vite. It is a web port of the ListMaster iOS app.

**Stack:** React 19, TypeScript 5, React Router v7, React Context + `useReducer` stores, Tailwind CSS v4, shadcn/ui, `vite-plugin-pwa`
**Workspace root:** `/Users/spencerking/Documents/Swift/ListMasterPWA`

---

## How to Use the Docs Folder

Before editing anything in an unfamiliar area, read the relevant doc first. Do not guess from context.

| You are about to touch…             | Read this first                             |
| ----------------------------------- | ------------------------------------------- |
| Any UI layout or scroll behavior    | `docs/snapshots/main-screen-ui-snapshot.md` |
| Any UI styling or animation         | `docs/plans/ios-feel-overhaul.md`           |
| Architecture, state, or data models | `docs/reference/` (pick the relevant file)  |
| A feature with an existing plan     | `docs/plans/`                               |

`docs/snapshots/` captures point-in-time HTML structure, confirmed-working behavior, and known issues. Treat it as ground truth for the current UI state.

---

## Before Every Edit — Decision Checklist

Work through these in order before writing any code:

1. **Scope** — Does this change belong to the current task? If not, leave it alone.
2. **Location** — Which file(s) need to change? Confirm each is in the correct folder (see [Folder Map]).
3. **Size** — Check the current line count of each file to be edited. If it is at or over its hard limit, extract before adding (see [File Size Rules]).
4. **Minimal diff** — Identify the smallest set of lines that achieves the goal. Leave all surrounding code untouched, including formatting, naming, and structure.
5. **Docs** — Does this change touch UI, theming, or a component with a snapshot? Read the relevant doc before proceeding.

---

## File Size Rules

Every `src/` file has a target and a hard ceiling. The hard ceiling is absolute — do not exceed it.

| File type                   | Target    | Hard ceiling  |
| --------------------------- | --------- | ------------- |
| Screen (`screens/`)         | 150 lines | **200 lines** |
| Component (`components/`)   | 120 lines | **180 lines** |
| Store (`store/`)            | 100 lines | **150 lines** |
| Service (`services/`)       | 100 lines | **150 lines** |
| Hook (standalone `use*.ts`) | 80 lines  | **120 lines** |
| Utility (`lib/`)            | 80 lines  | **120 lines** |

**If the file you are about to edit is already over its hard ceiling:** add one sentence to the task list flagging this, then extract before adding.

**If adding your code would push a file past its ceiling:** extract first, then add. Choose the right extraction type:

- A JSX block with a clear visual identity → new file in `components/`
- Clustered `useState`/`useEffect` logic → new `use*.ts` in `store/`
- A pure function with no React dependency → `lib/utils.ts` or a new file in `lib/`

**If a file needs more than three `// MARK: -` sections to stay navigable:** split the file, do not add another marker.

---

## Folder Map

```
src/
├── App.tsx               # Routing and top-level providers only
├── main.tsx              # ReactDOM.createRoot entry point
├── index.css             # Tailwind imports, @theme tokens, global resets
├── vite-env.d.ts         # Vite type declarations
├── assets/               # Static assets imported by components
├── models/
│   └── types.ts          # TypeScript interfaces and types ONLY — no logic, no imports
├── store/                # React Context + useReducer/useState global state hooks
│   ├── useCategoriesStore.ts
│   ├── useSettingsStore.ts
│   └── useTheme.ts
├── screens/              # One file per route — thin compositions only
│   ├── MainScreen.tsx
│   ├── OnboardingWelcomeScreen.tsx
│   ├── OnboardingSetupScreen.tsx
│   └── SettingsSheet.tsx
├── components/           # Reusable UI components not tied to a specific screen
│   ├── BottomBar.tsx
│   ├── CategoryPanel.tsx
│   ├── CategoryPicker.tsx
│   ├── HeaderBar.tsx
│   └── ui/               # shadcn/ui primitives — read-only, do not edit
├── services/
│   └── persistenceService.ts   # The only file allowed to read/write localStorage
├── styles/
│   └── tokens.css        # CSS custom property definitions — all color tokens live here
└── lib/
    └── utils.ts          # Pure, framework-agnostic utility functions (cn(), etc.)
```

**Each folder accepts exactly one category of code:**

| Folder           | Accepts                                  | Rejects                                    |
| ---------------- | ---------------------------------------- | ------------------------------------------ |
| `models/`        | `interface` and `type` declarations only | Logic, functions, imports, side effects    |
| `store/`         | Context providers and state hooks        | Persistence logic, JSX, direct DOM access  |
| `screens/`       | Route-level composition components       | Reusable components, business logic        |
| `components/`    | Reusable UI components                   | Screen-specific data coupling, store logic |
| `components/ui/` | shadcn/ui generated files                | Any hand-edits whatsoever                  |
| `services/`      | Stateless I/O singletons                 | React state, components, types             |
| `styles/`        | CSS token files                          | Any `.ts` or `.tsx` files                  |
| `lib/`           | Pure utility functions                   | React hooks, store logic, components       |

---

## Architecture Rules

**Models** — `src/models/types.ts` holds only `interface` and `type` declarations. No functions, no classes, no imports of any kind.

**Stores** — Own all global mutable state via React Context + `useReducer` or `useState`. Mutations go through dispatched actions or explicit setter functions only — never direct state mutation. One concern per store file; if a file manages two unrelated state slices, split it.

**Components** — Read from stores and call store methods. They never call `localStorage`, `fetch`, or any other I/O directly. They never import from `src/screens/`.

**Screens** — Composed entirely of components from `src/components/`. A screen file contains no inline sub-components, no embedded logic hooks, and no JSX blocks exceeding ~40 lines. If a visual section needs 40+ lines of JSX, extract it to `components/` first.

**Services** — `PersistenceService` is the only file in the codebase that reads or writes `localStorage`. Stores call its methods. Components do not call it.

**State scope** — `useState` for local UI state only (input values, open/close booleans). `useReducer` for multi-action global state. Never hold app-level data in component-local state.

**Providers** — Context providers are instantiated once, in `main.tsx`. Never inside a screen or component.

**Routing** — `HashRouter` only. Required for GitHub Pages and PWA deployment. Do not switch to `BrowserRouter`.

---

## Naming Conventions

| Thing                            | Convention             | Example                                          |
| -------------------------------- | ---------------------- | ------------------------------------------------ |
| Component files                  | `PascalCase.tsx`       | `CategoryPanel.tsx`                              |
| Non-component TS files           | `camelCase.ts`         | `persistenceService.ts`                          |
| React components                 | `PascalCase`           | `CategoryPanel`                                  |
| TypeScript interfaces and types  | `PascalCase`           | `CategoryItem`                                   |
| Variables, functions, parameters | `camelCase`            | `selectedCategoryId`                             |
| Compile-time primitive constants | `SCREAMING_SNAKE_CASE` | `MAX_ITEMS`                                      |
| Module-level constants           | `camelCase`            | `defaultSettings`                                |
| Boolean variables                | Assertion form         | `isEmpty`, `isChecked`, `hasCompletedOnboarding` |
| Custom hooks                     | `use` prefix           | `useCategoriesStore`                             |
| Event handler props              | `on` prefix            | `onOpenSettings`, `onOpenChange`                 |

---

## TypeScript Rules

**Types**

- Zero `any`. Use `unknown` and narrow it if the type is genuinely uncertain.
- `interface` for object shapes. `type` for unions, intersections, and aliases.
- All exported functions and hooks must have explicit return type annotations. Inferred return types are only acceptable for trivial one-line expressions.
- Hooks must declare a named return type interface — e.g. `UseCategoriesStoreReturn`.
- `import type { X }` for all type-only imports.

**Assertions and casts**

- No non-null assertions (`value!`) except where a null value is a genuine programmer error — leave a comment explaining why.
- No `as` casts except to narrow a DOM API type that TypeScript cannot infer — e.g. `e.target as HTMLInputElement`.

**Code style**

- `const` over `let` wherever the binding is not reassigned.
- Early-return guards at the top of functions instead of nested `if` blocks.
- Template literals over string concatenation.
- `.some(...)` for "has any matching element" checks. `array.length === 0` for empty checks.
- All `src/`-relative imports use the `@/` alias — e.g. `import { useCategoriesStore } from "@/store/useCategoriesStore"`. No `../` paths from `components/` or `screens/`.
- Do not import `React` explicitly. Only import named hooks and types from `"react"`.

**Documentation**

- JSDoc (`/** ... */`) on every exported function, component, and type.
- `// MARK: - Section Name` to divide a file into named sections. More than three marks in one file means the file should be split, not further annotated.

---

## UI Rules

**Read before editing UI:**

- `docs/snapshots/main-screen-ui-snapshot.md` — current HTML structure, scroll chain, confirmed-working behavior, known issues.
- `docs/plans/ios-feel-overhaul.md` — design intent and iOS-feel specifications.

**Layout**

- Header and footer padding: `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` in inline styles.
- `SettingsSheet` uses the shadcn `Sheet` component sliding up from the bottom. Do not replace it with page navigation.

**Interaction**

- Interactive elements use `active:scale-[0.96]` for press feedback, not hover-only states.
- Apply `touch-action: manipulation` to buttons and interactive elements to remove the 300 ms tap delay.
- Apply `user-select: none` to drag targets.

**Gestures** — used in `MainScreen` (horizontal swipe) and `CategoryPicker` (drag-to-scroll):

- Use Pointer Events API only: `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerLeave`.
- Call `setPointerCapture` once horizontal drag intent is confirmed (delta > 5 px).
- Rubber-band resistance past an edge: multiply drag offset by `0.15`.
- Do not use `onMouseDown` or other mouse-specific events.

**Animation**

- Snap animations: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Dismissal animations: `ease-out`

---

## CategoryPicker — Specific Constraints

`src/components/CategoryPicker.tsx` is a horizontally scrollable pill row with custom drag-to-scroll behavior. When editing it:

- The scroll container is a `div` with `overflow-x: auto` and `scrollbar-width: none`.
- Selection-follow uses `scrollIntoView({ behavior: "smooth", inline: "center" })` triggered by a `useEffect` watching `selectedCategoryID`. Do not implement this with manual `scrollLeft` animation.
- A `hasDraggedRef` boolean gates the pill `onClick` — always check `hasDraggedRef.current` before calling `selectCategory` in a click handler.

---

## Theming

- Theme is applied by setting `data-theme` on `document.documentElement` via `applyThemeToDOM()`. Do not use React state or CSS class toggling for theme switching.
- `applyThemeToDOM()` is called synchronously inside the `useState` initializer in `SettingsProvider`. Do not move it — this placement prevents a flash of wrong theme on load.
- `"system"` → remove `data-theme` entirely, letting `@media (prefers-color-scheme: dark)` take over.
- `"light"` / `"dark"` → set `data-theme="light"` or `data-theme="dark"`, overriding the media query.
- Do not use Tailwind's `dark:` variant for themed colors. Use CSS custom properties from `tokens.css` instead.

---

## Color System

All colors are CSS custom properties in `src/styles/tokens.css`, defined in four blocks: `:root`, `@media (prefers-color-scheme: dark)`, `:root[data-theme="light"]`, `:root[data-theme="dark"]`.

**Token categories:**

- `--color-brand-*` — primary brand palette (green, teal, blue, deep-green)
- `--color-surface-*` — background, card, input, tint
- `--color-text-*` — primary and secondary text
- `--color-danger` — destructive actions

**Rules:**

- Never hard-code hex values in component files. Always reference a token: `var(--color-brand-green)`.
- Tailwind aliases for tokens (e.g. `text-brand-green`, `bg-surface-card`) are defined via `@theme inline` in `index.css`. Prefer these where Tailwind classes are already in use.
- Adding a new color requires two steps: (1) add it to all four blocks in `tokens.css`, (2) add a `@theme inline` alias in `index.css`.
