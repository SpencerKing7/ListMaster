// src/features/settings/components/AddCategoryGroupButton.tsx
// Button that opens the add category/group sheet in the settings card.

import type { JSX } from "react";

/** Props for {@link AddCategoryGroupButton}. */
interface AddCategoryGroupButtonProps {
  /** Called when the user taps the button. */
  onClick: () => void;
}

/** Full-width branded button for adding a category or group. */
export function AddCategoryGroupButton({ onClick }: AddCategoryGroupButtonProps): JSX.Element {
  return (
    <div className="pt-1">
      <div className="border-t mb-3" style={{ borderColor: "var(--color-text-secondary)", opacity: 0.1 }} />
      <button
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] active:opacity-80"
        style={{
          color: "var(--color-brand-green)",
          backgroundColor: `rgba(var(--color-brand-green-rgb), 0.12)`,
          touchAction: "manipulation",
        }}
        onClick={onClick}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Category or Group
      </button>
    </div>
  );
}
