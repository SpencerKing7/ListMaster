// src/features/settings/components/GroupAssignmentSheet.tsx
// ActionSheet for assigning a category to a group.

import type { JSX } from "react";
import { ActionSheet } from "@/components/ui/action-sheet";
import type { CategoryGroup } from "@/models/types";

// MARK: - Props

/** Props for the {@link GroupAssignmentSheet} component. */
interface GroupAssignmentSheetProps {
  /** Whether the action sheet is currently visible. */
  isOpen: boolean;
  /** The category being assigned, or `null` when closed. */
  selectedCategory: { id: string; name: string } | null;
  /** All available groups to assign to. */
  groups: CategoryGroup[];
  /** Called when the user picks a group (or `null` for "No Group"). */
  onAssign: (groupID: string | null) => void;
  /** Called to dismiss the sheet without making a selection. */
  onClose: () => void;
}

// MARK: - Component

/** ActionSheet for assigning a category to a group. */
export function GroupAssignmentSheet({
  isOpen,
  selectedCategory,
  groups,
  onAssign,
  onClose,
}: GroupAssignmentSheetProps): JSX.Element {
  return (
    <ActionSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign "${selectedCategory?.name}" to Group`}
      actions={[
        { label: "No Group", onClick: () => onAssign(null) },
        ...groups.map(group => ({
          label: group.name,
          onClick: () => onAssign(group.id),
        })),
      ]}
    />
  );
}
