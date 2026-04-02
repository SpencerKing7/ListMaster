# TypeScript Conventions

This document describes the code style rules that apply throughout the ListMaster PWA codebase. These conventions are enforced by code review, not by a linter, so every contributor is responsible for following them.

---

## Comments

### JSDoc on Exports

All exported functions, React components, and types must have a JSDoc block comment:

```ts
/**
 * Renders the horizontal category pill row.
 * Supports drag-to-scroll via the Pointer Events API.
 */
export function CategoryPicker({ ... }: CategoryPickerProps) { ... }
```

```ts
/**
 * Represents a single checklist item within a category.
 */
export interface ChecklistItem { ... }
```

### `// MARK: - Section Name`

Large files are divided into named sections using Swift-style `MARK` comments. Editors that support code folding or symbol navigation will surface these as section dividers.

```ts
// MARK: - Reducer

function reducer(state: StoreState, action: StoreAction): StoreState { ... }

// MARK: - Provider

export function CategoriesProvider({ children }: { children: ReactNode }) { ... }
```

---

## Types

### `interface` vs. `type`

| Use         | When                                                                      |
| ----------- | ------------------------------------------------------------------------- |
| `interface` | Object shapes (data models, component prop types)                         |
| `type`      | Unions, intersections, and aliases (`type SortOrder = "date" \| "alpha"`) |

Never use `type` where `interface` would work.

### No Non-null Assertions

Do not use the `!` non-null assertion operator unless failure is a genuine programmer error (not a runtime condition). When it is necessary, add a comment explaining why:

```ts
// The container ref is always attached by the time this callback runs.
const height = containerRef.current!.offsetHeight;
```

### No Unsafe `as` Casts

Never use `as` for type narrowing except when TypeScript cannot infer the type from a DOM API:

```ts
// OK — TypeScript types event.target as EventTarget, not HTMLInputElement
const value = (e.target as HTMLInputElement).value;
```

Never use `as` to silence a type error you haven't actually resolved.

---

## Variables and Bindings

### `const` over `let`

Use `const` for every binding that is not reassigned. Use `let` only when the value is explicitly reassigned later in the same scope.

### Boolean Naming

Boolean variables and props are named as assertions — they read as true/false statements:

| ✅ Correct               | ❌ Incorrect         |
| ------------------------ | -------------------- |
| `isEmpty`                | `getIsEmpty`         |
| `isChecked`              | `checkIsChecked`     |
| `hasCompletedOnboarding` | `onboardingComplete` |

---

## Control Flow

### Early-Return Guards

Use early-return guards at the top of a function to handle preconditions. Do not nest the main logic inside `if` blocks:

```ts
// ✅ Correct
function handleSwipe(delta: number) {
  if (delta === 0) return;
  // ... main logic
}

// ❌ Incorrect
function handleSwipe(delta: number) {
  if (delta !== 0) {
    // ... main logic
  }
}
```

---

## Strings and Collections

- Prefer **template literals** over string concatenation: `` `Hello, ${name}` `` not `"Hello, " + name`.
- Prefer `.some(fn)` for "has any matching" checks over a manual loop.
- Use `array.length === 0` to check for empty arrays, or extract it into a named boolean (`const isEmpty = items.length === 0`).

---

## Imports

- Use the `@/` path alias for all `src/`-relative imports: `import { useCategoriesStore } from "@/store/useCategoriesStore"`.
- Never use `../` relative paths from `components/` or `screens/`.
- Do not import `React` explicitly — the Vite JSX transform handles it. Only import named hooks and types from `"react"` (e.g. `import { useState, useCallback } from "react"`).
