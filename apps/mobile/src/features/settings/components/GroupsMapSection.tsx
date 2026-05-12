// src/features/settings/components/GroupsMapSection.tsx
// Drag-sortable list of group rows inside the "Categories & Groups" settings card.
import { View, StyleSheet } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import type { ComposedGesture, GestureType } from "react-native-gesture-handler";
import type { Category, CategoryGroup, CatDragState, GroupDragState } from "@/models/types";
import { GroupRow } from "./GroupRow";

interface GroupsMapSectionProps {
  groups: CategoryGroup[];
  categories: Category[];
  canDeleteCategories: boolean;
  groupDragState: GroupDragState | null;
  catDragState: CatDragState | null;
  makeGroupGesture: (idx: number) => ComposedGesture | GestureType;
  getGroupTranslate: (idx: number) => SharedValue<number>;
  onGroupRowLayout: (idx: number, height: number) => void;
  makeCatGesture: (
    visualIdx: number,
    scopedCategories: Category[],
    allCategories: Category[],
    groupID: string | null,
  ) => ComposedGesture | GestureType;
  getCatTranslate: (flatIdx: number) => SharedValue<number>;
  onRowLayout: (flatIdx: number, height: number) => void;
  expandedGroupIDs: Set<string>;
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
  onAddCategoryInGroup?: (groupID: string) => void;
}

/** Drag-sortable list of collapsible group rows. */
export function GroupsMapSection({
  groups,
  categories,
  canDeleteCategories,
  groupDragState,
  catDragState,
  makeGroupGesture,
  getGroupTranslate,
  onGroupRowLayout,
  makeCatGesture,
  getCatTranslate,
  onRowLayout,
  expandedGroupIDs,
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
  onAddCategoryInGroup,
}: GroupsMapSectionProps): React.JSX.Element {
  const draggingGroupID = groupDragState ? groups[groupDragState.idx]?.id : null;

  return (
    <View style={styles.container}>
      {groups.map((group, groupVisualIdx) => {
        const isExpanded = expandedGroupIDs.has(group.id);
        const groupCategories = categories.filter((c) => c.groupID === group.id);
        const isGroupDragging = group.id === draggingGroupID;

        return (
          <GroupRow
            key={group.id}
            group={group}
            groupVisualIdx={groupVisualIdx}
            isExpanded={isExpanded}
            isGroupDragging={isGroupDragging}
            translateYShared={getGroupTranslate(groupVisualIdx)}
            groupCategories={groupCategories}
            categories={categories}
            catDragState={catDragState}
            canDeleteCategories={canDeleteCategories}
            makeGroupGesture={makeGroupGesture}
            onGroupRowLayout={onGroupRowLayout}
            makeCatGesture={makeCatGesture}
            getCatTranslate={getCatTranslate}
            onRowLayout={onRowLayout}
            toggleGroup={toggleGroup}
            inlineEditingCategoryID={inlineEditingCategoryID}
            setInlineEditingCategoryID={setInlineEditingCategoryID}
            renameCategoryName={renameCategoryName}
            onRenameCategoryNameChange={onRenameCategoryNameChange}
            saveRenameCategory={saveRenameCategory}
            onDeleteCategory={onDeleteCategory}
            inlineEditingGroupID={inlineEditingGroupID}
            setInlineEditingGroupID={setInlineEditingGroupID}
            renameGroupName={renameGroupName}
            onRenameGroupNameChange={onRenameGroupNameChange}
            saveRenameGroup={saveRenameGroup}
            onDeleteGroup={onDeleteGroup}
            onAddCategory={onAddCategoryInGroup ? () => onAddCategoryInGroup(group.id) : undefined}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
});
