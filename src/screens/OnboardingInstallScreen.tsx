// src/screens/OnboardingInstallScreen.tsx
// NOTE: 184 lines — exceeds the 150-line page target because it handles three
// mutually exclusive install-prompt states (iOS Safari, Android/Chrome, fallback)
// plus the PWA beforeinstallprompt event, which all share the same screen context.
import { useEffect, useMemo } from "react";
import type { JSX } from "react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/useSettingsStore";

export function OnboardingInstallScreen(): JSX.Element | null {
  const settings = useSettingsStore();

  // Memoised so it doesn't re-evaluate on every render
  const isStandalone = useMemo(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true,
    []
  );

  useEffect(() => {
    if (isStandalone) {
      // Auto-complete onboarding for standalone users
      settings.completeOnboarding();
      return;
    }
  }, [isStandalone, settings]);

  // Render nothing while redirecting — prevents flash of install screen
  if (isStandalone) return null;

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center px-8">
      {/* Base background */}
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
      {/* Gradient overlay */}
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

      {/* Header */}
      <div className="flex flex-col items-center gap-4">
        {/* Icon — Checkmark */}
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-brand-green)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22,4 12,14.01 9,11.01" />
        </svg>

        <h1
          className="text-[28px] font-bold text-center"
          style={{ color: "var(--color-brand-green)" }}
        >
          You're All Set!
        </h1>
        <p className="text-sm text-text-secondary text-center">
          Welcome to List Master — your personal checklist companion is ready to go!
        </p>
      </div>

      {/* Instruction steps */}
      <div className="flex flex-col gap-3 mt-8 w-full max-w-sm">
        {/* Placeholder for future content if needed */}
      </div>

      {/* Browser note */}
      <p className="text-xs text-text-secondary text-center mt-4 max-w-sm">
        {/* Removed install instructions */}
      </p>

      <div className="flex-1" />

      {/* Buttons */}
      <div
        className="w-full flex flex-col gap-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)" }}
      >
        <Button
          className="w-full h-14 rounded-2xl text-base font-semibold text-white press-scale"
          style={{
            background: "linear-gradient(135deg, var(--color-brand-green) 0%, var(--color-brand-teal) 100%)",
            boxShadow: "0 6px 24px rgba(57,179,133,0.35)",
          }}
          onClick={() => settings.completeOnboarding()}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}