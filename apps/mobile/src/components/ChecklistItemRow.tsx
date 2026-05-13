// src/components/ChecklistItemRow.tsx — Single checklist item row with tap animation and edit/delete buttons.
import { View, Text, Pressable, StyleSheet } from "react-native";
import Svg, { Circle, Polyline, Path } from "react-native-svg";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { ChecklistItem } from "@/models/types";

interface ChecklistItemRowProps {
  item: ChecklistItem;
  isTapped: boolean;
  onTap: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** Renders one checklist row with circle/checkmark icon, item name, and inline edit/delete buttons. */
export function ChecklistItemRow({ item, isTapped, onTap, onEdit, onDelete }: ChecklistItemRowProps) {
  const { theme, textSizeSp, rowPaddingY } = useSettingsStore();

  const bgColor = item.isChecked
    ? `rgba(26,94,75,0.08)`
    : theme.surfaceCard;

  const borderColor = item.isChecked ? "transparent" : theme.borderSubtle;

  return (
    <Pressable
      onPress={onTap}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: bgColor,
          borderColor,
          paddingVertical: rowPaddingY,
          opacity: isTapped || pressed ? 0.8 : 1,
          transform: [{ scale: isTapped ? 0.97 : 1 }],
        },
      ]}
    >
      {/* Circle / Checkmark icon */}
      {item.isChecked ? (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx={12} cy={12} r={10} fill={theme.brandGreen} />
          <Polyline points="9,12 11,14 15,10" stroke="white" strokeWidth={2.2} />
        </Svg>
      ) : (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx={12} cy={12} r={10} stroke={theme.brandTeal} strokeOpacity={0.6} />
        </Svg>
      )}

      {/* Item name */}
      <Text
        style={[
          styles.name,
          {
            fontSize: textSizeSp,
            color: item.isChecked ? theme.textSecondary : theme.textPrimary,
            fontWeight: item.isChecked ? "400" : "500",
            textDecorationLine: item.isChecked ? "line-through" : "none",
          },
        ]}
        numberOfLines={2}
      >
        {item.name}
      </Text>

      {/* Edit button */}
      <Pressable
        onPress={(e) => { e.stopPropagation(); onEdit(); }}
        style={({ pressed }) => [styles.actionButton, { opacity: pressed ? 0.9 : 0.5, transform: [{ scale: pressed ? 0.9 : 1 }] }]}
        hitSlop={8}
      >
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.brandTeal} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <Path d="m15 5 4 4" />
        </Svg>
      </Pressable>

      {/* Delete button */}
      <Pressable
        onPress={(e) => { e.stopPropagation(); onDelete(); }}
        style={({ pressed }) => [styles.actionButton, { opacity: pressed ? 0.9 : 0.5, transform: [{ scale: pressed ? 0.9 : 1 }] }]}
        hitSlop={8}
      >
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Polyline points="3,6 5,6 21,6" />
          <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </Svg>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  name: {
    flex: 1,
  },
  actionButton: {
    padding: 6,
    borderRadius: 8,
  },
});
