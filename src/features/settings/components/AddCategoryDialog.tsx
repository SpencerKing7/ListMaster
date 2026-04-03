// src/features/settings/components/AddCategoryDialog.tsx
// Dialog for adding a new category with an optional group picker.

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
import type { CategoryGroup } from "@/models/types";
import { INPUT_CLASS } from "@/features/settings/constants";

// MARK: - Props

/** Props for the {@link AddCategoryDialog} component. */
interface AddCategoryDialogProps {
  /** Whether the dialog is currently visible. */
  isOpen: boolean;
  /** Current category name input value. */
  categoryName: string;
  /** Called when the user types in the name input. */
  onNameChange: (name: string) => void;
  /** Currently selected group ID, or `null` for ungrouped. */
  selectedGroupID: string | null;
  /** Called when the user picks a group (or `null`). */
  onGroupChange: (id: string | null) => void;
  /** Called when the user confirms the new category. */
  onConfirm: () => void;
  /** Called to dismiss the dialog without creating. */
  onClose: () => void;
  /** All available groups for the group picker. */
  groups: CategoryGroup[];
}

// MARK: - Component

/** Dialog for creating a new category with optional group assignment. */
export function AddCategoryDialog({
  isOpen,
  categoryName,
  onNameChange,
  selectedGroupID,
  onGroupChange,
  onConfirm,
  onClose,
  groups,
}: AddCategoryDialogProps): JSX.Element {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent showCloseButton={false} className="gap-3">
        <DialogHeader>
          <DialogTitle>New Category</DialogTitle>
        </DialogHeader>
        <Input
          value={categoryName}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (groups.length === 0) onConfirm();
            }
          }}
          placeholder="Category name"
          className={INPUT_CLASS}
          autoFocus
          autoCapitalize="words"
        />
        {groups.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium px-0.5" style={{ color: "var(--color-text-secondary)" }}>
              Group
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onGroupChange(null)}
                className="h-9 rounded-xl px-3 text-sm font-medium transition-colors"
                style={{
                  touchAction: "manipulation",
                  backgroundColor: selectedGroupID === null
                    ? "var(--color-brand-green)"
                    : "var(--color-surface-input)",
                  color: selectedGroupID === null ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                No Group
              </button>
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => onGroupChange(group.id)}
                  className="h-9 rounded-xl px-3 text-sm font-medium transition-colors"
                  style={{
                    touchAction: "manipulation",
                    backgroundColor: selectedGroupID === group.id
                      ? "var(--color-brand-green)"
                      : "var(--color-surface-input)",
                    color: selectedGroupID === group.id ? "#fff" : "var(--color-text-primary)",
                  }}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </div>
        )}
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
            disabled={categoryName.trim().length === 0}
            onClick={onConfirm}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
