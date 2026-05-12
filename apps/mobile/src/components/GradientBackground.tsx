// src/components/GradientBackground.tsx — Full-screen branded background used on onboarding screens.
import { View, StyleSheet } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";

/** Covers flex:1 with the surface background color. Tint overlay added via brandGreen at low opacity. */
export function GradientBackground() {
  const { theme } = useSettingsStore();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.surfaceBackground }]} />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.brandGreen, opacity: 0.04 },
        ]}
      />
    </View>
  );
}
