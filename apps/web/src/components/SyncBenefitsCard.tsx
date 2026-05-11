// src/components/SyncBenefitsCard.tsx
// Animated card listing the three cloud-sync benefits on the onboarding sync screen.
import type { JSX } from "react";
import { SyncFeatureRow } from "@/components/SyncFeatureRow";

/** Props for the {@link SyncBenefitsCard} component. */
interface SyncBenefitsCardProps {
  /** Controls fade-in + slide-up animation — true once the entry delay has elapsed. */
  isEntered: boolean;
}

/**
 * Card containing the three sync benefit rows (cloud backup, multi-device access,
 * private storage). Animates in when `isEntered` flips to true.
 */
export function SyncBenefitsCard({ isEntered }: SyncBenefitsCardProps): JSX.Element {
  return (
    <div
      className="mx-8 mt-8 rounded-2xl px-5 py-4 flex flex-col gap-4"
      style={{
        backgroundColor: "var(--color-surface-card)",
        boxShadow: "var(--elevation-card)",
        opacity: isEntered ? 1 : 0,
        transform: isEntered ? "translateY(0)" : "translateY(12px)",
        transition:
          "opacity 480ms 60ms cubic-bezier(0,0,0.2,1), transform 480ms 60ms cubic-bezier(0,0,0.2,1)",
      }}
    >
      <SyncFeatureRow
        icon={
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-brand-teal)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          </svg>
        }
        title="Automatic cloud backup"
        subtitle="Your lists are safely stored online"
      />
      <SyncFeatureRow
        icon={
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-brand-teal)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
        }
        title="Access from any device"
        subtitle="Sync seamlessly across all your devices"
      />
      <SyncFeatureRow
        icon={
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-brand-teal)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        }
        title="Private to you — no account needed"
        subtitle="Secure and anonymous cloud storage"
      />
    </div>
  );
}
