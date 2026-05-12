// src/components/EmptyState.tsx — Animated empty-state with icon, title, and optional subtitle.
import { useState, useEffect, useRef, type ReactNode } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}

/** Centered empty-state with a mount-in animation (fade + slide up). */
export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const { theme } = useSettingsStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={[styles.iconCircle, { backgroundColor: `rgba(26,94,75,0.14)` }]}>
          {icon}
        </View>
        <Text style={[styles.title, { color: theme.brandTeal }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  content: {
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
