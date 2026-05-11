// app/onboarding/sync.tsx — Onboarding step 3: offer cloud sync before completing onboarding.
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Animated,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSyncStore } from "@/store/useSyncStore";
import { GradientBackground } from "@/components/GradientBackground";
import { SyncBenefitsCard } from "@/components/SyncBenefitsCard";
import { PageIndicator } from "@/components/PageIndicator";

export default function SyncScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, completeOnboarding } = useSettingsStore();
  const sync = useSyncStore();

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [headerAnim] = useState(() => new Animated.Value(0));
  const [cardAnim] = useState(() => new Animated.Value(0));

  const navigateForward = useCallback((): void => {
    completeOnboarding();
    router.replace("/(main)");
  }, [completeOnboarding, router]);

  // Early-exit: user already joined sync on setup screen
  useEffect(() => {
    if (sync.isSyncEnabled) {
      navigateForward();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Entry animation
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
        }),
        Animated.timing(cardAnim, {
          toValue: 1,
          duration: 480,
          delay: 60,
          useNativeDriver: true,
        }),
      ]).start();
    }, 60);
    return () => clearTimeout(t);
  }, [headerAnim, cardAnim]);

  // Sync status watcher — enableSync() sets syncStatus internally; stale closure
  // means we can't read it immediately after await.
  useEffect(() => {
    if (!isLoading) return;
    if (sync.syncStatus === "synced") {
      setIsLoading(false);
      navigateForward();
    } else if (sync.syncStatus === "error") {
      setIsLoading(false);
      setHasError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync.syncStatus, isLoading]);

  async function handleEnable(): Promise<void> {
    setHasError(false);
    setIsLoading(true);
    await sync.enableSync();
  }

  if (sync.isSyncEnabled) return null;

  return (
    <View style={{ flex: 1 }}>
      <GradientBackground />

      <View style={{ flex: 1 }} />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Svg
          width={56}
          height={56}
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.brandGreen}
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </Svg>
        <Text style={[styles.title, { color: theme.brandGreen }]}>
          Sync Across Devices
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Back up your lists to the cloud and access them from any device.
        </Text>
      </Animated.View>

      <SyncBenefitsCard animValue={cardAnim} />

      <View style={{ flex: 1 }} />

      <PageIndicator count={3} activeIndex={2} />

      {/* CTA stack */}
      <View
        style={[
          styles.ctaStack,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: theme.brandGreen,
              opacity: isLoading ? 0.7 : pressed ? 0.85 : 1,
            },
          ]}
          disabled={isLoading}
          onPress={handleEnable}
        >
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.textOnBrand} size="small" />
              <Text style={[styles.buttonText, { color: theme.textOnBrand }]}>
                Enable Cloud Sync
              </Text>
            </View>
          ) : (
            <Text style={[styles.buttonText, { color: theme.textOnBrand }]}>
              {hasError ? "Try Again" : "Enable Cloud Sync"}
            </Text>
          )}
        </Pressable>

        {hasError && (
          <Text style={[styles.errorText, { color: theme.danger }]}>
            Couldn't connect. Check your connection and try again.
          </Text>
        )}

        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          disabled={isLoading}
          onPress={navigateForward}
        >
          <Text style={[styles.skipText, { color: theme.textSecondary }]}>
            Skip for Now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  ctaStack: {
    paddingHorizontal: 32,
    gap: 12,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    textAlign: "center",
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    paddingVertical: 8,
  },
});
