// src/components/InstallDeviceToggle.tsx
// Segmented toggle for switching between Mobile and Desktop install instructions.
import type { JSX } from "react";

/** Props for the {@link InstallDeviceToggle} component. */
export interface InstallDeviceToggleProps {
  /** Currently active device mode. */
  deviceMode: "mobile" | "desktop";
  /** Called when the user selects a mode. */
  onDeviceModeChange: (mode: "mobile" | "desktop") => void;
}

/**
 * Segmented toggle that lets the user switch between Mobile and Desktop install
 * instruction sets inside the install sheet.
 */
export function InstallDeviceToggle({
  deviceMode,
  onDeviceModeChange,
}: InstallDeviceToggleProps): JSX.Element {
  return (
    <div
      className="flex rounded-lg p-0.5"
      style={{ backgroundColor: "var(--color-surface-input)" }}
    >
      <button
        type="button"
        className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors duration-200"
        style={{
          backgroundColor:
            deviceMode === "mobile"
              ? "var(--color-surface-card)"
              : "transparent",
          color:
            deviceMode === "mobile"
              ? "var(--color-brand-teal)"
              : "var(--color-text-secondary)",
          boxShadow:
            deviceMode === "mobile"
              ? "0 1px 2px rgba(0,0,0,0.06)"
              : "none",
          touchAction: "manipulation",
        }}
        onClick={() => onDeviceModeChange("mobile")}
      >
        Mobile
      </button>
      <button
        type="button"
        className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors duration-200"
        style={{
          backgroundColor:
            deviceMode === "desktop"
              ? "var(--color-surface-card)"
              : "transparent",
          color:
            deviceMode === "desktop"
              ? "var(--color-brand-teal)"
              : "var(--color-text-secondary)",
          boxShadow:
            deviceMode === "desktop"
              ? "0 1px 2px rgba(0,0,0,0.06)"
              : "none",
          touchAction: "manipulation",
        }}
        onClick={() => onDeviceModeChange("desktop")}
      >
        Desktop
      </button>
    </div>
  );
}
