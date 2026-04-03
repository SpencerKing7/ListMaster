// src/components/EmptyState.tsx
// Animated empty-state illustration with icon, title, and optional subtitle.

import { useState, useEffect, type JSX, type ReactNode } from "react";

/** Props for the animated empty-state card. */
interface EmptyStateProps {
  /** SVG icon node rendered inside a tinted circle. */
  icon: ReactNode;
  /** Primary message text. */
  title: string;
  /** Optional secondary description text. */
  subtitle?: string;
}

// MARK: - Component

/** Centered empty-state with a mount-in animation (fade + slide up). */
export function EmptyState({ icon, title, subtitle }: EmptyStateProps): JSX.Element {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
      <div
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0) scale(1)" : "translateY(12px) scale(0.92)",
          transition:
            "opacity 220ms cubic-bezier(0,0,0.2,1), transform 220ms cubic-bezier(0,0,0.2,1)",
        }}
        className="flex flex-col items-center gap-2"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(var(--color-brand-deep-green-rgb), 0.10)" }}
        >
          {icon}
        </div>
        <p className="text-base font-medium" style={{ color: "var(--color-brand-teal)" }}>
          {title}
        </p>
        {subtitle && (
          <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
