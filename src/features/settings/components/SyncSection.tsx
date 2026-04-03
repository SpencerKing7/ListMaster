// src/features/settings/components/SyncSection.tsx
// Sync & Backup settings card for SettingsSheet.

import { useState, type JSX } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SyncStatus } from "@/store/useSyncStore";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";

// MARK: - Constants

const INPUT_CLASS =
  "h-11 rounded-xl border-transparent bg-[color:var(--color-surface-input)] text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-secondary)] focus-visible:border-[color:var(--color-brand-green)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-green)]/30";

// MARK: - Props

interface SyncSectionProps {
  /** Whether cloud sync is currently enabled. */
  isSyncEnabled: boolean;
  /** The active sync code (empty string if not enabled). */
  syncCode: string;
  /** Current sync status for UI indicators. */
  syncStatus: SyncStatus;
  /** Enables sync by generating a new code. */
  onEnableSync: () => Promise<void>;
  /** Disables sync. Pass `true` to also permanently delete cloud data. */
  onDisableSync: (deleteCloud: boolean) => Promise<void>;
  /** Adopts an existing sync code from another device. */
  onAdoptSyncCode: (code: string) => Promise<void>;
}

// MARK: - Component

/**
 * Sync & Backup settings card. Shows either the active sync code with
 * copy/switch/disable actions, or enable/enter-code buttons.
 */
export function SyncSection({
  isSyncEnabled,
  syncCode,
  syncStatus,
  onEnableSync,
  onDisableSync,
  onAdoptSyncCode,
}: SyncSectionProps): JSX.Element {
  const [isAdoptingCode, setIsAdoptingCode] = useState(false);
  const [syncCodeInput, setSyncCodeInput] = useState("");
  const [isDisableSyncDialogOpen, setIsDisableSyncDialogOpen] = useState(false);

  return (
    <>
      <SettingsCard>
        <SectionLabel>Sync & Backup</SectionLabel>
        {isSyncEnabled ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                Sync Code
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: syncStatus === "error"
                    ? `rgba(var(--color-danger-rgb), 0.12)`
                    : `rgba(var(--color-brand-green-rgb), 0.12)`,
                  color: syncStatus === "error"
                    ? "var(--color-danger)"
                    : "var(--color-brand-green)",
                }}
              >
                {syncStatus === "syncing" ? "Syncing…" : syncStatus === "error" ? "Error" : "Synced"}
              </span>
              <button
                className="text-xs font-semibold px-2 py-1 rounded-lg transition-all hover:opacity-80 active:scale-[0.96]"
                style={{ color: "var(--color-brand-green)", backgroundColor: "rgba(var(--color-brand-green-rgb), 0.1)" }}
                onClick={() => navigator.clipboard.writeText(syncCode)}
              >
                Copy
              </button>
            </div>
            <div className="font-mono text-sm p-2 rounded-lg break-all" style={{ backgroundColor: "var(--color-surface-input)", color: "var(--color-text-primary)" }}>
              {syncCode}
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
              Share this code with others to sync your list, or use it on another device.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-[0.96]"
                style={{ color: "var(--color-text-secondary)", backgroundColor: "var(--color-surface-input)" }}
                onClick={() => setIsAdoptingCode(true)}
              >
                Switch Code
              </button>
              <button
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-[0.96]"
                style={{ color: "var(--color-danger)", backgroundColor: "rgba(var(--color-danger-rgb), 0.08)" }}
                onClick={() => setIsDisableSyncDialogOpen(true)}
              >
                Disable
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--color-text-secondary)" }}>
              Switching to a different code will replace your current data.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm mb-3" style={{ color: "var(--color-text-secondary)" }}>
              Enable cloud sync to backup your data and share it across devices.
            </p>
            <div className="flex gap-2">
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-[0.96]"
                style={{ color: "var(--color-brand-green)", backgroundColor: "rgba(var(--color-brand-green-rgb), 0.1)" }}
                onClick={onEnableSync}
                disabled={syncStatus === "syncing"}
              >
                {syncStatus === "syncing" ? "Enabling..." : "New Code"}
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-[0.96]"
                style={{ color: "var(--color-text-secondary)", backgroundColor: "var(--color-surface-input)" }}
                onClick={() => setIsAdoptingCode(true)}
                disabled={syncStatus === "syncing"}
              >
                Enter Code
              </button>
            </div>
          </>
        )}
      </SettingsCard>

      {/* Adopt Sync Code Dialog */}
      <Dialog open={isAdoptingCode} onOpenChange={setIsAdoptingCode}>
        <DialogContent showCloseButton={false} className="gap-3">
          <DialogHeader>
            <DialogTitle>Enter Sync Code</DialogTitle>
          </DialogHeader>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Paste the sync code from another device to load and sync that data.
          </p>
          <Input
            value={syncCodeInput}
            onChange={(e) => setSyncCodeInput(e.target.value)}
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
            className={INPUT_CLASS}
            autoFocus
          />
          <DialogFooter className="flex-row gap-2 mt-1">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-text-secondary)" }}
              onClick={() => {
                setIsAdoptingCode(false);
                setSyncCodeInput("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl font-semibold hover:!bg-[color:var(--color-surface-input)]"
              style={{ color: "var(--color-brand-green)" }}
              onClick={() => {
                onAdoptSyncCode(syncCodeInput.trim());
                setIsAdoptingCode(false);
                setSyncCodeInput("");
              }}
              disabled={!syncCodeInput.trim()}
            >
              Adopt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Sync Confirmation Dialog */}
      <Dialog open={isDisableSyncDialogOpen} onOpenChange={setIsDisableSyncDialogOpen}>
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
              style={{ backgroundColor: "var(--color-surface-input)", color: "var(--color-text-primary)" }}
              onClick={() => {
                onDisableSync(false);
                setIsDisableSyncDialogOpen(false);
              }}
            >
              <span className="block font-semibold">Keep cloud backup</span>
              <span className="block text-xs mt-0.5 font-normal" style={{ color: "var(--color-text-secondary)" }}>
                Sync is disabled locally. Re-enter your code later to restore.
              </span>
            </button>
            <button
              className="w-full py-3 rounded-xl text-sm font-semibold text-left px-4 transition-all hover:opacity-80 active:scale-[0.98]"
              style={{ backgroundColor: "rgba(var(--color-danger-rgb), 0.08)", color: "var(--color-danger)" }}
              onClick={() => {
                onDisableSync(true);
                setIsDisableSyncDialogOpen(false);
              }}
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
            style={{ color: "var(--color-text-secondary)" }}
            onClick={() => setIsDisableSyncDialogOpen(false)}
          >
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
