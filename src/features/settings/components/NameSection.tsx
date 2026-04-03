// src/features/settings/components/NameSection.tsx
// Name input card for SettingsSheet.

import type { JSX } from "react";
import { Input } from "@/components/ui/input";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";

// MARK: - Constants

const INPUT_CLASS =
  "h-11 rounded-xl border-transparent bg-[color:var(--color-surface-input)] text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-secondary)] focus-visible:border-[color:var(--color-brand-green)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-green)]/30";

// MARK: - Props

interface NameSectionProps {
  /** Current user name value. */
  userName: string;
  /** Called when the user edits the name. */
  onChangeName: (name: string) => void;
}

// MARK: - Component

/**
 * Settings card containing the user name text input.
 */
export function NameSection({ userName, onChangeName }: NameSectionProps): JSX.Element {
  return (
    <SettingsCard>
      <SectionLabel>Name</SectionLabel>
      <Input
        value={userName}
        onChange={(e) => onChangeName(e.target.value)}
        placeholder="Your name"
        className={INPUT_CLASS}
        style={{ color: "var(--color-text-primary)" }}
      />
    </SettingsCard>
  );
}
