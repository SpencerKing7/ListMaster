# Theming & Color System

---

## Appearance Modes

The app supports three appearance modes, managed by `useSettingsStore` and applied by `applyThemeToDOM()` in `src/store/useTheme.ts`:

| Mode       | Behavior                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `"system"` | Removes the `data-theme` attribute from `<html>` entirely, allowing `@media (prefers-color-scheme: dark)` to control the theme |
| `"light"`  | Sets `data-theme="light"` on `<html>`, forcing light mode regardless of OS setting                                             |
| `"dark"`   | Sets `data-theme="dark"` on `<html>`, forcing dark mode regardless of OS setting                                               |

---

## How Theme is Applied

Theme application is **imperative DOM manipulation**, not React state. `applyThemeToDOM(mode)` sets or removes the `data-theme` attribute on `document.documentElement` directly. This avoids a React re-render cascade just to change a CSS attribute.

```ts
// src/store/useTheme.ts
export function applyThemeToDOM(mode: AppearanceMode): void {
  if (mode === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", mode);
  }
  // Also updates <meta name="theme-color"> for iOS status bar
}
```

### Flash-Free on Load

`applyThemeToDOM()` is called **synchronously inside the `useState` initializer** in `SettingsProvider` (in `src/store/useSettingsStore.ts`). Because the initializer runs before React's first paint, the correct `data-theme` is on `<html>` before any component renders — preventing the "flash of wrong theme" that would occur if theme were applied in a `useEffect`.

**Do not move this call out of the initializer.**

---

## Text Size

`applyTextSizeToDOM(size)` (also in `src/store/useTheme.ts`) sets **two** CSS custom properties on `:root`:

```ts
document.documentElement.style.setProperty("--text-size-base", remValue);
document.documentElement.style.setProperty("--row-padding-y", paddingValue);
```

- `--text-size-base` — scales the checklist item label font size. Five-step scale:

  | `TextSize` | `--text-size-base` |
  | ---------- | ------------------ |
  | `"xs"`     | `0.6875rem`        |
  | `"s"`      | `0.8125rem`        |
  | `"m"`      | `1rem`             |
  | `"l"`      | `1.125rem`         |
  | `"xl"`     | `1.3125rem`        |

- `--row-padding-y` — scales the vertical padding of list item rows proportionally with the font size:

  | `TextSize` | `--row-padding-y` |
  | ---------- | ----------------- |
  | `"xs"`     | `0.45rem`         |
  | `"s"`      | `0.6rem`          |
  | `"m"`      | `0.875rem`        |
  | `"l"`      | `1.0rem`          |
  | `"xl"`     | `1.25rem`         |

Both `applyThemeToDOM()` and `applyTextSizeToDOM()` also update the `<meta name="theme-color">` tags (one for `media="(prefers-color-scheme: light)"` and one for dark) so the iOS status-bar area matches the app background color at all times, including during forced theme overrides.

---

## Color Token System (`src/styles/tokens.css`)

All brand colors are defined as CSS custom properties in `tokens.css`. There are four rule blocks, and **every token must appear in all four**:

| Block                                 | When it applies                                                  |
| ------------------------------------- | ---------------------------------------------------------------- |
| `:root`                               | Light mode default (system preference = light, or no preference) |
| `@media (prefers-color-scheme: dark)` | System dark mode when `data-theme` is absent                     |
| `:root[data-theme="light"]`           | Forced light mode override                                       |
| `:root[data-theme="dark"]`            | Forced dark mode override                                        |

### Token Namespaces

| Prefix                  | Purpose                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| `--color-brand-*`       | Primary brand palette — green, teal, blue, deep-green                                          |
| `--color-brand-*-rgb`   | RGB channel triples for use in `rgba()` (e.g. `rgba(var(--color-brand-deep-green-rgb), 0.10)`) |
| `--color-surface-*`     | Background layers — background, card, input, green tint, overlay                               |
| `--color-text-*`        | Text colors — primary, secondary                                                               |
| `--color-danger`        | Destructive actions (delete button, error states)                                              |
| `--elevation-*`         | Box shadow definitions for card and sheet elevation                                            |
| `--gradient-brand-wide` | The diagonal alpha-tinted brand gradient used as the app background                            |

### Tailwind Aliases (`src/index.css`)

The `@theme inline` block in `src/index.css` maps each CSS custom property to a Tailwind utility class:

```css
--color-brand-green: var(--color-brand-green);
--color-surface-card: var(--color-surface-card);
```

This enables classes like `text-brand-green`, `bg-surface-card`, and `bg-surface-background` in Tailwind JSX. Use these Tailwind classes where classes are already in use; use the `var()` form directly in `style={{}}` props.

---

## Rules

- **Never hard-code hex or `oklch` color values in component files.** Always reference a CSS custom property: `var(--color-brand-green)`, `var(--color-surface-card)`, etc.
- **Never use Tailwind's `dark:` variant** for theme-sensitive colors. All theming goes through the `data-theme` attribute and CSS custom properties in `tokens.css`.
- **To add a new color:**
  1. Add it to all four rule blocks in `tokens.css`.
  2. Add an `--color-*` alias in the `@theme inline` block in `index.css`.
  3. Use the new Tailwind class or `var()` reference in components.
