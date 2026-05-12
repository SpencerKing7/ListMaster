// src/features/settings/components/DisableSyncDialog.tsx
import { Text, View, Pressable, StyleSheet } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Dialog } from "@/components/primitives/Dialog";

interface DisableSyncDialogProps {
  isOpen: boolean;
  onDisable: (deleteCloud: boolean) => void;
  onClose: () => void;
}

/** Dialog for disabling sync with options to keep or delete cloud data. */
export function DisableSyncDialog({ isOpen, onDisable, onClose }: DisableSyncDialogProps): React.JSX.Element {
  const { theme } = useSettingsStore();
  return (
    <Dialog visible={isOpen} onDismiss={onClose} title="Disable Sync">
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        What would you like to do with your cloud backup?
      </Text>
      <View style={styles.options}>
        <Pressable
          onPress={() => onDisable(false)}
          style={({ pressed }) => [
            styles.option,
            { backgroundColor: theme.surfaceInput, borderColor: theme.borderSubtle, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>Keep cloud backup</Text>
          <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
            Sync is disabled locally. Re-enter your code later to restore.
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onDisable(true)}
          style={({ pressed }) => [
            styles.option,
            { backgroundColor: `${theme.danger}14`, borderColor: `${theme.danger}26`, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.optionTitle, { color: theme.danger }]}>Delete cloud data</Text>
          <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
            Permanently removes your data from the cloud. Cannot be undone.
          </Text>
        </Pressable>
      </View>
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [
          styles.cancelBtn,
          { backgroundColor: theme.surfaceInput, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
      </Pressable>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 14, lineHeight: 20 },
  options: { gap: 8 },
  option: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  optionTitle: { fontSize: 14, fontWeight: "600" },
  optionSub: { fontSize: 12, lineHeight: 17 },
  cancelBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600" },
});
