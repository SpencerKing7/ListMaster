// src/components/BottomBar.tsx — Fixed bottom navigation bar with category nav arrows and clear-checked button.
import { View, Text, Pressable, StyleSheet } from "react-native";
import Svg, { Polyline, Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { HapticService } from "@/services/hapticService";

/** Bottom bar — chevron navigation and clear-checked button when checked items exist. */
export function BottomBar() {
  const insets = useSafeAreaInsets();
  const { theme } = useSettingsStore();
  const store = useCategoriesStore();

  const checkedCount = store.selectedCategory?.items.filter(i => i.isChecked).length ?? 0;
  const hasCheckedItems = checkedCount > 0;

  return (
    <LinearGradient
      colors={["transparent", theme.surfaceChrome]}
      locations={[0, 0.4]}
      style={[styles.container, { paddingBottom: insets.bottom + 10 }]}
    >
      {/* 3-column grid so centre is always truly centred */}
      <View style={styles.grid}>
        {/* Left — previous */}
        <View style={styles.cell}>
          {store.canSelectPreviousCategory && (
            <Pressable
              onPress={() => { store.selectPreviousCategory(); HapticService.selection(); }}
              style={({ pressed }) => [
                styles.navButton,
                { backgroundColor: `rgba(26,94,75,0.10)`, opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.brandGreen} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="15,18 9,12 15,6" />
              </Svg>
              <Text style={[styles.navText, { color: theme.brandGreen }]} numberOfLines={1}>
                {store.previousCategory?.name ?? ""}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Centre — clear checked */}
        <View style={[styles.cell, styles.cellCenter]}>
          {hasCheckedItems && (
            <Pressable
              onPress={() => { store.clearCheckedItemsInSelectedCategory(); HapticService.medium(); }}
              style={({ pressed }) => [
                styles.navButton,
                { backgroundColor: `rgba(${hexToRgb(theme.danger)}, 0.12)`, opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
            >
              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={theme.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3 6h18" />
                <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </Svg>
              <Text style={[styles.navText, { color: theme.danger }]}>Clear {checkedCount}</Text>
            </Pressable>
          )}
        </View>

        {/* Right — next */}
        <View style={[styles.cell, styles.cellRight]}>
          {store.canSelectNextCategory && (
            <Pressable
              onPress={() => { store.selectNextCategory(); HapticService.selection(); }}
              style={({ pressed }) => [
                styles.navButton,
                { backgroundColor: `rgba(26,94,75,0.10)`, opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
            >
              <Text style={[styles.navText, { color: theme.brandGreen }]} numberOfLines={1}>
                {store.nextCategory?.name ?? ""}
              </Text>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.brandGreen} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="9,6 15,12 9,18" />
              </Svg>
            </Pressable>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0,0,0";
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  grid: {
    flexDirection: "row",
    marginBottom: 8,
  },
  cell: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  cellCenter: {
    alignItems: "center",
  },
  cellRight: {
    alignItems: "flex-end",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: 130,
  },
  navText: {
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
});
