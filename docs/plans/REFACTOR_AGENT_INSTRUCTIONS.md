# React/Vite PWA Refactor & Cleanup Instructions

> **For the coding agent:** Read this entire document before touching a single file. Follow every phase in order. Do not skip ahead.

---

## Your Mission

This codebase has grown organically and now contains files exceeding 1,000+ lines. Your job is to systematically decompose oversized files into clean, focused components — without breaking functionality. Think of yourself as a surgeon, not a demolition crew. Every cut must be precise and intentional.

---

## Phase 0 — Audit First, Touch Nothing

Before writing a single line of code, produce a full audit report.

### 0.1 File Size Audit

Scan every file in `src/` and list all files exceeding **150 lines**. Output a table like this:

```
| File Path                        | Lines | Concerns                          |
|----------------------------------|-------|-----------------------------------|
| src/pages/Dashboard.tsx          | 1,340 | mixed logic, layout, API calls    |
| src/components/Sidebar.tsx       |   890 | state, routing, 12 subcomponents  |
| ...                              |       |                                   |
```

### 0.2 Dependency Graph

For each oversized file, identify:
- What it imports
- What imports it
- What state it owns vs. what it receives as props
- Any API calls, data fetching, or side effects (useEffect, fetch, axios, react-query, etc.)

### 0.3 Declare a Refactor Plan

For each oversized file, write out (in comments or a plan block) exactly what pieces you intend to extract **before** extracting them. Get approval or proceed with documented intent. Do not refactor silently.

---

## Phase 1 — Establish the Target Folder Structure

Reorganize `src/` into this structure if it doesn't already exist. Do not delete anything — only move and restructure.

```
src/
├── assets/               # Static files: images, fonts, icons
├── components/           # Shared, reusable UI components
│   └── ui/               # Primitives: Button, Input, Modal, Badge, etc.
├── features/             # Feature-based modules (see Phase 2)
│   └── [feature-name]/
│       ├── components/   # Components used only by this feature
│       ├── hooks/        # Hooks scoped to this feature
│       ├── utils/        # Helpers scoped to this feature
│       └── index.ts      # Public API — only export what others need
├── hooks/                # Shared custom hooks
├── lib/                  # Third-party wrappers, config, clients (e.g. axios instance)
├── pages/                # Route-level page components — thin, mostly composition
├── store/                # Global state (Zustand, Redux, Context, etc.)
├── styles/               # Global CSS, theme tokens, Tailwind config extensions
├── types/                # Global TypeScript types and interfaces
└── utils/                # Pure utility functions shared across features
```

**Rules:**
- `pages/` files should ideally be **under 80 lines**. They compose features and layouts — nothing more.
- `components/ui/` should only contain stateless or minimally-stateful primitives.
- A component should do **one thing**. If you can't summarize it in 5 words, it does too much.

---

## Phase 2 — Decompose Oversized Files

Work through oversized files **one at a time**. For each file:

### Step A — Identify Extraction Candidates

Look for these patterns inside a large file:

| Pattern | What to extract |
|---|---|
| JSX block with its own clear visual purpose | New component file |
| `useState` + related handlers that only affect one UI section | Custom hook |
| `useEffect` with fetch/async logic | Custom hook (e.g. `useUserData`) |
| Helper functions that don't use React (pure logic) | `utils/` file |
| Repeated JSX structures (lists, cards, rows) | New component with props |
| Large `switch`/`if-else` render logic | Component with typed props |
| Constants arrays or config objects | `constants.ts` or `config.ts` |

### Step B — Extract with Zero Behavior Change

When extracting a component:

1. **Copy** the JSX block into a new file.
2. **Identify** every variable/prop it needs from the parent.
3. **Define a typed interface** for its props (TypeScript) or PropTypes (JS).
4. **Replace** the original JSX with the new `<ComponentName />` usage.
5. **Verify** the parent file still compiles and renders identically.
6. Only then move to the next extraction.

```tsx
// ✅ Good — clear props interface, single responsibility
interface UserCardProps {
  name: string;
  avatarUrl: string;
  role: string;
  onEdit: () => void;
}

export function UserCard({ name, avatarUrl, role, onEdit }: UserCardProps) {
  return ( ... );
}

// ❌ Bad — accepts entire user object + unrelated concerns
export function UserCard({ user, theme, dispatch, router }) { ... }
```

### Step C — Extract Custom Hooks for Logic

If a component has complex state or side effects, extract them into a custom hook:

```tsx
// Before (inside a 900-line component):
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
useEffect(() => { fetchDashboardData().then(setData) }, []);

// After — extracted to src/features/dashboard/hooks/useDashboardData.ts
export function useDashboardData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { fetchDashboardData().then(setData) }, []);
  return { data, loading };
}
```

**Hook naming rules:**
- Always prefix with `use`
- Name it after what it **returns**, not what it fetches: `useCurrentUser`, `useCartItems`, `useFilteredResults`

### Step D — Update Imports & Barrel Exports

After extracting, update all imports. Use barrel files (`index.ts`) inside feature folders to keep imports clean:

```ts
// src/features/dashboard/index.ts
export { DashboardPage } from './DashboardPage';
export { useDashboardData } from './hooks/useDashboardData';
export type { DashboardItem } from './types';
```

---

## Phase 3 — Code Quality Pass

After decomposition, apply these rules across all refactored files:

### 3.1 File Length Targets

| File Type | Target | Hard Max |
|---|---|---|
| Page component | < 80 lines | 150 lines |
| Feature component | < 150 lines | 250 lines |
| UI primitive | < 100 lines | 150 lines |
| Custom hook | < 80 lines | 120 lines |
| Utility function file | < 100 lines | 150 lines |

If you cannot get a file under its hard max, document why in a comment at the top.

### 3.2 Component Rules

- **One component per file.** No exceptions.
- **No anonymous default exports.** Always use named exports.
  ```tsx
  // ❌ export default () => <div />
  // ✅ export function UserAvatar() { return <div /> }
  ```
- **No inline function definitions in JSX** for anything more than trivial one-liners. Extract to a named handler.
- **No deeply nested ternaries.** Extract to a variable or sub-component.
  ```tsx
  // ❌ Hard to read
  return isLoading ? <Spinner /> : error ? <Error msg={error} /> : data ? <List items={data} /> : null;
  
  // ✅ Clear
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return null;
  return <List items={data} />;
  ```

### 3.3 Props & Types

- Every component must have a typed props interface (TypeScript) or documented propTypes (JS).
- Avoid prop drilling more than 2 levels deep. If you need to pass a prop through 3+ components, use Context or a state store.
- Do not pass entire objects as props when only 1-2 fields are needed.

### 3.4 Hooks Rules

- Each `useEffect` should do **one thing**. Split multi-concern effects.
- Every `useEffect` must have a complete, correct dependency array. Fix all lint warnings.
- Never put async functions directly inside `useEffect`. Use the inner-async pattern:
  ```tsx
  useEffect(() => {
    async function load() { await fetchSomething(); }
    load();
  }, [dependency]);
  ```

### 3.5 Imports

- Remove all unused imports.
- Sort imports: React → third-party → internal (absolute) → internal (relative) → types.
- No wildcard imports (`import * as X`), unless from a library that requires it.

---

## Phase 4 — PWA-Specific Cleanup

### 4.1 Service Worker

- Service worker logic should live in `src/sw.ts` or be managed by `vite-plugin-pwa` config — **not** scattered across components.
- No component should directly interact with `navigator.serviceWorker`. Wrap it in a hook: `useServiceWorker`.

### 4.2 Offline / Cache Logic

- Cache strategies and resource lists belong in `vite.config.ts` (workbox config) or a dedicated `src/lib/pwa.ts` file.
- If you find caching logic embedded in components, extract it.

### 4.3 App Shell

- The app shell layout (persistent header, nav, footer, sidebar) should be in a single `src/components/AppShell.tsx` or `src/components/Layout.tsx`.
- Pages should be wrapped by the layout — not each implementing their own shell.

### 4.4 Install Prompt

- The PWA install prompt logic (`beforeinstallprompt`) must live in a single hook: `src/hooks/usePWAInstall.ts`.
- Only one component should ever trigger the install prompt UI.

---

## Phase 5 — Final Verification Checklist

Before considering the refactor complete, verify every item:

### Functionality
- [ ] App builds with no errors: `npm run build`
- [ ] Dev server runs with no errors: `npm run dev`
- [ ] All existing routes/pages still render correctly
- [ ] PWA installs correctly and service worker registers
- [ ] No console errors or warnings introduced by refactor
- [ ] Any existing tests pass: `npm run test` (if applicable)

### Code Quality
- [ ] No file in `src/` exceeds 250 lines (except explicitly documented exceptions)
- [ ] No unused imports anywhere
- [ ] All components are named exports
- [ ] All props have type definitions
- [ ] No `useEffect` has missing dependencies (ESLint clean)
- [ ] No TODO or debugging `console.log` statements left behind

### Structure
- [ ] Folder structure matches the target layout from Phase 1
- [ ] Each feature module has a clean `index.ts` barrel export
- [ ] No orphaned files (files that nothing imports)

---

## Ground Rules for the Agent

1. **Never refactor and add features at the same time.** This is a cleanup pass only.
2. **Commit (or checkpoint) after each major file decomposition.** One file at a time.
3. **If a refactor would change behavior, stop and flag it.** Do not silently change logic.
4. **If a file has tests, do not rename exports** without updating the tests first.
5. **When in doubt, extract less.** A slightly large file is better than a broken app.
6. **Document non-obvious decisions** with a brief comment. Future-you will thank present-you.

---

## Glossary

| Term | Meaning in this project |
|---|---|
| Feature module | A folder in `src/features/` that owns all code for one domain area |
| UI primitive | A generic, stateless component in `src/components/ui/` |
| Page component | A thin route-level component in `src/pages/` that composes features |
| Barrel file | An `index.ts` that re-exports from sibling files for clean imports |
| Custom hook | A `useX` function that encapsulates stateful logic for reuse |

---

*Generated for a React/Vite PWA refactor. Adjust line-count targets and folder conventions to match your team's style guide if needed.*
