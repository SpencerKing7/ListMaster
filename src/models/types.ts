// src/models/types.ts

export interface ChecklistItem {
  id: string; // UUID string — matches Swift UUID.uuidString
  name: string;
  isChecked: boolean;
  /** Unix timestamp (ms) when the item was created — used for date-based sort. */
  createdAt: number;
}

export interface Category {
  id: string; // UUID string
  name: string;
  items: ChecklistItem[];
  /** Per-list sort order. Defaults to "date" when absent (legacy data). */
  sortOrder?: SortOrder;
  /** Per-list sort direction. Defaults to "asc" when absent (legacy data). */
  sortDirection?: SortDirection;
  /** UUID of the owning CategoryGroup, or undefined for ungrouped categories. */
  groupID?: string;
}

export interface CategoryGroup {
  id: string; // UUID v4
  name: string; // User-visible label — e.g. "Shopping", "Work"
  sortOrder: number; // Display order among groups
}

/** Five-step text size scale for checklist item text. */
export type TextSize = "xs" | "s" | "m" | "l" | "xl";

/** Sort order for checklist items within a category. */
export type SortOrder = "date" | "alpha";

/** Sort direction for checklist items within a category. */
export type SortDirection = "asc" | "desc";
