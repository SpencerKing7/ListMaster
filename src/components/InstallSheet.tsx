// src/components/InstallSheet.tsx
import { useState, useRef } from "react";
import type { JSX } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { InstallInstructions } from "@/components/InstallInstructions";
import { useSyncStore } from "@/store/useSyncStore";
import { SettingsService } from "@/services/settingsService";
import { detectPlatform } from "@/lib/detectPlatform";
import type { PlatformDetection } from "@/lib/detectPlatform";
import { InstallPromptService } from "@/services/installPromptService";

interface InstallSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Bottom sheet providing complete install instructions for existing users. */
export function InstallSheet({ isOpen, onOpenChange }: InstallSheetProps): JSX.Element {
  const { syncCode, isSyncEnabled, enableSync, syncStatus } = useSyncStore();
  const [platform] = useState<PlatformDetection>(detectPlatform);
  const [deviceMode, setDeviceMode] = useState(platform.deviceMode);
  const [isCopied, setIsCopied] = useState(false);

  const sheetFocusSentinelRef = useRef<HTMLDivElement>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      InstallPromptService.recordDismissal();
    }
    onOpenChange(open);
  };

  /** Enables sync if needed, then copies the code to the clipboard. */
  const handleGetAndCopyCode = async (): Promise<void> => {
    try {
      if (!isSyncEnabled) {
        await enableSync();
      }
      // Read from service directly — store state may not have flushed yet.
      const code = SettingsService.getSyncCode();
      if (!code) return;
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Clipboard API may fail on iOS — code is visible for manual copy
    }
  };

  const handleDontRemindMe = () => {
    InstallPromptService.setPermanentlyDismissed(true);
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="rounded-t-3xl max-h-[90dvh]"
        initialFocus={sheetFocusSentinelRef}
        style={{
          backgroundColor: "var(--color-surface-background)",
          boxShadow: "var(--elevation-sheet)",
        }}
      >
        <div className="flex flex-col overflow-hidden max-h-[90dvh] relative">
          <div ref={sheetFocusSentinelRef} tabIndex={-1} className="sr-only" aria-hidden />

          <SheetHeader className="flex flex-row items-center justify-between px-5 pb-3 pt-4">
            <SheetTitle
              className="text-2xl font-bold"
              style={{ color: "var(--color-brand-green)" }}
            >
              Install List Master
            </SheetTitle>
            <Button
              variant="ghost"
              className="font-semibold text-sm rounded-full px-4 hover:!bg-[color:var(--color-surface-input)] focus-visible:!border-[color:var(--color-brand-green)] focus-visible:!ring-[color:var(--color-brand-green)]/30"
              style={{
                color: "var(--color-brand-green)",
                backgroundColor: "rgba(var(--color-brand-green-rgb), 0.12)",
                touchAction: "manipulation",
              }}
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </SheetHeader>

          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 z-10"
            style={{
              top: "60px",
              height: "28px",
              background:
                "linear-gradient(to bottom, var(--color-surface-background) 0%, transparent 100%)",
            }}
          />

          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-5 px-5 pb-10 pt-2">
              <div className="flex items-center gap-3">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-brand-green)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Works offline, feels like a native app, launches from your home screen.
                </span>
              </div>

              {isSyncEnabled && syncCode ? (
                <div
                  className="rounded-xl p-4 flex flex-col gap-3"
                  style={{ backgroundColor: "var(--color-surface-input)" }}
                >
                  <div className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
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
                    onClick={handleGetAndCopyCode}
                  >
                    {isCopied ? "✓ Copied!" : "Copy Code"}
                  </button>
                  <div
                    className="text-xs"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Paste this code in your setup after install to restore your lists.
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-xl p-4 flex flex-col gap-3"
                  style={{ backgroundColor: "var(--color-surface-input)" }}
                >
                  <div className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                    Sync Code
                  </div>
                  <div
                    className="text-xs"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
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
                    onClick={handleGetAndCopyCode}
                    disabled={syncStatus === "syncing"}
                  >
                    {syncStatus === "syncing"
                      ? "Setting up…"
                      : isCopied
                        ? "✓ Copied!"
                        : "Enable Sync & Copy Code"}
                  </button>
                  {isCopied && (
                    <div
                      className="text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Paste this code in your setup after install to restore your lists.
                    </div>
                  )}
                </div>
              )}

              <div className="flex rounded-lg p-0.5" style={{ backgroundColor: "var(--color-surface-input)" }}>
                <button
                  type="button"
                  className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors duration-200"
                  style={{
                    backgroundColor: deviceMode === "mobile" ? "var(--color-surface-card)" : "transparent",
                    color: deviceMode === "mobile" ? "var(--color-brand-teal)" : "var(--color-text-secondary)",
                    boxShadow: deviceMode === "mobile" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                    touchAction: "manipulation",
                  }}
                  onClick={() => setDeviceMode("mobile")}
                >
                  Mobile
                </button>
                <button
                  type="button"
                  className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors duration-200"
                  style={{
                    backgroundColor: deviceMode === "desktop" ? "var(--color-surface-card)" : "transparent",
                    color: deviceMode === "desktop" ? "var(--color-brand-teal)" : "var(--color-text-secondary)",
                    boxShadow: deviceMode === "desktop" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                    touchAction: "manipulation",
                  }}
                  onClick={() => setDeviceMode("desktop")}
                >
                  Desktop
                </button>
              </div>

              <InstallInstructions
                deviceMode={deviceMode}
                initialMobileBrowser={platform.mobileBrowser}
                initialDesktopBrowser={platform.desktopBrowser}
                isIos={platform.isIos}
              />

              <div
                className="text-xs text-center"
                style={{ color: "var(--color-text-secondary)" }}
              >
                After installing, close this tab and open List Master from your home screen.
              </div>

              <button
                type="button"
                className="text-xs underline self-center"
                style={{ color: "var(--color-text-secondary)", touchAction: "manipulation" }}
                onClick={handleDontRemindMe}
              >
                Don't remind me again
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}