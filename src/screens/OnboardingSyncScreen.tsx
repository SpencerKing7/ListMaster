// src/screens/OnboardingSyncScreen.tsx
// Step 3 of 4 in onboarding — reached from /setup, navigates to /install (browser) or completes onboarding (standalone).
import { useState, useEffect, useCallback } from "react";
import type { JSX } from "react";
import { Button } from "@/components/ui/button";
import { useSyncStore } from "@/store/useSyncStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { SyncBenefitsCard } from "@/components/SyncBenefitsCard";

// MARK: - Screen

/** Onboarding screen that offers cloud sync before the user finishes setup. */
export function OnboardingSyncScreen(): JSX.Element | null {
  // 1. Store hooks
  const sync = useSyncStore();
  const settings = useSettingsStore();

  // 2. State declarations
  const [isLoading, setIsLoading] = useState(false);
  const [isEntered, setIsEntered] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 3. navigateForward — must be defined before effects that call it
  const navigateForward = useCallback((): void => {
    settings.completeOnboarding();
    // App.tsx re-renders automatically when hasCompletedOnboarding flips.
  }, [settings]);

  // 5. Early-exit effect — user already joined sync on /setup
  useEffect(() => {
    if (sync.isSyncEnabled) {
      navigateForward();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // runs once on mount only — navigateForward is stable

  // 6. Entry animation effect
  useEffect(() => {
    const t = setTimeout(() => setIsEntered(true), 60);
    return () => clearTimeout(t);
  }, []);

  // 7. Sync status watcher — CRITICAL
  // enableSync() does not re-throw; it sets syncStatus internally.
  // Reading syncStatus inline after await is a stale closure — use this watcher.
  // Both deps required: isLoading gates mount-fire; including it also re-triggers
  // the effect on retry so a second consecutive "error" status is caught.
  useEffect(() => {
    if (!isLoading) return; // guard: ignore mount fire and "syncing" intermediate
    if (sync.syncStatus === "synced") {
      setIsLoading(false);
      navigateForward();
    } else if (sync.syncStatus === "error") {
      setIsLoading(false);
      setHasError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync.syncStatus, isLoading]); // BOTH deps required — see note above

  // 8. handleEnable
  async function handleEnable(): Promise<void> {
    setHasError(false);
    setIsLoading(true);
    await sync.enableSync();
    // Do NOT call navigateForward() here — syncStatus is stale at this point.
  }

  // 9. Early-exit render guard
  if (sync.isSyncEnabled) return null;

  // 10. JSX return
  return (
    <div className="relative min-h-dvh flex flex-col">
      {/* Background layer 1 — solid fill, extended into safe areas */}
      <div
        className="absolute -z-10"
        style={{
          top: "calc(-1 * env(safe-area-inset-top, 0px))",
          left: 0,
          right: 0,
          bottom: "calc(-1 * env(safe-area-inset-bottom, 0px))",
          backgroundColor: "var(--color-surface-background)",
        }}
      />

      {/* Background layer 2 — brand gradient overlay */}
      <div
        className="absolute -z-10"
        style={{
          top: "calc(-1 * env(safe-area-inset-top, 0px))",
          left: 0,
          right: 0,
          bottom: "calc(-1 * env(safe-area-inset-bottom, 0px))",
          background: "var(--gradient-brand-wide)",
        }}
      />

      <div className="flex-1" />

      {/* Header — animated with isEntered, 0ms delay */}
      <div
        className="flex flex-col items-center gap-4 px-8"
        style={{
          opacity: isEntered ? 1 : 0,
          transform: isEntered ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 480ms cubic-bezier(0,0,0.2,1), transform 480ms cubic-bezier(0,0,0.2,1)",
        }}
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-green)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </svg>
        <h1 className="text-2xl font-bold text-center" style={{ color: "var(--color-brand-green)" }}>
          Sync Across Devices
        </h1>
        <p className="text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Back up your lists to the cloud and access them from any device.
        </p>
      </div>

      {/* Feature card — animated with isEntered, 60ms delay */}
      <SyncBenefitsCard isEntered={isEntered} />

      <div className="flex-1" />

      {/* CTA stack — pinned to bottom with safe-area inset */}
      <div
        className="px-8 flex flex-col gap-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)" }}
      >
        {/* Primary button */}
        <Button
          className="w-full h-14 rounded-2xl text-base font-semibold text-white press-scale"
          style={{
            background: "linear-gradient(135deg, var(--color-brand-green) 0%, var(--color-brand-teal) 100%)",
            boxShadow: "0 6px 24px rgba(57,179,133,0.35)",
            opacity: isLoading ? 0.7 : 1,
          }}
          disabled={isLoading}
          onClick={handleEnable}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Enable Cloud Sync</span>
            </div>
          ) : hasError ? (
            "Try Again"
          ) : (
            "Enable Cloud Sync"
          )}
        </Button>

        {/* Inline error message */}
        {hasError && (
          <p className="text-xs text-center" style={{ color: "var(--color-danger)" }}>
            Couldn't connect. Check your connection and try again.
          </p>
        )}

        {/* Ghost skip button */}
        <Button
          variant="ghost"
          className="w-full h-12 rounded-2xl text-sm font-medium"
          style={{ color: "var(--color-text-secondary)" }}
          disabled={isLoading}
          onClick={navigateForward}
        >
          Skip for Now
        </Button>
      </div>
    </div>
  );
}
