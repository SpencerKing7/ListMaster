// src/features/settings/components/GroupCategoryList.tsx
// Collapsible category sub-list inside a GroupRow.
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import type { ComposedGesture, GestureType } from "react-native-gesture-handler";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { Category, CatDragState } from "@/models/types";
import { CategoryRow } from "./CategoryRow";

interface GroupCategoryListProps {
  groupID: string;
  isExpanded: boolean;
  groupCategories: Category[];
  categories: Category[];
  catDragState: CatDragState | null;
  canDeleteCategories: boolean;
  makeCatGesture: (
    visualIdx: number,
    scopedCategories: Category[],
    allCategories: Category[],
    groupID: string | null,
  ) => ComposedGesture | GestureType;
  getCatTranslate: (flatIdx: number) => SharedValue<number>;
  onRowLayout: (flatIdx: number, height: number) => void;
  inlineEditingCategoryID: string | null;
  setInlineEditingCategoryID: (id: string | null) => void;
  renameCategoryName: string;
  onRenameCategoryNameChange: (v: string) => void;
  saveRenameCategory: () => void;
  onDeleteCategory: (id: string, name: string) => void;
  onAddCategory?: () => void;
}

/** Collapsible category sub-list with a teal left accent bar. */
export function GroupCategoryList({
  groupID,
  isExpanded,
  groupCategories,
  categories,
  catDragState,
  canDeleteCategories,
  makeCatGesture,
  getCatTranslate,
  onRowLayout,
  inlineEditingCategoryID,
  setInlineEditingCategoryID,
  renameCategoryName,
  onRenameCategoryNameChange,
  saveRenameCategory,
  onDeleteCategory,
  onAddCategory,
}: GroupCategoryListProps): React.JSX.Element | null {
  const { theme } = useSettingsStore();
  if (!isExpanded) return null;

  const draggingCatID = catDragState?.groupID === groupID
    ? (categories[catDragState.flatIdx]?.id ?? null)
    : null;

  return (
    <View style={[styles.container, { backgroundColor: `${theme.brandDeepGreen}0d` }]}>
      <View style={[styles.accentBar, { backgroundColor: `${theme.brandTeal}59` }]} />
      <View style={styles.inner}>
        {groupCategories.map((cat, visualIdx) => {
          const flatIdx = categories.indexOf(cat);
          const isDragging = cat.id === draggingCatID;
          return (
            <CategoryRow
              key={cat.id}
              category={cat}
              flatIdx={flatIdx}
              isDragging={isDragging}
              canDelete={canDeleteCategories}
              variant="grouped"
              catGesture={makeCatGesture(visualIdx, groupCategories, categories, groupID)}
              translateYShared={getCatTranslate(flatIdx)}
              onRowLayout={onRowLayout}
              inlineEditingCategoryID={inlineEditingCategoryID}
              setInlineEditingCategoryID={setInlineEditingCategoryID}
              renameCategoryName={renameCategoryName}
              onRenameCategoryNameChange={onRenameCategoryNameChange}
              saveRenameCategory={saveRenameCategory}
              onDelete={onDeleteCategory}
            />
          );
        })}
        {groupCategories.length === 0 && (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>No categories yet</Text>
        )}
        {onAddCategory && (
          <Pressable onPress={onAddCategory} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={[styles.addCat, { color: theme.brandGreen }]}>+ Add category</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "relative" },
  accentBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderRadius: 2 },
  inner: { paddingLeft: 28, paddingRight: 8, paddingVertical: 6, gap: 2 },
  empty: { fontSize: 12, paddingVertical: 8, paddingLeft: 4 },
  addCat: { fontSize: 12, paddingVertical: 8, paddingLeft: 4 },
});
