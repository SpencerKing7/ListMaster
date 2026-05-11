// src/features/settings/components/AddGroupDialog.tsx
import { TextInput, Text, View, Pressable, StyleSheet } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";
import { capitalizeWords } from "@/lib/utils";
import { Dialog } from "@/components/primitives/Dialog";

interface AddGroupDialogProps {
  isOpen: boolean;
  groupName: string;
  onNameChange: (name: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

/** Dialog for creating a new category group. */
export function AddGroupDialog({
  isOpen,
  groupName,
  onNameChange,
  onConfirm,
  onClose,
}: AddGroupDialogProps): React.JSX.Element {
  const { theme } = useSettingsStore();
  const canConfirm = groupName.trim().length > 0;

  return (
    <Dialog visible={isOpen} onDismiss={onClose} title="New Group">
      <TextInput
        value={groupName}
        onChangeText={(t) => onNameChange(capitalizeWords(t))}
        onSubmitEditing={() => { if (canConfirm) onConfirm(); }}
        placeholder="Group name"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="words"
        returnKeyType="done"
        autoFocus
        style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surfaceInput, borderColor: theme.borderSubtle }]}
      />
      <View style={styles.row}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.btn, { backgroundColor: theme.surfaceInput, opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.btnText, { color: theme.textSecondary }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          disabled={!canConfirm}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: `${theme.brandGreen}1f`, opacity: pressed || !canConfirm ? 0.5 : 1 },
          ]}
        >
          <Text style={[styles.btnText, { color: theme.brandGreen }]}>Create</Text>
        </Pressable>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  input: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, borderWidth: 1 },
  row: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnText: { fontSize: 15, fontWeight: "600" },
});
