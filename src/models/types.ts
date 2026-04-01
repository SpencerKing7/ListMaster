// src/models/types.ts

export interface ChecklistItem {
  id: string; // UUID string — matches Swift UUID.uuidString
  name: string;
  isChecked: boolean;
}

export interface Category {
  id: string; // UUID string
  name: string;
  items: ChecklistItem[];
}
