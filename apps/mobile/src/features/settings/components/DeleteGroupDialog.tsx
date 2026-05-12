// src/features/settings/components/DeleteGroupDialog.tsx
import { Text, View, Pressable, StyleSheet } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Dialog } from "@/components/primitives/Dialog";

interface DeleteGroupDialogProps {
  groupToDelete: { id: string; name: string } | null;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmation dialog for deleting a group. Categories inside become ungrouped. */
export function DeleteGroupDialog({ groupToDelete, onConfirm, onClose }: DeleteGroupDialogProps): React.JSX.Element {
  const { theme } = useSettingsStore();
  return (
    <Dialog visible={groupToDelete !== null} onDismiss={onClose} title="Delete Group?">
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        "{groupToDelete?.name}" will be permanently deleted. Categories inside it will become ungrouped.
      </Text>
      <View style={styles.row}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.btn, { backgroundColor: theme.surfaceInput, opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.btnText, { color: theme.textSecondary }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          style={({ pressed }) => [styles.btn, { backgroundColor: theme.danger, opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.btnText, { color: "#ffffff" }]}>Delete</Text>
        </Pressable>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 14, lineHeight: 20 },
  row: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnText: { fontSize: 15, fontWeight: "600" },
});
