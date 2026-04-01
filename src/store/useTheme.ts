// src/store/useTheme.ts

/** Surface-background hex values matching tokens.css — used to keep the
 *  `<meta name="theme-color">` in sync so the iOS status bar area matches. */
const SURFACE_BG_LIGHT = "#f0f6f3";
const SURFACE_BG_DARK = "#0e1714";

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
    // Restore both media-conditional meta tags so the browser picks the right one
    setThemeColor(SURFACE_BG_LIGHT, "light");
    setThemeColor(SURFACE_BG_DARK, "dark");
  } else {
    root.setAttribute("data-theme", mode);
    const bg = mode === "dark" ? SURFACE_BG_DARK : SURFACE_BG_LIGHT;
    // Set both meta tags to the forced value so there is no mismatch
    setThemeColor(bg, "light");
    setThemeColor(bg, "dark");
  }

  // Force immediate background repaint to prevent flash between old and new theme
  const bg =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? SURFACE_BG_DARK
      : SURFACE_BG_LIGHT;
  root.style.backgroundColor = bg;
  document.body.style.backgroundColor = bg;

  // Also set the gradient to ensure full coverage behind safe areas
  const gradient = getComputedStyle(root)
    .getPropertyValue("--gradient-brand-wide")
    .trim();
  if (gradient) {
    root.style.backgroundImage = gradient;
  }
}

/** Updates a `<meta name="theme-color">` tag for a specific color-scheme media. */
function setThemeColor(color: string, scheme: "light" | "dark"): void {
  const selector = `meta[name="theme-color"][media="(prefers-color-scheme: ${scheme})"]`;
  const meta = document.querySelector<HTMLMetaElement>(selector);
  if (meta) {
    meta.setAttribute("content", color);
  }
}
