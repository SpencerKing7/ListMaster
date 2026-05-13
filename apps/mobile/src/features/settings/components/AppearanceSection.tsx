// src/features/settings/components/AppearanceSection.tsx
import type { AppearanceMode } from "@/models/types";
import Svg, { Rect, Path, Circle } from "react-native-svg";
import { useSettingsStore } from "@/store/useSettingsStore";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";
import { SegmentedControl } from "./SegmentedControl";

function SystemIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={2} y={3} width={20} height={14} rx={2} />
      <Path d="M8 21h8M12 17v4" />
    </Svg>
  );
}

function LightIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={4} />
      <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </Svg>
  );
}

function DarkIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Svg>
  );
}

interface AppearanceSectionProps {
  appearanceMode: AppearanceMode;
  onChangeMode: (mode: AppearanceMode) => void;
}

/** Settings card for system/light/dark appearance toggle with mode icons. */
export function AppearanceSection({ appearanceMode, onChangeMode }: AppearanceSectionProps): React.JSX.Element {
  const { theme } = useSettingsStore();

  const segments: { value: AppearanceMode; label: string; icon: React.JSX.Element }[] = [
    { value: "system", label: "System", icon: <SystemIcon color={appearanceMode === "system" ? theme.brandGreen : theme.textSecondary} /> },
    { value: "light", label: "Light", icon: <LightIcon color={appearanceMode === "light" ? theme.brandGreen : theme.textSecondary} /> },
    { value: "dark", label: "Dark", icon: <DarkIcon color={appearanceMode === "dark" ? theme.brandGreen : theme.textSecondary} /> },
  ];

  return (
    <SettingsCard>
      <SectionLabel>Appearance</SectionLabel>
      <SegmentedControl segments={segments} value={appearanceMode} onChange={onChangeMode} />
    </SettingsCard>
  );
}
