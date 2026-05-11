// src/features/settings/components/AddFlow.tsx
// Dialog pair for the "Add Category" and "Add Group" flows.

import type { JSX } from "react";
import type { CategoryGroup } from "@/models/types";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { AddGroupDialog } from "./AddGroupDialog";

// MARK: - Props

/** Props for the {@link AddFlow} component. */
interface AddFlowProps {
  /** Which add dialog is active: `"category"`, `"group"`, or `null`. */
  addMode: "category" | "group" | null;
  /** Sets the active add mode (opens the corresponding dialog). */
  onSetAddMode: (mode: "category" | "group" | null) => void;
  /** Current category name input value. */
  addCategoryName: string;
  /** Called when the user types in the category name input. */
  onSetAddCategoryName: (name: string) => void;
  /** Currently selected group ID for the new category. */
  addCategoryGroupID: string | null;
  /** Called when the user picks a group for the new category. */
  onSetAddCategoryGroupID: (id: string | null) => void;
  /** Current group name input value. */
  addGroupDialogName: string;
  /** Called when the user types in the group name input. */
  onSetAddGroupDialogName: (name: string) => void;
  /** Whether the category name collides in the selected group. */
  isDuplicate: boolean;
  /** Confirms creation of the new category. */
  onAddCategoryConfirm: () => void;
  /** Confirms creation of the new group. */
  onAddGroupConfirm: () => void;
  /** All available groups for the category group picker. */
  groups: CategoryGroup[];
}

// MARK: - Component

/** Dialog pair for the "Add Category" and "Add Group" flows. */
export function AddFlow({
  addMode,
  onSetAddMode,
  addCategoryName,
  onSetAddCategoryName,
  addCategoryGroupID,
  onSetAddCategoryGroupID,
  addGroupDialogName,
  onSetAddGroupDialogName,
  isDuplicate,
  onAddCategoryConfirm,
  onAddGroupConfirm,
  groups,
}: AddFlowProps): JSX.Element {
  return (
    <>
      <AddCategoryDialog
        isOpen={addMode === "category"}
        isDuplicate={isDuplicate}
        categoryName={addCategoryName}
        onNameChange={onSetAddCategoryName}
        selectedGroupID={addCategoryGroupID}
        onGroupChange={onSetAddCategoryGroupID}
        onConfirm={onAddCategoryConfirm}
        onClose={() => {
          onSetAddMode(null);
          onSetAddCategoryName("");
          onSetAddCategoryGroupID(null);
        }}
        groups={groups}
      />

      <AddGroupDialog
        isOpen={addMode === "group"}
        groupName={addGroupDialogName}
        onNameChange={onSetAddGroupDialogName}
        onConfirm={onAddGroupConfirm}
        onClose={() => {
          onSetAddMode(null);
          onSetAddGroupDialogName("");
        }}
      />
    </>
  );
}
