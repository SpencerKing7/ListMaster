// src/store/useTheme.ts

/** Applies the user's appearance choice to the DOM.
 *  - 'light' / 'dark' → sets data-theme attribute, overriding the system media query.
 *  - 'system' → removes data-theme, letting @media (prefers-color-scheme) take over.
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
  } else {
    root.setAttribute("data-theme", mode);
  }
}
