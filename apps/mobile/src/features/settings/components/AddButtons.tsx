// src/features/settings/components/AddButtons.tsx
// Side-by-side "+ Category" and "+ Group" buttons at the bottom of the categories card.
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";

interface AddButtonsProps {
  onAddCategory: () => void;
  onAddGroup: () => void;
}

/** Two side-by-side buttons for opening the add-category and add-group dialogs. */
export function AddButtons({ onAddCategory, onAddGroup }: AddButtonsProps): React.JSX.Element {
  const { theme } = useSettingsStore();
  return (
    <View style={styles.wrapper}>
      <View style={[styles.divider, { backgroundColor: theme.textSecondary }]} />
      <View style={styles.row}>
        <Pressable
          onPress={onAddCategory}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: `${theme.brandGreen}1f`, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.btnText, { color: theme.brandGreen }]}>+ Category</Text>
        </Pressable>
        <Pressable
          onPress={onAddGroup}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: `${theme.brandGreen}1f`, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.btnText, { color: theme.brandGreen }]}>+ Group</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingTop: 4 },
  divider: { height: 1, opacity: 0.1, marginBottom: 12 },
  row: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  btnText: { fontSize: 14, fontWeight: "600" },
});
