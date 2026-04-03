// src/features/settings/components/DataSection.tsx
// Data / Reset settings card for SettingsSheet.

import { useState, type JSX } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";

// MARK: - Props

interface DataSectionProps {
  /** Called when the user confirms the reset. */
  onReset: () => void;
}

// MARK: - Component

/**
 * Settings card with a "Reset to New User" button and confirmation dialog.
 */
export function DataSection({ onReset }: DataSectionProps): JSX.Element {
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  return (
    <>
      <SettingsCard>
        <SectionLabel>Data</SectionLabel>
        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-[0.96] active:opacity-75"
          style={{
            color: "var(--color-danger)",
            backgroundColor: `rgba(var(--color-danger-rgb), 0.08)`,
          }}
          onClick={() => setIsResetDialogOpen(true)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35A7.96 7.96 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </svg>
          Reset to New User
        </button>
        <p className="text-xs text-center mt-1.5 px-2" style={{ color: "var(--color-text-secondary)" }}>
          Clears all data and restarts the onboarding process.
        </p>
      </SettingsCard>

      {/* Reset Confirmation Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent showCloseButton={false} className="gap-3">
          <DialogHeader>
            <DialogTitle>Reset to New User?</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            This will clear all your data and restart the onboarding process. This cannot be undone.
          </p>
          <DialogFooter className="flex-row gap-2 mt-1">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-text-secondary)", backgroundColor: "var(--color-surface-input)" }}
              onClick={() => setIsResetDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl font-semibold text-white"
              style={{ backgroundColor: "var(--color-danger)" }}
              onClick={() => {
                onReset();
                setIsResetDialogOpen(false);
              }}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
