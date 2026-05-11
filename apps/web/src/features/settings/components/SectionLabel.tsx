// src/features/settings/components/SectionLabel.tsx
// Uppercase teal label used as a heading inside each SettingsCard.

import type { ReactNode, JSX } from "react";

/** Props for the {@link SectionLabel} component. */
interface SectionLabelProps {
  /** The label text to display. */
  children: ReactNode;
}

/**
 * Small, uppercase label rendered at the top of each settings card section.
 * Uses the brand-teal colour and tracking for visual hierarchy.
 */
export function SectionLabel({ children }: SectionLabelProps): JSX.Element {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-wide w-fit px-2 py-0.5 rounded-md"
      style={{
        color: "var(--color-brand-teal)",
        backgroundColor: "rgba(var(--color-brand-teal-rgb), 0.08)",
      }}
    >
      {children}
    </p>
  );
}
