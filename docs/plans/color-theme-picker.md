# Plan: Color Theme Picker (Green / Blue / Orange)

## Overview

Add a three-option color-theme picker (Green, Blue, Orange) to the Settings sheet,
alongside the existing light/dark/system appearance toggle. The selected theme re-tints
all `--color-brand-*` tokens and related surface tints.

> **Implementation decision (shipped):** Surface backgrounds (`--color-surface-*`) are
> **not** tinted per color theme. All three themes share the same neutral iOS-gray surfaces
> (`#f2f2f7` light / `#0a0a0a` dark). Only `--color-brand-*`, `--color-surface-green-tint`,
> and the RGB helper tokens are overridden. The color-value tables below are the original
> plan values; rows for `--color-surface-*` and gradient stops were intentionally omitted
> from the implementation. The `--gradient-brand-wide` token is set to `none` globally.
> `getSurfaceBg()` was removed in favour of inlining `SURFACE_BG` directly.

## Color Values

### Green (current default — no `data-color-theme` needed, or `"green"`)

Already defined in `tokens.css`. No changes to these values.

### Blue

| Token                                    | Light                                    | Dark                                      |
| ---------------------------------------- | ---------------------------------------- | ----------------------------------------- |
| `--color-brand-green` (primary action)   | `#3b82f6`                                | `#60a5fa`                                 |
| `--color-brand-teal`                     | `#2563eb`                                | `#4b8ef5`                                 |
| `--color-brand-blue`                     | `#1d4ed8`                                | `#3b82f6`                                 |
| `--color-brand-deep-green` (deep accent) | `#1e3a8a`                                | `#1e40af`                                 |
| `--color-surface-background`             | `#eff3fb`                                | `#080c14`                                 |
| `--color-surface-card`                   | `#f7f9fe`                                | `#141d2e`                                 |
| `--color-surface-input`                  | `#e3eaf8`                                | `#0f1826`                                 |
| `--color-surface-chrome`                 | `#eff3fb`                                | `#101828`                                 |
| surface tint                             | `rgba(59,130,246,0.06)`                  | `rgba(96,165,250,0.10)`                   |
| gradient stop 0                          | `rgba(30,58,138,0.18)`                   | `rgba(30,64,175,0.22)`                    |
| gradient stop 50                         | `rgba(37,99,235,0.12)`                   | `rgba(75,142,245,0.14)`                   |
| gradient stop 100                        | `rgba(59,130,246,0.08)`                  | `rgba(59,130,246,0.10)`                   |
| RGB helpers                              | `59,130,246` / `30,58,138` / `37,99,235` | `96,165,250` / `30,64,175` / `75,142,245` |

### Orange

| Token                                    | Light                                     | Dark                                      |
| ---------------------------------------- | ----------------------------------------- | ----------------------------------------- |
| `--color-brand-green` (primary action)   | `#f97316`                                 | `#fb923c`                                 |
| `--color-brand-teal`                     | `#ea6c0a`                                 | `#f0821c`                                 |
| `--color-brand-blue`                     | `#c2510a`                                 | `#e07318`                                 |
| `--color-brand-deep-green` (deep accent) | `#7c2d12`                                 | `#9a3412`                                 |
| `--color-surface-background`             | `#fdf3ec`                                 | `#110805`                                 |
| `--color-surface-card`                   | `#fef8f4`                                 | `#221209`                                 |
| `--color-surface-input`                  | `#f8e8d8`                                 | `#1a0e06`                                 |
| `--color-surface-chrome`                 | `#fdf3ec`                                 | `#1c0f07`                                 |
| surface tint                             | `rgba(249,115,22,0.06)`                   | `rgba(251,146,60,0.10)`                   |
| gradient stop 0                          | `rgba(124,45,18,0.18)`                    | `rgba(154,52,18,0.22)`                    |
| gradient stop 50                         | `rgba(234,108,10,0.12)`                   | `rgba(240,130,28,0.14)`                   |
| gradient stop 100                        | `rgba(249,115,22,0.08)`                   | `rgba(249,115,22,0.10)`                   |
| RGB helpers                              | `249,115,22` / `124,45,18` / `234,108,10` | `251,146,60` / `154,52,18` / `240,130,28` |

### Splash Screen + App Icon

The in-app splash screen themes automatically with the active color — it already consumes
`var(--color-brand-green)`, `var(--color-surface-*)`, and `var(--gradient-brand-wide)`,
all of which are overridden by the `data-color-theme` CSS blocks. No extra work needed.

Home screen icon changes are tracked separately and are out of scope for this plan.

---

## Implementation Steps

### Step 1 — Add `ColorTheme` type to `src/models/types.ts`

Add: `export type ColorTheme = "green" | "blue" | "orange";`

### Step 2 — Add `COLOR_THEME_KEY` + CRUD to `src/services/settingsService.ts`

- Add `const COLOR_THEME_KEY = "colorTheme";` constant.
- Add `getColorTheme()`, `setColorTheme()`, `clearColorTheme()` methods.
- Add `clearColorTheme()` to the existing `clearAll()` call pattern.

### Step 3 — Add `applyColorThemeToDOM()` to `src/store/useTheme.ts`

- Sets `data-color-theme="blue|orange"` on `document.documentElement`.
- Removes the attribute entirely for `"green"` (CSS `:root` defaults apply).
- Updates `--color-surface-background` inline style (like the current `applyThemeToDOM` does) so the repaint is immediate.
- Updates `<meta name="theme-color">` via existing `setThemeColor()` helper, using the theme's surface-background value.
- Export a `SURFACE_BG_PER_THEME` map for light and dark × 3 themes.

### Step 4 — Wire `colorTheme` into `src/store/useSettingsStore.ts`

- Import `ColorTheme` and `applyColorThemeToDOM`.
- Add `colorTheme: ColorTheme` state, initialized from `SettingsService.getColorTheme()` with synchronous `applyColorThemeToDOM()` call (same pattern as `appearanceMode`).
- Add `setColorTheme(theme: ColorTheme)` action.
- Expose both in `SettingsState` interface and context value.
- Update `resetToNewUser()` to reset to `"green"`.
- Update `SettingsState` return type accordingly.

### Step 5 — Add blue + orange theme CSS blocks to `src/styles/tokens.css`

For each of the four existing mode blocks, add a nested `:root[data-color-theme="blue"]`
and `:root[data-color-theme="orange"]` override using `:is()` to combine attributes:

```css
/* ── Blue theme override — light default ─── */
:root[data-color-theme="blue"] { … }
/* ── Blue theme override — system dark ─── */
@media (prefers-color-scheme: dark) {
  :root[data-color-theme="blue"] { … }
}
/* ── Blue theme override — forced light ─── */
:root[data-theme="light"][data-color-theme="blue"] { … }
/* ── Blue theme override — forced dark ─── */
:root[data-theme="dark"][data-color-theme="blue"] { … }
```

Repeat for orange. Also add the five `--color-splash-*` tokens to `:root`.

### Step 6 — No splash screen code changes required

The in-app splash screen already consumes `var(--color-brand-green)`, `var(--color-surface-*)`,
and `var(--gradient-brand-wide)`, all of which are overridden by the `data-color-theme` CSS
blocks added in Step 5. It themes automatically. Home screen icon is out of scope.

### Step 7 — Create `src/features/settings/components/ColorThemeSection.tsx`

- Renders a `SettingsCard` with `SectionLabel` "Color Theme".
- Three pill buttons (Green / Blue / Orange) styled as the existing `ToggleGroup` pattern.
- Each pill shows a small filled color swatch circle + label.
- Active pill: white background + `--color-brand-green` text (the currently active brand color).
- Props: `colorTheme: ColorTheme`, `onChangeTheme: (theme: ColorTheme) => void`.

### Step 8 — Export `ColorThemeSection` from `src/features/settings/index.ts`

### Step 9 — Add `ColorThemeSection` to `src/screens/SettingsSheet.tsx`

- Import `useSettingsStore` fields `colorTheme` + `setColorTheme`.
- Place `<ColorThemeSection>` immediately below `<AppearanceSection>`.

### Step 10 — Update `applyThemeToDOM` in `src/store/useTheme.ts` to also re-evaluate the surface background per active color theme

When `applyThemeToDOM` fires (light/dark/system switch), it must read the current
`data-color-theme` attribute value so the `meta[theme-color]` and inline
`backgroundColor` repaint use the correct theme's surface-background color, not
hardcoded green values. Refactor `SURFACE_BG_LIGHT` / `SURFACE_BG_DARK` into a lookup
function `getSurfaceBg(mode, colorTheme)`.

### Step 11 — Run `npm run build` and fix any TypeScript errors

---

## Files Created

| File                                                     | Why                            |
| -------------------------------------------------------- | ------------------------------ |
| `src/features/settings/components/ColorThemeSection.tsx` | New settings section component |

## Files Modified

| File                              | Change summary                                           |
| --------------------------------- | -------------------------------------------------------- |
| `src/models/types.ts`             | Add `ColorTheme` type                                    |
| `src/services/settingsService.ts` | Add color theme persistence methods                      |
| `src/store/useTheme.ts`           | Add `applyColorThemeToDOM()`, refactor surface-bg lookup |
| `src/store/useSettingsStore.ts`   | Wire `colorTheme` state + `setColorTheme` action         |
| `src/styles/tokens.css`           | Add blue/orange theme CSS blocks                         |
| `src/features/settings/index.ts`  | Export `ColorThemeSection`                               |
| `src/screens/SettingsSheet.tsx`   | Render `<ColorThemeSection>`                             |

---

## Architecture Notes

- `data-color-theme` + `data-theme` are orthogonal attributes. CSS specificity handles
  the intersection correctly via `[data-theme="dark"][data-color-theme="blue"]` selectors.
- The green theme requires **no** `data-color-theme` attribute (`:root` defaults). The
  attribute is only set for blue/orange. This means green is also the graceful fallback
  if the attribute is missing (e.g., first launch before persistence loads).
- No component files reference brand colors directly by value — they all use
  `var(--color-brand-*)` — so zero component changes are needed beyond the new section.
- `resetToNewUser()` resets to `"green"`, which removes `data-color-theme` from the DOM.
