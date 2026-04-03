// src/features/settings/components/DeleteGroupDialog.tsx
// Confirmation dialog for permanently deleting a group.

import type { JSX } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// MARK: - Props

/** Props for the {@link DeleteGroupDialog} component. */
interface DeleteGroupDialogProps {
  /** The group being deleted, or `null` when the dialog is closed. */
  groupToDelete: { id: string; name: string } | null;
  /** Called when the user confirms the deletion. */
  onConfirm: () => void;
  /** Called to dismiss the dialog without deleting. */
  onClose: () => void;
}

// MARK: - Component

/** Confirmation dialog for deleting a group. Categories inside become ungrouped. */
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
