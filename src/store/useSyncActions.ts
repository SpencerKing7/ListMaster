// src/store/useSyncActions.ts
import { useCallback } from "react";
import { SettingsService } from "@/services/settingsService";
import { generateSyncCode } from "@/lib/utils";
import type { SyncStatus } from "@/store/useSyncStore";

// MARK: - Types

/** Setter functions passed in from SyncProvider. */
export interface UseSyncSetters {
  setSyncCode: (code: string) => void;
  setIsSyncEnabled: (enabled: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  /** Required: written after registerDevice + loadState resolve inside enableSync/adoptSyncCode. */
  setSyncedDeviceCount: (count: number) => void;
}

/** Return type of useSyncActions. */
export interface UseSyncActionsReturn {
  enableSync: () => Promise<void>;
  disableSync: (deleteCloud: boolean) => Promise<void>;
  adoptSyncCode: (code: string) => Promise<void>;
  resetSync: () => void;
}

/** Regex matching the XXXXX-XXXXX-XXXXX-XXXXX sync code format. */
const SYNC_CODE_PATTERN = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;

// MARK: - Hook

/**
 * Provides the four sync action callbacks for SyncProvider.
 * enableSync and adoptSyncCode capture user.uid from ensureAnonymousAuth()
 * and immediately call registerDevice, then loadState for the initial count.
 */
export function useSyncActions(
  isSyncEnabled: boolean,
  setters: UseSyncSetters,
): UseSyncActionsReturn {
  const { setSyncCode, setIsSyncEnabled, setSyncStatus, setSyncedDeviceCount } =
    setters;

  const enableSync = useCallback(async () => {
    if (isSyncEnabled) return;
    setSyncStatus("syncing");
    try {
      const { ensureAnonymousAuth, registerDevice, loadState } =
        await import("@/services/syncService");
      const user = await ensureAnonymousAuth();

      const newCode = generateSyncCode();
      SettingsService.setSyncCode(newCode);
      SettingsService.setIsSyncEnabled(true);
      setSyncCode(newCode);
      setIsSyncEnabled(true);

      await registerDevice(newCode, user.uid);
      const result = await loadState(newCode);
      setSyncedDeviceCount((result?.deviceIDs ?? []).length);

      setSyncStatus("synced");
    } catch (error) {
      console.error("Failed to enable sync:", error);
      setSyncStatus("error");
    }
  }, [
    isSyncEnabled,
    setSyncCode,
    setIsSyncEnabled,
    setSyncStatus,
    setSyncedDeviceCount,
  ]);

  const disableSync = useCallback(
    async (deleteCloud: boolean) => {
      const codeToDelete = SettingsService.getSyncCode();

      SettingsService.setIsSyncEnabled(false);
      SettingsService.clearSyncCode();
      setIsSyncEnabled(false);
      setSyncCode("");
      setSyncStatus("idle");
      setSyncedDeviceCount(0);

      if (deleteCloud && codeToDelete) {
        try {
          const { deleteSyncData } = await import("@/services/syncService");
          await deleteSyncData(codeToDelete);
        } catch (error) {
          console.error("Failed to delete cloud sync data:", error);
        }
      }
    },
    [setSyncCode, setIsSyncEnabled, setSyncStatus, setSyncedDeviceCount],
  );

  const adoptSyncCode = useCallback(
    async (code: string) => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) return;

      if (!SYNC_CODE_PATTERN.test(trimmed)) {
        console.error("Invalid sync code format:", trimmed);
        setSyncStatus("error");
        return;
      }

      setSyncStatus("syncing");
      try {
        const { ensureAnonymousAuth, registerDevice, loadState } =
          await import("@/services/syncService");
        const user = await ensureAnonymousAuth();

        SettingsService.setSyncCode(trimmed);
        SettingsService.setIsSyncEnabled(true);
        setSyncCode(trimmed);
        setIsSyncEnabled(true);

        await registerDevice(trimmed, user.uid);
        const result = await loadState(trimmed);
        setSyncedDeviceCount((result?.deviceIDs ?? []).length);

        setSyncStatus("synced");
      } catch (error) {
        console.error("Failed to adopt sync code:", error);
        setSyncStatus("error");
      }
    },
    [setSyncCode, setIsSyncEnabled, setSyncStatus, setSyncedDeviceCount],
  );

  const resetSync = useCallback(() => {
    const newCode = generateSyncCode();
    SettingsService.setSyncCode(newCode);
    setSyncCode(newCode);
    setSyncStatus("idle");
  }, [setSyncCode, setSyncStatus]);

  return { enableSync, disableSync, adoptSyncCode, resetSync };
}
