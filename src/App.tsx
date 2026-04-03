// src/App.tsx
import { useEffect, useRef, useState } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSettingsStore } from "./store/useSettingsStore";
import { useCategoriesStore } from "./store/useCategoriesStore";
import OnboardingWelcomeScreen from "./screens/OnboardingWelcomeScreen";
import OnboardingSetupScreen from "./screens/OnboardingSetupScreen";
import OnboardingInstallScreen from "./screens/OnboardingInstallScreen";
import MainScreen from "./screens/MainScreen";
import SplashScreen from "./screens/SplashScreen";
import PageTransitionWrapper from "./components/PageTransitionWrapper";

export default function App() {
  const { hasCompletedOnboarding } = useSettingsStore();
  const { reload } = useCategoriesStore();
  const [isSplashVisible, setIsSplashVisible] = useState(
    () => hasCompletedOnboarding,
  );
  // Skip the very first visibilitychange event which fires on initial page
  // load (the tab transitions hidden → visible before React mounts).
  // We only want to reload on genuine tab-switch returns.
  const hasHandledFirstVisibility = useRef(false);

  // Foreground-reload: re-read localStorage when the tab becomes visible
  // Mirrors scenePhase == .active → store.reload() in ListMasterApp.swift
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        if (!hasHandledFirstVisibility.current) {
          hasHandledFirstVisibility.current = true;
          return;
        }
        reload();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [reload]);

  if (isSplashVisible) {
    return <SplashScreen onFinished={() => setIsSplashVisible(false)} />;
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </PageTransitionWrapper>
    </HashRouter>
  );
}
