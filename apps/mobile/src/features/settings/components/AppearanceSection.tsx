// src/features/settings/components/AppearanceSection.tsx
import type { AppearanceMode } from "@/models/types";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";
import { SegmentedControl } from "./SegmentedControl";

interface AppearanceSectionProps {
  appearanceMode: AppearanceMode;
  onChangeMode: (mode: AppearanceMode) => void;
}

const SEGMENTS: { value: AppearanceMode; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/** Settings card for system/light/dark appearance toggle. */
export function AppearanceSection({ appearanceMode, onChangeMode }: AppearanceSectionProps): React.JSX.Element {
  return (
    <SettingsCard>
      <SectionLabel>Appearance</SectionLabel>
      <SegmentedControl segments={SEGMENTS} value={appearanceMode} onChange={onChangeMode} />
    </SettingsCard>
  );
}
