// src/features/settings/components/SyncSection.tsx
// Sync & Backup settings card for SettingsSheet.
// Composes AdoptSyncCodeDialog and DisableSyncDialog for the two sync actions.

import { useState, type JSX } from "react";
import type { SyncStatus } from "@/store/useSyncStore";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";
import { AdoptSyncCodeDialog } from "./AdoptSyncCodeDialog";
import { DisableSyncDialog } from "./DisableSyncDialog";

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

      <AdoptSyncCodeDialog
        isOpen={isAdoptingCode}
        syncCodeInput={syncCodeInput}
        onInputChange={setSyncCodeInput}
        onAdopt={() => {
          onAdoptSyncCode(syncCodeInput.trim());
          setIsAdoptingCode(false);
          setSyncCodeInput("");
        }}
        onClose={() => {
          setIsAdoptingCode(false);
          setSyncCodeInput("");
        }}
      />

      <DisableSyncDialog
        isOpen={isDisableSyncDialogOpen}
        onDisable={(deleteCloud) => {
          onDisableSync(deleteCloud);
          setIsDisableSyncDialogOpen(false);
        }}
        onClose={() => setIsDisableSyncDialogOpen(false)}
      />
    </>
  );
}
