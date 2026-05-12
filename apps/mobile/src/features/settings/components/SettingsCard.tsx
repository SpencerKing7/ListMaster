// src/features/settings/components/SettingsCard.tsx
import { type ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";

interface SettingsCardProps {
  children: ReactNode;
}

/** Rounded card container for individual settings sections. */
export function SettingsCard({ children }: SettingsCardProps): React.JSX.Element {
  const { theme } = useSettingsStore();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surfaceCard,
          borderColor: theme.borderSubtle,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderWidth: 1,
  },
});
