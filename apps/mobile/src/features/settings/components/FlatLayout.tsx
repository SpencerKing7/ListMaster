// src/features/settings/components/FlatLayout.tsx
// Flat category list used when no groups exist.
import { View, StyleSheet } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import type { ComposedGesture, GestureType } from "react-native-gesture-handler";
import type { Category, CatDragState } from "@/models/types";
import { CategoryRow } from "./CategoryRow";

interface FlatLayoutProps {
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
}

/** Flat category list used when no groups exist. */
export function FlatLayout({
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
}: FlatLayoutProps): React.JSX.Element {
  const draggingCatID = catDragState?.groupID === null
    ? (categories[catDragState.flatIdx]?.id ?? null)
    : null;

  return (
    <View style={styles.list}>
      {categories.map((cat, idx) => {
        const isDragging = cat.id === draggingCatID;
        return (
          <CategoryRow
            key={cat.id}
            category={cat}
            flatIdx={idx}
            isDragging={isDragging}
            canDelete={canDeleteCategories}
            variant="flat"
            catGesture={makeCatGesture(idx, categories, categories, null)}
            translateYShared={getCatTranslate(idx)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 6 },
});
