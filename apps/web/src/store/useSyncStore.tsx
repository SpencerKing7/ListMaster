// src/store/useSyncStore.tsx
// React Context provider and hook for sync status (enabled, code, device count, status).
import {
  createContext,
  useContext,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { SettingsService } from "@/services/settingsService";
import { useSyncActions } from "@/store/useSyncActions";
import type { Category, CategoryGroup, ColorTheme } from "@/models/types";

// MARK: - Types

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

/** Callback invoked with loaded cloud data so StoreProvider can dispatch SYNC_LOAD immediately. */
export type SyncLoadCallback = (
  categories: Category[],
  selectedCategoryID: string | null,
  groups: CategoryGroup[],
  colorTheme: ColorTheme | undefined,
) => void;

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
  /**
   * Registers a callback that is invoked with cloud data immediately when
   * adoptSyncCode fetches it. StoreProvider calls this on mount to wire
   * dispatch(SYNC_LOAD) so data lands in the store before navigation.
   */
  registerSyncLoadCallback: (cb: SyncLoadCallback) => void;
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

  // Stable ref — StoreProvider registers its dispatch-based callback here so
  // adoptSyncCode can dispatch SYNC_LOAD synchronously before returning.
  const syncLoadCallbackRef = useRef<SyncLoadCallback | null>(null);
  const registerSyncLoadCallback = (cb: SyncLoadCallback) => {
    syncLoadCallbackRef.current = cb;
  };

  const { enableSync, disableSync, adoptSyncCode, resetSync } = useSyncActions(
    isSyncEnabled,
    { setSyncCode, setIsSyncEnabled, setSyncStatus, setSyncedDeviceCount },
    syncLoadCallbackRef,
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
    registerSyncLoadCallback,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

// MARK: - Hook

/** Returns the sync store context value. Must be used within SyncProvider. */
export function useSyncStore(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error("useSyncStore must be used within a SyncProvider");
  }
  return ctx;
}