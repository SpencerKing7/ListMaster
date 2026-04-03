// src/features/settings/components/SettingsDialogs.tsx
// Rename, delete, and assignment dialogs for the categories & groups settings section.
// NOTE: 274 lines — exceeds the 250-line feature-component target because five small
// dialog components (each <50 lines JSX) are colocated. They share the same Dialog
// primitives and conceptual domain; extracting each to its own file would add 5 files
// with minimal standalone value.

import { useRef, type JSX } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionSheet } from "@/components/ui/action-sheet";
import type { CategoryGroup } from "@/models/types";

// MARK: - Constants

const INPUT_CLASS =
  "h-11 rounded-xl border-transparent bg-[color:var(--color-surface-input)] text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-secondary)] focus-visible:border-[color:var(--color-brand-green)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-green)]/30";

// MARK: - Rename Category Dialog

interface RenameCategoryDialogProps {
  categoryToRename: { id: string; name: string } | null;
  renameCategoryName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onClose: () => void;
}

/** Dialog for renaming a category. */
export function RenameCategoryDialog({
  categoryToRename,
  renameCategoryName,
  onNameChange,
  onSave,
  onClose,
}: RenameCategoryDialogProps): JSX.Element {
  const renameInputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog
      open={categoryToRename !== null}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <DialogContent showCloseButton={false} className="gap-3">
        <DialogHeader>
          <DialogTitle>Rename Category</DialogTitle>
        </DialogHeader>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Choose a new name for &ldquo;{categoryToRename?.name}&rdquo;.
        </p>
        <Input
          ref={renameInputRef}
          value={renameCategoryName}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onSave(); } }}
          className={INPUT_CLASS}
          autoFocus
        />
        <DialogFooter className="flex-row gap-2 mt-1">
          <Button
            variant="ghost"
            className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
            style={{ color: "var(--color-text-secondary)" }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="ghost"
            className="flex-1 rounded-xl font-semibold hover:!bg-[color:var(--color-surface-input)]"
            style={{ color: "var(--color-brand-green)" }}
            onClick={onSave}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// MARK: - Rename Group Dialog

interface RenameGroupDialogProps {
  groupToRename: { id: string; name: string } | null;
  renameGroupName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onClose: () => void;
}

/** Dialog for renaming a group. */
export function RenameGroupDialog({
  groupToRename,
  renameGroupName,
  onNameChange,
  onSave,
  onClose,
}: RenameGroupDialogProps): JSX.Element {
  return (
    <Dialog
      open={groupToRename !== null}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <DialogContent showCloseButton={false} className="gap-3">
        <DialogHeader>
          <DialogTitle>Rename Group</DialogTitle>
        </DialogHeader>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Choose a new name for &ldquo;{groupToRename?.name}&rdquo;.
        </p>
        <Input
          value={renameGroupName}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onSave(); } }}
          className={INPUT_CLASS}
          autoFocus
        />
        <DialogFooter className="flex-row gap-2 mt-1">
          <Button
            variant="ghost"
            className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
            style={{ color: "var(--color-text-secondary)" }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="ghost"
            className="flex-1 rounded-xl font-semibold hover:!bg-[color:var(--color-surface-input)]"
            style={{ color: "var(--color-brand-green)" }}
            onClick={onSave}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// MARK: - Delete Category Dialog

interface DeleteCategoryDialogProps {
  categoryToDelete: { id: string; name: string } | null;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmation dialog for deleting a category. */
export function DeleteCategoryDialog({
  categoryToDelete,
  onConfirm,
  onClose,
}: DeleteCategoryDialogProps): JSX.Element {
  return (
    <Dialog
      open={categoryToDelete !== null}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <DialogContent showCloseButton={false} className="gap-3">
        <DialogHeader>
          <DialogTitle>Delete Category?</DialogTitle>
        </DialogHeader>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          &ldquo;{categoryToDelete?.name}&rdquo; will be permanently deleted. This cannot be undone.
        </p>
        <DialogFooter className="flex-row gap-2 mt-1">
          <Button
            variant="ghost"
            className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
            style={{ color: "var(--color-text-secondary)" }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-xl font-semibold text-white"
            style={{ backgroundColor: "var(--color-danger)" }}
            onClick={onConfirm}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// MARK: - Delete Group Dialog

interface DeleteGroupDialogProps {
  groupToDelete: { id: string; name: string } | null;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmation dialog for deleting a group. */
export function DeleteGroupDialog({
  groupToDelete,
  onConfirm,
  onClose,
}: DeleteGroupDialogProps): JSX.Element {
  return (
    <Dialog
      open={groupToDelete !== null}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <DialogContent showCloseButton={false} className="gap-3">
        <DialogHeader>
          <DialogTitle>Delete Group?</DialogTitle>
        </DialogHeader>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          &ldquo;{groupToDelete?.name}&rdquo; will be permanently deleted. Categories inside it will become ungrouped.
        </p>
        <DialogFooter className="flex-row gap-2 mt-1">
          <Button
            variant="ghost"
            className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
            style={{ color: "var(--color-text-secondary)" }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-xl font-semibold text-white"
            style={{ backgroundColor: "var(--color-danger)" }}
            onClick={onConfirm}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// MARK: - Group Assignment ActionSheet

interface GroupAssignmentSheetProps {
  isOpen: boolean;
  selectedCategory: { id: string; name: string } | null;
  groups: CategoryGroup[];
  onAssign: (groupID: string | null) => void;
  onClose: () => void;
}

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
