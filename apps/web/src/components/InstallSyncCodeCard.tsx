// src/components/InstallSyncCodeCard.tsx
// Card showing the user's sync code (or offer to enable sync) inside the install sheet.
import type { JSX } from "react";
import type { SyncStatus } from "@/store/useSyncStore";

/** Props for the {@link InstallSyncCodeCard} component. */
export interface InstallSyncCodeCardProps {
  /** Whether cloud sync is currently enabled for this device. */
  isSyncEnabled: boolean;
  /** The current sync code, or null/undefined when sync is not yet enabled. */
  syncCode: string | null | undefined;
  /** Whether the sync code was just copied to the clipboard. */
  isCopied: boolean;
  /** Current sync operation status — used to disable the button while syncing. */
  syncStatus: SyncStatus;
  /** Called when the user presses the copy / enable-and-copy button. */
  onCopy: () => void;
}

/**
 * Displays the user's sync code and a copy button when sync is active.
 * When sync is not yet enabled, shows a prompt to enable it and copy the code.
 */
export function InstallSyncCodeCard({
  isSyncEnabled,
  syncCode,
  isCopied,
  syncStatus,
  onCopy,
}: InstallSyncCodeCardProps): JSX.Element {
  if (isSyncEnabled && syncCode) {
    return (
      <div
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{ backgroundColor: "var(--color-surface-input)" }}
      >
        <div
          className="text-xs font-semibold"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Your Sync Code
        </div>
        <div
          className="font-mono text-lg font-bold tracking-wider"
          style={{ color: "var(--color-text-primary)" }}
        >
          {syncCode}
        </div>
        <button
          type="button"
          className="self-start px-4 py-2 rounded-xl text-sm font-semibold active:scale-[0.96] transition-transform"
          style={{
            backgroundColor: isCopied
              ? "rgba(var(--color-brand-green-rgb), 0.15)"
              : "rgba(var(--color-brand-green-rgb), 0.12)",
            color: "var(--color-brand-green)",
            touchAction: "manipulation",
            cursor: "pointer",
          }}
          onClick={onCopy}
        >
          {isCopied ? "✓ Copied!" : "Copy Code"}
        </button>
        <div
          className="text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Paste this code in your setup after install to restore your lists. You
          can always find it in Settings.
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ backgroundColor: "var(--color-surface-input)" }}
    >
      <div
        className="text-xs font-semibold"
        style={{ color: "var(--color-text-secondary)" }}
      >
        Sync Code
      </div>
      <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
        Get a sync code to restore your lists after installing.
      </div>
      <button
        type="button"
        className="self-start px-4 py-2 rounded-xl text-sm font-semibold active:scale-[0.96] transition-transform"
        style={{
          backgroundColor: isCopied
            ? "rgba(var(--color-brand-green-rgb), 0.15)"
            : "rgba(var(--color-brand-green-rgb), 0.12)",
          color: "var(--color-brand-green)",
          touchAction: "manipulation",
          cursor: "pointer",
        }}
        onClick={onCopy}
        disabled={syncStatus === "syncing"}
      >
        {syncStatus === "syncing"
          ? "Setting up…"
          : isCopied
            ? "✓ Copied!"
            : "Enable Sync & Copy Code"}
      </button>
      {isCopied && (
        <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          Paste this code in your setup after install to restore your lists.
        </div>
      )}
    </div>
  );
}
