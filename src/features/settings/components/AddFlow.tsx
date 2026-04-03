// src/features/settings/components/AddFlow.tsx
// ActionSheet orchestrator for the unified "Add Category or Group" flow.
// Composes AddCategoryDialog and AddGroupDialog for the two add modes.

import type { JSX } from "react";
import { ActionSheet } from "@/components/ui/action-sheet";
import type { CategoryGroup } from "@/models/types";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { AddGroupDialog } from "./AddGroupDialog";

// MARK: - Props

/** Props for the {@link AddFlow} component. */
interface AddFlowProps {
  /** Whether the ActionSheet chooser is open. */
  isAddActionSheetOpen: boolean;
  /** Closes the ActionSheet chooser. */
  onCloseAddActionSheet: () => void;
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
  /** Confirms creation of the new category. */
  onAddCategoryConfirm: () => void;
  /** Confirms creation of the new group. */
  onAddGroupConfirm: () => void;
  /** All available groups for the category group picker. */
  groups: CategoryGroup[];
}

// MARK: - Component

/** ActionSheet + Dialog pair for the unified "Add Category or Group" flow. */
export function AddFlow({
  isAddActionSheetOpen,
  onCloseAddActionSheet,
  addMode,
  onSetAddMode,
  addCategoryName,
  onSetAddCategoryName,
  addCategoryGroupID,
  onSetAddCategoryGroupID,
  addGroupDialogName,
  onSetAddGroupDialogName,
  onAddCategoryConfirm,
  onAddGroupConfirm,
  groups,
}: AddFlowProps): JSX.Element {
  return (
    <>
      <ActionSheet
        isOpen={isAddActionSheetOpen}
        onClose={onCloseAddActionSheet}
        title="Add"
        actions={[
          {
            label: "Add a Category",
            onClick: () => {
              onCloseAddActionSheet();
              onSetAddCategoryGroupID(null);
              onSetAddCategoryName("");
              onSetAddMode("category");
            },
          },
          {
            label: "Add a Group",
            onClick: () => {
              onCloseAddActionSheet();
              onSetAddGroupDialogName("");
              onSetAddMode("group");
            },
          },
        ]}
      />

      <AddCategoryDialog
        isOpen={addMode === "category"}
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
