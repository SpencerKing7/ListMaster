// src/features/settings/components/SyncSection.tsx
import { useState } from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import * as Clipboard from "expo-clipboard";
import type { SyncStatus } from "@/store/useSyncStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";
import { AdoptSyncCodeDialog } from "./AdoptSyncCodeDialog";
import { DisableSyncDialog } from "./DisableSyncDialog";

interface SyncSectionProps {
  isSyncEnabled: boolean;
  syncCode: string;
  syncStatus: SyncStatus;
  syncedDeviceCount: number;
  onEnableSync: () => Promise<void>;
  onDisableSync: (deleteCloud: boolean) => Promise<void>;
  onAdoptSyncCode: (code: string) => Promise<void>;
}

/** Sync & Backup settings card. */
export function SyncSection({
  isSyncEnabled,
  syncCode,
  syncStatus,
  syncedDeviceCount,
  onEnableSync,
  onDisableSync,
  onAdoptSyncCode,
}: SyncSectionProps): React.JSX.Element {
  const { theme } = useSettingsStore();
  const [isAdopting, setIsAdopting] = useState(false);
  const [syncCodeInput, setSyncCodeInput] = useState("");
  const [isDisabling, setIsDisabling] = useState(false);

  const statusColor = syncStatus === "error" ? theme.danger : theme.brandGreen;
  const statusLabel = syncStatus === "syncing" ? "Syncing…" : syncStatus === "error" ? "Error" : "Synced";

  return (
    <>
      <SettingsCard>
        <SectionLabel>Sync & Backup</SectionLabel>
        {isSyncEnabled ? (
          <>
            <View style={styles.codeHeader}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>Sync Code</Text>
              <View style={[styles.badge, { backgroundColor: `${statusColor}1f` }]}>
                <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
              <Pressable
                onPress={() => Clipboard.setStringAsync(syncCode)}
                style={({ pressed }) => [
                  styles.copyBtn,
                  { backgroundColor: `${theme.brandGreen}1a`, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.copyText, { color: theme.brandGreen }]}>Copy</Text>
              </Pressable>
            </View>
            <View style={[styles.codeBox, { backgroundColor: theme.surfaceInput }]}>
              <Text
                style={[styles.codeText, { color: theme.textPrimary }]}
                numberOfLines={2}
                selectable
              >
                {syncCode}
              </Text>
            </View>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Share this code with others to sync your list, or use it on another device.
            </Text>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Synced devices: {syncedDeviceCount}
            </Text>
            <View style={styles.actionRow}>
              <Pressable
                onPress={() => setIsAdopting(true)}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: theme.surfaceInput, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.actionText, { color: theme.textSecondary }]}>Switch Code</Text>
              </Pressable>
              <Pressable
                onPress={() => setIsDisabling(true)}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: `${theme.danger}14`, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.actionText, { color: theme.danger }]}>Disable</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Enable cloud sync to backup your data and share it across devices.
            </Text>
            <View style={styles.actionRow}>
              <Pressable
                onPress={onEnableSync}
                disabled={syncStatus === "syncing"}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: `${theme.brandGreen}1a`, opacity: pressed || syncStatus === "syncing" ? 0.6 : 1 },
                ]}
              >
                <Text style={[styles.actionText, { color: theme.brandGreen }]}>
                  {syncStatus === "syncing" ? "Enabling..." : "New Code"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setIsAdopting(true)}
                disabled={syncStatus === "syncing"}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: theme.surfaceInput, opacity: pressed || syncStatus === "syncing" ? 0.6 : 1 },
                ]}
              >
                <Text style={[styles.actionText, { color: theme.textSecondary }]}>Enter Code</Text>
              </Pressable>
            </View>
          </>
        )}
      </SettingsCard>

      <AdoptSyncCodeDialog
        isOpen={isAdopting}
        syncCodeInput={syncCodeInput}
        onInputChange={setSyncCodeInput}
        onAdopt={() => {
          onAdoptSyncCode(syncCodeInput.trim());
          setIsAdopting(false);
          setSyncCodeInput("");
        }}
        onClose={() => {
          setIsAdopting(false);
          setSyncCodeInput("");
        }}
      />
      <DisableSyncDialog
        isOpen={isDisabling}
        onDisable={(del) => {
          onDisableSync(del);
          setIsDisabling(false);
        }}
        onClose={() => setIsDisabling(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  codeHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { flex: 1, fontSize: 14, fontWeight: "500" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  copyBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  copyText: { fontSize: 12, fontWeight: "600" },
  codeBox: { borderRadius: 10, padding: 10 },
  codeText: { fontFamily: "monospace", fontSize: 13, lineHeight: 18 },
  hint: { fontSize: 12, lineHeight: 18 },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  actionText: { fontSize: 14, fontWeight: "600" },
});
