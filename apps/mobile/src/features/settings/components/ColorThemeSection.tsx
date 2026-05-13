// src/features/settings/components/ColorThemeSection.tsx
import type { ColorTheme } from "@/models/types";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";
import { SegmentedControl } from "./SegmentedControl";

interface ColorThemeSectionProps {
  colorTheme: ColorTheme;
  onChangeTheme: (theme: ColorTheme) => void;
}

/** Static swatch colors matching web tokens.css --color-theme-swatch-*. */
const THEME_SWATCHES: Record<ColorTheme, string> = {
  green: "#39b385",
  blue: "#3b82f6",
  orange: "#f97316",
};

const SEGMENTS: { value: ColorTheme; label: string; dot: string }[] = [
  { value: "green", label: "Green", dot: THEME_SWATCHES.green },
  { value: "blue", label: "Blue", dot: THEME_SWATCHES.blue },
  { value: "orange", label: "Orange", dot: THEME_SWATCHES.orange },
];

/** Settings card for green/blue/orange color theme toggle with swatch previews. */
export function ColorThemeSection({ colorTheme, onChangeTheme }: ColorThemeSectionProps): React.JSX.Element {
  return (
    <SettingsCard>
      <SectionLabel>Color Theme</SectionLabel>
      <SegmentedControl segments={SEGMENTS} value={colorTheme} onChange={onChangeTheme} />
    </SettingsCard>
  );
}
