// src/lib/installSteps.ts
// Pure data definitions for add-to-home-screen install instruction steps.
// Used by InstallInstructions component.

// MARK: - Types

/** A single install instruction step. */
export interface InstallStep {
  /** Key referencing an icon in InstallIcons. */
  iconKey: "share" | "plusSquare" | "menuDots" | "download" | "globe";
  title: string;
  subtitle: string;
}

// MARK: - Mobile steps

/** iPhone / iOS Safari install steps. */
export function getIphoneSteps(): InstallStep[] {
  return [
    {
      iconKey: "share",
      title: "Tap the Share button",
      subtitle: "In Safari's toolbar at the bottom of the screen",
    },
    {
      iconKey: "plusSquare",
      title: 'Tap "Add to Home Screen"',
      subtitle: "Scroll down in the share sheet if needed",
    },
    {
      iconKey: "plusSquare",
      title: 'Tap "Add"',
      subtitle: "In the top-right corner to confirm",
    },
  ];
}

/** Android / Chrome install steps. */
export function getAndroidSteps(): InstallStep[] {
  return [
    {
      iconKey: "menuDots",
      title: "Tap the menu button",
      subtitle: "The \u22EE icon in the top-right of Chrome",
    },
    {
      iconKey: "download",
      title: 'Tap "Add to Home screen"',
      subtitle: 'Or "Install app" if shown',
    },
    {
      iconKey: "plusSquare",
      title: 'Tap "Add"',
      subtitle: "To confirm and place the icon on your home screen",
    },
  ];
}

// MARK: - Desktop steps

/** Chrome desktop install steps. */
export function getChromeSteps(): InstallStep[] {
  return [
    {
      iconKey: "download",
      title: "Click the install icon",
      subtitle: "In the address bar (right side), or open the \u22EE menu",
    },
    {
      iconKey: "plusSquare",
      title: 'Click "Install"',
      subtitle: "In the confirmation dialog that appears",
    },
  ];
}

/** Edge desktop install steps. */
export function getEdgeSteps(): InstallStep[] {
  return [
    {
      iconKey: "menuDots",
      title: "Click the \u2026 menu",
      subtitle: "In the top-right corner of Edge",
    },
    {
      iconKey: "globe",
      title: 'Select "Apps" \u2192 "Install this site as an app"',
      subtitle: "Then click Install to confirm",
    },
  ];
}

/** Safari macOS install steps. */
export function getSafariMacSteps(): InstallStep[] {
  return [
    {
      iconKey: "share",
      title: "Click the Share button",
      subtitle: "In Safari's toolbar",
    },
    {
      iconKey: "plusSquare",
      title: 'Click "Add to Dock"',
      subtitle: "The app will appear in your Dock as a standalone window",
    },
  ];
}
