// app/onboarding/setup.tsx — Onboarding step: enter categories or a sync code.
import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { useSyncStore } from "@/store/useSyncStore";
import { GradientBackground } from "@/components/GradientBackground";
import { OnboardingCategoryInput } from "@/components/OnboardingCategoryInput";
import { PageIndicator } from "@/components/PageIndicator";
import { OnboardingSyncCodeInput } from "@/components/OnboardingSyncCodeInput";

export default function SetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore();
  const { theme } = settings;
  const store = useCategoriesStore();
  const sync = useSyncStore();

  const [pendingCategories, setPendingCategories] = useState<string[]>(
    store.categories.map((c) => c.name),
  );
  const [syncCodeText, setSyncCodeText] = useState("");

  const trimmedSyncCode = syncCodeText.trim();
  const isFormValid =
    trimmedSyncCode.length > 0 ||
    pendingCategories.length > 0;
  const isManualDimmed = trimmedSyncCode.length > 0;

  async function finishSetup(): Promise<void> {
    if (!isFormValid) return;

    if (trimmedSyncCode.length > 0) {
      await sync.adoptSyncCode(trimmedSyncCode);
    } else {
      store.setCategories(pendingCategories);
    }

    setTimeout(() => router.push("/onboarding/sync"), 350);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <GradientBackground />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1 }} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.brandGreen }]}>
            Welcome to List Master!
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Let's get you set up with your categories
          </Text>
        </View>

        {/* Manual setup form */}
        <View
          style={[
            styles.form,
            { opacity: isManualDimmed ? 0.4 : 1 },
          ]}
          pointerEvents={isManualDimmed ? "none" : "auto"}
        >
          <OnboardingCategoryInput
            categories={pendingCategories}
            onAdd={(name) =>
              setPendingCategories((prev) => [...prev, name])
            }
            onRemove={(name) =>
              setPendingCategories((prev) => prev.filter((c) => c !== name))
            }
          />
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View
            style={[styles.dividerLine, { backgroundColor: theme.textSecondary }]}
          />
          <Text style={[styles.dividerText, { color: theme.textSecondary }]}>
            or
          </Text>
          <View
            style={[styles.dividerLine, { backgroundColor: theme.textSecondary }]}
          />
        </View>

        <OnboardingSyncCodeInput
          value={syncCodeText}
          onChange={setSyncCodeText}
          onSubmit={finishSetup}
        />

        <View style={{ flex: 1, minHeight: 32 }} />

        <PageIndicator count={3} activeIndex={1} />

        {/* Finish button */}
        <View style={styles.ctaContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: theme.brandGreen,
                opacity: !isFormValid ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
            disabled={!isFormValid}
            onPress={finishSetup}
          >
            <Text style={[styles.buttonText, { color: theme.textOnBrand }]}>
              Next
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingTop: 32,
  },
  header: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  form: {
    paddingHorizontal: 32,
    marginTop: 40,
    gap: 24,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
    marginTop: 32,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    opacity: 0.2,
  },
  dividerText: {
    fontSize: 12,
  },
  ctaContainer: {
    paddingHorizontal: 32,
    marginTop: 32,
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
