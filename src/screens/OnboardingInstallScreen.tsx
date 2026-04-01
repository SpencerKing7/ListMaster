// src/screens/OnboardingInstallScreen.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Declare gtag as a global function (loaded by GA script in index.html)
declare global {
  function gtag(command: string, targetId: string, config?: Record<string, unknown>): void;
}

export default function OnboardingInstallScreen() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  // Memoised so it doesn't re-evaluate on every render
  const isStandalone = useMemo(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true,
    []
  );

  useEffect(() => {
    if (isStandalone) {
      // Track standalone mode sessions as a proxy for PWA installs
      gtag('event', 'pwa_session', {
        event_category: 'PWA',
        event_label: 'Standalone Mode'
      });
      navigate("/welcome", { replace: true });
      return;
    }
    setMounted(true);
  }, [isStandalone, navigate]);

  // Render nothing while redirecting — prevents flash of install screen
  if (isStandalone) return null;

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center px-8">
      {/* Base background */}
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: "var(--color-surface-background)" }}
      />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-brand-wide)" }}
      />

      <div className="flex-1" />

      {/* Header */}
      <div className="flex flex-col items-center gap-4">
        {/* Icon — iPhone */}
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-brand-green)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2" />
        </svg>

        <h1
          className="text-[28px] font-bold text-center"
          style={{ color: "var(--color-brand-green)" }}
        >
          Add to Home Screen
        </h1>
        <p className="text-sm text-text-secondary text-center">
          ListMaster works best as an app on your home screen — it's faster, works offline, and feels just like a native app.
        </p>
      </div>

      {/* Instruction steps */}
      <div className="flex flex-col gap-3 mt-8 w-full max-w-sm">
        {/* Step 1 */}
        <div
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.07] border border-brand-green/15 transition-all duration-220 ease-decelerate ${mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-92"
            }`}
          style={{ transitionDelay: "0ms" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-brand-teal)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16,6 12,2 8,6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold text-text-primary">Tap the Share button</p>
            <p className="text-sm text-text-secondary">in Safari's toolbar at the bottom of the screen</p>
          </div>
        </div>

        {/* Step 2 */}
        <div
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.07] border border-brand-green/15 transition-all duration-220 ease-decelerate ${mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-92"
            }`}
          style={{ transitionDelay: "100ms" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-brand-teal)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold text-text-primary">Tap "Add to Home Screen"</p>
            <p className="text-sm text-text-secondary">then tap Add in the top-right corner</p>
          </div>
        </div>
      </div>

      {/* Browser note */}
      <p className="text-xs text-text-secondary text-center mt-4 max-w-sm">
        Most iOS browsers support Add to Home Screen from the share menu. On Android, look for "Install App" or "Add to Home Screen" in your browser's menu (⋮).
      </p>

      <div className="flex-1" />

      {/* Buttons */}
      <div className="w-full pb-[60px] flex flex-col gap-3">
        <Button
          variant="ghost"
          className="w-full h-12 rounded-2xl text-sm font-medium"
          style={{ color: "var(--color-text-secondary)" }}
          onClick={() => navigate("/welcome")}
        >
          Skip for Now — Use in Browser
        </Button>
      </div>
    </div>
  );
}