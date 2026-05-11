// src/lib/installStepsDesktop.ts
// Desktop browser install instruction step data.
import type { InstallStep } from "@/lib/installSteps";

// MARK: - Desktop steps

/** Chrome desktop install steps. */
export function getChromeSteps(): InstallStep[] {
  return [
    {
      iconKey: "download",
      title: "Click the install icon in the address bar",
      subtitle: "Right side of the URL bar, or use the \u22EE menu",
      iconLabel: "Install",
    },
    {
      iconKey: "plusSquare",
      title: 'Click "Install" in the popup',
      subtitle: "Chrome will add it as a standalone app",
      iconLabel: "Install",
    },
  ];
}

/** Edge desktop install steps. */
export function getEdgeSteps(): InstallStep[] {
  return [
    {
      iconKey: "menuDots",
      title: "Open the \u2026 menu",
      subtitle: "Top-right corner of the Edge toolbar",
      iconLabel: "Menu",
    },
    {
      iconKey: "globe",
      title: 'Choose "Apps" \u2192 "Install this site as an app"',
      subtitle: "Then click Install to confirm",
      iconLabel: "Apps",
    },
  ];
}

/** Safari macOS install steps. */
export function getSafariMacSteps(): InstallStep[] {
  return [
    {
      iconKey: "share",
      title: "Click the Share button in the toolbar",
      subtitle: "Located in Safari's top toolbar area",
      iconLabel: "Share",
    },
    {
      iconKey: "plusSquare",
      title: 'Choose "Add to Dock"',
      subtitle: "The app opens as its own window from the Dock",
      iconLabel: "Add to Dock",
    },
  ];
}
