// src/App.tsx
import { useEffect, useRef, useState, useMemo } from "react";
import type { JSX } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSettingsStore } from "./store/useSettingsStore";
import { useCategoriesStore } from "./store/useCategoriesStore";
import { OnboardingWelcomeScreen } from "./screens/OnboardingWelcomeScreen";
import { OnboardingSetupScreen } from "./screens/OnboardingSetupScreen";
import { OnboardingSyncScreen } from "./screens/OnboardingSyncScreen";
import { OnboardingInstallScreen } from "./screens/OnboardingInstallScreen";
import { MainScreen } from "./screens/MainScreen";
import { SplashScreen } from "./screens/SplashScreen";
import { PageTransitionWrapper } from "./components/PageTransitionWrapper";

// Declare gtag as a global function (loaded by GA script in index.html)
declare global {
  function gtag(command: string, targetId: string, config?: Record<string, unknown>): void;
}

export function App(): JSX.Element {
  const { hasCompletedOnboarding } = useSettingsStore();
  const { reload } = useCategoriesStore();
  const [isSplashVisible, setIsSplashVisible] = useState(() => true);
  // Skip the very first visibilitychange event which fires on initial page
  // load (the tab transitions hidden → visible before React mounts).
  // We only want to reload on genuine tab-switch returns.
  const hasHandledFirstVisibility = useRef(false);

  const isStandalone = useMemo(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true,
    []
  );

  // Foreground-reload: re-read localStorage when the tab becomes visible
  // Mirrors scenePhase == .active → store.reload() in ListMasterApp.swift
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        if (!hasHandledFirstVisibility.current) {
          hasHandledFirstVisibility.current = true;
          // Track standalone mode sessions as a proxy for PWA installs.
          // Guard required — gtag may not be loaded if GA is blocked or slow.
          if (isStandalone && hasCompletedOnboarding && typeof gtag === "function") {
            gtag('event', 'pwa_session', {
              event_category: 'PWA',
              event_label: 'Standalone Mode'
            });
          }
          return;
        }
        reload();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [reload, isStandalone, hasCompletedOnboarding]);

  if (isSplashVisible) {
    return <SplashScreen onFinished={() => setIsSplashVisible(false)} isReturningUser={hasCompletedOnboarding} />;
  }

  return (
    <HashRouter>
      <PageTransitionWrapper>
        <Routes>
          {hasCompletedOnboarding ? (
            <>
              <Route path="/" element={<MainScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<OnboardingInstallScreen />} />
              <Route path="/welcome" element={<OnboardingWelcomeScreen />} />
              <Route path="/setup" element={<OnboardingSetupScreen />} />
              <Route path="/sync" element={<OnboardingSyncScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </PageTransitionWrapper>
    </HashRouter>
  );
}
