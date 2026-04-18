# ListMaster PWA — Cleanup & Maintenance Guide

> **For the coding agent:** Read this entire document before touching a single file. Follow every phase in order. Do not skip ahead. This is the authoritative reference for all cleanup, refactor, and maintenance tasks on the ListMaster PWA codebase.

---

## Your Mission

ListMaster PWA is a **React 19 + TypeScript 5** Progressive Web App built with Vite, Tailwind CSS v4, and React Router v7 (`HashRouter`). The architecture is well-established. Your job during any cleanup pass is to reduce file sizes, improve type safety, and keep documentation accurate — **without changing behavior, restructuring established conventions, or introducing new patterns**.

Think of yourself as a surgeon, not a demolition crew. Every cut must be precise and intentional.

**The two pillars of every cleanup pass:**

1. **Structure** — decompose oversized files into the correct existing folders per the Folder Map below.
2. **Documentation** — keep inline TSDoc and `docs/` snapshot/reference files accurate and up to date.

---

## Phase 0 — Audit First, Touch Nothing

Before writing a single line of code, produce a full audit report.

### 0.1 File Size Audit

Run `wc -l` across all `src/` files and list every file at or over its ceiling. Use the ceilings from the copilot instructions:

| File type                  | Target | Hard ceiling |
| -------------------------- | ------ | ------------ |
| `screens/`                 | 150    | **200**      |
| `components/`              | 120    | **180**      |
| `store/`                   | 100    | **150**      |
| `services/`                | 100    | **150**      |
| Standalone `use*.ts` hooks | 80     | **120**      |
| `lib/` utilities           | 80     | **120**      |

Output a table:

```
| File Path                                          | Lines | Over ceiling? | Concerns                        |
|----------------------------------------------------|-------|---------------|---------------------------------|
| src/features/settings/hooks/useGroupDrag.ts        |  306  | YES (+186)    | too many responsibilities       |
| src/store/categoriesReducer.ts                     |  299  | YES (+149)    | >3 MARK sections                |
| ...                                                |       |               |                                 |
```

### 0.2 TypeScript Health Audit

- Run `npm run build` (which runs `tsc --noEmit` + vite build) and record all errors.
- Flag every use of `any` — resolve with `unknown` + type narrowing.
- Flag every missing explicit return type on exported functions/hooks.
- Flag every missing `import type` for type-only imports.

### 0.3 Docs Currency Audit

- Read `docs/snapshots/main-screen-ui-snapshot.md` and `docs/snapshots/component-catalog.md`. Are they stale relative to current source files?
- Read `docs/reference/architecture-overview.md`. Does the provider nesting order, routing tree, and folder map still match `src/main.tsx` and `src/App.tsx`?
- List every `docs/plans/` file and classify it:

```
| File Path                              | Classification  | Action    |
|----------------------------------------|-----------------|-----------|
| docs/plans/firebase-sync-impl.md       | Active feature  | Keep      |
| docs/plans/some-old-idea.md            | Stale scratchpad| Delete    |
```

### 0.4 Dependency Map

For each oversized file, identify:

- What it imports and what imports it
- What state it owns vs. what it receives as props or from store hooks
- Any `useEffect` blocks with side effects

### 0.5 Declare the Work

For each file to be touched, state explicitly:

- Which JSX blocks become new files in `components/` or `features/settings/components/`
- Which logic clusters become new hooks in `store/` or `features/*/hooks/`
- Which pure helpers move to `lib/utils.ts`
- What `// MARK: -` sections the resulting file will have

Do not begin editing until this plan is complete.

---

## Phase 1 — Confirm the Established Folder Map

The folder structure is **already correct**. Do not create new top-level `src/` folders. Every new file goes into one of these existing locations:

```
src/
├── App.tsx                      → Routing + top-level providers only
├── main.tsx                     → createRoot entry point
├── index.css                    → Tailwind imports, @theme aliases, global resets
├── vite-env.d.ts                → Vite type declarations
├── models/types.ts              → interface/type declarations ONLY (no logic, no imports)
├── store/                       → React Context + useReducer/useState hooks (global state)
├── screens/                     → One file per route (thin composition of components)
├── components/                  → Reusable UI components
│   └── ui/                      → shadcn/ui primitives (READ-ONLY, never edit)
├── features/settings/           → Settings feature module
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── constants.ts
├── services/                    → Stateless I/O singletons
├── styles/tokens.css            → CSS custom property definitions
└── lib/utils.ts                 → Pure, framework-agnostic utility functions
```

**Hard rules — checked before every file is created:**

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

## Phase 2 — Decompose Oversized Files

Work through oversized files **one at a time**. Complete one file fully before starting the next.

### Step A — Identify Extraction Candidates

Look for these patterns inside a large file:

| Pattern                                                  | What to extract                | Destination                                          |
| -------------------------------------------------------- | ------------------------------ | ---------------------------------------------------- |
| JSX block with its own clear visual purpose              | New component file             | `components/` or `features/settings/components/`     |
| `useState` + related handlers that affect one UI section | Custom hook                    | `store/use*.ts` or `features/settings/hooks/use*.ts` |
| `useEffect` cluster with a single concern                | Custom hook                    | same as above                                        |
| Helper functions with no React dependency                | Pure utility                   | `lib/utils.ts`                                       |
| Repeated JSX structures (rows, cards)                    | New component with typed props | `components/`                                        |
| `// MARK: -` section count > 3                           | Split the file                 | per folder rules above                               |

### Step B — Extract with Zero Behavior Change

When extracting a component:

1. **Copy** the JSX block into a new `.tsx` file in the correct folder.
2. **Identify** every variable/prop it needs from the parent.
3. **Define a TypeScript `interface`** for its props directly above the component.
4. **Use `@/` alias imports** — never `../` from `components/` or `screens/`.
5. **Replace** the original JSX with the new `<ComponentName />` usage.
6. **Run `npm run build`** — fix all errors before moving on.

```tsx
// ✅ Correct — explicit interface, named export, @/ alias, JSDoc
/** Props for the {@link CategoryRow} component. */
interface CategoryRowProps {
  /** Display name of the category. */
  name: string;
  /** Called when the row is tapped. */
  onPress: () => void;
}

/** Single row in the category list. */
export function CategoryRow({ name, onPress }: CategoryRowProps): JSX.Element {
  return ( ... );
}

// ❌ Wrong — any types, default export, relative import, no JSDoc
export default function ({ category, dispatch }: any) { ... }
```

**TypeScript rules for all extractions:**

- **Zero `any`.** Use `unknown` + narrowing or a proper interface.
- **`interface` for object shapes. `type` for unions/intersections/aliases.**
- **All exported functions and hooks require explicit return type annotations.**
- **Hooks declare a named return type** — e.g. `UseCategoryActionsReturn`.
- **`import type { X }`** for all type-only imports.
- **No `!` non-null assertions** except where null = programmer error (add a `// reason` comment).
- **No `as` casts** except for DOM API narrowing (e.g. `e.target as HTMLInputElement`).

### Step C — Extract Custom Hooks for Logic

If a component or store file has a clustered group of `useState`/`useEffect` that serves one concern, extract it:

```ts
// After — src/features/settings/hooks/useGroupDrag.ts
// Custom hook managing drag-to-reorder for category groups.

/** Return type for {@link useGroupDrag}. */
interface UseGroupDragReturn {
  dragIndex: number | null;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
}

/** Manages drag-to-reorder state for category groups in the settings list. */
export function useGroupDrag(): UseGroupDragReturn {
  ...
  return { dragIndex, onDragStart, onDragEnd };
}
```

**Hook rules:**

- Always prefix with `use`.
- Name after what it **manages**, not what it fetches.
- Always export a named return type interface.
- Each `useEffect` does one thing. Split multi-concern effects.
- Never put async functions directly inside `useEffect` — use the inner-async pattern:
  ```ts
  useEffect(() => {
    async function run(): Promise<void> { ... }
    run();
  }, [dep]);
  ```

### Step D — Update Imports

After every extraction:

- Replace the inline code in the parent with the new import.
- Use `@/` alias: `import { CategoryRow } from "@/components/CategoryRow"`.
- Use `import type` for type-only imports.
- Remove all unused imports.
- Add `// MARK: - Section Name` dividers if the file has logical sections.

---

## Phase 3 — TypeScript Quality Pass

Apply these rules across all edited files.

### 3.1 Component Rules

- **One component per file.** No exceptions.
- **Named exports only.** No anonymous default exports.
- **Explicit return types.** Use `JSX.Element`, `JSX.Element | null`, or `React.ReactNode`.
- **No inline function definitions in JSX** beyond trivial one-liners.
- **No deeply nested ternaries.** Use early returns:

  ```tsx
  // ❌
  return isLoading ? <Spinner /> : error ? <ErrorMsg /> : <Content />;

  // ✅
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMsg />;
  return <Content />;
  ```

### 3.2 Types and Shared Interfaces

- Shared types (used by 2+ files) go in `src/models/types.ts` — the only type file.
- Feature-local types that don't belong in `models/types.ts` stay in the file that uses them.
- Use discriminated unions for multi-state shapes:
  ```ts
  // ✅
  type SyncState =
    | { status: "idle" }
    | { status: "syncing" }
    | { status: "error"; message: string };
  ```

### 3.3 Persistence and State Rules

- **Never call `localStorage` directly** in any component, hook, or reducer. All reads/writes go through `src/services/persistenceService.ts`.
- **`useState` = local UI state only** (open/close, input values).
- **`useReducer` = multi-action global state.**
- Components read from store hooks and call store methods. They perform no I/O.

### 3.4 Imports Checklist

- All imports from `src/` use `@/` alias — no `../` from `components/` or `screens/`.
- No `import React from "react"` — import only named hooks/types.
- `import type { X }` for all type-only imports.
- No unused imports.

---

## Phase 4 — PWA and Color System Checks

### 4.1 Colors

- **Zero hard-coded hex values** in component files. Use `var(--color-*)` tokens.
- When adding a new color token, add it to **all four** rule blocks in `src/styles/tokens.css`:
  - `:root`
  - `@media (prefers-color-scheme: dark)`
  - `:root[data-theme="light"]`
  - `:root[data-theme="dark"]`
- Then add a `@theme inline` alias in `src/index.css`.
- **Do not use Tailwind's `dark:` variant** for themed colors — use CSS custom properties.

### 4.2 Gestures and Interaction

- **Pointer Events API only** for any drag/swipe logic: `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerLeave`.
- `touch-action: manipulation` on all interactive elements.
- `active:scale-[0.96]` for press feedback.
- Never add `onMouseDown` or mouse-specific event handlers.

### 4.3 Safe Areas

- Header/footer padding uses `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` in inline styles.

---

## Phase 5 — Documentation

Documentation is written **alongside** the cleanup, not after. Every extracted file gets documented before moving on.

### 5.1 Inline TSDoc Comments

Use [TSDoc](https://tsdoc.org/) `/** */` format on every exported function, component, hook, and type.

**Components:**

```tsx
/**
 * Displays a single category row with a label and press handler.
 *
 * @example
 * <CategoryRow name="Groceries" onPress={() => selectCategory(id)} />
 */
export function CategoryRow({ name, onPress }: CategoryRowProps): JSX.Element {
```

**Hooks:**

```ts
/**
 * Manages drag-to-reorder state for the settings category list.
 *
 * @returns Current drag index and drag event handlers.
 */
export function useCategoryDrag(): UseCategoryDragReturn {
```

**Utility functions:**

```ts
/**
 * Returns a CSS class string combining all truthy inputs.
 *
 * @param inputs - Class strings or conditional values.
 * @returns A single merged class string.
 */
export function cn(...inputs: ClassValue[]): string {
```

**Types:**

```ts
/** A single checklist item belonging to a category. */
export interface ChecklistItem {
  id: string;
  /** Display text shown in the checklist row. */
  name: string;
  isChecked: boolean;
}
```

### 5.2 File-Level Header Comments

Every file (except `index.ts` barrel re-exports) opens with a one-line purpose comment:

```ts
// src/features/settings/hooks/useGroupDrag.ts
// Custom hook managing drag-to-reorder state for category groups.
```

### 5.3 `// MARK: -` Section Dividers

Use `// MARK: - Section Name` to divide files into logical sections. If a file needs more than 3 marks, it is too large — split it.

### 5.4 Keep Snapshot and Reference Docs Current

After any change to a component listed in `docs/snapshots/`:

- Update `docs/snapshots/component-catalog.md` if the component's props, structure, or purpose changed.
- Update `docs/snapshots/main-screen-ui-snapshot.md` if the main screen layout, scroll behavior, or component tree changed.
- Update `docs/snapshots/store-catalog.md` if a store hook's return shape changed.

After any architectural change:

- Update `docs/reference/architecture-overview.md`.
- Update `docs/reference/state-management.md` if store structure changed.
- Update `docs/reference/services.md` if a service was added or modified.

### 5.5 Triage `docs/plans/`

**Keep** a plan file if it describes a major, active, or upcoming feature with non-trivial detail.
**Delete** a plan file if it is a minor tweak, stale scratchpad, or fully shipped with no ongoing reference value.

Add a status header to every kept file:

```md
<!-- Feature: Firebase Sync | Status: In Progress | Last updated: April 2026 -->
```

---

## Phase 6 — Final Verification

Run `npm run build` after every file edit. Do not batch-verify at the end. A failing build must be fixed before the next file is touched.

### Checklist

**Functionality**

- [ ] `npm run build` passes with zero TypeScript errors and zero Vite build errors
- [ ] All routes still render correctly

**TypeScript**

- [ ] Zero `any` in `src/`
- [ ] All exported components have explicit return types
- [ ] All exported hooks have a named return type interface
- [ ] All exported utility functions have typed params and return types
- [ ] `import type` used for all type-only imports
- [ ] No `!` non-null assertions without a `// reason` comment
- [ ] No `as` casts except DOM API narrowing

**Code Quality**

- [ ] No file exceeds its hard ceiling (screens: 200, components: 180, store/services: 150, hooks/lib: 120)
- [ ] No unused imports
- [ ] All components use named exports
- [ ] No `localStorage` calls outside `persistenceService.ts`
- [ ] No hard-coded hex values in component files
- [ ] No `onMouseDown` or mouse-specific event handlers
- [ ] No commented-out code blocks
- [ ] No unexplained `console.log` statements

**Structure**

- [ ] Every new file is in the correct folder per the Folder Map
- [ ] No new files created at `src/` root (only the four that exist)
- [ ] No `../` relative imports from `components/` or `screens/`
- [ ] Shared types that belong in `models/types.ts` are there, not duplicated inline

**Documentation**

- [ ] Every extracted file has a one-line header comment
- [ ] Every exported symbol has a TSDoc `/** */` block
- [ ] Affected `docs/snapshots/` files updated
- [ ] Affected `docs/reference/` files updated
- [ ] `docs/plans/` triaged — stale files removed

---

## Ground Rules for the Agent

1. **Never refactor and add features at the same time.** Cleanup only.
2. **One file at a time.** Build must pass before moving to the next file.
3. **If a refactor would change behavior, stop and flag it.** Do not silently alter logic.
4. **When in doubt, extract less.** A slightly large file is better than a broken app.
5. **Never suppress TypeScript errors** with `// @ts-ignore` or `as any`. Fix the root cause.
6. **Never run `npm run deploy`.** Deployment is human-only.
7. **Never edit `src/components/ui/`.** These are read-only shadcn/ui primitives.

---

## Glossary

| Term               | Meaning in this project                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Store              | A file in `src/store/` that exports a React Context provider and a typed `use*` hook       |
| Screen             | A thin route-level component in `src/screens/` that composes reusable components           |
| Component          | A reusable UI building block in `src/components/`                                          |
| Feature module     | `src/features/settings/` — owns all settings-specific components, hooks, and utils         |
| UI primitive       | A shadcn/ui generated file in `src/components/ui/` — read-only                             |
| PersistenceService | The only file that reads/writes `localStorage` — `src/services/persistenceService.ts`      |
| Token              | A CSS custom property defined in `src/styles/tokens.css` (e.g. `var(--color-brand-green)`) |
| TSDoc              | The `/** */` comment format used by TypeScript tooling for IDE tooltips and doc generation |
| `@/` alias         | The TypeScript path alias that maps to `src/` — use for all intra-project imports          |
