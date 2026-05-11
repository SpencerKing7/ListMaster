// app/onboarding/welcome.tsx — First onboarding screen with animated welcome hero.
import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsStore } from "@/store/useSettingsStore";
import { GradientBackground } from "@/components/GradientBackground";
import { AppIcon } from "@/components/AppIcon";
import { PageIndicator } from "@/components/PageIndicator";

export default function WelcomeScreen() {
  const { theme } = useSettingsStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [iconAnim] = useState(() => new Animated.Value(0));
  const [textAnim] = useState(() => new Animated.Value(0));
  const [ctaAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const delay = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    async function runEntrance() {
      await delay(60);
      Animated.timing(iconAnim, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }).start();
      await delay(60);
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }).start();
      await delay(60);
      Animated.timing(ctaAnim, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }).start();
    }

    runEntrance();
  }, [iconAnim, textAnim, ctaAnim]);

  return (
    <View style={styles.container}>
      <GradientBackground />

      <View style={{ flex: 1 }} />

      {/* Hero block */}
      <View style={styles.hero}>
        <Animated.View
          style={{
            opacity: iconAnim,
            transform: [
              {
                scale: iconAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.82, 1],
                }),
              },
              {
                translateY: iconAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          }}
        >
          <AppIcon size={96} />
        </Animated.View>

        <Animated.View
          style={[
            styles.wordmark,
            {
              opacity: textAnim,
              transform: [
                {
                  translateY: textAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.title, { color: theme.brandGreen }]}>
            List Master
          </Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>
            Your personal checklist companion
          </Text>
        </Animated.View>
      </View>

      <View style={{ flex: 1 }} />

      <PageIndicator count={3} activeIndex={0} />

      {/* CTA */}
      <Animated.View
        style={[
          styles.ctaContainer,
          {
            paddingBottom: insets.bottom + 40,
            opacity: ctaAnim,
            transform: [
              {
                translateY: ctaAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.brandGreen, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => router.push("/onboarding/setup")}
        >
          <Text style={[styles.buttonText, { color: theme.textOnBrand }]}>
            Get Started
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    alignItems: "center",
    gap: 20,
  },
  wordmark: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    textAlign: "center",
  },
  ctaContainer: {
    paddingHorizontal: 32,
  },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
