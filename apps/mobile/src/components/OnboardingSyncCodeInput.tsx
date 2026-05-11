// src/components/OnboardingSyncCodeInput.tsx — Sync code entry for onboarding setup screen.
import { View, Text, TextInput, StyleSheet } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";

interface OnboardingSyncCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/** Sync code input with label and helper description. */
export function OnboardingSyncCodeInput({
  value,
  onChange,
  onSubmit,
}: OnboardingSyncCodeInputProps) {
  const { theme } = useSettingsStore();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.brandTeal }]}>
        Enter a Sync Code
      </Text>
      <Text style={[styles.helper, { color: theme.textSecondary }]}>
        Have a code from another device? Enter it here to sync your data
        instead.
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.surfaceInput,
            color: theme.textPrimary,
            borderColor: theme.borderSubtle,
          },
        ]}
        placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        autoCapitalize="characters"
        returnKeyType="done"
        inputMode="text"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    paddingHorizontal: 32,
    marginTop: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
  helper: {
    fontSize: 12,
    lineHeight: 17,
  },
  input: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    borderWidth: 1,
    marginTop: 2,
  },
});
