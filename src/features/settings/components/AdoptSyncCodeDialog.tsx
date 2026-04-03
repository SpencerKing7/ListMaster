// src/features/settings/components/AdoptSyncCodeDialog.tsx
// Dialog for entering a sync code from another device.

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

/** Props for the {@link AdoptSyncCodeDialog} component. */
interface AdoptSyncCodeDialogProps {
  /** Whether the dialog is currently visible. */
  isOpen: boolean;
  /** Current sync code input value. */
  syncCodeInput: string;
  /** Called when the user types in the sync code input. */
  onInputChange: (value: string) => void;
  /** Called when the user confirms the sync code. */
  onAdopt: () => void;
  /** Called to dismiss the dialog without adopting. */
  onClose: () => void;
}

// MARK: - Component

/** Dialog for entering a sync code from another device. */
export function AdoptSyncCodeDialog({
  isOpen,
  syncCodeInput,
  onInputChange,
  onAdopt,
  onClose,
}: AdoptSyncCodeDialogProps): JSX.Element {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="gap-3">
        <DialogHeader>
          <DialogTitle>Enter Sync Code</DialogTitle>
        </DialogHeader>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Paste the sync code from another device to load and sync that data.
        </p>
        <Input
          value={syncCodeInput}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
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
            onClick={onAdopt}
            disabled={!syncCodeInput.trim()}
          >
            Adopt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
