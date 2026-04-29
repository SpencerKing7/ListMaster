// src/store/useTheme.ts
import type { TextSize, ColorTheme } from "@/models/types";

// MARK: - Surface background lookup

/** Surface-background hex values for light and dark — neutral across all color themes.
 *  Used to keep `<meta name="theme-color">` and the immediate DOM repaint in sync. */
const SURFACE_BG = {
  light: "#f2f2f7",
  dark: "#0a0a0a",
};

/** Maps TextSize tokens to their rem values, matching the 5-step scale. */
const TEXT_SIZE_VALUES: Record<TextSize, string> = {
  xs: "0.6875rem",
  s: "0.8125rem",
  m: "1rem",
  l: "1.125rem",
  xl: "1.3125rem",
};

/** Maps TextSize tokens to vertical padding values for list item rows.
 *  Scales proportionally with text size for better density. */
const ROW_PADDING_VALUES: Record<TextSize, string> = {
  xs: "0.45rem",
  s: "0.6rem",
  m: "0.875rem",
  l: "1.0rem",
  xl: "1.25rem",
};

// MARK: - DOM application functions

/** Applies the user's appearance choice to the DOM.
 *  - 'light' / 'dark' → sets data-theme attribute, overriding the system media query.
 *  - 'system' → removes data-theme, letting @media (prefers-color-scheme) take over.
 *  Also updates the `<meta name="theme-color">` so the iOS status bar area
 *  matches the current surface background.
 *  Mirrors UIWindow.overrideUserInterfaceStyle from ThemeManager.swift.
 *
 *  Called synchronously inside the SettingsProvider useState initializer
 *  so the correct theme is applied BEFORE the first React paint — avoiding
 *  a flash of wrong theme on load.
 */
export function applyThemeToDOM(mode: "system" | "light" | "dark"): void {
  const root = document.documentElement;

  if (mode === "system") {
    root.removeAttribute("data-theme");
    setThemeColor(SURFACE_BG.light, "light");
    setThemeColor(SURFACE_BG.dark, "dark");
  } else {
    root.setAttribute("data-theme", mode);
    const bg = mode === "dark" ? SURFACE_BG.dark : SURFACE_BG.light;
    setThemeColor(bg, "light");
    setThemeColor(bg, "dark");
  }

  // Force immediate background repaint to prevent flash between old and new theme
  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const bg = isDark ? SURFACE_BG.dark : SURFACE_BG.light;
  root.style.backgroundColor = bg;
  document.body.style.backgroundColor = bg;
}

/** Applies the user's color theme choice to the DOM by setting the
 *  `data-color-theme` attribute on the root element.
 *  - 'green' → removes the attribute (CSS :root defaults apply).
 *  - 'blue' | 'orange' → sets data-color-theme to the theme name.
 *  Also updates the immediate background repaint and meta theme-color.
 *
 *  Called synchronously inside the SettingsProvider useState initializer. */
export function applyColorThemeToDOM(
  theme: ColorTheme,
  appearanceMode: "system" | "light" | "dark" = "system",
): void {
  const root = document.documentElement;
  if (theme === "green") {
    root.removeAttribute("data-color-theme");
  } else {
    root.setAttribute("data-color-theme", theme);
  }

  // Re-paint background with neutral surface color
  const isDark =
    appearanceMode === "dark" ||
    (appearanceMode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const bg = isDark ? SURFACE_BG.dark : SURFACE_BG.light;
  root.style.backgroundColor = bg;
  document.body.style.backgroundColor = bg;

  if (appearanceMode === "system") {
    setThemeColor(SURFACE_BG.light, "light");
    setThemeColor(SURFACE_BG.dark, "dark");
  } else {
    setThemeColor(bg, "light");
    setThemeColor(bg, "dark");
  }
}

/** Applies the user's text size preference to the DOM by setting
 *  the `--text-size-base` CSS custom property on the root element.
 *  Called synchronously inside the SettingsProvider useState initializer. */
export function applyTextSizeToDOM(size: TextSize): void {
  const textValue = TEXT_SIZE_VALUES[size] ?? TEXT_SIZE_VALUES["m"];
  const paddingValue = ROW_PADDING_VALUES[size] ?? ROW_PADDING_VALUES["m"];
  document.documentElement.style.setProperty("--text-size-base", textValue);
  document.documentElement.style.setProperty("--row-padding-y", paddingValue);
}

/** Updates a `<meta name="theme-color">` tag for a specific color-scheme media. */
function setThemeColor(color: string, scheme: "light" | "dark"): void {
  const selector = `meta[name="theme-color"][media="(prefers-color-scheme: ${scheme})"]`;
  const meta = document.querySelector<HTMLMetaElement>(selector);
  if (meta) {
    meta.setAttribute("content", color);
  }
}
