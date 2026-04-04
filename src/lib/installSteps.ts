// src/lib/installSteps.ts
// Pure data definitions for add-to-home-screen install instruction steps.

// MARK: - Types

/** A single install instruction step. */
export interface InstallStep {
  /** Key referencing an icon in InstallIcons. */
  iconKey:
    | "share"
    | "plusSquare"
    | "menuDots"
    | "menuDotsH"
    | "download"
    | "globe";
  title: string;
  subtitle: string;
  /** Short label displayed below the reference icon. */
  iconLabel: string;
}

// MARK: - Mobile steps

/** Safari (iOS / iPadOS) install steps. */
export function getMobileSafariSteps(): InstallStep[] {
  return [
    {
      iconKey: "share",
      title: "Tap the Share button",
      subtitle: "Find this icon in Safari's bottom toolbar",
      iconLabel: "Share",
    },
    {
      iconKey: "plusSquare",
      title: 'Choose "Add to Home Screen"',
      subtitle: "Scroll down in the share sheet to find it",
      iconLabel: "Add to Home Screen",
    },
    {
      iconKey: "plusSquare",
      title: 'Tap "Add" to confirm',
      subtitle: "Top-right corner of the dialog",
      iconLabel: "Add",
    },
  ];
}

/** Chrome mobile install steps — adapts icon/copy for iOS vs Android. */
export function getMobileChromeSteps(isIos: boolean): InstallStep[] {
  return [
    isIos
      ? {
          iconKey: "menuDotsH" as const,
          title: "Tap the \u22EF menu button",
          subtitle: "Bottom-right corner of Chrome",
          iconLabel: "Menu",
        }
      : {
          iconKey: "menuDots" as const,
          title: "Tap the \u22EE menu button",
          subtitle: "Top-right corner of Chrome",
          iconLabel: "Menu",
        },
    {
      iconKey: "download",
      title: 'Choose "Add to Home screen"',
      subtitle: 'May also appear as "Install app"',
      iconLabel: "Install",
    },
    {
      iconKey: "plusSquare",
      title: 'Tap "Add" to confirm',
      subtitle: "Places the app icon on your home screen",
      iconLabel: "Add",
    },
  ];
}

/** Firefox mobile install steps. */
export function getMobileFirefoxSteps(): InstallStep[] {
  return [
    {
      iconKey: "menuDots",
      title: "Tap the \u22EE menu button",
      subtitle: "Top-right corner of Firefox",
      iconLabel: "Menu",
    },
    {
      iconKey: "download",
      title: 'Choose "Install"',
      subtitle: 'Or "Add to Home screen" on older versions',
      iconLabel: "Install",
    },
    {
      iconKey: "plusSquare",
      title: 'Tap "Add" to confirm',
      subtitle: "The app will appear on your home screen",
      iconLabel: "Add",
    },
  ];
}
