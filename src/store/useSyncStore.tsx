// src/store/useSyncStore.ts
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { SettingsService } from "@/services/settingsService";
import { generateSyncCode } from "@/lib/utils";
// NOTE: syncService is NOT statically imported here (GAP 8). All calls to
// ensureAnonymousAuth() use dynamic import() so the Firebase SDK only loads
// after the user has enabled sync. This preserves zero bundle cost for users
// who never use sync.

// MARK: - Types

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface SyncContextValue {
  /** The current sync code (empty string if sync has never been enabled). */
  syncCode: string;
  /** Whether sync is currently enabled. */
  isSyncEnabled: boolean;
  /** Current sync status indicator. */
  syncStatus: SyncStatus;
  /** Enables sync by generating a new code and saving it. */
  enableSync: () => Promise<void>;
  /** Disables sync. Pass `true` to also permanently delete the Firestore document. */
  disableSync: (deleteCloud: boolean) => Promise<void>;
  /** Adopts an existing sync code from another device. */
  adoptSyncCode: (code: string) => Promise<void>;
  /** Resets sync by generating a new code. */
  resetSync: () => void;
}

/** Regex matching the XXXXX-XXXXX-XXXXX-XXXXX sync code format. */
const SYNC_CODE_PATTERN = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;

// MARK: - Provider

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

// MARK: - Provider

export function SyncProvider({ children }: { children: ReactNode }) {
  const [syncCode, setSyncCodeState] = useState<string>(() =>
    SettingsService.getSyncCode(),
  );
  const [isSyncEnabled, setIsSyncEnabledState] = useState<boolean>(() =>
    SettingsService.getIsSyncEnabled(),
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  const enableSync = useCallback(async () => {
    if (isSyncEnabled) return;

    // Reset any prior error state before re-attempting.
    setSyncStatus("syncing");
    try {
      // Dynamic import to load Firebase only when needed
      const { ensureAnonymousAuth } = await import("@/services/syncService");
      await ensureAnonymousAuth();

      const newCode = generateSyncCode();
      SettingsService.setSyncCode(newCode);
      SettingsService.setIsSyncEnabled(true);
      setSyncCodeState(newCode);
      setIsSyncEnabledState(true);
      setSyncStatus("synced");
    } catch (error) {
      console.error("Failed to enable sync:", error);
      setSyncStatus("error");
    }
  }, [isSyncEnabled]);

  const disableSync = useCallback(async (deleteCloud: boolean) => {
    const codeToDelete = SettingsService.getSyncCode();

    SettingsService.setIsSyncEnabled(false);
    SettingsService.clearSyncCode();
    setIsSyncEnabledState(false);
    setSyncCodeState("");
    setSyncStatus("idle");

    if (deleteCloud && codeToDelete) {
      try {
        const { deleteSyncData } = await import("@/services/syncService");
        await deleteSyncData(codeToDelete);
      } catch (error) {
        // Non-fatal — local state is already cleared; log and move on.
        console.error("Failed to delete cloud sync data:", error);
      }
    }
  }, []);

  const adoptSyncCode = useCallback(async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    if (!SYNC_CODE_PATTERN.test(trimmed)) {
      console.error("Invalid sync code format:", trimmed);
      setSyncStatus("error");
      return;
    }

    // Reset from any prior error so the UI reflects the new attempt.
    setSyncStatus("syncing");
    try {
      // Dynamic import to load Firebase only when needed
      const { ensureAnonymousAuth } = await import("@/services/syncService");
      await ensureAnonymousAuth();

      SettingsService.setSyncCode(trimmed);
      SettingsService.setIsSyncEnabled(true);
      setSyncCodeState(trimmed);
      setIsSyncEnabledState(true);
      setSyncStatus("synced");
    } catch (error) {
      console.error("Failed to adopt sync code:", error);
      setSyncStatus("error");
    }
  }, []);

  const resetSync = useCallback(() => {
    const newCode = generateSyncCode();
    SettingsService.setSyncCode(newCode);
    setSyncCodeState(newCode);
    setSyncStatus("idle");
  }, []);

  const value: SyncContextValue = {
    syncCode,
    isSyncEnabled,
    syncStatus,
    enableSync,
    disableSync,
    adoptSyncCode,
    resetSync,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSyncStore(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error("useSyncStore must be used within a SyncProvider");
  }
  return ctx;
}