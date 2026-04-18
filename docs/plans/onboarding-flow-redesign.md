<!-- Status: In Progress | Last updated: April 2026 -->
# Plan: Onboarding Flow & Splash Screen Redesign

## Goal

Restructure the onboarding flow so new users see a branded welcome before any install prompt, and show the splash screen to all users.

---

## Route Map — Before vs After

### Before (current)

| Route      | Component                 | Condition                        |
| ---------- | ------------------------- | -------------------------------- |
| —          | `SplashScreen`            | Only if `hasCompletedOnboarding` |
| `/`        | `OnboardingInstallScreen` | `!hasCompletedOnboarding`        |
| `/welcome` | `OnboardingWelcomeScreen` | `!hasCompletedOnboarding`        |
| `/setup`   | `OnboardingSetupScreen`   | `!hasCompletedOnboarding`        |
| `/`        | `MainScreen`              | `hasCompletedOnboarding`         |

### After (target)

| Route      | Component                 | Condition                          |
| ---------- | ------------------------- | ---------------------------------- |
| —          | `SplashScreen`            | Always (1.0s new / 1.4s returning) |
| `/`        | `OnboardingWelcomeScreen` | `!hasCompletedOnboarding`          |
| `/setup`   | `OnboardingSetupScreen`   | `!hasCompletedOnboarding`          |
| `/install` | `OnboardingInstallScreen` | `!hasCompletedOnboarding`          |
| `/`        | `MainScreen`              | `hasCompletedOnboarding`           |

### User flows

```
New user (browser):    Splash → / (Welcome) → /setup → /install ("You're All Set") → MainScreen
New user (standalone): Splash → / (Welcome) → /setup → MainScreen  (skip /install)
Returning user:        Splash → MainScreen
```

---

## File Changes

| #   | File                                      | Action     |
| --- | ----------------------------------------- | ---------- |
| 1   | `src/App.tsx`                             | **Modify** |
| 2   | `src/screens/SplashScreen.tsx`            | **Modify** |
| 3   | `src/screens/OnboardingSetupScreen.tsx`   | **Modify** |
| 4   | `src/screens/OnboardingInstallScreen.tsx` | **Modify** |
| 5   | `docs/snapshots/screens-catalog.md`       | **Modify** |

---

## Steps

### Step 1 · `src/App.tsx` — Splash for all users + route reorder + GA relocation

**1a. Always show splash:**

```ts
// BEFORE
const [isSplashVisible, setIsSplashVisible] = useState(
  () => hasCompletedOnboarding,
);

// AFTER
const [isSplashVisible, setIsSplashVisible] = useState(() => true);
```

Pass `isReturningUser={hasCompletedOnboarding}` to `<SplashScreen>`.

**1b. Reorder onboarding routes:**

```tsx
// BEFORE (inside !hasCompletedOnboarding branch)
<Route path="/" element={<OnboardingInstallScreen />} />
<Route path="/welcome" element={<OnboardingWelcomeScreen />} />
<Route path="/setup" element={<OnboardingSetupScreen />} />
<Route path="*" element={<Navigate to="/" replace />} />

// AFTER
<Route path="/" element={<OnboardingWelcomeScreen />} />
<Route path="/setup" element={<OnboardingSetupScreen />} />
<Route path="/install" element={<OnboardingInstallScreen />} />
<Route path="*" element={<Navigate to="/" replace />} />
```

**1c. Relocate GA standalone tracking:**

Move the `gtag('event', 'pwa_session', ...)` call from `OnboardingInstallScreen` into the existing `visibilitychange` `useEffect` in `App.tsx`. Fire once on mount when `isStandalone && hasCompletedOnboarding`. Compute `isStandalone` as a `useMemo`:

```ts
const isStandalone = useMemo(
  () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true,
  [],
);
```

---

### Step 2 · `src/screens/SplashScreen.tsx` — Variable duration

**Update props interface:**

```ts
interface SplashScreenProps {
  onFinished: () => void;
  isReturningUser?: boolean;
}
```

**Change `fadeTimer` delay:**

```ts
// BEFORE
const fadeTimer = setTimeout(() => { ... }, 1400);

// AFTER
const duration = isReturningUser ? 1400 : 1000;
const fadeTimer = setTimeout(() => { ... }, duration);
```

> **Constraint:** `SplashScreen` renders outside `<HashRouter>` (in the `if (isSplashVisible)` early return). No router hooks are available. Use only `onFinished` callback + timers. Current code already follows this — do not introduce `useNavigate`.

---

### Step 3 · `src/screens/OnboardingSetupScreen.tsx` — Navigate to `/install` instead of completing onboarding

**3a. Add imports:**

```ts
import { useNavigate } from "react-router-dom";
```

**3b. Rename internal function** from `completeOnboarding` to `finishSetup` to avoid confusion with `settings.completeOnboarding()`.

**3c. Pre-populate form from store** (guards back-navigation from `/install`):

```ts
// BEFORE
const [nameText, setNameText] = useState("");
const [pendingCategories, setPendingCategories] = useState<string[]>([]);

// AFTER
const [nameText, setNameText] = useState(() => settings.userName);
const [pendingCategories, setPendingCategories] = useState<string[]>(() =>
  store.categories.map((c) => c.name),
);
```

**3d. Replace the `setTimeout` body in `finishSetup()`:**

```ts
// BEFORE (inside the 350ms setTimeout)
window.scrollTo(0, 0);
settings.completeOnboarding();

// AFTER
window.scrollTo(0, 0);
const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as { standalone?: boolean }).standalone === true;

if (isStandalone) {
  // Already installed — skip install screen, go straight to MainScreen.
  // Route tree swap is automatic when hasCompletedOnboarding flips.
  settings.completeOnboarding();
} else {
  navigate("/install");
}
```

> **Preserve:** The 350ms `setTimeout` stays — it guards keyboard-dismiss layout jank. The `await sync.adoptSyncCode()` call runs before the timeout. Keep this structure.

---

### Step 4 · `src/screens/OnboardingInstallScreen.tsx` — Redesign as "You're All Set" screen

**4a. Add store import:**

```ts
import { useSettingsStore } from "@/store/useSettingsStore";
// inside component:
const settings = useSettingsStore();
```

**4b. Remove from this file:**

- `gtag` tracking block + `declare global` — relocated to `App.tsx` (Step 1c)
- `navigate("/welcome", { replace: true })` call — no longer needed
- `return null` early exit for standalone — no longer needed

**4c. Standalone detection on mount:**

```ts
useEffect(() => {
  if (isStandalone) {
    settings.completeOnboarding();
    // Route tree swap in App.tsx handles navigation — do NOT call navigate()
  }
}, [isStandalone, settings]);
```

**4d. UI changes:**

- Heading: `"Add to Home Screen"` → `"You're All Set!"`
- Subheading: `"Your lists are ready to go."`
- Install instructions: Keep as always-visible card, restyle with "Pro tip" framing. Use `var(--color-surface-card)` bg + `var(--elevation-card)` shadow.
- Primary CTA: `"Start Using List Master"` → `onClick={() => settings.completeOnboarding()}`. Full-width, gradient button, same style as other onboarding CTAs.
- Remove "Skip for Now" ghost button — primary CTA is the only forward action.

> **Do NOT call `navigate("/")`** after `settings.completeOnboarding()`. The `hasCompletedOnboarding` state flip causes `App.tsx` to re-render and swap the route tree to `MainScreen`. An explicit navigate would race against this.

---

### Step 5 · Verify `PageTransitionWrapper` — no code changes

Depth map for new routes:

- `/` → 0, `/setup` → 1, `/install` → 1

`PageTransitionWrapper` uses `currentDepth >= prevDepth` for forward push. `1 >= 1` is `true`, so `/setup` → `/install` triggers slide-in-from-right. This is correct and desirable.

---

### Step 6 · `docs/snapshots/screens-catalog.md` — Update documentation

Update:

- Route map table
- `SplashScreen`: renders for all users, `isReturningUser` prop, variable duration
- `OnboardingInstallScreen`: route `/install`, entry from `/setup`, `useSettingsStore` dependency, GA tracking removed
- `OnboardingSetupScreen`: navigates to `/install` (browser) or calls `completeOnboarding()` (standalone)

---

## Decisions Made

| #   | Question                                    | Answer                                                       |
| --- | ------------------------------------------- | ------------------------------------------------------------ |
| 1   | Install tip collapsible or always visible?  | Always visible. Card style, not collapsible.                 |
| 2   | Add page indicator dots to onboarding?      | No. Not needed for a 3-step flow.                            |
| 3   | Splash tagline differ for new vs returning? | No. Same tagline ("YOUR CHECKLIST COMPANION") for all users. |
