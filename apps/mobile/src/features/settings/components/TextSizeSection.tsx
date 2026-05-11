// src/features/settings/components/TextSizeSection.tsx
import type { TextSize } from "@/models/types";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";
import { SegmentedControl } from "./SegmentedControl";

interface TextSizeSectionProps {
  textSize: TextSize;
  onChangeSize: (size: TextSize) => void;
}

const SEGMENTS: { value: TextSize; label: string }[] = [
  { value: "xs", label: "XS" },
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
  { value: "xl", label: "XL" },
];

/** Settings card for five-step text size toggle. */
export function TextSizeSection({ textSize, onChangeSize }: TextSizeSectionProps): React.JSX.Element {
  return (
    <SettingsCard>
      <SectionLabel>Text Size</SectionLabel>
      <SegmentedControl segments={SEGMENTS} value={textSize} onChange={onChangeSize} />
    </SettingsCard>
  );
}
