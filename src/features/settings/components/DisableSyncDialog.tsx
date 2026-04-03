// src/features/settings/components/DisableSyncDialog.tsx
// Confirmation dialog for disabling cloud sync (keep or delete cloud data).

import type { JSX } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// MARK: - Props

/** Props for the {@link DisableSyncDialog} component. */
interface DisableSyncDialogProps {
  /** Whether the dialog is currently visible. */
  isOpen: boolean;
  /** Called when the user chooses to disable sync. `true` = delete cloud data. */
  onDisable: (deleteCloud: boolean) => void;
  /** Called to dismiss the dialog without changes. */
  onClose: () => void;
}

// MARK: - Component

/** Dialog for disabling sync with options to keep or delete cloud data. */
export function DisableSyncDialog({
  isOpen,
  onDisable,
  onClose,
}: DisableSyncDialogProps): JSX.Element {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="gap-3">
        <DialogHeader>
          <DialogTitle>Disable Sync</DialogTitle>
        </DialogHeader>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          What would you like to do with your cloud backup?
        </p>
        <div className="flex flex-col gap-2 mt-1">
          <button
            className="w-full py-3 rounded-xl text-sm font-semibold text-left px-4 transition-all hover:opacity-80 active:scale-[0.98]"
            style={{
              backgroundColor: "var(--color-surface-input)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-subtle)",
            }}
            onClick={() => onDisable(false)}
          >
            <span className="block font-semibold">Keep cloud backup</span>
            <span className="block text-xs mt-0.5 font-normal" style={{ color: "var(--color-text-secondary)" }}>
              Sync is disabled locally. Re-enter your code later to restore.
            </span>
          </button>
          <button
            className="w-full py-3 rounded-xl text-sm font-semibold text-left px-4 transition-all hover:opacity-80 active:scale-[0.98]"
            style={{
              backgroundColor: "rgba(var(--color-danger-rgb), 0.08)",
              color: "var(--color-danger)",
              border: "1px solid rgba(var(--color-danger-rgb), 0.15)",
            }}
            onClick={() => onDisable(true)}
          >
            <span className="block font-semibold">Delete cloud data</span>
            <span className="block text-xs mt-0.5 font-normal" style={{ color: "var(--color-text-secondary)" }}>
              Permanently removes your data from the cloud. Cannot be undone.
            </span>
          </button>
        </div>
        <Button
          variant="ghost"
          className="w-full rounded-xl hover:!bg-[color:var(--color-surface-input)] mt-1"
          style={{ color: "var(--color-text-secondary)", backgroundColor: "var(--color-surface-input)" }}
          onClick={onClose}
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
