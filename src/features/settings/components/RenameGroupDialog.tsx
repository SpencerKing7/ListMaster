// src/features/settings/components/RenameGroupDialog.tsx
// Dialog for renaming a group in the settings sheet.

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

/** Props for the {@link RenameGroupDialog} component. */
interface RenameGroupDialogProps {
  /** The group being renamed, or `null` when the dialog is closed. */
  groupToRename: { id: string; name: string } | null;
  /** Current value of the rename input field. */
  renameGroupName: string;
  /** Called when the user types in the rename input. */
  onNameChange: (name: string) => void;
  /** Called when the user confirms the rename. */
  onSave: () => void;
  /** Called to dismiss the dialog without saving. */
  onClose: () => void;
}

// MARK: - Component

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
            onClick={onSave}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
