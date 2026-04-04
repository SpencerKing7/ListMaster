// src/screens/OnboardingInstallScreen.tsx
// First step in onboarding — shows add-to-home-screen instructions.
import { useState, useEffect, useMemo } from "react";
import type { JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InstallInstructions } from "@/components/InstallInstructions";
import { detectPlatform } from "@/lib/detectPlatform";
import type { PlatformDetection } from "@/lib/detectPlatform";

/** Onboarding screen with platform-specific add-to-home-screen instructions. */
export function OnboardingInstallScreen(): JSX.Element | null {
  const navigate = useNavigate();
  const [isEntered, setIsEntered] = useState(false);

  const isStandalone = useMemo(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true,
    [],
  );

  // Detect device + browser once on mount
  const [platform] = useState<PlatformDetection>(detectPlatform);

  const [deviceMode, setDeviceMode] = useState(platform.deviceMode);

  useEffect(() => {
    if (isStandalone) {
      navigate("/welcome");
    }
  }, [isStandalone, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setIsEntered(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (isStandalone) return null;

  return (
    <div className="relative min-h-dvh flex flex-col overflow-y-auto">
      {/* Base background */}
      <div
        className="fixed -z-10 inset-0"
        style={{ backgroundColor: "var(--color-surface-background)" }}
      />
      {/* Gradient overlay */}
      <div
        className="fixed -z-10 inset-0"
        style={{ background: "var(--gradient-brand-wide)" }}
      />

      {/* Header */}
      <div
        className="flex flex-col items-center gap-2 px-8"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)",
          opacity: isEntered ? 1 : 0,
          transform: isEntered ? "translateY(0)" : "translateY(12px)",
          transition:
            "opacity 480ms cubic-bezier(0,0,0.2,1), transform 480ms cubic-bezier(0,0,0.2,1)",
        }}
      >
        {/* Download/install icon */}
        <svg
          width="40"
          height="40"
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

        <h1
          className="text-2xl font-bold text-center"
          style={{ color: "var(--color-brand-green)" }}
        >
          Install List Master
        </h1>
        <p className="text-sm text-center max-w-xs" style={{ color: "var(--color-text-secondary)" }}>
          Add List Master to your home screen so it works offline and feels like
          a native app. Follow the steps below in your browser.
        </p>
      </div>

      {/* Device mode toggle */}
      <div
        className="flex mx-8 mt-4 rounded-xl p-1"
        style={{
          backgroundColor: "var(--color-surface-input)",
          opacity: isEntered ? 1 : 0,
          transform: isEntered ? "translateY(0)" : "translateY(12px)",
          transition:
            "opacity 480ms 40ms cubic-bezier(0,0,0.2,1), transform 480ms 40ms cubic-bezier(0,0,0.2,1)",
        }}
      >
        <button
          type="button"
          className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors duration-200"
          style={{
            backgroundColor:
              deviceMode === "mobile" ? "var(--color-surface-card)" : "transparent",
            color:
              deviceMode === "mobile"
                ? "var(--color-brand-green)"
                : "var(--color-text-secondary)",
            boxShadow:
              deviceMode === "mobile" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            touchAction: "manipulation",
          }}
          onClick={() => setDeviceMode("mobile")}
        >
          Mobile
        </button>
        <button
          type="button"
          className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors duration-200"
          style={{
            backgroundColor:
              deviceMode === "desktop" ? "var(--color-surface-card)" : "transparent",
            color:
              deviceMode === "desktop"
                ? "var(--color-brand-green)"
                : "var(--color-text-secondary)",
            boxShadow:
              deviceMode === "desktop" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            touchAction: "manipulation",
          }}
          onClick={() => setDeviceMode("desktop")}
        >
          Desktop
        </button>
      </div>

      {/* Platform-specific instructions */}
      <div
        style={{
          opacity: isEntered ? 1 : 0,
          transform: isEntered ? "translateY(0)" : "translateY(12px)",
          transition:
            "opacity 480ms 80ms cubic-bezier(0,0,0.2,1), transform 480ms 80ms cubic-bezier(0,0,0.2,1)",
        }}
      >
        <InstallInstructions
          deviceMode={deviceMode}
          initialMobileBrowser={platform.mobileBrowser}
          initialDesktopBrowser={platform.desktopBrowser}
        />
      </div>

      {/* Tip */}
      <p
        className="text-xs text-center px-10 mt-3"
        style={{ color: "var(--color-text-secondary)" }}
      >
        After installing, close this tab and open List Master from your home
        screen. You can also install later from your browser&apos;s menu.
      </p>

      <div className="flex-1 min-h-4" />

      {/* Buttons */}
      <div
        className="px-8 flex flex-col gap-3 pb-8"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 56px)" }}
      >
        <Button
          className="w-full h-14 rounded-2xl text-base font-semibold text-white press-scale"
          style={{
            background:
              "linear-gradient(135deg, var(--color-brand-green) 0%, var(--color-brand-teal) 100%)",
            boxShadow: "0 6px 24px rgba(57,179,133,0.35)",
          }}
          onClick={() => navigate("/welcome")}
        >
          I&apos;ve Installed It — Continue
        </Button>
        <button
          type="button"
          className="w-full h-12 rounded-2xl text-sm font-medium press-scale"
          style={{
            color: "var(--color-text-secondary)",
            backgroundColor: "transparent",
            touchAction: "manipulation",
          }}
          onClick={() => navigate("/welcome")}
        >
          Skip for Now
        </button>
      </div>
    </div>
  );
}