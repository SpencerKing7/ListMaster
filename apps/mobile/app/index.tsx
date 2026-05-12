// app/index.tsx — Entry point: routes to onboarding or main, handles foreground reload.
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { Redirect } from "expo-router";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCategoriesStore } from "@/store/useCategoriesStore";

export default function Index() {
  const { hasCompletedOnboarding } = useSettingsStore();
  const { reload } = useCategoriesStore();
  const hasHandledFirstActive = useRef(false);

  // Foreground reload — mirrors scenePhase == .active in ListMasterApp.swift
  useEffect(() => {
    function handleAppStateChange(nextState: AppStateStatus): void {
      if (nextState === "active") {
        if (!hasHandledFirstActive.current) {
          hasHandledFirstActive.current = true;
          return;
        }
        reload();
      }
    }
    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, [reload]);

  // Navigate based on onboarding completion
  if (hasCompletedOnboarding) {
    return <Redirect href="/(main)" />;
  }

  return <Redirect href="/onboarding/welcome" />;
}
