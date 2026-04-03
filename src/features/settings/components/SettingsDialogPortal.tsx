// src/features/settings/components/SettingsDialogPortal.tsx
// Renders all Settings-related dialogs and action sheets in a single Fragment.

import type { JSX } from "react";
import type { CategoryGroup } from "@/models/types";
import type { UseSettingsDialogsReturn } from "@/features/settings/hooks/useSettingsDialogs";
import { RenameCategoryDialog } from "./RenameCategoryDialog";
import { RenameGroupDialog } from "./RenameGroupDialog";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";
import { DeleteGroupDialog } from "./DeleteGroupDialog";
import { GroupAssignmentSheet } from "./GroupAssignmentSheet";
import { AddFlow } from "./AddFlow";

// MARK: - Props

/** Props for {@link SettingsDialogPortal}. */
interface SettingsDialogPortalProps {
  /** The full return value of useSettingsDialogs. */
  d: UseSettingsDialogsReturn;
  /** All category groups — needed by GroupAssignmentSheet and AddFlow. */
  groups: CategoryGroup[];
}

// MARK: - Component

/**
 * Renders every dialog and action sheet used by the Settings screen.
 *
 * Extracted so the SettingsSheet page component stays under the 150-line
 * page target while keeping all dialog wiring in one place.
 */
export function SettingsDialogPortal({ d, groups }: SettingsDialogPortalProps): JSX.Element {
  return (
    <>
      <RenameCategoryDialog
        categoryToRename={d.categoryToRename}
        renameCategoryName={d.renameCategoryName}
        onNameChange={d.onRenameCategoryNameChange}
        onSave={d.saveRenameCategory}
        onClose={d.closeRenameCategory}
      />
      <RenameGroupDialog
        groupToRename={d.groupToRename}
        renameGroupName={d.renameGroupName}
        onNameChange={d.onRenameGroupNameChange}
        onSave={d.saveRenameGroup}
        onClose={d.closeRenameGroup}
      />
      <DeleteCategoryDialog
        categoryToDelete={d.categoryToDelete}
        onConfirm={d.confirmDeleteCategory}
        onClose={d.closeDeleteCategory}
      />
      <DeleteGroupDialog
        groupToDelete={d.groupToDelete}
        onConfirm={d.confirmDeleteGroup}
        onClose={d.closeDeleteGroup}
      />
      <GroupAssignmentSheet
        isOpen={d.isGroupActionSheetOpen}
        selectedCategory={d.selectedCategoryForGroup}
        groups={groups}
        onAssign={d.handleCategoryGroupChange}
        onClose={d.closeGroupAssignment}
      />
      <AddFlow
        isAddActionSheetOpen={d.isAddActionSheetOpen}
        onCloseAddActionSheet={d.closeAddActionSheet}
        addMode={d.addMode}
        onSetAddMode={d.setAddMode}
        addCategoryName={d.addCategoryName}
        onSetAddCategoryName={d.setAddCategoryName}
        addCategoryGroupID={d.addCategoryGroupID}
        onSetAddCategoryGroupID={d.setAddCategoryGroupID}
        addGroupDialogName={d.addGroupDialogName}
        onSetAddGroupDialogName={d.setAddGroupDialogName}
        onAddCategoryConfirm={d.confirmAddCategory}
        onAddGroupConfirm={d.confirmAddGroup}
        groups={groups}
      />
    </>
  );
}
