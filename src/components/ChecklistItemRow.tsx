// src/components/ChecklistItemRow.tsx
// Single checklist item row with checked/unchecked states, tap animation,
// and inline edit/delete action buttons.

import type { JSX } from "react";
import type { ChecklistItem } from "@/models/types";

/** Props for a single checklist item row. */
interface ChecklistItemRowProps {
  item: ChecklistItem;
  isTapped: boolean;
  onTap: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// MARK: - Component

/** Renders one checklist row with circle/checkmark icon, item name, and
 *  inline edit/delete buttons. */
export function ChecklistItemRow({ item, isTapped, onTap, onEdit, onDelete }: ChecklistItemRowProps): JSX.Element {
  return (
    <li
      className={`flex items-center gap-3.5 px-4 rounded-[14px] cursor-pointer ${isTapped ? "scale-[0.97] opacity-80" : ""
        }`}
      style={{
        paddingTop: "var(--row-padding-y)",
        paddingBottom: "var(--row-padding-y)",
        backgroundColor: item.isChecked
          ? "rgba(var(--color-brand-deep-green-rgb), 0.08)"
          : "var(--color-surface-card)",
        border: item.isChecked ? "1px solid transparent" : "1px solid var(--color-border-subtle)",
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

      {/* Edit button */}
      <button
        className="p-1.5 rounded-lg transition-all active:scale-[0.9] cursor-pointer"
        style={{ opacity: 0.5, touchAction: "manipulation" }}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        aria-label={`Rename ${item.name}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--color-brand-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      </button>

      {/* Delete button */}
      <button
        className="p-1.5 rounded-lg transition-all active:scale-[0.9] cursor-pointer"
        style={{ opacity: 0.5, touchAction: "manipulation" }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label={`Delete ${item.name}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </li>
  );
}
