// src/features/settings/hooks/useGroupAssignment.ts
// State and handlers for the group-assignment action sheet.

import { useState, useCallback } from "react";
import { useCategoriesStore } from "@/store/useCategoriesStore";

// MARK: - Types

/** Return type for {@link useGroupAssignment}. */
export interface UseGroupAssignmentReturn {
  /** Whether the group assignment action sheet is open. */
  isGroupActionSheetOpen: boolean;
  /** The category being reassigned, or `null` when idle. */
  selectedCategoryForGroup: { id: string; name: string } | null;
  /** Opens the assignment sheet for a given category. */
  openGroupAssignment: (categoryId: string, categoryName: string) => void;
  /** Closes the assignment sheet without changes. */
  closeGroupAssignment: () => void;
  /** Assigns the selected category to a group (or `null` for ungrouped). */
  handleCategoryGroupChange: (groupID: string | null) => void;
}

// MARK: - Hook

/** Manages the group-assignment action sheet state. */
export function useGroupAssignment(): UseGroupAssignmentReturn {
  const store = useCategoriesStore();

  const [selectedCategoryForGroup, setSelectedCategoryForGroup] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isGroupActionSheetOpen, setIsGroupActionSheetOpen] = useState(false);

  const openGroupAssignment = useCallback(
    (categoryId: string, categoryName: string) => {
      setSelectedCategoryForGroup({ id: categoryId, name: categoryName });
      setIsGroupActionSheetOpen(true);
    },
    [],
  );

  const closeGroupAssignment = useCallback(() => {
    setIsGroupActionSheetOpen(false);
  }, []);

  const handleCategoryGroupChange = useCallback(
    (groupID: string | null) => {
      if (!selectedCategoryForGroup) return;
      store.setCategoryGroup(selectedCategoryForGroup.id, groupID ?? undefined);
      setSelectedCategoryForGroup(null);
      setIsGroupActionSheetOpen(false);
    },
    [selectedCategoryForGroup, store],
  );

  return {
    isGroupActionSheetOpen,
    selectedCategoryForGroup,
    openGroupAssignment,
    closeGroupAssignment,
    handleCategoryGroupChange,
  };
}
