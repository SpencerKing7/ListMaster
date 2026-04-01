// src/App.tsx
import { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSettingsStore } from "./store/useSettingsStore";
import { useCategoriesStore } from "./store/useCategoriesStore";
import OnboardingWelcomeScreen from "./screens/OnboardingWelcomeScreen";
import OnboardingSetupScreen from "./screens/OnboardingSetupScreen";
import MainScreen from "./screens/MainScreen";
import PageTransitionWrapper from "./components/PageTransitionWrapper";

export default function App() {
  const { hasCompletedOnboarding } = useSettingsStore();
  const { reload } = useCategoriesStore();

  // Foreground-reload: re-read localStorage when the tab becomes visible
  // Mirrors scenePhase == .active → store.reload() in ListMasterApp.swift
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        reload();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [reload]);

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
              <Route path="/" element={<OnboardingWelcomeScreen />} />
              <Route path="/setup" element={<OnboardingSetupScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </PageTransitionWrapper>
    </HashRouter>
  );
}
