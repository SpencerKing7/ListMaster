// src/features/settings/components/DataSection.tsx
import { useState } from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import Svg, { Path, Polyline } from "react-native-svg";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Dialog } from "@/components/primitives/Dialog";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";

interface DataSectionProps {
  onReset: () => void;
}

/** Settings card with a "Reset to New User" button and confirmation dialog. */
export function DataSection({ onReset }: DataSectionProps): React.JSX.Element {
  const { theme } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <SettingsCard>
        <SectionLabel>Data</SectionLabel>
        <Pressable
          onPress={() => setIsOpen(true)}
          style={({ pressed }) => [
            styles.resetBtn,
            { backgroundColor: `${theme.danger}14`, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Svg width={15} height={15} viewBox="0 0 24 24" fill={theme.danger}>
            <Path d="M17.65 6.35A7.96 7.96 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </Svg>
          <Text style={[styles.resetText, { color: theme.danger }]}>Reset to New User</Text>
        </Pressable>
        <Text style={[styles.caption, { color: theme.textSecondary }]}>
          Clears all data and restarts the onboarding process.
        </Text>
      </SettingsCard>

      <Dialog visible={isOpen} onDismiss={() => setIsOpen(false)} title="Reset to New User?">
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          This will clear all your data and restart the onboarding process. This cannot be undone.
        </Text>
        <View style={styles.row}>
          <Pressable
            onPress={() => setIsOpen(false)}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: theme.surfaceInput, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.btnText, { color: theme.textSecondary }]}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => { onReset(); setIsOpen(false); }}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: theme.danger, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.btnText, { color: "#ffffff" }]}>Reset</Text>
          </Pressable>
        </View>
      </Dialog>
    </>
  );
}

const styles = StyleSheet.create({
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resetText: { fontSize: 14, fontWeight: "600" },
  caption: { fontSize: 12, textAlign: "center" },
  body: { fontSize: 14, lineHeight: 20 },
  row: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnText: { fontSize: 15, fontWeight: "600" },
});
