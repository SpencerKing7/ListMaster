// src/components/InstallInstructions.tsx
// Platform-specific add-to-home-screen / install instructions for onboarding.
import { useState } from "react";
import type { JSX } from "react";
import type { InstallStep } from "@/lib/installSteps";
import {
  getIphoneSteps,
  getAndroidSteps,
  getChromeSteps,
  getEdgeSteps,
  getSafariMacSteps,
} from "@/lib/installSteps";
import { InstallStepIcon } from "@/components/InstallIcons";

// MARK: - Types

type MobilePlatform = "iphone" | "android";
type DesktopPlatform = "chrome" | "edge" | "safari";

interface InstallInstructionsProps {
  deviceMode: "mobile" | "desktop";
}

// MARK: - Step card

/** Single numbered instruction step rendered as a card. */
function StepCard({ step, index }: { step: InstallStep; index: number }): JSX.Element {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3.5"
      style={{
        backgroundColor: "var(--color-surface-card)",
        border: "1px solid var(--color-border-subtle)",
      }}
    >
      <div
        className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-xs font-bold"
        style={{
          backgroundColor: "var(--color-surface-green-tint)",
          color: "var(--color-brand-green)",
        }}
      >
        {index + 1}
      </div>
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0">
          <InstallStepIcon iconKey={step.iconKey} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
            {step.title}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {step.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
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
    <div className="flex rounded-lg p-0.5" style={{ backgroundColor: "var(--color-surface-input)" }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors duration-200"
          style={{
            backgroundColor: selected === opt.value ? "var(--color-surface-card)" : "transparent",
            color: selected === opt.value ? "var(--color-brand-teal)" : "var(--color-text-secondary)",
            boxShadow: selected === opt.value ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
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

// MARK: - Steps list

/** Renders a vertical list of step cards. */
function StepsList({ steps, platformKey }: { steps: InstallStep[]; platformKey: string }): JSX.Element {
  return (
    <div className="flex flex-col gap-2.5">
      {steps.map((step, i) => (
        <StepCard key={`${platformKey}-${i}`} step={step} index={i} />
      ))}
    </div>
  );
}

// MARK: - Main component

/** Renders platform-toggled install instructions for mobile or desktop. */
export function InstallInstructions({ deviceMode }: InstallInstructionsProps): JSX.Element {
  const [mobilePlatform, setMobilePlatform] = useState<MobilePlatform>("iphone");
  const [desktopPlatform, setDesktopPlatform] = useState<DesktopPlatform>("chrome");

  if (deviceMode === "mobile") {
    const steps = mobilePlatform === "iphone" ? getIphoneSteps() : getAndroidSteps();
    return (
      <div className="flex flex-col gap-3 px-8 mt-4">
        <PlatformToggle
          options={[
            { value: "iphone" as const, label: "iPhone" },
            { value: "android" as const, label: "Android" },
          ]}
          selected={mobilePlatform}
          onSelect={setMobilePlatform}
        />
        <StepsList steps={steps} platformKey={mobilePlatform} />
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
      <StepsList steps={steps} platformKey={desktopPlatform} />
    </div>
  );
}
