# React/Vite PWA Refactor & Cleanup Instructions (TypeScript)

> **For the coding agent:** Read this entire document before touching a single file. Follow every phase in order. Do not skip ahead.

---

## Your Mission

This is a **TypeScript** React/Vite PWA. The codebase has grown organically and now contains files exceeding 1,000+ lines. Your job is to systematically decompose oversized files into clean, focused components and produce thorough, accurate documentation — without breaking functionality. Think of yourself as a surgeon, not a demolition crew. Every cut must be precise and intentional.

**The two pillars of this refactor:**
1. **Structure** — break large files down into small, focused modules with clean TypeScript types throughout.
2. **Documentation** — every module, component, hook, type, and utility gets clear, accurate inline and external docs.

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

### 0.2 TypeScript Health Audit

Before refactoring, check the current state of TypeScript usage across the project:

- Run `tsc --noEmit` and record all type errors. Do not fix them yet — just catalog them.
- Flag every use of `any` — these are documentation and safety debt that must be resolved during the refactor.
- Flag every untyped function return value, untyped prop, and missing interface.
- Note any files using `.js`/`.jsx` extensions that should be converted to `.ts`/`.tsx`.

Output a second audit table:

```
| File Path                        | any count | tsc errors | Missing types        |
|----------------------------------|-----------|------------|----------------------|
| src/utils/helpers.ts             |     7     |     2      | return types, params |
| src/store/appStore.ts            |     3     |     0      | action payloads      |
| ...                              |           |            |                      |
```

### 0.3 Documentation Audit

Inventory the current state of docs before writing new ones:

- Does a `README.md` exist at the project root? Is it accurate and up to date?
- Is there a `docs/` folder? What's in it, and is it stale?
- Are there any existing JSDoc/TSDoc comments? Are they accurate?
- Do any components, hooks, or utilities have zero documentation?

**`docs/plans/` audit — list every file and classify it:**

```
| File Path                              | Classification  | Action               |
|----------------------------------------|-----------------|----------------------|
| docs/plans/auth-redesign.md            | Major feature   | Move → features/     |
| docs/plans/fix-button-padding.md       | Minor tweak     | Delete               |
| docs/plans/offline-sync-architecture.md| Major feature   | Move → features/     |
| docs/plans/old-color-ideas.md          | Scratchpad/stale| Delete               |
| ...                                    |                 |                      |
```

Do not move or delete anything yet — just build the list. The actual cleanup happens in Phase 5.1.

### 0.4 Dependency Graph

For each oversized file, identify:
- What it imports
- What imports it
- What state it owns vs. what it receives as props
- Any API calls, data fetching, or side effects (`useEffect`, `fetch`, `axios`, `react-query`, etc.)

### 0.5 Declare a Refactor Plan

For each oversized file, write out (in a plan block) exactly what pieces you intend to extract **before** extracting them. Do not refactor silently. Include in the plan:
- Which pieces become new components
- Which pieces become hooks
- Which pieces become types in `src/types/`
- What documentation will be written for each extracted piece

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
│       ├── types.ts      # Types/interfaces scoped to this feature
│       ├── utils/        # Helpers scoped to this feature
│       └── index.ts      # Public API — only export what others need
├── hooks/                # Shared custom hooks
├── lib/                  # Third-party wrappers, config, clients (e.g. axios instance)
├── pages/                # Route-level page components — thin, mostly composition
├── store/                # Global state (Zustand, Redux, Context, etc.)
├── styles/               # Global CSS, theme tokens, Tailwind config extensions
├── types/                # Global TypeScript types, interfaces, and enums
│   ├── api.ts            # API request/response shapes
│   ├── models.ts         # Core domain models
│   └── index.ts          # Re-exports all global types
└── utils/                # Pure utility functions shared across features

docs/                     # Project-level documentation (outside src/)
├── README.md             # Project overview (mirrors/extends root README)
├── architecture.md       # Folder structure, key decisions, data flow
├── components.md         # Catalogue of shared components and their props
├── hooks.md              # Catalogue of all custom hooks
├── pwa.md                # PWA setup, service worker, install flow
├── types.md              # Key types and domain model reference
└── plans/                # Planning documents
    └── features/         # Retained plans for major shipped/in-progress features only
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

1. **Copy** the JSX block into a new `.tsx` file.
2. **Identify** every variable/prop it needs from the parent.
3. **Define a TypeScript interface** for its props — always use `interface`, not `type`, for component props unless you need union/intersection types.
4. **Replace** the original JSX with the new `<ComponentName />` usage.
5. **Verify** `tsc --noEmit` still passes and the parent renders identically.
6. Only then move to the next extraction.

```tsx
// ✅ Good — explicit interface, named export, no any
interface UserCardProps {
  name: string;
  avatarUrl: string;
  role: 'admin' | 'editor' | 'viewer'; // use union literals, not string
  onEdit: () => void;
}

export function UserCard({ name, avatarUrl, role, onEdit }: UserCardProps) {
  return ( ... );
}

// ❌ Bad — any types, accepts entire object, implicit return type
export function UserCard({ user, theme, dispatch, router }: any) { ... }
```

**TypeScript extraction rules:**
- **Never use `any`.** If you don't know the type yet, use `unknown` and narrow it, or create a placeholder interface with a `// TODO: refine` comment.
- **Prefer `interface` over `type` for object shapes** — they produce clearer error messages.
- **Use `type` for unions, intersections, and aliases** — e.g. `type Status = 'idle' | 'loading' | 'error' | 'success'`.
- **Always annotate function return types** on hooks, utilities, and any function longer than 3 lines.
- **Move shared types to `src/types/`** — if two or more files need the same type, it belongs in the global types folder, not inline.

### Step C — Extract Custom Hooks for Logic

If a component has complex state or side effects, extract them into a custom hook with explicit return types:

```tsx
// Before (buried inside a 900-line component, no types):
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
useEffect(() => { fetchDashboardData().then(setData) }, []);

// After — src/features/dashboard/hooks/useDashboardData.ts
import type { DashboardItem } from '../types';

interface UseDashboardDataReturn {
  data: DashboardItem[] | null;
  loading: boolean;
  error: string | null;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await fetchDashboardData();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { data, loading, error };
}
```

**Hook naming rules:**
- Always prefix with `use`.
- Name it after what it **returns**, not what it fetches: `useCurrentUser`, `useCartItems`, `useFilteredResults`.
- Always define and export a return type interface (e.g. `UseCurrentUserReturn`) — this is the hook's public contract.
- All state variables must have explicit generic types: `useState<string>('')`, never `useState('')` alone when the type is non-obvious.

### Step D — Update Imports & Barrel Exports

After extracting, update all imports. Use barrel files (`index.ts`) inside feature folders to keep imports clean:

```ts
// src/features/dashboard/index.ts
export { DashboardPage } from './DashboardPage';
export { useDashboardData } from './hooks/useDashboardData';
export type { DashboardItem } from './types';
```

---

## Phase 3 — TypeScript Quality Pass

After decomposition, apply these rules across all refactored files:

### 3.1 File Length Targets

| File Type | Target | Hard Max |
|---|---|---|
| Page component | < 80 lines | 150 lines |
| Feature component | < 150 lines | 250 lines |
| UI primitive | < 100 lines | 150 lines |
| Custom hook | < 80 lines | 120 lines |
| Utility function file | < 100 lines | 150 lines |
| Type definition file | < 120 lines | 200 lines |

If you cannot get a file under its hard max, document why in a comment at the top.

### 3.2 Component Rules

- **One component per file.** No exceptions.
- **No anonymous default exports.** Always use named exports.
  ```tsx
  // ❌ export default () => <div />
  // ✅ export function UserAvatar(): JSX.Element { return <div /> }
  ```
- **All components must have explicit return type annotations** — either `JSX.Element`, `JSX.Element | null`, or `React.ReactNode` as appropriate.
- **No inline function definitions in JSX** for anything more than trivial one-liners. Extract to a named, typed handler.
- **No deeply nested ternaries.** Extract to a variable or sub-component.
  ```tsx
  // ❌ Hard to read, impossible to type properly
  return isLoading ? <Spinner /> : error ? <Error msg={error} /> : data ? <List items={data} /> : null;

  // ✅ Clear early returns, each branch obvious
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return null;
  return <List items={data} />;
  ```

### 3.3 TypeScript Types & Interfaces

- **Zero `any` tolerance.** Every `any` found in the audit must be resolved. Use `unknown` + type narrowing, or define a proper interface.
- **Every component has a props interface** defined directly above the component in the same file, or imported from the feature's `types.ts`.
- **Avoid prop drilling more than 2 levels deep.** If a prop passes through 3+ components, move it to Context or a state store and type the context value explicitly.
- **Do not pass entire objects as props** when only 1-2 fields are needed — this creates hidden type coupling.
- **Use discriminated unions for state shapes** to make impossible states unrepresentable:
  ```ts
  // ❌ These fields are all optional — nothing enforces valid combinations
  interface FetchState {
    data?: User[];
    error?: string;
    loading?: boolean;
  }

  // ✅ Each state is explicit and exhaustive
  type FetchState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: User[] }
    | { status: 'error'; message: string };
  ```
- **Consolidate shared types.** If the same shape appears in more than one file, move it to `src/types/` and import it everywhere. No duplicated interfaces.
- **Use `type` imports** when importing only a type: `import type { User } from '../types'`. This is enforced by `verbatimModuleSyntax` if enabled, and is good practice regardless.

### 3.4 Hooks Rules

- Each `useEffect` should do **one thing**. Split multi-concern effects.
- Every `useEffect` must have a complete, correct dependency array. Fix all ESLint `react-hooks/exhaustive-deps` warnings.
- Never put async functions directly inside `useEffect`. Use the inner-async pattern:
  ```tsx
  useEffect(() => {
    async function load(): Promise<void> {
      await fetchSomething();
    }
    load();
  }, [dependency]);
  ```
- **All event handler props must be precisely typed** — use specific signatures, not `Function`:
  ```ts
  // ❌
  onSelect: Function;

  // ✅
  onSelect: (id: string) => void;
  onSelect: (item: MenuItem, index: number) => void;
  ```

### 3.5 Utility Functions

- Every utility function must have explicit parameter types and a return type annotation.
- Pure functions (no side effects, no React) belong in `src/utils/` — not inside component files.
- Group related utilities into named files: `src/utils/dates.ts`, `src/utils/formatting.ts`, `src/utils/validation.ts`.
- Each utility file should have a TSDoc comment block per exported function (see Phase 5 — Documentation for format).

### 3.6 Imports

- Remove all unused imports. Run `tsc --noEmit` and ESLint to catch them.
- Sort imports: React → third-party → internal absolute (`src/...`) → internal relative (`./...`) → type-only imports.
- Use `import type` for all type-only imports.
- No wildcard imports (`import * as X`) unless a library explicitly requires it.

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

## Phase 5 — Documentation

Documentation is written **alongside** the refactor, not after. Every extracted file gets documented before you move on to the next one.

### 5.1 Clean Up `docs/plans/`

Use the classification table you built in Phase 0.3 to triage every file in `docs/plans/`. Apply these rules:

**Keep → move to `docs/plans/features/`** if the file meets ALL of these criteria:
- It describes a **major feature** — something that meaningfully changed user-facing behavior, added a significant capability, or involved substantial architectural decisions.
- It is still **relevant** — the feature is live, actively in progress, or planned for the near future.
- It contains **non-trivial content** — more than a rough idea, with enough detail to be useful as a reference (e.g. describes data models, UX flows, API design, tradeoffs, or technical constraints).

**Delete** if the file matches ANY of these:
- It was a plan for a minor fix, small tweak, or cosmetic change (padding, colors, copy edits, one-liners).
- It was a rough scratchpad, brainstorm dump, or incomplete idea that was never developed.
- It is fully superseded — the feature shipped and the plan no longer matches reality, with no historical value.
- It duplicates another file already being kept.
- It was a one-off investigation or spike with no ongoing relevance.

**When in doubt, delete.** A `docs/plans/` folder full of stale files is noise, not documentation. If something might genuinely matter later, keep it — but do not keep files just to avoid making a decision.

**After cleanup, add a one-line summary comment** to the top of each retained file in `docs/plans/features/`:

```md
<!-- Feature: Offline Sync Architecture | Status: In Progress | Last updated: [date] -->
```

This makes the folder scannable at a glance without opening every file.


### 5.2 Inline TSDoc Comments

Use [TSDoc](https://tsdoc.org/) format for all inline documentation. This ensures IDE tooltips, auto-generated docs, and future agents all benefit from the same source of truth.

**Components** — document the component and its props interface:
```tsx
/**
 * Displays a user's profile card with name, avatar, role badge, and an edit action.
 *
 * Used in the team roster view and the account settings sidebar.
 *
 * @example
 * <UserCard
 *   name="Jane Smith"
 *   avatarUrl="/avatars/jane.png"
 *   role="admin"
 *   onEdit={() => openEditModal(user.id)}
 * />
 */
export function UserCard({ name, avatarUrl, role, onEdit }: UserCardProps): JSX.Element {
```

```tsx
/** Props for the {@link UserCard} component. */
interface UserCardProps {
  /** Full display name of the user. */
  name: string;
  /** Absolute or relative URL for the user's avatar image. */
  avatarUrl: string;
  /** Permission role — controls which badge is shown. */
  role: 'admin' | 'editor' | 'viewer';
  /** Called when the user clicks the edit (pencil) icon. */
  onEdit: () => void;
}
```

**Custom hooks** — document the hook, its parameters, and return shape:
```ts
/**
 * Fetches and manages dashboard data for the current user.
 *
 * Handles loading and error states internally. Re-fetches when `userId` changes.
 *
 * @param userId - The ID of the user whose dashboard data to load.
 * @returns An object containing `data`, `loading`, and `error` state.
 *
 * @example
 * const { data, loading, error } = useDashboardData(currentUser.id);
 */
export function useDashboardData(userId: string): UseDashboardDataReturn {
```

**Utility functions** — every exported function gets a TSDoc block:
```ts
/**
 * Formats a UTC timestamp into a human-readable relative string.
 *
 * @param timestamp - ISO 8601 date string or Unix timestamp in milliseconds.
 * @param locale - BCP 47 locale string. Defaults to `'en-US'`.
 * @returns A relative time string such as "3 hours ago" or "yesterday".
 *
 * @example
 * formatRelativeTime('2024-01-15T10:00:00Z') // "2 days ago"
 */
export function formatRelativeTime(timestamp: string | number, locale = 'en-US'): string {
```

**Types & interfaces** — document the purpose and non-obvious fields:
```ts
/**
 * Represents a single item in the dashboard activity feed.
 * Returned by the `/api/dashboard/activity` endpoint.
 */
export interface DashboardItem {
  id: string;
  /** ISO 8601 timestamp of when the activity occurred. */
  createdAt: string;
  /** The user who performed the action, or `null` for system events. */
  actor: User | null;
  type: ActivityType;
}
```

### 5.3 File-Level Header Comments

Every file (except barrel `index.ts` re-exports) should open with a one-line comment stating its purpose:

```ts
// src/features/dashboard/hooks/useDashboardData.ts
// Custom hook for fetching and managing dashboard activity feed data.
```

This makes grep, file search, and code reviews significantly easier.

### 5.4 Update `docs/` Folder

After each feature or major file is refactored, update the relevant doc file in `docs/`. If the `docs/` folder doesn't exist, create it.

**`docs/architecture.md`** — Keep this current throughout the refactor:
- Folder structure diagram (update as structure evolves)
- Data flow description: where state lives, how it flows to components
- Key technical decisions and why they were made
- Third-party libraries used and their purpose (e.g. `vite-plugin-pwa`, state manager, router)

**`docs/components.md`** — Running catalogue of all shared components:

```md
## UserCard
**Location:** `src/components/UserCard.tsx`
**Purpose:** Displays user name, avatar, and role badge with an edit action.
**Props:** `name`, `avatarUrl`, `role` ('admin' | 'editor' | 'viewer'), `onEdit`
**Used by:** TeamRosterPage, AccountSidebar
```

**`docs/hooks.md`** — Running catalogue of all custom hooks:

```md
## useDashboardData
**Location:** `src/features/dashboard/hooks/useDashboardData.ts`
**Purpose:** Fetches dashboard activity feed. Manages loading/error state.
**Parameters:** `userId: string`
**Returns:** `{ data: DashboardItem[] | null, loading: boolean, error: string | null }`
**Used by:** DashboardPage
```

**`docs/types.md`** — Key domain types and what they represent:

```md
## DashboardItem
**Location:** `src/types/models.ts`
**Purpose:** A single activity feed entry returned by the dashboard API.
**Key fields:** `id`, `createdAt`, `actor` (User | null), `type` (ActivityType)
```

**`docs/pwa.md`** — PWA-specific documentation:
- How the service worker is configured and registered
- Cache strategies in use (which routes/assets are cached and how)
- How the install prompt flow works (`usePWAInstall` hook)
- How to test PWA behavior locally

### 5.5 Update the Root `README.md`

The root `README.md` must be accurate by the end of the refactor. It should include:

- **Project name and one-sentence description**
- **Tech stack** — React, Vite, TypeScript, PWA, plus any key libraries
- **Getting started** — `npm install`, `npm run dev`, `npm run build`
- **Folder structure** — a brief description of `src/` layout (can link to `docs/architecture.md`)
- **Key scripts** — `dev`, `build`, `preview`, `test`, `tsc --noEmit`
- **PWA notes** — how to test the service worker locally

Anything in the README that is outdated, wrong, or missing must be corrected. Do not leave stale instructions.

### 5.6 Comment Quality Rules

- **Comments explain *why*, not *what*.** The code already shows what. Comments add context, intent, and caveats.
  ```ts
  // ❌ Increments counter
  count++;

  // ✅ Offset by 1 because the API returns 0-indexed pages but the UI displays 1-indexed
  count++;
  ```
- **Remove commented-out code.** Dead code in comments belongs in git history, not in the file.
- **No obvious filler comments.** `// render` above a return statement adds no value.
- **Flag genuine uncertainty** with `// TODO:` or `// NOTE:` — but each one must have a reason, not just a vague note.

---

## Phase 6 — Final Verification Checklist

Before considering the refactor complete, verify every item:

### Functionality
- [ ] App builds with no TypeScript errors: `tsc --noEmit && npm run build`
- [ ] Dev server runs with no errors: `npm run dev`
- [ ] All existing routes/pages still render correctly
- [ ] PWA installs correctly and service worker registers
- [ ] No console errors or warnings introduced by the refactor
- [ ] Any existing tests pass: `npm run test` (if applicable)

### TypeScript
- [ ] Zero `any` types remaining in `src/`
- [ ] All components have explicit return types (`JSX.Element`, `JSX.Element | null`, etc.)
- [ ] All custom hooks have explicit return type interfaces
- [ ] All utility functions have typed parameters and return types
- [ ] All props interfaces are defined and exported from the correct location
- [ ] `import type` used for all type-only imports
- [ ] `tsc --noEmit` passes with zero errors

### Code Quality
- [ ] No file in `src/` exceeds 250 lines (except explicitly documented exceptions)
- [ ] No unused imports anywhere
- [ ] All components use named exports
- [ ] No `useEffect` has missing or incorrect dependencies (ESLint `react-hooks` clean)
- [ ] No commented-out code blocks remaining
- [ ] No debugging `console.log` statements remaining
- [ ] No `TODO` comments left without explanation

### Structure
- [ ] Folder structure matches the target layout from Phase 1
- [ ] Each feature module has a clean `index.ts` barrel export
- [ ] No orphaned files (files that nothing imports)
- [ ] Shared types consolidated in `src/types/`

### Documentation
- [ ] Every exported component has a TSDoc comment block
- [ ] Every custom hook has a TSDoc comment block with `@param` and `@returns`
- [ ] Every exported utility function has a TSDoc comment block
- [ ] Every exported type/interface has a TSDoc comment and field-level comments on non-obvious properties
- [ ] Every file has a one-line header comment stating its purpose
- [ ] `docs/architecture.md` reflects the current folder structure and data flow
- [ ] `docs/components.md` has an entry for every shared component
- [ ] `docs/hooks.md` has an entry for every custom hook
- [ ] `docs/types.md` has an entry for every key domain type
- [ ] `docs/pwa.md` accurately describes the PWA setup
- [ ] Root `README.md` is accurate, up to date, and has correct setup instructions
- [ ] `docs/plans/` has been triaged — stale and minor files deleted
- [ ] Major feature plans moved to `docs/plans/features/` with a status comment header

---

## Ground Rules for the Agent

1. **Never refactor and add features at the same time.** This is a cleanup pass only.
2. **Commit (or checkpoint) after each major file decomposition.** One file at a time.
3. **If a refactor would change behavior, stop and flag it.** Do not silently change logic.
4. **If a file has tests, do not rename exports** without updating the tests first.
5. **When in doubt, extract less.** A slightly large file is better than a broken app.
6. **Write documentation as you go.** Do not batch it to the end — stale docs are worse than no docs.
7. **Never suppress TypeScript errors with `// @ts-ignore` or `as any`.** Fix the root cause.
8. **Document non-obvious decisions** with a `// NOTE:` comment. Future-you will thank present-you.

---

## Glossary

| Term | Meaning in this project |
|---|---|
| Feature module | A folder in `src/features/` that owns all code for one domain area |
| UI primitive | A generic, stateless component in `src/components/ui/` |
| Page component | A thin route-level component in `src/pages/` that composes features |
| Barrel file | An `index.ts` that re-exports from sibling files for clean imports |
| Custom hook | A `useX` function that encapsulates stateful logic for reuse |
| TSDoc | The `/** */` documentation comment standard used by TypeScript tooling |
| Discriminated union | A TypeScript `type` with a shared literal field (e.g. `status`) used to model mutually exclusive states |
| `import type` | A TypeScript import that is erased at compile time — used for type-only imports |

---

*Generated for a TypeScript React/Vite PWA refactor. Adjust line-count targets and folder conventions to match your team's style guide if needed.*

