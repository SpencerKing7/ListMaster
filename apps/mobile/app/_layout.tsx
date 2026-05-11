// app/_layout.tsx — Root layout: hydrates caches, mounts all providers, controls splash screen.
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SettingsProvider } from "@/store/useSettingsStore";
import { SyncProvider } from "@/store/useSyncStore";
import { StoreProvider } from "@/store/useCategoriesStore";
import { hydratePersistenceCache } from "@/services/persistenceService";
import { hydrateSettingsCache } from "@/services/settingsService";

SplashScreen.preventAutoHideAsync();

function HydrationGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([hydratePersistenceCache(), hydrateSettingsCache()]).then(
      () => {
        setReady(true);
        SplashScreen.hideAsync();
      },
    );
  }, []);

  if (!ready) return <View style={{ flex: 1 }} />;

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <HydrationGate>
          <SettingsProvider>
            <SyncProvider>
              <StoreProvider>
                <Stack screenOptions={{ headerShown: false }} />
              </StoreProvider>
            </SyncProvider>
          </SettingsProvider>
        </HydrationGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
