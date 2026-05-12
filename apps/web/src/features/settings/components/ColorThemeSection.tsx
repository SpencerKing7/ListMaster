// src/features/settings/components/ColorThemeSection.tsx
// Color theme picker (Green / Blue / Orange) for SettingsSheet.

import type { JSX } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ColorTheme } from "@/models/types";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";

// MARK: - Constants

const COLOR_THEMES = ["green", "blue", "orange"] as const;

/** Type guard — narrows a raw string to `ColorTheme`. */
function isColorTheme(value: string): value is ColorTheme {
  return (COLOR_THEMES as readonly string[]).includes(value);
}

/** CSS custom property names for theme preview swatches.
 *  Values are defined in tokens.css — never hardcoded in component files. */
const THEME_SWATCH_VAR: Record<ColorTheme, string> = {
  green: "var(--color-theme-swatch-green)",
  blue: "var(--color-theme-swatch-blue)",
  orange: "var(--color-theme-swatch-orange)",
};

const THEME_LABEL: Record<ColorTheme, string> = {
  green: "Green",
  blue: "Blue",
  orange: "Orange",
};

// MARK: - Props

interface ColorThemeSectionProps {
  /** Currently selected color theme. */
  colorTheme: ColorTheme;
  /** Called when the user selects a new color theme. */
  onChangeTheme: (theme: ColorTheme) => void;
}

// MARK: - Component

/**
 * Settings card containing the green / blue / orange color theme toggle group.
 * Each option shows a filled color swatch circle alongside the theme label.
 */
export function ColorThemeSection({ colorTheme, onChangeTheme }: ColorThemeSectionProps): JSX.Element {
  return (
    <SettingsCard>
      <SectionLabel>Color Theme</SectionLabel>
      <ToggleGroup
        value={[colorTheme]}
        onValueChange={(values: string[]) => {
          const first = values[0];
          if (first !== undefined && isColorTheme(first)) onChangeTheme(first);
        }}
        className="w-full rounded-xl p-1"
        style={{
          backgroundColor: `rgba(var(--color-brand-deep-green-rgb), 0.12)`,
        }}
      >
        {(COLOR_THEMES).map((theme) => (
          <ToggleGroupItem
            key={theme}
            value={theme}
            className="flex-1 !rounded-lg text-xs font-semibold capitalize hover:!bg-transparent aria-pressed:!bg-[var(--color-surface-card)] aria-pressed:!text-[var(--color-brand-green)] aria-pressed:shadow-sm aria-pressed:!opacity-100 opacity-75 transition-all"
            style={{ color: "var(--color-text-primary)", touchAction: "manipulation" }}
          >
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: THEME_SWATCH_VAR[theme] }}
              />
              {THEME_LABEL[theme]}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </SettingsCard>
  );
}
