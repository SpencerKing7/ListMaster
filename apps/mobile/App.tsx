// App.tsx — Phase 1 entry point: hydrates storage caches then mounts all providers.
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SettingsProvider } from "@/store/useSettingsStore";
import { SyncProvider } from "@/store/useSyncStore";
import { StoreProvider } from "@/store/useCategoriesStore";
import { hydratePersistenceCache } from "@/services/persistenceService";
import { hydrateSettingsCache } from "@/services/settingsService";

function AppContent() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ListMaster — Phase 1 scaffold ✓</Text>
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([hydratePersistenceCache(), hydrateSettingsCache()]).then(() =>
      setReady(true),
    );
  }, []);

  if (!ready) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading…</Text>
      </View>
    );
  }

  return (
    <SettingsProvider>
      <SyncProvider>
        <StoreProvider>
          <AppContent />
        </StoreProvider>
      </SyncProvider>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f7",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    color: "#1a1a1a",
  },
});
