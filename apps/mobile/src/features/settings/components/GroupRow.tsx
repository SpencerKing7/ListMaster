// src/features/settings/components/GroupRow.tsx
// A collapsible group row: header + expandable category sub-list.
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import type { ComposedGesture, GestureType } from "react-native-gesture-handler";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { Category, CategoryGroup, CatDragState } from "@/models/types";
import { GroupRowHeader } from "./GroupRowHeader";
import { GroupCategoryList } from "./GroupCategoryList";

interface GroupRowProps {
  group: CategoryGroup;
  groupVisualIdx: number;
  isExpanded: boolean;
  isGroupDragging: boolean;
  translateYShared: SharedValue<number>;
  groupCategories: Category[];
  categories: Category[];
  catDragState: CatDragState | null;
  canDeleteCategories: boolean;
  makeGroupGesture: (idx: number) => ComposedGesture | GestureType;
  onGroupRowLayout: (idx: number, height: number) => void;
  makeCatGesture: (
    visualIdx: number,
    scopedCategories: Category[],
    allCategories: Category[],
    groupID: string | null,
  ) => ComposedGesture | GestureType;
  getCatTranslate: (flatIdx: number) => SharedValue<number>;
  onRowLayout: (flatIdx: number, height: number) => void;
  toggleGroup: (groupID: string) => void;
  inlineEditingCategoryID: string | null;
  setInlineEditingCategoryID: (id: string | null) => void;
  renameCategoryName: string;
  onRenameCategoryNameChange: (v: string) => void;
  saveRenameCategory: () => void;
  onDeleteCategory: (id: string, name: string) => void;
  inlineEditingGroupID: string | null;
  setInlineEditingGroupID: (id: string | null) => void;
  renameGroupName: string;
  onRenameGroupNameChange: (v: string) => void;
  saveRenameGroup: () => void;
  onDeleteGroup: (id: string, name: string) => void;
  onAddCategory?: () => void;
}

/** A single collapsible group with its category sub-list. */
export function GroupRow({
  group,
  groupVisualIdx,
  isExpanded,
  isGroupDragging,
  translateYShared,
  groupCategories,
  categories,
  catDragState,
  canDeleteCategories,
  makeGroupGesture,
  onGroupRowLayout,
  makeCatGesture,
  getCatTranslate,
  onRowLayout,
  toggleGroup,
  inlineEditingCategoryID,
  setInlineEditingCategoryID,
  renameCategoryName,
  onRenameCategoryNameChange,
  saveRenameCategory,
  onDeleteCategory,
  inlineEditingGroupID,
  setInlineEditingGroupID,
  renameGroupName,
  onRenameGroupNameChange,
  saveRenameGroup,
  onDeleteGroup,
  onAddCategory,
}: GroupRowProps): React.JSX.Element {
  const { theme } = useSettingsStore();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateYShared.value },
      { scale: withTiming(isGroupDragging ? 1.01 : 1, { duration: 120 }) },
    ],
    shadowOpacity: withTiming(isGroupDragging ? 0.22 : 0, { duration: 120 }),
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderColor: `${theme.brandDeepGreen}26`,
          zIndex: isGroupDragging ? 10 : 0,
          elevation: isGroupDragging ? 8 : 0,
          shadowColor: "#000",
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        },
        animatedStyle,
      ]}
    >
      <GroupRowHeader
        group={group}
        groupVisualIdx={groupVisualIdx}
        isExpanded={isExpanded}
        categoryCount={groupCategories.length}
        groupGesture={makeGroupGesture(groupVisualIdx)}
        onGroupRowLayout={onGroupRowLayout}
        onToggle={toggleGroup}
        inlineEditingGroupID={inlineEditingGroupID}
        setInlineEditingGroupID={setInlineEditingGroupID}
        renameGroupName={renameGroupName}
        onRenameGroupNameChange={onRenameGroupNameChange}
        saveRenameGroup={saveRenameGroup}
        onDelete={onDeleteGroup}
      />
      <GroupCategoryList
        groupID={group.id}
        isExpanded={isExpanded}
        groupCategories={groupCategories}
        categories={categories}
        catDragState={catDragState}
        canDeleteCategories={canDeleteCategories}
        makeCatGesture={makeCatGesture}
        getCatTranslate={getCatTranslate}
        onRowLayout={onRowLayout}
        inlineEditingCategoryID={inlineEditingCategoryID}
        setInlineEditingCategoryID={setInlineEditingCategoryID}
        renameCategoryName={renameCategoryName}
        onRenameCategoryNameChange={onRenameCategoryNameChange}
        saveRenameCategory={saveRenameCategory}
        onDeleteCategory={onDeleteCategory}
        onAddCategory={onAddCategory}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
  },
});
