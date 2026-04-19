# Plan: Dark Mode & Overall UI Visual Enhancement

<!-- Status: Proposed | Last updated: April 2026 -->

**Goal:** Improve dark mode contrast, readability, and visual hierarchy across the entire app. Lighten dark surfaces, strengthen borders, increase text contrast on secondary elements, and refine popup/sheet/dialog presentation — all purely CSS token and className changes. Zero logic changes.

---

## Problem Summary

The current dark mode palette uses very deep, nearly-black greens (`#0e1714` background, `#131f1b` card, `#0a110e` input). This creates:

1. **Low contrast between surfaces** — cards barely distinguish from background.
2. **Popups/sheets blend into the background** — dialogs and action sheets feel hard to see.
3. **Secondary text at 50% white opacity is too dim** — metadata and labels strain the eyes.
4. **Borders at 6–10% white opacity are nearly invisible** — card edges disappear.
5. **The brand gradient overlay is imperceptible** in dark mode due to low-alpha on a near-black base.

---

## Design Principles for This Change

- **Keep the green-tinted dark identity.** Surfaces stay tinted green, not neutral gray.
- **Lift the overall lightness by ~15–20%.** Move from near-black greens to dark-but-visible greens.
- **Increase border visibility.** Go from 6% → 12% white on subtle borders, 10% → 16% on dialog borders.
- **Boost secondary text.** Go from 50% → 60% white opacity.
- **Give cards a clear lift above background.** Ensure ≥ 6% perceived lightness difference.
- **Strengthen overlay scrims** so popups pop.
- **No logic changes.** Only `tokens.css`, `index.css`, and component className/style tweaks.

---

## Step-by-Step Implementation

### Step 1 — Update Dark Mode Tokens in `src/styles/tokens.css`

**Both** the `@media (prefers-color-scheme: dark)` block and the `:root[data-theme="dark"]` block must receive identical changes. Apply every value change to BOTH blocks.

#### 1a. Surface Colors

| Token                        | Old Value                  | New Value                  | Rationale                                                                                                  |
| ---------------------------- | -------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `--color-surface-background` | `#0e1714`                  | `#141f1b`                  | Lighter base — still distinctly green-dark, but no longer near-black. Hex lightness goes from ~8% to ~12%. |
| `--color-surface-card`       | `#131f1b`                  | `#1c2b26`                  | Cards now clearly separate from background (~16% lightness).                                               |
| `--color-surface-input`      | `#0a110e`                  | `#111b17`                  | Input fields slightly recessed but not black-hole dark.                                                    |
| `--color-surface-green-tint` | `rgba(73, 203, 154, 0.15)` | `rgba(73, 203, 154, 0.10)` | Slightly reduced — the tint was too saturated against lifted surfaces.                                     |

#### 1b. Text Colors

| Token                    | Old Value                  | New Value                   | Rationale                                                            |
| ------------------------ | -------------------------- | --------------------------- | -------------------------------------------------------------------- |
| `--color-text-secondary` | `rgba(255, 255, 255, 0.5)` | `rgba(255, 255, 255, 0.63)` | Boost secondary text readability. Meets WCAG AA on new card surface. |

#### 1c. Border Colors

| Token                   | Old Value                   | New Value                   | Rationale                                    |
| ----------------------- | --------------------------- | --------------------------- | -------------------------------------------- |
| `--color-border-subtle` | `rgba(255, 255, 255, 0.06)` | `rgba(255, 255, 255, 0.12)` | Card edges now visible — subtle but present. |
| `--color-border-dialog` | `rgba(255, 255, 255, 0.1)`  | `rgba(255, 255, 255, 0.18)` | Dialogs and sheets get a clear perimeter.    |

#### 1d. Overlay / Scrim

| Token                     | Old Value            | New Value            | Rationale                                                |
| ------------------------- | -------------------- | -------------------- | -------------------------------------------------------- |
| `--color-surface-overlay` | `rgba(0, 0, 0, 0.6)` | `rgba(0, 0, 0, 0.7)` | Stronger scrim behind popups to create depth separation. |

#### 1e. Elevation Shadows

| Token               | Old Value                                                  | New Value                                                 | Rationale                                               |
| ------------------- | ---------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| `--elevation-card`  | `0 1px 3px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.15)`    | `0 1px 3px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)`    | Slightly deeper shadow for card lift.                   |
| `--elevation-sheet` | `0 -4px 24px rgba(0,0,0,0.35), 0 -1px 4px rgba(0,0,0,0.2)` | `0 -4px 24px rgba(0,0,0,0.5), 0 -1px 4px rgba(0,0,0,0.3)` | Sheets cast a stronger shadow to separate from content. |

#### 1f. Brand Gradient (dark variant)

Currently, `--gradient-brand-wide` is only defined once in `:root` and shared across themes. To make the gradient more visible in dark mode, add a dark-mode override in BOTH dark blocks:

```css
--gradient-brand-wide: linear-gradient(
  135deg,
  rgba(39, 120, 98, 0.22) 0%,
  rgba(61, 170, 176, 0.14) 50%,
  rgba(76, 141, 203, 0.1) 100%
);
```

This raises the gradient alpha values so the green-to-teal wash is perceptible against `#141f1b`.

**Implementation notes:**

- The `--gradient-brand-wide` token is currently only in the light `:root` block. Add it to both dark blocks with the dark-specific values above.
- Do NOT modify the light `:root` or `:root[data-theme="light"]` gradient values.

---

### Step 1g — Update Hard-Coded Dark Background Hex in Sync Points

The dark-mode `--color-surface-background` hex (`#0e1714`) is duplicated in three places outside `tokens.css` that control the iOS status bar color and PWA splash screen. All must be updated from `#0e1714` → `#141f1b`.

#### `index.html` — meta tag and inline script

Two changes:

1. The `<meta name="theme-color">` tag for dark:
   - Old: `<meta name="theme-color" content="#0e1714" media="(prefers-color-scheme: dark)" />`
   - New: `<meta name="theme-color" content="#141f1b" media="(prefers-color-scheme: dark)" />`

2. The inline theme initializer script's `darkBg` variable:
   - Old: `var darkBg = "#0e1714";`
   - New: `var darkBg = "#141f1b";`

#### `src/store/useTheme.ts` — theme-color constant

- Old: `const SURFACE_BG_DARK = "#0e1714";`
- New: `const SURFACE_BG_DARK = "#141f1b";`

> **Note:** `vite.config.ts` PWA manifest `theme_color` and `background_color` are set to the light-mode value and do not need a dark-mode update here.

---

### Step 2 — Refine Checked-Item Row Appearance (Dark Mode)

**File:** `src/components/ChecklistItemRow.tsx`

The checked-item background uses `rgba(var(--color-brand-deep-green-rgb), 0.04)`. In dark mode on the new card surface, `0.04` is invisible.

**Change:** Increase from `0.04` to `0.08`.

Find:

```tsx
backgroundColor: item.isChecked
  ? "rgba(var(--color-brand-deep-green-rgb), 0.04)"
  : "var(--color-surface-card)",
```

Replace with:

```tsx
backgroundColor: item.isChecked
  ? "rgba(var(--color-brand-deep-green-rgb), 0.08)"
  : "var(--color-surface-card)",
```

This is safe for light mode too — `0.08` of deep-green on the light card is still extremely subtle.

---

### Step 3 — Add Visible Card Border to Checklist Item Rows

**File:** `src/components/ChecklistItemRow.tsx`

Currently, unchecked rows rely solely on `--elevation-card` box-shadow for separation. In dark mode, shadows on dark backgrounds are nearly invisible regardless of opacity.

**Change:** Add a `border` to the `style` object for unchecked items:

In the `style` prop of the `<li>`, for the unchecked branch, add:

```tsx
border: "1px solid var(--color-border-subtle)",
```

For the checked branch, add:

```tsx
border: "1px solid transparent",
```

This ensures unchecked rows get a subtle visible edge in dark mode while checked (muted) rows stay borderless. The transparent border on checked rows prevents layout shift.

---

### Step 4 — Strengthen Category Picker Selected-Pill Contrast

**File:** `src/components/CategoryPickerPill.tsx`

The selected pill uses `backgroundColor: "var(--color-surface-card)"`. With the old dark tokens, card and background were almost identical. Even with the new tokens, reinforce the selected state:

**Change:** In the `isSelected` style branch, add a border:

```tsx
border: "1px solid var(--color-border-subtle)",
```

In the `!isSelected` (unselected) style branch, add:

```tsx
border: "1px solid transparent",
```

This prevents layout shift while giving the selected pill a visible boundary in dark mode.

---

### Step 5 — Improve AddItemInput Visibility

**File:** `src/components/AddItemInput.tsx`

The input container uses `backgroundColor: "var(--color-surface-card)"` and `boxShadow: "var(--elevation-card)"`. In dark mode, it blends in.

**Change:** Add a border to the input container `<div>`:

```tsx
border: "1px solid var(--color-border-subtle)",
```

---

### Step 6 — Improve Settings Sheet Header Contrast

**File:** `src/screens/SettingsSheet.tsx`

The gradient fade div under the sticky header uses `var(--color-surface-background)`. Ensure the gradient properly covers scrolled content in dark mode by matching the updated background.

No token change needed (it reads from the variable), but verify the gradient fade div's `background` value correctly resolves. **No code change expected here — just verify after Step 1 token changes.**

---

### Step 7 — Improve Action Sheet / Dialog Presentation

**Files:** `src/components/ui/action-sheet.tsx` and `src/components/ui/dialog.tsx` are READ-ONLY (shadcn/ui). However, they already consume `--color-surface-card`, `--color-border-dialog`, `--color-surface-overlay`, and `--elevation-sheet` from tokens.

**No component edits needed.** The token changes in Step 1 (stronger borders at 18%, deeper overlay at 70%, heavier sheet shadow) will automatically improve popup presentation. Verify visually after Step 1.

---

### Step 8 — Refine BottomBar Button Backgrounds

**File:** `src/components/BottomBar.tsx`

Navigation buttons use `rgba(var(--color-brand-deep-green-rgb), 0.10)`. The clear button uses `rgba(212, 75, 74, 0.10)`.

In dark mode on the new, lighter background, these tinted buttons may need a slight bump.

**Change:** Increase both from `0.10` to `0.12`:

- Navigation buttons: `rgba(var(--color-brand-deep-green-rgb), 0.12)`
- Clear button: `rgba(var(--color-danger-rgb), 0.12)`

Also replace the hard-coded `rgba(212, 75, 74, 0.10)` for the clear button with the token-based `rgba(var(--color-danger-rgb), 0.12)` — this ensures it adapts to the dark-mode danger color.

---

### Step 9 — Refine HeaderBar Refresh Button Background

**File:** `src/components/HeaderBar.tsx`

The refresh button uses `rgba(var(--color-brand-deep-green-rgb), 0.10)`.

**Change:** Increase to `0.12` for consistency with BottomBar:

```tsx
backgroundColor: "rgba(var(--color-brand-deep-green-rgb), 0.12)",
```

---

### Step 10 — Improve EmptyState Icon Circle Visibility

**File:** `src/components/EmptyState.tsx`

The icon circle uses `rgba(var(--color-brand-deep-green-rgb), 0.10)`.

**Change:** Increase to `0.14`:

```tsx
backgroundColor: "rgba(var(--color-brand-deep-green-rgb), 0.14)";
```

---

### Step 11 — Improve SwipeableRow Delete Button Contrast

**File:** `src/components/SwipeableRow.tsx`

The delete tray uses `backgroundColor: "var(--color-danger)"`. This is fine — the danger color already adapts. **No change needed.** Verify visually.

---

### Step 12 — Bump Settings Feature Tinted Button Backgrounds

Multiple settings dialogs and sections use `0.10` opacity tinted backgrounds for action buttons. Bump all to `0.12` for consistency with the main screen components.

**Files and changes (apply to each):**

| File                                                           | Old Value                                       | New Value                                       |
| -------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| `src/features/settings/components/RenameCategoryDialog.tsx`    | `rgba(var(--color-brand-green-rgb), 0.10)`      | `rgba(var(--color-brand-green-rgb), 0.12)`      |
| `src/features/settings/components/AddCategoryDialog.tsx`       | `rgba(var(--color-brand-green-rgb), 0.10)`      | `rgba(var(--color-brand-green-rgb), 0.12)`      |
| `src/features/settings/components/AddGroupDialog.tsx`          | `rgba(var(--color-brand-green-rgb), 0.10)`      | `rgba(var(--color-brand-green-rgb), 0.12)`      |
| `src/features/settings/components/RenameGroupDialog.tsx`       | `rgba(var(--color-brand-green-rgb), 0.10)`      | `rgba(var(--color-brand-green-rgb), 0.12)`      |
| `src/features/settings/components/AdoptSyncCodeDialog.tsx`     | `rgba(var(--color-brand-green-rgb), 0.10)`      | `rgba(var(--color-brand-green-rgb), 0.12)`      |
| `src/features/settings/components/CategoriesGroupsSection.tsx` | `rgba(var(--color-brand-green-rgb), 0.10)`      | `rgba(var(--color-brand-green-rgb), 0.12)`      |
| `src/features/settings/components/AppearanceSection.tsx`       | `rgba(var(--color-brand-deep-green-rgb), 0.10)` | `rgba(var(--color-brand-deep-green-rgb), 0.12)` |
| `src/features/settings/components/TextSizeSection.tsx`         | `rgba(var(--color-brand-deep-green-rgb), 0.10)` | `rgba(var(--color-brand-deep-green-rgb), 0.12)` |

These are simple find-and-replace changes — the `0.10` → `0.12` swap in each file's `backgroundColor` value.

---

## Files Modified (Summary)

| File                                                           | Change Type                                                 |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| `src/styles/tokens.css`                                        | Token value updates in both dark blocks + gradient addition |
| `index.html`                                                   | `theme-color` meta tag + inline script `darkBg` variable    |
| `src/store/useTheme.ts`                                        | `SURFACE_BG_DARK` constant                                  |
| `src/components/ChecklistItemRow.tsx`                          | Background opacity bump + border addition                   |
| `src/components/CategoryPickerPill.tsx`                        | Border addition on selected/unselected pills                |
| `src/components/AddItemInput.tsx`                              | Border addition on input container                          |
| `src/components/BottomBar.tsx`                                 | Background opacity bump + token usage fix                   |
| `src/components/HeaderBar.tsx`                                 | Background opacity bump                                     |
| `src/components/EmptyState.tsx`                                | Background opacity bump                                     |
| `src/features/settings/components/RenameCategoryDialog.tsx`    | Background opacity bump                                     |
| `src/features/settings/components/AddCategoryDialog.tsx`       | Background opacity bump                                     |
| `src/features/settings/components/AddGroupDialog.tsx`          | Background opacity bump                                     |
| `src/features/settings/components/RenameGroupDialog.tsx`       | Background opacity bump                                     |
| `src/features/settings/components/AdoptSyncCodeDialog.tsx`     | Background opacity bump                                     |
| `src/features/settings/components/CategoriesGroupsSection.tsx` | Background opacity bump                                     |
| `src/features/settings/components/AppearanceSection.tsx`       | Background opacity bump                                     |
| `src/features/settings/components/TextSizeSection.tsx`         | Background opacity bump                                     |

**Read-only files NOT touched:** `src/components/ui/*` (action-sheet, dialog, sheet) — these benefit automatically from token changes.

---

## Validation

After all changes:

```bash
npm run build
```

Must pass `tsc --noEmit && vite build` with zero errors.

Visual verification checklist (manual, in browser with dark mode):

- [ ] Cards clearly separate from background
- [ ] Checklist item rows have visible edges
- [ ] Checked items are visually distinct but muted
- [ ] Category picker selected pill stands out
- [ ] Add-item input is clearly visible
- [ ] Action sheets / dialogs have strong border and scrim
- [ ] Settings sheet scrolls cleanly with gradient fade
- [ ] Bottom bar buttons are visible and tappable
- [ ] Empty state icon circle is visible
- [ ] Brand gradient wash is perceptible on the background
- [ ] iOS status bar color matches new dark background (test in Safari standalone mode)
- [ ] Light mode is not negatively affected by any change
- [ ] Light mode is not negatively affected by any change
