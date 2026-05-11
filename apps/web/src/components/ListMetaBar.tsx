// src/components/ListMetaBar.tsx
// Row above the item list with check-all toggle, item count, and sort controls.

import type { JSX } from "react";
import type { SortOrder, SortDirection } from "@/models/types";
import { HapticService } from "@/services/hapticService";

/** Props for the list metadata / sort controls bar. */
interface ListMetaBarProps {
  itemCount: number;
  allChecked: boolean;
  sortOrder: SortOrder;
  sortDirection: SortDirection;
  onCheckAll: () => void;
  onUncheckAll: () => void;
  onChangeSortOrder: (next: SortOrder) => void;
  onChangeSortDirection: (next: SortDirection) => void;
}

// MARK: - Component

/** Renders check-all button + item count (left) and sort controls (right). */
export function ListMetaBar({
  itemCount,
  allChecked,
  sortOrder,
  sortDirection,
  onCheckAll,
  onUncheckAll,
  onChangeSortOrder,
  onChangeSortDirection,
}: ListMetaBarProps): JSX.Element {
  return (
    <div className="flex items-center justify-between mt-1.5 mb-1 px-1">
      <div className="flex items-center gap-2">
        {/* Check-all / uncheck-all toggle */}
        <button
          className="press-scale shrink-0"
          style={{ touchAction: "manipulation" }}
          onClick={() => {
            if (allChecked) {
              onUncheckAll();
            } else {
              onCheckAll();
            }
            HapticService.medium();
          }}
          aria-label={allChecked ? "Uncheck all items" : "Check all items"}
        >
          {allChecked ? (
            <svg
              width="18"
              height="18"
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
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--color-brand-teal)", opacity: 0.8 }}
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" />
            </svg>
          )}
        </button>

        {/* Item count */}
        <span
          className="text-xs font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Sort order toggle */}
        <button
          className="flex items-center gap-1 press-scale"
          style={{ color: "var(--color-text-secondary)", touchAction: "manipulation" }}
          onClick={() => {
            const next: SortOrder = sortOrder === "date" ? "alpha" : "date";
            onChangeSortOrder(next);
            HapticService.light();
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M7 12h10M11 18h2" />
          </svg>
          <span className="text-xs font-semibold">
            {sortOrder === "alpha" ? "A–Z" : "Date Added"}
          </span>
        </button>

        {/* Divider */}
        <span style={{ color: "var(--color-text-secondary)", opacity: 0.3, fontSize: "11px" }}>|</span>

        {/* Sort direction toggle */}
        <button
          className="flex items-center gap-0.5 press-scale"
          style={{ color: "var(--color-text-secondary)", touchAction: "manipulation" }}
          onClick={() => {
            const next: SortDirection = sortDirection === "asc" ? "desc" : "asc";
            onChangeSortDirection(next);
            HapticService.light();
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transition: "transform 200ms ease-out",
              transform: sortDirection === "desc" ? "scaleY(-1)" : "scaleY(1)",
            }}
          >
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
          <span className="text-xs font-semibold">
            {sortDirection === "asc" ? "Asc" : "Desc"}
          </span>
        </button>
      </div>
    </div>
  );
}
