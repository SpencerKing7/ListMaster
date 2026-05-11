// src/features/settings/components/GroupRowHeader.tsx
// Header for a collapsible group: drag handle, name, badge, rename, delete, chevron.
import { useRef, useEffect } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import type { ComposedGesture, GestureType } from "react-native-gesture-handler";
import Svg, { Path, Line, Polyline } from "react-native-svg";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { CategoryGroup } from "@/models/types";

interface GroupRowHeaderProps {
  group: CategoryGroup;
  groupVisualIdx: number;
  isExpanded: boolean;
  categoryCount: number;
  groupGesture: ComposedGesture | GestureType;
  onGroupRowLayout: (idx: number, height: number) => void;
  onToggle: (groupID: string) => void;
  inlineEditingGroupID: string | null;
  setInlineEditingGroupID: (id: string | null) => void;
  renameGroupName: string;
  onRenameGroupNameChange: (v: string) => void;
  saveRenameGroup: () => void;
  onDelete: (id: string, name: string) => void;
}

/** Header bar for a group row: drag handle, chevron, name, badge, rename/delete. */
export function GroupRowHeader({
  group,
  groupVisualIdx,
  isExpanded,
  categoryCount,
  groupGesture,
  onGroupRowLayout,
  onToggle,
  inlineEditingGroupID,
  setInlineEditingGroupID,
  renameGroupName,
  onRenameGroupNameChange,
  saveRenameGroup,
  onDelete,
}: GroupRowHeaderProps): React.JSX.Element {
  const { theme } = useSettingsStore();
  const isEditing = inlineEditingGroupID === group.id;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isEditing) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isEditing]);

  return (
    <View
      style={[styles.header, { backgroundColor: `${theme.brandDeepGreen}1f` }]}
      onLayout={(e) => onGroupRowLayout(groupVisualIdx, e.nativeEvent.layout.height)}
    >
      {/* Drag handle */}
      <GestureDetector gesture={groupGesture}>
        <View style={styles.handle} hitSlop={{ top: 8, bottom: 8 }}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.brandTeal} strokeWidth={2.5}>
            <Line x1={4} y1={7} x2={20} y2={7} />
            <Line x1={4} y1={12} x2={20} y2={12} />
            <Line x1={4} y1={17} x2={20} y2={17} />
          </Svg>
        </View>
      </GestureDetector>

      {/* Name or inline rename */}
      {isEditing ? (
        <TextInput
          ref={inputRef}
          value={renameGroupName}
          onChangeText={onRenameGroupNameChange}
          onBlur={() => { saveRenameGroup(); setInlineEditingGroupID(null); }}
          onSubmitEditing={() => { saveRenameGroup(); setInlineEditingGroupID(null); }}
          returnKeyType="done"
          autoCapitalize="words"
          style={[
            styles.renameInput,
            { color: theme.textPrimary, backgroundColor: theme.surfaceInput, borderColor: theme.borderSubtle },
          ]}
        />
      ) : (
        <Pressable style={styles.namePressable} onPress={() => onToggle(group.id)}>
          <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>{group.name}</Text>
        </Pressable>
      )}

      {/* Category count badge */}
      {categoryCount > 0 && (
        <View style={[styles.badge, { backgroundColor: `${theme.brandTeal}24` }]}>
          <Text style={[styles.badgeText, { color: theme.brandTeal }]}>{categoryCount}</Text>
        </View>
      )}

      {/* Rename */}
      <Pressable
        onPress={() => setInlineEditingGroupID(group.id)}
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 0.55, padding: 6 })}
      >
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.brandTeal} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <Path d="m15 5 4 4" />
        </Svg>
      </Pressable>

      {/* Delete */}
      <Pressable
        onPress={() => onDelete(group.id, group.name)}
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 0.55, padding: 6 })}
      >
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Polyline points="3 6 5 6 21 6" />
          <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </Svg>
      </Pressable>

      {/* Chevron */}
      <Pressable
        onPress={() => onToggle(group.id)}
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 0.6, padding: 8, marginLeft: 2 })}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
      >
        <Svg
          width={18}
          height={18}
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.brandTeal}
          strokeWidth={2.5}
          style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}
        >
          <Path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  handle: { paddingHorizontal: 2 },
  namePressable: { flex: 1 },
  name: { fontSize: 14, fontWeight: "600", letterSpacing: -0.1 },
  renameInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
});
