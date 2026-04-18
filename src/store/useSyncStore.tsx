// src/store/useSyncStore.tsx
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { SettingsService } from "@/services/settingsService";
import { useSyncActions } from "@/store/useSyncActions";

// MARK: - Types

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface SyncContextValue {
  /** The current sync code (empty string if sync has never been enabled). */
  syncCode: string;
  /** Whether sync is currently enabled. */
  isSyncEnabled: boolean;
  /** Current sync status indicator. */
  syncStatus: SyncStatus;
  /** Number of devices registered to the current sync code. */
  syncedDeviceCount: number;
  /** Called by useCloudSync to update the count from subscription snapshots. */
  setSyncedDeviceCount: (count: number) => void;
  /** Enables sync by generating a new code and saving it. */
  enableSync: () => Promise<void>;
  /** Disables sync. Pass `true` to also permanently delete the Firestore document. */
  disableSync: (deleteCloud: boolean) => Promise<void>;
  /** Adopts an existing sync code from another device. */
  adoptSyncCode: (code: string) => Promise<void>;
  /** Resets sync by generating a new code. */
  resetSync: () => void;
}

// MARK: - Context

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

// MARK: - Provider

/** Provides the sync store to the component tree. */
export function SyncProvider({ children }: { children: ReactNode }): ReactNode {
  const [syncCode, setSyncCode] = useState<string>(() =>
    SettingsService.getSyncCode(),
  );
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(() =>
    SettingsService.getIsSyncEnabled(),
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncedDeviceCount, setSyncedDeviceCount] = useState<number>(0);

  const { enableSync, disableSync, adoptSyncCode, resetSync } = useSyncActions(
    isSyncEnabled,
    { setSyncCode, setIsSyncEnabled, setSyncStatus, setSyncedDeviceCount },
  );

  const value: SyncContextValue = {
    syncCode,
    isSyncEnabled,
    syncStatus,
    syncedDeviceCount,
    setSyncedDeviceCount,
    enableSync,
    disableSync,
    adoptSyncCode,
    resetSync,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

// MARK: - Hook

// eslint-disable-next-line react-refresh/only-export-components
/** Returns the sync store context value. Must be used within SyncProvider. */
export function useSyncStore(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error("useSyncStore must be used within a SyncProvider");
  }
  return ctx;
}