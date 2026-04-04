// src/components/InstallInstructions.tsx
// Platform-specific add-to-home-screen / install instructions for onboarding.
// Renders a vertical stepper with reference icons users should look for in
// their browser — styled to be clearly non-interactive.
import { useState } from "react";
import type { JSX } from "react";
import {
  getMobileSafariSteps,
  getMobileChromeSteps,
  getMobileFirefoxSteps,
} from "@/lib/installSteps";
import {
  getChromeSteps,
  getEdgeSteps,
  getSafariMacSteps,
} from "@/lib/installStepsDesktop";
import { InstallStepper } from "@/components/InstallStepper";

import type { MobileBrowser, DesktopBrowser } from "@/lib/detectPlatform";

// MARK: - Types

interface InstallInstructionsProps {
  deviceMode: "mobile" | "desktop";
  /** Detected mobile browser to pre-select. Defaults to "safari". */
  initialMobileBrowser?: MobileBrowser;
  /** Detected desktop browser to pre-select. Defaults to "chrome". */
  initialDesktopBrowser?: DesktopBrowser;
}

// MARK: - Platform toggle

/** Segmented toggle for switching between platforms within a device mode. */
function PlatformToggle<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
}): JSX.Element {
  return (
    <div
      className="flex rounded-lg p-0.5"
      style={{ backgroundColor: "var(--color-surface-input)" }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors duration-200"
          style={{
            backgroundColor:
              selected === opt.value ? "var(--color-surface-card)" : "transparent",
            color:
              selected === opt.value
                ? "var(--color-brand-teal)"
                : "var(--color-text-secondary)",
            boxShadow:
              selected === opt.value ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            touchAction: "manipulation",
          }}
          onClick={() => onSelect(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// MARK: - Section label

/** "FOLLOW THESE STEPS" uppercase label above the stepper. */
function StepperLabel(): JSX.Element {
  return (
    <p
      className="text-[11px] font-semibold tracking-widest uppercase"
      style={{ color: "var(--color-text-secondary)" }}
    >
      Follow these steps in your browser
    </p>
  );
}

// MARK: - Main component

/** Renders platform-toggled install instructions for mobile or desktop. */
export function InstallInstructions({
  deviceMode,
  initialMobileBrowser = "safari",
  initialDesktopBrowser = "chrome",
}: InstallInstructionsProps): JSX.Element {
  const [mobilePlatform, setMobilePlatform] = useState<MobileBrowser>(initialMobileBrowser);
  const [desktopPlatform, setDesktopPlatform] = useState<DesktopBrowser>(initialDesktopBrowser);

  if (deviceMode === "mobile") {
    const steps =
      mobilePlatform === "safari"
        ? getMobileSafariSteps()
        : mobilePlatform === "chrome"
          ? getMobileChromeSteps()
          : getMobileFirefoxSteps();
    return (
      <div className="flex flex-col gap-3 px-8 mt-4">
        <PlatformToggle
          options={[
            { value: "safari" as const, label: "Safari" },
            { value: "chrome" as const, label: "Chrome" },
            { value: "firefox" as const, label: "Firefox" },
          ]}
          selected={mobilePlatform}
          onSelect={setMobilePlatform}
        />
        <StepperLabel />
        <InstallStepper steps={steps} platformKey={mobilePlatform} />
      </div>
    );
  }

  const steps =
    desktopPlatform === "chrome"
      ? getChromeSteps()
      : desktopPlatform === "edge"
        ? getEdgeSteps()
        : getSafariMacSteps();

  return (
    <div className="flex flex-col gap-3 px-8 mt-4">
      <PlatformToggle
        options={[
          { value: "chrome" as const, label: "Chrome" },
          { value: "edge" as const, label: "Edge" },
          { value: "safari" as const, label: "Safari" },
        ]}
        selected={desktopPlatform}
        onSelect={setDesktopPlatform}
      />
      <StepperLabel />
      <InstallStepper steps={steps} platformKey={desktopPlatform} />
    </div>
  );
}
