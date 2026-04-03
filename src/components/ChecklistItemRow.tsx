// src/components/ChecklistItemRow.tsx
// Single checklist item row with checked/unchecked states and tap animation.

import type { JSX } from "react";
import type { ChecklistItem } from "@/models/types";

/** Props for a single checklist item row. */
interface ChecklistItemRowProps {
  item: ChecklistItem;
  isTapped: boolean;
  onTap: () => void;
}

// MARK: - Component

/** Renders one checklist row with circle/checkmark icon, item name, and
 *  a brief press-down animation on tap. Wraps inside `SwipeableRow`. */
export function ChecklistItemRow({ item, isTapped, onTap }: ChecklistItemRowProps): JSX.Element {
  return (
    <li
      className={`flex items-center gap-3.5 px-4 rounded-[14px] cursor-pointer ${isTapped ? "scale-[0.97] opacity-80" : ""
        }`}
      style={{
        paddingTop: "var(--row-padding-y)",
        paddingBottom: "var(--row-padding-y)",
        backgroundColor: item.isChecked
          ? "rgba(var(--color-brand-deep-green-rgb), 0.04)"
          : "var(--color-surface-card)",
        boxShadow: item.isChecked ? "none" : "var(--elevation-card)",
        transition: isTapped
          ? "transform 80ms ease-out, opacity 80ms ease-out"
          : "background-color 200ms ease-out, box-shadow 200ms ease-out",
      }}
      onClick={onTap}
    >
      {/* Circle / Checkmark icon */}
      {item.isChecked ? (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" fill="var(--color-brand-green)" />
          <polyline points="9 12 11 14 15 10" stroke="white" strokeWidth="2.2" />
        </svg>
      ) : (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--color-brand-teal)", opacity: 0.6 }}
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" />
        </svg>
      )}

      {/* Item name */}
      <span
        className={`flex-1 ${item.isChecked ? "line-through" : "font-medium"}`}
        style={
          item.isChecked
            ? {
              fontSize: "var(--text-size-base)",
              color: "var(--color-text-secondary)",
              textDecorationColor: "rgba(var(--color-brand-green-rgb), 0.45)",
            }
            : {
              fontSize: "var(--text-size-base)",
              color: "var(--color-text-primary)",
            }
        }
      >
        {item.name}
      </span>
    </li>
  );
}
