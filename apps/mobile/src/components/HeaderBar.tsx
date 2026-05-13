// src/components/HeaderBar.tsx — Sticky top navigation bar with app title, refresh, settings, group tabs, and category picker.
import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";
import Svg, { Line, Polyline, Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { GroupTabBar } from "@/components/GroupTabBar";
import { CategoryPicker } from "@/components/CategoryPicker";

interface HeaderBarProps {
  scrolled?: boolean;
  onRefresh?: () => void;
}

/** Top header bar — brand row, greeting, group tabs, category picker. */
export function HeaderBar({ scrolled = false, onRefresh }: HeaderBarProps) {
  const insets = useSafeAreaInsets();
  const { theme, userName } = useSettingsStore();
  const { hasGroups, groups, selectedGroupID, selectGroup } = useCategoriesStore();
  const trimmedName = userName.trim();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [spinAnim] = useState(() => new Animated.Value(0));

  function handleRefresh() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
    ).start();
    setTimeout(() => {
      setIsRefreshing(false);
      spinAnim.setValue(0);
      onRefresh?.();
    }, 800);
  }

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <LinearGradient
      colors={[theme.surfaceChrome, theme.surfaceChrome, "transparent"]}
      locations={[0, 0.85, 1]}
      style={[styles.container, { paddingTop: insets.top + 8 }]}
    >
      {/* MARK: - Brand row */}
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={theme.brandGreen} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Line x1={9} y1={6} x2={20} y2={6} />
            <Line x1={9} y1={12} x2={20} y2={12} />
            <Line x1={9} y1={18} x2={20} y2={18} />
            <Polyline points="4,6 5,7 7,5" />
            <Polyline points="4,12 5,13 7,11" />
            <Polyline points="4,18 5,19 7,17" />
          </Svg>
          <Text style={[styles.brandText, { color: theme.brandGreen }]}>List Master</Text>
        </View>

        {/* Refresh button */}
        <Pressable
          onPress={handleRefresh}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: `rgba(26,94,75,0.10)`, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.brandTeal} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <Path d="M21 3v5h-5" />
              <Path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <Path d="M8 16H3v5" />
            </Svg>
          </Animated.View>
        </Pressable>

        {/* Settings button */}
        <Pressable
          onPress={() => router.push("/(main)/settings")}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: `rgba(26,94,75,0.10)`, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill={theme.brandTeal} stroke="none">
            <Path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.04 7.04 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.26.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" />
          </Svg>
        </Pressable>
      </View>

      {/* MARK: - Greeting */}
      {trimmedName.length > 0 && (
        <Text
          style={[
            styles.greeting,
            {
              color: theme.textPrimary,
              fontSize: scrolled ? 13 : 26,
              opacity: scrolled ? 0.6 : 1,
            },
          ]}
          numberOfLines={1}
        >
          {"Welcome, "}
          <Text style={{ color: theme.brandGreen }}>{trimmedName}</Text>
        </Text>
      )}

      {/* MARK: - Group tabs */}
      {hasGroups && (
        <GroupTabBar
          groups={groups}
          selectedGroupID={selectedGroupID}
          onSelectGroup={selectGroup}
        />
      )}

      {/* MARK: - Category picker */}
      <CategoryPicker />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  brandLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 8,
  },
});
