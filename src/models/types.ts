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

/**
 * A category enriched with a display flag for the CategoryPicker.
 * In the "All" view (no group selected), ungrouped categories are placed
 * first with `isUngrouped: true` so the picker can render them dimmed/italic.
 * In a specific-group view, only that group's categories are included and
 * `isUngrouped` is always `false`.
 */
export interface CategoryPickerItem {
  category: Category;
  /** True when this category has no group and trails the group's assigned categories. */
  isUngrouped: boolean;
}

/** Five-step text size scale for checklist item text. */
export type TextSize = "xs" | "s" | "m" | "l" | "xl";

/** Sort order for checklist items within a category. */
export type SortOrder = "date" | "alpha";

/** Sort direction for checklist items within a category. */
export type SortDirection = "asc" | "desc";

// MARK: - Store types

/** Top-level shape of the categories store reducer state. */
export interface StoreState {
  categories: Category[];
  selectedCategoryID: string;
  groups: CategoryGroup[];
  selectedGroupID: string | null;
}

/** Discriminated union of every action the categories reducer can handle. */
export type StoreAction =
  | { type: "SELECT_CATEGORY"; id: string }
  | { type: "ADD_CATEGORY"; name: string }
  | { type: "SET_CATEGORIES"; names: string[] }
  | { type: "RENAME_CATEGORY"; id: string; newName: string }
  | { type: "DELETE_CATEGORY"; id: string }
  | { type: "MOVE_CATEGORIES"; from: number; to: number }
  | { type: "REORDER_CATEGORIES"; orderedIDs: string[] }
  | { type: "SET_CATEGORY_SORT_ORDER"; id: string; sortOrder: SortOrder }
  | {
      type: "SET_CATEGORY_SORT_DIRECTION";
      id: string;
      sortDirection: SortDirection;
    }
  | { type: "ADD_ITEM"; name: string }
  | { type: "TOGGLE_ITEM"; itemID: string }
  | { type: "DELETE_ITEM"; itemID: string }
  | { type: "RENAME_ITEM"; itemID: string; newName: string }
  | { type: "CLEAR_CHECKED" }
  | { type: "CHECK_ALL" }
  | { type: "UNCHECK_ALL" }
  | { type: "RELOAD" }
  | { type: "RESET_CATEGORIES" }
  | {
      type: "SYNC_LOAD";
      categories: Category[];
      selectedCategoryID?: string | null;
      groups?: CategoryGroup[];
    }
  | { type: "ADD_GROUP"; name: string }
  | { type: "RENAME_GROUP"; id: string; newName: string }
  | { type: "DELETE_GROUP"; id: string }
  | { type: "MOVE_GROUPS"; from: number; to: number }
  | { type: "SELECT_GROUP"; id: string | null }
  | {
      type: "SET_CATEGORY_GROUP";
      categoryID: string;
      groupID: string | undefined;
    }
  | { type: "ADD_CATEGORY_WITH_GROUP"; name: string; groupID: string };

/** All mutation callbacks exposed by the categories store. */
export interface CategoryActions {
  selectCategory: (id: string) => void;
  addCategory: (name: string) => void;
  setCategories: (names: string[]) => void;
  renameCategory: (id: string, newName: string) => void;
  deleteCategory: (id: string) => void;
  moveCategories: (from: number, to: number) => void;
  reorderCategories: (orderedIDs: string[]) => void;
  setCategorySortOrder: (id: string, sortOrder: SortOrder) => void;
  setCategorySortDirection: (id: string, sortDirection: SortDirection) => void;
  addItemToSelectedCategory: (name: string) => void;
  toggleItemInSelectedCategory: (itemID: string) => void;
  deleteItemFromSelectedCategory: (itemID: string) => void;
  renameItemInSelectedCategory: (itemID: string, newName: string) => void;
  clearCheckedItemsInSelectedCategory: () => void;
  checkAllItemsInSelectedCategory: () => void;
  uncheckAllItemsInSelectedCategory: () => void;
  reload: () => void;
  resetCategories: () => void;
  selectGroup: (id: string | null) => void;
  addGroup: (name: string) => void;
  renameGroup: (id: string, newName: string) => void;
  deleteGroup: (id: string) => void;
  moveGroups: (from: number, to: number) => void;
  setCategoryGroup: (categoryID: string, groupID: string | undefined) => void;
  /** Atomically creates a new category and assigns it to the given group. */
  addCategoryWithGroup: (name: string, groupID: string) => void;
}

/** Derived read-only values computed from the store state. */
export interface CategoryDerived {
  /** The currently selected category, or null if none is found. */
  selectedCategory: Category | null;
  /** Whether deleting the selected category is allowed (requires >1 in the active group view). */
  canDeleteCategories: boolean;
  /** Whether there is a next category to navigate to within the group. */
  canSelectNextCategory: boolean;
  /** Whether there is a previous category to navigate to within the group. */
  canSelectPreviousCategory: boolean;
  /** The next category in the current group, or null. */
  nextCategory: Category | null;
  /** The previous category in the current group, or null. */
  previousCategory: Category | null;
  /** Categories filtered to the currently selected group. */
  categoriesInSelectedGroup: Category[];
  /**
   * Categories for the picker. In the "All" view, ungrouped categories come
   * first with `isUngrouped: true`. In a specific-group view, only that
   * group's categories are included and `isUngrouped` is always `false`.
   */
  pickerCategories: CategoryPickerItem[];
  /** Whether any groups exist in the store. */
  hasGroups: boolean;
  /** Navigate to the next category in the current group. */
  selectNextCategory: () => void;
  /** Navigate to the previous category in the current group. */
  selectPreviousCategory: () => void;
}

/** Public API surface of the categories store context. */
export interface StoreContextValue {
  categories: Category[];
  selectedCategoryID: string;
  selectedCategory: Category | null;
  canDeleteCategories: boolean;
  canSelectNextCategory: boolean;
  canSelectPreviousCategory: boolean;
  nextCategory: Category | null;
  previousCategory: Category | null;
  selectCategory: (id: string) => void;
  selectNextCategory: () => void;
  selectPreviousCategory: () => void;
  addCategory: (name: string) => void;
  setCategories: (names: string[]) => void;
  renameCategory: (id: string, newName: string) => void;
  deleteCategory: (id: string) => void;
  moveCategories: (from: number, to: number) => void;
  reorderCategories: (orderedIDs: string[]) => void;
  setCategorySortOrder: (id: string, sortOrder: SortOrder) => void;
  setCategorySortDirection: (id: string, sortDirection: SortDirection) => void;
  addItemToSelectedCategory: (name: string) => void;
  toggleItemInSelectedCategory: (itemID: string) => void;
  deleteItemFromSelectedCategory: (itemID: string) => void;
  renameItemInSelectedCategory: (itemID: string, newName: string) => void;
  clearCheckedItemsInSelectedCategory: () => void;
  checkAllItemsInSelectedCategory: () => void;
  uncheckAllItemsInSelectedCategory: () => void;
  reload: () => void;
  resetCategories: () => void;
  groups: CategoryGroup[];
  selectedGroupID: string | null;
  categoriesInSelectedGroup: Category[];
  pickerCategories: CategoryPickerItem[];
  hasGroups: boolean;
  selectGroup: (id: string | null) => void;
  addGroup: (name: string) => void;
  renameGroup: (id: string, newName: string) => void;
  deleteGroup: (id: string) => void;
  moveGroups: (from: number, to: number) => void;
  setCategoryGroup: (categoryID: string, groupID: string | undefined) => void;
  addCategoryWithGroup: (name: string, groupID: string) => void;
}
