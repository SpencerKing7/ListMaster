// src/features/settings/components/RenameCategoryDialog.tsx
// Dialog for renaming a category in the settings sheet.

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
import { INPUT_CLASS } from "@/features/settings/constants";

// MARK: - Props

/** Props for the {@link RenameCategoryDialog} component. */
interface RenameCategoryDialogProps {
  /** The category being renamed, or `null` when the dialog is closed. */
  categoryToRename: { id: string; name: string } | null;
  /** Current value of the rename input field. */
  renameCategoryName: string;
  /** Called when the user types in the rename input. */
  onNameChange: (name: string) => void;
  /** Whether the new name collides with an existing category in the same group. */
  isRenameDuplicate: boolean;
  /** Whether any groups exist (for adaptive error message). */
  hasGroups: boolean;
  /** Called when the user confirms the rename. */
  onSave: () => void;
  /** Called to dismiss the dialog without saving. */
  onClose: () => void;
}

// MARK: - Component

/** Dialog for renaming a category. */
export function RenameCategoryDialog({
  categoryToRename,
  isRenameDuplicate,
  hasGroups,
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
        {isRenameDuplicate && (
          <p className="text-xs px-0.5 -mt-1" style={{ color: "var(--color-danger)" }}>
            {hasGroups
              ? "A category with this name already exists in this group."
              : "A category with this name already exists."}
          </p>
        )}
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
            disabled={renameCategoryName.trim().length === 0 || isRenameDuplicate}
            onClick={onSave}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
