// src/features/settings/components/DeleteCategoryDialog.tsx
import { Text, View, Pressable, StyleSheet } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Dialog } from "@/components/primitives/Dialog";

interface DeleteCategoryDialogProps {
  categoryToDelete: { id: string; name: string } | null;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmation dialog for permanently deleting a category. */
export function DeleteCategoryDialog({ categoryToDelete, onConfirm, onClose }: DeleteCategoryDialogProps): React.JSX.Element {
  const { theme } = useSettingsStore();
  return (
    <Dialog visible={categoryToDelete !== null} onDismiss={onClose} title="Delete Category?">
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        "{categoryToDelete?.name}" will be permanently deleted. This cannot be undone.
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
