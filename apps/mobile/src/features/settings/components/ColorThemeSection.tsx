// src/features/settings/components/ColorThemeSection.tsx
import type { ColorTheme } from "@/models/types";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";
import { SegmentedControl } from "./SegmentedControl";

interface ColorThemeSectionProps {
  colorTheme: ColorTheme;
  onChangeTheme: (theme: ColorTheme) => void;
}

const SEGMENTS: { value: ColorTheme; label: string }[] = [
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
  { value: "orange", label: "Orange" },
];

/** Settings card for green/blue/orange color theme toggle. */
export function ColorThemeSection({ colorTheme, onChangeTheme }: ColorThemeSectionProps): React.JSX.Element {
  return (
    <SettingsCard>
      <SectionLabel>Color Theme</SectionLabel>
      <SegmentedControl segments={SEGMENTS} value={colorTheme} onChange={onChangeTheme} />
    </SettingsCard>
  );
}
