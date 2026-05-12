// src/components/CategoryPanelIcons.tsx
// SVG icon elements used by CategoryPanel empty states.

import type { JSX } from "react";

/** Icon for the "No lists in this group" empty state. */
export const noGroupIcon: JSX.Element = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    style={{ color: "var(--color-brand-teal)" }}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);

/** Icon for the "No items yet" empty state. */
export const noItemsIcon: JSX.Element = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    style={{ color: "var(--color-brand-teal)" }}>
    <line x1="9" y1="6" x2="20" y2="6" />
    <line x1="9" y1="12" x2="20" y2="12" />
    <line x1="9" y1="18" x2="20" y2="18" />
    <polyline points="4 6 5 7 7 5" />
    <polyline points="4 12 5 13 7 11" />
    <polyline points="4 18 5 19 7 17" />
  </svg>
);
