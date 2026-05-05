// src/features/settings/components/AddButtons.tsx
// Side-by-side buttons for adding a category or group directly from the settings card.

import type { JSX } from "react";

/** Props for {@link AddButtons}. */
interface AddButtonsProps {
  /** Called when the user taps "+ Category". */
  onAddCategory: () => void;
  /** Called when the user taps "+ Group". */
  onAddGroup: () => void;
}

const buttonStyle = {
  color: "var(--color-brand-green)",
  backgroundColor: `rgba(var(--color-brand-green-rgb), 0.12)`,
  touchAction: "manipulation" as const,
};

/** Two side-by-side buttons that open the add-category and add-group dialogs directly. */
export function AddButtons({ onAddCategory, onAddGroup }: AddButtonsProps): JSX.Element {
  return (
    <div className="pt-1">
      <div
        className="border-t mb-3"
        style={{ borderColor: "var(--color-text-secondary)", opacity: 0.1 }}
      />
      <div className="flex flex-row gap-2">
        <button
          type="button"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] active:opacity-80"
          style={buttonStyle}
          onClick={onAddCategory}
        >
          + Category
        </button>
        <button
          type="button"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] active:opacity-80"
          style={buttonStyle}
          onClick={onAddGroup}
        >
          + Group
        </button>
      </div>
    </div>
  );
}
