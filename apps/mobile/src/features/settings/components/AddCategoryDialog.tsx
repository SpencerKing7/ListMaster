// src/features/settings/components/AddCategoryDialog.tsx
import { TextInput, Text, View, Pressable, ScrollView, StyleSheet } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";
import { capitalizeWords } from "@/lib/utils";
import type { CategoryGroup } from "@/models/types";
import { Dialog } from "@/components/primitives/Dialog";

interface AddCategoryDialogProps {
  isOpen: boolean;
  isDuplicate: boolean;
  categoryName: string;
  onNameChange: (name: string) => void;
  selectedGroupID: string | null;
  onGroupChange: (id: string | null) => void;
  onConfirm: () => void;
  onClose: () => void;
  groups: CategoryGroup[];
}

/** Dialog for creating a new category with optional group assignment. */
export function AddCategoryDialog({
  isOpen,
  isDuplicate,
  categoryName,
  onNameChange,
  selectedGroupID,
  onGroupChange,
  onConfirm,
  onClose,
  groups,
}: AddCategoryDialogProps): React.JSX.Element {
  const { theme } = useSettingsStore();
  const canConfirm = categoryName.trim().length > 0 && !isDuplicate;

  return (
    <Dialog visible={isOpen} onDismiss={onClose} title="New Category">
      <TextInput
        value={categoryName}
        onChangeText={(t) => onNameChange(capitalizeWords(t))}
        onSubmitEditing={() => { if (canConfirm) onConfirm(); }}
        placeholder="Category name"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="words"
        returnKeyType="done"
        autoFocus
        style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surfaceInput, borderColor: theme.borderSubtle }]}
      />
      {isDuplicate && (
        <Text style={[styles.dupError, { color: theme.danger }]}>
          {groups.length > 0
            ? "A category with this name already exists in this group."
            : "A category with this name already exists."}
        </Text>
      )}
      {groups.length > 0 && (
        <View>
          <Text style={[styles.groupLabel, { color: theme.textSecondary }]}>Group</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
            <View style={styles.pillRow}>
              <Pressable
                onPress={() => onGroupChange(null)}
                style={({ pressed }) => [
                  styles.pill,
                  {
                    backgroundColor: selectedGroupID === null ? theme.brandGreen : theme.surfaceInput,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={[styles.pillText, { color: selectedGroupID === null ? theme.textOnBrand : theme.textSecondary }]}>
                  No Group
                </Text>
              </Pressable>
              {groups.map((g) => (
                <Pressable
                  key={g.id}
                  onPress={() => onGroupChange(g.id)}
                  style={({ pressed }) => [
                    styles.pill,
                    {
                      backgroundColor: selectedGroupID === g.id ? theme.brandGreen : theme.surfaceInput,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.pillText, { color: selectedGroupID === g.id ? theme.textOnBrand : theme.textPrimary }]}>
                    {g.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
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
          <Text style={[styles.btnText, { color: theme.brandGreen }]}>Add</Text>
        </Pressable>
      </View>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  input: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, borderWidth: 1 },
  dupError: { fontSize: 12, marginTop: -4 },
  groupLabel: { fontSize: 12, fontWeight: "500", marginBottom: 8 },
  pillScroll: { marginHorizontal: -4 },
  pillRow: { flexDirection: "row", gap: 8, paddingHorizontal: 4 },
  pill: { height: 36, borderRadius: 12, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  pillText: { fontSize: 14, fontWeight: "500" },
  row: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnText: { fontSize: 15, fontWeight: "600" },
});
