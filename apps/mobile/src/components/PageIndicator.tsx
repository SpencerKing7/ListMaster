// src/components/PageIndicator.tsx — Page-position dot indicator matching iOS UIPageControl.
import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";

interface PageIndicatorProps {
  count: number;
  activeIndex: number;
}

/** Row of dots showing the current onboarding step. Active dot expands into a pill. */
export function PageIndicator({ count, activeIndex }: PageIndicatorProps) {
  const { theme } = useSettingsStore();

  return (
    <View style={styles.row} accessibilityElementsHidden>
      {Array.from({ length: count }, (_, i) => (
        <Dot key={i} isActive={i === activeIndex} theme={theme} />
      ))}
    </View>
  );
}

function Dot({ isActive, theme }: { isActive: boolean; theme: { brandGreen: string; textSecondary: string } }) {
  const widthAnim = useRef(new Animated.Value(isActive ? 18 : 6)).current;
  const opacityAnim = useRef(new Animated.Value(isActive ? 1 : 0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(widthAnim, {
        toValue: isActive ? 18 : 6,
        useNativeDriver: false,
        tension: 280,
        friction: 24,
      }),
      Animated.timing(opacityAnim, {
        toValue: isActive ? 1 : 0.4,
        duration: 280,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isActive, widthAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: widthAnim,
          opacity: opacityAnim,
          backgroundColor: isActive ? theme.brandGreen : theme.textSecondary,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  dot: {
    height: 6,
    borderRadius: 9999,
  },
});
