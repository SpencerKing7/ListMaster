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
}

/** Five-step text size scale for checklist item text. */
export type TextSize = "xs" | "s" | "m" | "l" | "xl";

/** Sort order for checklist items within a category. */
export type SortOrder = "date" | "alpha";
