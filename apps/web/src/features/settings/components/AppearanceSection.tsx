// src/features/settings/components/AppearanceSection.tsx
// Appearance mode toggle (system / light / dark) for SettingsSheet.

import type { ReactNode, JSX } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";

// MARK: - Constants

/** Maps each appearance mode to a small inline SVG icon (12×12 viewport). */
const APPEARANCE_ICONS: Record<string, ReactNode> = {
  system: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  light: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  dark: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
};

// MARK: - Props

interface AppearanceSectionProps {
  /** Currently selected appearance mode. */
  appearanceMode: "system" | "light" | "dark";
  /** Called when the user selects a new appearance mode. */
  onChangeMode: (mode: "system" | "light" | "dark") => void;
}

// MARK: - Component

/**
 * Settings card containing the system/light/dark appearance toggle group.
 */
export function AppearanceSection({ appearanceMode, onChangeMode }: AppearanceSectionProps): JSX.Element {
  return (
    <SettingsCard>
      <SectionLabel>Appearance</SectionLabel>
      <ToggleGroup
        value={[appearanceMode]}
        onValueChange={(values: string[]) => {
          if (values.length > 0) {
            onChangeMode(values[0] as "system" | "light" | "dark");
          }
        }}
        className="w-full rounded-xl p-1"
        style={{
          backgroundColor: `rgba(var(--color-brand-deep-green-rgb), 0.12)`,
        }}
      >
        {(["system", "light", "dark"] as const).map((mode) => (
          <ToggleGroupItem
            key={mode}
            value={mode}
            className="flex-1 !rounded-lg text-xs font-semibold capitalize hover:!bg-transparent aria-pressed:!bg-[var(--color-surface-card)] aria-pressed:!text-[var(--color-brand-green)] aria-pressed:shadow-sm aria-pressed:!opacity-100 opacity-75 transition-all"
            style={{ color: "var(--color-text-primary)" }}
          >
            <span className="flex items-center gap-1.5">
              {APPEARANCE_ICONS[mode]}
              {mode === "system" ? "System" : mode === "light" ? "Light" : "Dark"}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </SettingsCard>
  );
}
