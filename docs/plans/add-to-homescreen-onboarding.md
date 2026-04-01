# Plan: Add-to-Home-Screen Onboarding Step

**Goal:** Insert a new first step in the onboarding flow that explains to users they'll get the best experience by adding ListMaster to their home screen, with clear step-by-step instructions and Safari/browser icons. Provide a "Skip" option for users who prefer the browser, and an "I've already done this" option for users who land on this screen after already installing.

---

## Current Onboarding Flow

```
/           → OnboardingWelcomeScreen   (hero + "Get Started" button)
/setup      → OnboardingSetupScreen     (name + categories + "Finish Setup")
```

After `completeOnboarding()` is called, `hasCompletedOnboarding` flips to `true` in `useSettingsStore` and `App.tsx` renders the `MainScreen` routes instead.

## Proposed Flow

```
/           → OnboardingInstallScreen   (NEW — add-to-home-screen prompt)
/welcome    → OnboardingWelcomeScreen   (existing — hero + "Get Started")
/setup      → OnboardingSetupScreen     (existing — name + categories)
```

The new screen becomes the landing page (`/`). The existing Welcome screen moves to `/welcome`. The Setup screen stays at `/setup`.

---

## Step-by-Step Implementation

### Step 1 — Create `OnboardingInstallScreen.tsx`

**File:** `src/screens/OnboardingInstallScreen.tsx` _(new)_

This is the new first screen in the onboarding flow. It should:

1. **Match the existing onboarding visual style** — full-height `min-h-dvh` layout, brand gradient background (same two overlay `div`s used by `OnboardingWelcomeScreen` and `OnboardingSetupScreen`), centered content area.

2. **Detect standalone mode.** Use `window.matchMedia('(display-mode: standalone)').matches` or `(window.navigator as any).standalone === true` (Safari) to determine if the app is already running as a home-screen PWA. Store this in a local `isStandalone` boolean.

3. **If already standalone → auto-navigate.** If `isStandalone` is `true` on mount, immediately call `navigate("/welcome")` so the user never sees the install prompt — they've already installed.

4. **Header area:**
   - A large brand-colored icon representing a phone with an app badge (or a simplified "download/install" icon). Use an inline SVG, ~64×64, stroke style matching other onboarding icons (`strokeWidth="1.5"`, `strokeLinecap="round"`, `strokeLinejoin="round"`), colored with `var(--color-brand-green)`.
   - Title: **"Add to Home Screen"** — `text-[28px] font-bold text-center`, colored `var(--color-brand-green)`.
   - Subtitle: **"ListMaster works best as an app on your home screen — it's faster, works offline, and feels just like a native app."** — `text-sm text-text-secondary text-center`.

5. **Instruction steps area:** A numbered/visual step list with two steps. Each step is a rounded card (`rounded-xl bg-white/[0.07] border border-brand-green/15 px-4 py-3.5`) containing:

   **Step 1 — Tap the Share button**
   - Left icon: An inline SVG of the iOS Share icon (square with upward arrow, the universally recognised Safari share symbol), ~28×28, colored `var(--color-brand-teal)`.
   - Text: **"Tap the Share button"** (bold) + a secondary line: **"in Safari's toolbar at the bottom of the screen"** (text-sm, text-text-secondary).

   **Step 2 — Tap "Add to Home Screen"**
   - Left icon: An inline SVG of a plus-inside-a-rounded-square icon, ~28×28, colored `var(--color-brand-teal)`.
   - Text: **"Tap "Add to Home Screen""** (bold) + a secondary line: **"then tap Add in the top-right corner"** (text-sm, text-text-secondary).

   The two cards should be in a vertical flex column with `gap-3`.

6. **Tip/note for other browsers / Android:** Below the steps, a subtle `text-xs text-text-secondary text-center` note: **"Most iOS browsers support Add to Home Screen from the share menu. On Android, look for "Install App" or "Add to Home Screen" in your browser's menu (⋮)."**

   This replaces the previous Safari-only note. On iOS, Chrome, Firefox, Edge, and other browsers all route through WebKit and support the share-sheet "Add to Home Screen" action, so the Safari-focused instructions (share icon → Add to Home Screen) are broadly correct for all iOS browsers. The note now clarifies this and adds Android guidance since Android browser support varies more.

7. **Buttons area** (pinned toward the bottom, inside a `pb-[60px] px-8` wrapper, stacked vertically with `gap-3`):
   - **Primary button — "I've Added It — Continue"**
     - Full-width, `h-14 rounded-2xl text-base font-semibold text-white`, `backgroundColor: var(--color-brand-green)`. Same style as "Get Started" and "Finish Setup" in the other onboarding screens.
     - `onClick` → `navigate("/welcome")`.

   - **Secondary/ghost button — "Skip for Now"**
     - Full-width, `h-12 rounded-2xl text-sm font-medium`, transparent background, text colored `var(--color-text-secondary)`.
     - `onClick` → `navigate("/welcome")`.

8. **Animations:** Apply the same mount entrance animation pattern used in the empty-state of `CategoryPanel` — a `mounted` state boolean that flips to `true` in a `useEffect`, driving a Tailwind transition (`opacity-0 translate-y-3 → opacity-100 translate-y-0`) on the content container. Stagger the instruction cards slightly (e.g. card 1 appears at 0ms delay, card 2 at 100ms).

9. **No store interaction.** This screen does not call any store methods. It simply navigates forward. The onboarding is only marked complete on the final Setup screen, exactly as today.

---

### Step 2 — Update Routes in `App.tsx`

**File:** `src/App.tsx`

1. Add a new import at the top:

   ```tsx
   import OnboardingInstallScreen from "./screens/OnboardingInstallScreen";
   ```

2. In the `!hasCompletedOnboarding` route block, change from:
   ```tsx
   <Route path="/" element={<OnboardingWelcomeScreen />} />
   <Route path="/setup" element={<OnboardingSetupScreen />} />
   <Route path="*" element={<Navigate to="/" replace />} />
   ```
   to:
   ```tsx
   <Route path="/" element={<OnboardingInstallScreen />} />
   <Route path="/welcome" element={<OnboardingWelcomeScreen />} />
   <Route path="/setup" element={<OnboardingSetupScreen />} />
   <Route path="*" element={<Navigate to="/" replace />} />
   ```

---

### Step 3 — Update Navigation in `OnboardingWelcomeScreen.tsx`

**File:** `src/screens/OnboardingWelcomeScreen.tsx`

No URL changes needed for the "Get Started" button — it already navigates to `/setup` which remains correct.

However, since this screen now lives at `/welcome` instead of `/`, the `PageTransitionWrapper` will correctly detect a forward push (depth 0 → depth 1) and apply the slide-in-from-right animation. **No code changes required in this file.**

---

### Step 4 — Verify `PageTransitionWrapper` Handles the New Route Depth

**File:** `src/components/PageTransitionWrapper.tsx`

The existing depth heuristic (`pathname.split("/").filter(Boolean).length`) will compute:

- `/` → depth 0 (Install screen)
- `/welcome` → depth 1 (Welcome screen)
- `/setup` → depth 1 (Setup screen)

Forward navigation from `/` → `/welcome` will trigger the slide-in-right animation ✅.  
Forward navigation from `/welcome` → `/setup` computes same depth (1 → 1) — no animation. This matches current behaviour (Welcome → Setup was also 0 → 1 before, but now both are depth 1). This is acceptable — if animation is desired between Welcome and Setup, that's a separate concern. **No code changes required in this file.**

---

## Summary of File Changes

| File                                      | Action     | Description                                                |
| ----------------------------------------- | ---------- | ---------------------------------------------------------- |
| `src/screens/OnboardingInstallScreen.tsx` | **Create** | New onboarding screen with add-to-home-screen instructions |
| `src/App.tsx`                             | **Modify** | Add import + new route at `/`, move Welcome to `/welcome`  |

**Total files changed:** 2 (1 new, 1 modified)  
**No model/store/service changes.** The screen is purely presentational and navigational.

---

## Design Reference

The screen should visually feel like a sibling of `OnboardingWelcomeScreen` and `OnboardingSetupScreen`:

- Same gradient overlay background (`var(--gradient-brand-wide)` over `var(--color-surface-background)`).
- Same button styling (full-width, `h-14`, `rounded-2xl`, brand-green background).
- Same spacing conventions (`px-8`, `pb-[60px]`).
- Same font hierarchy (`text-[28px] font-bold` for title, `text-sm text-text-secondary` for subtitle).
- All colors via CSS custom properties — no hard-coded hex values.
- Inline SVG icons with consistent stroke style.
