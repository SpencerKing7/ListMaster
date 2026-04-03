// src/features/settings/components/TextSizeSection.tsx
// Text size toggle (xs / s / m / l / xl) for SettingsSheet.

import type { JSX } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { TextSize } from "@/models/types";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";

// MARK: - Constants

/** Maps each TextSize key to the corresponding Tailwind font-size class. */
const TEXT_SIZE_TAILWIND: Record<string, string> = {
  xs: "text-xs",
  s: "text-sm",
  m: "text-base",
  l: "text-lg",
  xl: "text-xl",
};

// MARK: - Props

interface TextSizeSectionProps {
  /** Currently selected text size. */
  textSize: TextSize;
  /** Called when the user selects a new text size. */
  onChangeSize: (size: TextSize) => void;
}

// MARK: - Component

/**
 * Settings card containing the five-step text size toggle group.
 */
export function TextSizeSection({ textSize, onChangeSize }: TextSizeSectionProps): JSX.Element {
  return (
    <SettingsCard>
      <SectionLabel>Text Size</SectionLabel>
      <ToggleGroup
        value={[textSize]}
        onValueChange={(values: string[]) => {
          if (values.length > 0) {
            onChangeSize(values[0] as TextSize);
          }
        }}
        className="w-full rounded-xl p-1"
        style={{
          backgroundColor: `rgba(var(--color-brand-deep-green-rgb), 0.10)`,
        }}
      >
        {(["xs", "s", "m", "l", "xl"] as const).map((size) => (
          <ToggleGroupItem
            key={size}
            value={size}
            className={cn(
              "flex-1 !rounded-lg font-semibold hover:!bg-transparent aria-pressed:!bg-[var(--color-surface-card)] aria-pressed:!text-[var(--color-brand-green)] aria-pressed:shadow-sm aria-pressed:!opacity-100 opacity-75 transition-all",
              TEXT_SIZE_TAILWIND[size],
            )}
            style={{ color: "var(--color-text-primary)" }}
          >
            {size.toUpperCase()}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </SettingsCard>
  );
}
