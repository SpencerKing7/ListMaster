// src/features/settings/components/SettingsCard.tsx
// Presentational card wrapper used for each settings section.

import type { ReactNode, JSX } from "react";

/** Props for the {@link SettingsCard} component. */
interface SettingsCardProps {
  /** The content to render inside the card. */
  children: ReactNode;
}

/**
 * Rounded card container for individual settings sections.
 * Provides consistent padding, background colour, and elevation shadow.
 */
export function SettingsCard({ children }: SettingsCardProps): JSX.Element {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl px-4 py-4"
      style={{
        backgroundColor: "var(--color-surface-card)",
        boxShadow: "var(--elevation-card)",
      }}
    >
      {children}
    </div>
  );
}
