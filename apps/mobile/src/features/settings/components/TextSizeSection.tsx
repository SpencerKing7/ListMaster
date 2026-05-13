// src/features/settings/components/TextSizeSection.tsx
import type { TextSize } from "@/models/types";
import { TEXT_SIZE_SP } from "@/lib/theme";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";
import { SegmentedControl } from "./SegmentedControl";

interface TextSizeSectionProps {
  textSize: TextSize;
  onChangeSize: (size: TextSize) => void;
}

const SEGMENTS: { value: TextSize; label: string; fontSize: number }[] = [
  { value: "xs", label: "XS", fontSize: TEXT_SIZE_SP.xs },
  { value: "s", label: "S", fontSize: TEXT_SIZE_SP.s },
  { value: "m", label: "M", fontSize: TEXT_SIZE_SP.m },
  { value: "l", label: "L", fontSize: TEXT_SIZE_SP.l },
  { value: "xl", label: "XL", fontSize: TEXT_SIZE_SP.xl },
];

/** Settings card for five-step text size toggle, each label rendered at its own size. */
export function TextSizeSection({ textSize, onChangeSize }: TextSizeSectionProps): React.JSX.Element {
  return (
    <SettingsCard>
      <SectionLabel>Text Size</SectionLabel>
      <SegmentedControl segments={SEGMENTS} value={textSize} onChange={onChangeSize} />
    </SettingsCard>
  );
}
