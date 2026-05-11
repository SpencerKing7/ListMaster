// src/features/settings/components/UngroupedSection.tsx
// Ungrouped categories below group sections, with "Assign" chip per row.
import { View, Text, StyleSheet } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import type { ComposedGesture, GestureType } from "react-native-gesture-handler";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { Category, CatDragState } from "@/models/types";
import { CategoryRow } from "./CategoryRow";

interface UngroupedSectionProps {
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
  onAssignGroup: (categoryId: string, categoryName: string) => void;
}

/** Renders ungrouped categories with drag handles and an "Assign" chip. */
export function UngroupedSection({
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
  onAssignGroup,
}: UngroupedSectionProps): React.JSX.Element | null {
  const { theme } = useSettingsStore();
  const ungrouped = categories.filter((c) => !c.groupID);
  if (ungrouped.length === 0) return null;

  const draggingCatID = catDragState?.groupID === null
    ? (categories[catDragState.flatIdx]?.id ?? null)
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={[styles.line, { backgroundColor: theme.textSecondary }]} />
        <Text style={[styles.label, { color: theme.textSecondary }]}>NO GROUP</Text>
        <View style={[styles.line, { backgroundColor: theme.textSecondary }]} />
      </View>
      <View style={styles.list}>
        {ungrouped.map((cat, visualIdx) => {
          const flatIdx = categories.indexOf(cat);
          const isDragging = cat.id === draggingCatID;
          return (
            <CategoryRow
              key={cat.id}
              category={cat}
              flatIdx={flatIdx}
              isDragging={isDragging}
              canDelete={canDeleteCategories}
              variant="flat"
              catGesture={makeCatGesture(visualIdx, ungrouped, categories, null)}
              translateYShared={getCatTranslate(flatIdx)}
              onRowLayout={onRowLayout}
              inlineEditingCategoryID={inlineEditingCategoryID}
              setInlineEditingCategoryID={setInlineEditingCategoryID}
              renameCategoryName={renameCategoryName}
              onRenameCategoryNameChange={onRenameCategoryNameChange}
              saveRenameCategory={saveRenameCategory}
              onDelete={onDeleteCategory}
              onAssignGroup={() => onAssignGroup(cat.id, cat.name)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  line: { flex: 1, height: 1, opacity: 0.2 },
  label: { fontSize: 10, fontWeight: "600", letterSpacing: 1, opacity: 0.5 },
  list: { gap: 4 },
});
