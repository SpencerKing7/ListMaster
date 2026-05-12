// src/features/settings/components/AdoptSyncCodeDialog.tsx
import { TextInput, Text, View, Pressable, StyleSheet } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Dialog } from "@/components/primitives/Dialog";

interface AdoptSyncCodeDialogProps {
  isOpen: boolean;
  syncCodeInput: string;
  onInputChange: (value: string) => void;
  onAdopt: () => void;
  onClose: () => void;
}

/** Dialog for entering a sync code from another device. */
export function AdoptSyncCodeDialog({
  isOpen,
  syncCodeInput,
  onInputChange,
  onAdopt,
  onClose,
}: AdoptSyncCodeDialogProps): React.JSX.Element {
  const { theme } = useSettingsStore();
  return (
    <Dialog visible={isOpen} onDismiss={onClose} title="Enter Sync Code">
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        Paste the sync code from another device to load and sync that data.
      </Text>
      <TextInput
        value={syncCodeInput}
        onChangeText={onInputChange}
        placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="characters"
        returnKeyType="done"
        style={[
          styles.input,
          { color: theme.textPrimary, backgroundColor: theme.surfaceInput, borderColor: theme.borderSubtle },
        ]}
      />
      <View style={styles.row}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: theme.surfaceInput, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.btnText, { color: theme.textSecondary }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={onAdopt}
          disabled={!syncCodeInput.trim()}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: `${theme.brandGreen}1f`, opacity: pressed || !syncCodeInput.trim() ? 0.5 : 1 },
          ]}
        >
          <Text style={[styles.btnText, { color: theme.brandGreen }]}>Adopt</Text>
        </Pressable>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 14, lineHeight: 20 },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  row: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnText: { fontSize: 15, fontWeight: "600" },
});
