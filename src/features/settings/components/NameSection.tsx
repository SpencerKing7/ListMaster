// src/features/settings/components/NameSection.tsx
// Name input card for SettingsSheet.

import type { JSX } from "react";
import { Input } from "@/components/ui/input";
import { INPUT_CLASS } from "@/features/settings/constants";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";

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
        autoCapitalize="words"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
      />
    </SettingsCard>
  );
}
