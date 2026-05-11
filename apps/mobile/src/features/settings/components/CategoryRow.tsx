// src/features/settings/components/CategoryRow.tsx
// Draggable category row with inline rename, delete, and optional group-assign.
import { useRef, useEffect } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { GestureDetector } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type { ComposedGesture, GestureType } from "react-native-gesture-handler";
import Svg, { Path, Line, Polyline } from "react-native-svg";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { Category } from "@/models/types";

// MARK: - Props

export interface CategoryRowProps {
  category: Category;
  flatIdx: number;
  isDragging: boolean;
  canDelete: boolean;
  variant: "grouped" | "flat";
  catGesture: ComposedGesture | GestureType;
  translateYShared: SharedValue<number>;
  onRowLayout: (flatIdx: number, height: number) => void;
  inlineEditingCategoryID: string | null;
  setInlineEditingCategoryID: (id: string | null) => void;
  renameCategoryName: string;
  onRenameCategoryNameChange: (v: string) => void;
  saveRenameCategory: () => void;
  onDelete: (id: string, name: string) => void;
  onAssignGroup?: () => void;
}

// MARK: - Component

/** A single draggable category row with inline rename, delete, and assign. */
export function CategoryRow({
  category,
  flatIdx,
  isDragging,
  canDelete,
  variant,
  catGesture,
  translateYShared,
  onRowLayout,
  inlineEditingCategoryID,
  setInlineEditingCategoryID,
  renameCategoryName,
  onRenameCategoryNameChange,
  saveRenameCategory,
  onDelete,
  onAssignGroup,
}: CategoryRowProps): React.JSX.Element {
  const { theme } = useSettingsStore();
  const isEditing = inlineEditingCategoryID === category.id;
  const isFlat = variant === "flat";
  const inputRef = useRef<TextInput>(null);
  const isCancelingRef = useRef(false);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isEditing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateYShared.value },
      { scale: withTiming(isDragging ? 1.02 : 1, { duration: 120 }) },
    ],
    shadowOpacity: withTiming(isDragging ? 0.18 : 0, { duration: 120 }),
  }));

  return (
    <Animated.View
      style={[
        styles.row,
        isFlat && [styles.flatRow, { backgroundColor: `${theme.brandDeepGreen}12` }],
        {
          zIndex: isDragging ? 10 : 0,
          elevation: isDragging ? 8 : 0,
          shadowColor: "#000",
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        },
        animatedStyle,
      ]}
    >
      {/* Layout probe — plain View so onLayout never enters a Reanimated worklet */}
      <View
        style={StyleSheet.absoluteFill}
        onLayout={(e) => onRowLayout(flatIdx, e.nativeEvent.layout.height)}
        pointerEvents="none"
      />
      {/* Drag handle */}
      <GestureDetector gesture={catGesture}>
        <View style={styles.handle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.brandTeal} strokeWidth={2.5}>
            <Line x1={4} y1={7} x2={20} y2={7} />
            <Line x1={4} y1={12} x2={20} y2={12} />
            <Line x1={4} y1={17} x2={20} y2={17} />
          </Svg>
        </View>
      </GestureDetector>

      {/* Name or inline rename input */}
      {isEditing ? (
        <TextInput
          ref={inputRef}
          value={renameCategoryName}
          onChangeText={onRenameCategoryNameChange}
          onBlur={() => {
            if (!isCancelingRef.current) saveRenameCategory();
            isCancelingRef.current = false;
            setInlineEditingCategoryID(null);
          }}
          onSubmitEditing={() => {
            saveRenameCategory();
            setInlineEditingCategoryID(null);
          }}
          returnKeyType="done"
          autoCapitalize="words"
          style={[
            styles.renameInput,
            {
              color: theme.textPrimary,
              backgroundColor: theme.surfaceInput,
              borderColor: theme.borderSubtle,
            },
          ]}
        />
      ) : (
        <Text
          style={[
            styles.name,
            { color: theme.textPrimary, fontWeight: isFlat ? "500" : "400" },
          ]}
          numberOfLines={1}
        >
          {category.name}
        </Text>
      )}

      {/* Assign chip */}
      {onAssignGroup !== undefined && !isEditing && (
        <Pressable
          onPress={onAssignGroup}
          style={({ pressed }) => [
            styles.assignChip,
            { backgroundColor: `${theme.brandTeal}1f`, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.assignText, { color: theme.brandTeal }]}>+ Assign</Text>
        </Pressable>
      )}

      {/* Rename button */}
      <Pressable
        onPress={() => setInlineEditingCategoryID(category.id)}
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 0.55, padding: 6 })}
      >
        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={theme.brandTeal} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <Path d="m15 5 4 4" />
        </Svg>
      </Pressable>

      {/* Delete button */}
      <Pressable
        onPress={() => onDelete(category.id, category.name)}
        disabled={!canDelete}
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : canDelete ? 0.55 : 0.2, padding: 6 })}
      >
        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={theme.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Polyline points="3 6 5 6 21 6" />
          <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </Svg>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
  },
  flatRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  handle: {
    paddingHorizontal: 4,
  },
  name: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  renameInput: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  assignChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  assignText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
