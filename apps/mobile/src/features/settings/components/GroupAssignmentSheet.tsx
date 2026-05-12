// src/features/settings/components/GroupAssignmentSheet.tsx
// Action-sheet style modal for assigning a category to a group.
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { CategoryGroup } from "@/models/types";

interface GroupAssignmentSheetProps {
  isOpen: boolean;
  selectedCategory: { id: string; name: string } | null;
  groups: CategoryGroup[];
  onAssign: (groupID: string | null) => void;
  onClose: () => void;
}

/** Bottom action sheet for assigning a category to a group. */
export function GroupAssignmentSheet({
  isOpen,
  selectedCategory,
  groups,
  onAssign,
  onClose,
}: GroupAssignmentSheetProps): React.JSX.Element {
  const { theme } = useSettingsStore();
  const insets = useSafeAreaInsets();

  return (
    <Modal transparent visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.surfaceOverlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.surfaceCard, paddingBottom: insets.bottom + 16 }]}>
          {selectedCategory && (
            <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
              Assign "{selectedCategory.name}" to Group
            </Text>
          )}
          <ScrollView bounces={false}>
            <Pressable
              onPress={() => { onAssign(null); onClose(); }}
              style={({ pressed }) => [
                styles.option,
                { backgroundColor: theme.surfaceInput, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={[styles.optionText, { color: theme.textPrimary }]}>No Group</Text>
            </Pressable>
            {groups.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => { onAssign(g.id); onClose(); }}
                style={({ pressed }) => [
                  styles.option,
                  { backgroundColor: theme.surfaceInput, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.optionText, { color: theme.textPrimary }]}>{g.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancel,
              { backgroundColor: theme.surfaceInput, opacity: pressed ? 0.7 : 1, marginTop: 8 },
            ]}
          >
            <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 8,
    maxHeight: "75%",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    alignItems: "center",
  },
  optionText: { fontSize: 16, fontWeight: "500" },
  cancel: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelText: { fontSize: 16, fontWeight: "600" },
});
