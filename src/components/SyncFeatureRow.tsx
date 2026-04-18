// src/components/SyncFeatureRow.tsx
// A single feature-benefit row used in the onboarding sync benefits card.
import type { JSX } from "react";

/** Props for the {@link SyncFeatureRow} component. */
export interface SyncFeatureRowProps {
  /** Icon element rendered to the left of the text block. */
  icon: JSX.Element;
  /** Bold primary label. */
  title: string;
  /** Secondary descriptive subtitle. */
  subtitle: string;
}

/**
 * Renders a single feature row consisting of an icon, a bold title, and a
 * secondary subtitle. Used in the sync benefits card on the onboarding sync screen.
 *
 * @example
 * <SyncFeatureRow
 *   icon={<CloudIcon />}
 *   title="Automatic cloud backup"
 *   subtitle="Your lists are safely stored online"
 * />
 */
export function SyncFeatureRow({
  icon,
  title,
  subtitle,
}: SyncFeatureRowProps): JSX.Element {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="font-semibold text-text-primary">{title}</p>
        <p className="text-sm text-text-secondary">{subtitle}</p>
      </div>
    </div>
  );
}
