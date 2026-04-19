// src/components/RenameItemDialog.tsx
// Dialog for renaming a checklist item from the category panel.

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

/** Standard input class for dialogs (mirrors settings feature). */
const INPUT_CLASS =
  "h-11 rounded-xl border-transparent bg-[color:var(--color-surface-input)] text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-secondary)] focus-visible:border-[color:var(--color-brand-green)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-green)]/30";

// MARK: - Props

/** Props for {@link RenameItemDialog}. */
interface RenameItemDialogProps {
  /** The item being renamed, or `null` when the dialog is closed. */
  itemToRename: { id: string; name: string } | null;
  /** Current value of the rename input field. */
  value: string;
  /** Called when the user types in the input. */
  onValueChange: (value: string) => void;
  /** Called when the user confirms the rename. */
  onSave: () => void;
  /** Called to dismiss the dialog without saving. */
  onClose: () => void;
}

// MARK: - Component

/** Dialog for renaming a checklist item in the category panel. */
export function RenameItemDialog({
  itemToRename,
  value,
  onValueChange,
  onSave,
  onClose,
}: RenameItemDialogProps): JSX.Element {
  return (
    <Dialog
      open={itemToRename !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent showCloseButton={false} className="gap-3">
        <DialogHeader>
          <DialogTitle>Rename Item</DialogTitle>
        </DialogHeader>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Choose a new name for &ldquo;{itemToRename?.name}&rdquo;.
        </p>
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSave();
            }
          }}
          className={INPUT_CLASS}
          autoFocus
        />
        <DialogFooter className="flex-row gap-2 mt-1">
          <Button
            variant="ghost"
            className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
            style={{
              color: "var(--color-text-secondary)",
              backgroundColor: "var(--color-surface-input)",
            }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="ghost"
            className="flex-1 rounded-xl font-semibold hover:!bg-[color:var(--color-surface-input)]"
            style={{
              color: "var(--color-brand-green)",
              backgroundColor: "rgba(var(--color-brand-green-rgb), 0.12)",
            }}
            disabled={value.trim().length === 0}
            onClick={onSave}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
