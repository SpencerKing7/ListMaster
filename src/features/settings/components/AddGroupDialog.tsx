// src/features/settings/components/AddGroupDialog.tsx
// Dialog for creating a new category group.

import type { JSX } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INPUT_CLASS } from "@/features/settings/constants";

// MARK: - Props

/** Props for the {@link AddGroupDialog} component. */
interface AddGroupDialogProps {
  /** Whether the dialog is currently visible. */
  isOpen: boolean;
  /** Current group name input value. */
  groupName: string;
  /** Called when the user types in the name input. */
  onNameChange: (name: string) => void;
  /** Called when the user confirms the new group. */
  onConfirm: () => void;
  /** Called to dismiss the dialog without creating. */
  onClose: () => void;
}

// MARK: - Component

/** Dialog for creating a new category group. */
export function AddGroupDialog({
  isOpen,
  groupName,
  onNameChange,
  onConfirm,
  onClose,
}: AddGroupDialogProps): JSX.Element {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent showCloseButton={false} className="gap-3">
        <DialogHeader>
          <DialogTitle>New Group</DialogTitle>
        </DialogHeader>
        <Input
          value={groupName}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); onConfirm(); }
          }}
          placeholder="Group name"
          className={INPUT_CLASS}
          autoFocus
          autoCapitalize="words"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
        />
        <DialogFooter className="flex-row gap-2 mt-1">
          <Button
            variant="ghost"
            className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
            style={{ color: "var(--color-text-secondary)", backgroundColor: "var(--color-surface-input)" }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="ghost"
            className="flex-1 rounded-xl font-semibold hover:!bg-[color:var(--color-surface-input)]"
            style={{ color: "var(--color-brand-green)", backgroundColor: "rgba(var(--color-brand-green-rgb), 0.12)" }}
            disabled={groupName.trim().length === 0}
            onClick={onConfirm}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
