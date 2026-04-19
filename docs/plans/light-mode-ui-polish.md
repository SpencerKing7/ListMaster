# Plan: Light Mode UI Polish (Part 2)

<!-- Status: Proposed | Last updated: April 2026 -->

**Goal:** Subtle refinements to the light mode palette for improved surface separation, softer text, and slightly stronger borders. These changes are minor — light mode is already in good shape. Zero logic changes.

**Dependency:** This plan is independent of the dark mode enhancement plan. Both can be implemented in either order. Changes primarily target the light `:root` and `:root[data-theme="light"]` blocks in `tokens.css`, but the background hex value is also hard-coded in three other locations that must be updated in sync.

---

## Problem Summary

Light mode works well overall, but has a few minor issues:

1. **Background (`#f0f6f3`) and card (`#f8fcf9`) are nearly identical** — only ~3% lightness apart. Cards rely entirely on faint shadows for separation, which can feel flat on lower-contrast displays.
2. **Pure black text (`#000000`)** is slightly harsher than iOS convention, which uses a very dark gray for primary text.
3. **Borders at 6% black opacity** are functionally invisible on the light green background — the SettingsCard border is present but barely perceptible.
4. **Dialog borders at 8%** are also very faint for popups that need to stand out.

---

## Design Principles

- **Keep the minty-green identity.** All surface colors remain green-tinted.
- **Soften, don't darken.** Move primary text from pure black to near-black for reduced eye strain.
- **Widen the background ↔ card gap slightly.** Just enough for cards to read as elevated without shadows.
- **Strengthen borders just enough to be perceptible.** Not heavy — just present.

---

## Step-by-Step Implementation

### Step 1 — Update Light Mode Tokens in `src/styles/tokens.css`

**Both** the default `:root` block and the `:root[data-theme="light"]` block must receive identical changes. Apply every value change to BOTH blocks.

#### 1a. Surface Colors

| Token                        | Old Value | New Value | Rationale                                                                                                                           |
| ---------------------------- | --------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `--color-surface-background` | `#f0f6f3` | `#edf3f0` | Slightly cooler/darker background creates more separation from cards. Cards at `#f8fcf9` now have ~5% lightness gap instead of ~3%. |
| `--color-surface-input`      | `#e8f0ec` | `#e5ede9` | Proportionally adjusted to maintain recessed feel against new background.                                                           |

> **`--color-surface-card` stays at `#f8fcf9`.** The card color is already bright and clean. Lowering the background achieves the needed separation.

#### 1b. Text Colors

| Token                  | Old Value | New Value | Rationale                                                                                                                                                          |
| ---------------------- | --------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--color-text-primary` | `#000000` | `#1a1a1a` | Matches iOS convention — near-black instead of pure black. Reduces harshness without losing readability. WCAG AAA contrast ratio on `#f8fcf9` card is still >15:1. |

#### 1c. Border Colors

| Token                   | Old Value             | New Value             | Rationale                                                                         |
| ----------------------- | --------------------- | --------------------- | --------------------------------------------------------------------------------- |
| `--color-border-subtle` | `rgba(0, 0, 0, 0.06)` | `rgba(0, 0, 0, 0.08)` | Card borders become just barely visible — a hairline that confirms the card edge. |
| `--color-border-dialog` | `rgba(0, 0, 0, 0.08)` | `rgba(0, 0, 0, 0.10)` | Dialogs/sheets get a slightly more visible edge.                                  |

#### 1d. No other light-mode token changes

The following are fine as-is and should NOT be changed:

- `--color-surface-overlay` (`rgba(0, 0, 0, 0.45)`) — adequate scrim on light.
- `--elevation-card` — works well on light backgrounds.
- `--elevation-sheet` — works well on light backgrounds.
- `--color-text-secondary` (`rgba(0, 0, 0, 0.5)`) — acceptable on light; the dark-mode plan already bumps the dark variant independently.
- `--gradient-brand-wide` — visible and pleasant on light.
- All brand colors — fine.

---

### Step 2 — Update Hard-Coded Background Hex in Sync Points

The light-mode `--color-surface-background` hex (`#f0f6f3`) is duplicated in three places outside `tokens.css` that control the iOS status bar color and PWA splash screen. All must be updated from `#f0f6f3` → `#edf3f0`.

#### 2a. `index.html` — meta tag and inline script

**File:** `index.html`

Two changes:

1. The `<meta name="theme-color">` tag for light:
   - Old: `<meta name="theme-color" content="#f0f6f3" media="(prefers-color-scheme: light)" />`
   - New: `<meta name="theme-color" content="#edf3f0" media="(prefers-color-scheme: light)" />`

2. The inline theme initializer script's `lightBg` variable:
   - Old: `var lightBg = "#f0f6f3";`
   - New: `var lightBg = "#edf3f0";`

#### 2b. `src/store/useTheme.ts` — theme-color constant

**File:** `src/store/useTheme.ts`

- Old: `const SURFACE_BG_LIGHT = "#f0f6f3";`
- New: `const SURFACE_BG_LIGHT = "#edf3f0";`

#### 2c. `vite.config.ts` — PWA manifest colors

**File:** `vite.config.ts`

Both `theme_color` and `background_color` in the PWA manifest config:

- Old: `theme_color: "#f0f6f3",`
- New: `theme_color: "#edf3f0",`
- Old: `background_color: "#f0f6f3",`
- New: `background_color: "#edf3f0",`

---

### Step 3 — Verify Component Rendering

No component file changes are needed for light mode. The token adjustments will propagate automatically through `var()` references. However, verify visually:

- **ChecklistItemRow:** Cards should now show a faintly stronger border (from Step 1c) plus a visible lightness gap from the background.
- **AddItemInput:** Same — border token bump applies automatically.
- **SettingsCard:** Already has `border: 1px solid var(--color-border-subtle)` — will become slightly more visible.
- **CategoryPickerPill selected state:** Uses `--color-surface-card` background — will now contrast more against the lowered background.
- **HeaderBar/BottomBar gradient fades:** Use `--color-surface-background` — will pick up the new slightly cooler value automatically.

---

## Files Modified (Summary)

| File                    | Change Type                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- |
| `src/styles/tokens.css` | Token value updates in default `:root` and `:root[data-theme="light"]` blocks |
| `index.html`            | `theme-color` meta tag + inline script `lightBg` variable                     |
| `src/store/useTheme.ts` | `SURFACE_BG_LIGHT` constant                                                   |
| `vite.config.ts`        | PWA manifest `theme_color` and `background_color`                             |

**No component files changed.** All improvements come from token and config adjustments.

---

## Validation

After all changes:

```bash
npm run build
```

Must pass `tsc --noEmit && vite build` with zero errors.

Visual verification checklist (manual, in browser with light mode):

- [ ] Cards separate from background with visible lightness gap
- [ ] Text feels softer — no harsh pure-black appearance
- [ ] Card borders are faintly visible (hairline, not heavy)
- [ ] Dialog/action sheet borders are visible
- [ ] Settings cards show a clear edge
- [ ] Category picker selected pill stands out against background
- [ ] Header/bottom bar gradient fades render correctly
- [ ] Overall green-tinted identity is preserved
- [ ] iOS status bar color matches new background (test in Safari standalone mode)
- [ ] Dark mode is not affected by any change (verify both themes still load independently)
