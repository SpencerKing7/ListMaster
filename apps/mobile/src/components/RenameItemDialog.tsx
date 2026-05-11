// src/components/RenameItemDialog.tsx — Dialog for renaming a checklist item.
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Dialog } from "@/components/primitives/Dialog";
import { useSettingsStore } from "@/store/useSettingsStore";
import { capitalizeFirst } from "@/lib/utils";

interface RenameItemDialogProps {
  itemToRename: { id: string; name: string } | null;
  value: string;
  onValueChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
}

/** Dialog for renaming a checklist item in the category panel. */
export function RenameItemDialog({
  itemToRename,
  value,
  onValueChange,
  onSave,
  onClose,
}: RenameItemDialogProps) {
  const { theme } = useSettingsStore();

  return (
    <Dialog
      visible={itemToRename !== null}
      onDismiss={onClose}
      title="Rename Item"
    >
      {itemToRename && (
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          Choose a new name for "{itemToRename.name}".
        </Text>
      )}

      <TextInput
        value={value}
        onChangeText={(val) => onValueChange(capitalizeFirst(val))}
        onSubmitEditing={onSave}
        style={[
          styles.input,
          {
            backgroundColor: theme.surfaceInput,
            color: theme.textPrimary,
            borderColor: theme.borderSubtle,
          },
        ]}
        placeholderTextColor={theme.textSecondary}
        autoFocus
        autoCapitalize="words"
        returnKeyType="done"
      />

      <View style={styles.buttons}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.surfaceInput, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.buttonText, { color: theme.textSecondary }]}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={onSave}
          disabled={value.trim().length === 0}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: `rgba(${hexToRgb(theme.brandGreen)}, 0.12)`,
              opacity: value.trim().length === 0 ? 0.4 : pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.buttonText, { color: theme.brandGreen, fontWeight: "600" }]}>Save</Text>
        </Pressable>
      </View>
    </Dialog>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0,0,0";
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}

const styles = StyleSheet.create({
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 15,
  },
});
