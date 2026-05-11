// src/features/settings/components/CategoriesGroupsSection.tsx
// Categories & Groups settings card with drag-to-reorder, inline rename, and add/delete.
import { useState } from "react";
import { Text, StyleSheet } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import type { ComposedGesture, GestureType } from "react-native-gesture-handler";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import type { Category, CategoryGroup } from "@/models/types";
import type { CatDragState } from "@/features/settings/hooks/useCategoryDrag";
import type { GroupDragState } from "@/features/settings/hooks/useGroupDrag";
import { SettingsCard } from "./SettingsCard";
import { SectionLabel } from "./SectionLabel";
import { GroupsMapSection } from "./GroupsMapSection";
import { UngroupedSection } from "./UngroupedSection";
import { FlatLayout } from "./FlatLayout";
import { AddButtons } from "./AddButtons";
import { AddCategoryDialog } from "./AddCategoryDialog";
import { AddGroupDialog } from "./AddGroupDialog";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";
import { DeleteGroupDialog } from "./DeleteGroupDialog";
import { GroupAssignmentSheet } from "./GroupAssignmentSheet";

// MARK: - Props

interface CategoriesGroupsSectionProps {
  categories: Category[];
  groups: CategoryGroup[];
  catDragState: CatDragState | null;
  groupDragState: GroupDragState | null;
  makeCatGesture: (
    visualIdx: number,
    scopedCategories: Category[],
    allCategories: Category[],
    groupID: string | null,
  ) => ComposedGesture | GestureType;
  getCatTranslate: (flatIdx: number) => SharedValue<number>;
  makeGroupGesture: (idx: number) => ComposedGesture | GestureType;
  getGroupTranslate: (idx: number) => SharedValue<number>;
  onRowLayout: (flatIdx: number, height: number) => void;
  onGroupRowLayout: (idx: number, height: number) => void;
  expandedGroupIDs: Set<string>;
  toggleGroup: (groupID: string) => void;
}

// MARK: - Component

/** The "Categories & Groups" settings card with full CRUD and drag-to-reorder. */
export function CategoriesGroupsSection({
  categories,
  groups,
  catDragState,
  groupDragState,
  makeCatGesture,
  getCatTranslate,
  makeGroupGesture,
  getGroupTranslate,
  onRowLayout,
  onGroupRowLayout,
  expandedGroupIDs,
  toggleGroup,
}: CategoriesGroupsSectionProps): React.JSX.Element {
  const { theme } = useSettingsStore();
  const { addCategory, addCategoryWithGroup, addGroup, renameCategory, renameGroup, deleteCategory, deleteGroup, setCategoryGroup } = useCategoriesStore();
  const canDeleteCategories = categories.length > 1;

  // ── Inline rename ──
  const [inlineEditingCategoryID, setInlineEditingCategoryID] = useState<string | null>(null);
  const [renameCategoryName, setRenameCategoryName] = useState("");
  const [inlineEditingGroupID, setInlineEditingGroupID] = useState<string | null>(null);
  const [renameGroupName, setRenameGroupName] = useState("");

  // ── Add dialogs ──
  const [addMode, setAddMode] = useState<"category" | "group" | null>(null);
  const [addCategoryName, setAddCategoryName] = useState("");
  const [addCategoryGroupID, setAddCategoryGroupID] = useState<string | null>(null);
  const [addGroupName, setAddGroupName] = useState("");

  // ── Delete dialogs ──
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<{ id: string; name: string } | null>(null);

  // ── Group assignment sheet ──
  const [assigningCategory, setAssigningCategory] = useState<{ id: string; name: string } | null>(null);

  // ── Duplicate check ──
  const isDuplicate = categories.some(
    (c) =>
      c.name.toLowerCase() === addCategoryName.trim().toLowerCase() &&
      (addCategoryGroupID ? c.groupID === addCategoryGroupID : !c.groupID),
  );

  function saveRenameCategory(): void {
    if (!inlineEditingCategoryID || !renameCategoryName.trim()) return;
    renameCategory(inlineEditingCategoryID, renameCategoryName.trim());
  }

  function saveRenameGroup(): void {
    if (!inlineEditingGroupID || !renameGroupName.trim()) return;
    renameGroup(inlineEditingGroupID, renameGroupName.trim());
  }

  function handleSetInlineEditingCategoryID(id: string | null): void {
    setInlineEditingCategoryID(id);
    if (id) setRenameCategoryName(categories.find((c) => c.id === id)?.name ?? "");
  }

  function handleSetInlineEditingGroupID(id: string | null): void {
    setInlineEditingGroupID(id);
    if (id) setRenameGroupName(groups.find((g) => g.id === id)?.name ?? "");
  }

  function handleAddCategoryConfirm(): void {
    if (!addCategoryName.trim() || isDuplicate) return;
    if (addCategoryGroupID) {
      addCategoryWithGroup(addCategoryName.trim(), addCategoryGroupID);
    } else {
      addCategory(addCategoryName.trim());
    }
    setAddMode(null);
    setAddCategoryName("");
    setAddCategoryGroupID(null);
  }

  function handleAddGroupConfirm(): void {
    if (!addGroupName.trim()) return;
    addGroup(addGroupName.trim());
    setAddMode(null);
    setAddGroupName("");
  }

  return (
    <>
      <SettingsCard>
        <SectionLabel>Categories &amp; Groups</SectionLabel>

        {groups.length === 0 && (
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            Categories live inside groups. Create groups to organize your lists.
          </Text>
        )}

        {groups.length > 0 ? (
          <>
            <GroupsMapSection
              groups={groups}
              categories={categories}
              canDeleteCategories={canDeleteCategories}
              groupDragState={groupDragState}
              catDragState={catDragState}
              makeGroupGesture={makeGroupGesture}
              getGroupTranslate={getGroupTranslate}
              onGroupRowLayout={onGroupRowLayout}
              makeCatGesture={makeCatGesture}
              getCatTranslate={getCatTranslate}
              onRowLayout={onRowLayout}
              expandedGroupIDs={expandedGroupIDs}
              toggleGroup={toggleGroup}
              inlineEditingCategoryID={inlineEditingCategoryID}
              setInlineEditingCategoryID={handleSetInlineEditingCategoryID}
              renameCategoryName={renameCategoryName}
              onRenameCategoryNameChange={setRenameCategoryName}
              saveRenameCategory={saveRenameCategory}
              onDeleteCategory={(id, name) => setCategoryToDelete({ id, name })}
              inlineEditingGroupID={inlineEditingGroupID}
              setInlineEditingGroupID={handleSetInlineEditingGroupID}
              renameGroupName={renameGroupName}
              onRenameGroupNameChange={setRenameGroupName}
              saveRenameGroup={saveRenameGroup}
              onDeleteGroup={(id, name) => setGroupToDelete({ id, name })}
              onAddCategoryInGroup={(gid) => { setAddMode("category"); setAddCategoryGroupID(gid); }}
            />
            <UngroupedSection
              categories={categories}
              catDragState={catDragState}
              canDeleteCategories={canDeleteCategories}
              makeCatGesture={makeCatGesture}
              getCatTranslate={getCatTranslate}
              onRowLayout={onRowLayout}
              inlineEditingCategoryID={inlineEditingCategoryID}
              setInlineEditingCategoryID={handleSetInlineEditingCategoryID}
              renameCategoryName={renameCategoryName}
              onRenameCategoryNameChange={setRenameCategoryName}
              saveRenameCategory={saveRenameCategory}
              onDeleteCategory={(id, name) => setCategoryToDelete({ id, name })}
              onAssignGroup={(id, name) => setAssigningCategory({ id, name })}
            />
          </>
        ) : (
          <FlatLayout
            categories={categories}
            catDragState={catDragState}
            canDeleteCategories={canDeleteCategories}
            makeCatGesture={makeCatGesture}
            getCatTranslate={getCatTranslate}
            onRowLayout={onRowLayout}
            inlineEditingCategoryID={inlineEditingCategoryID}
            setInlineEditingCategoryID={handleSetInlineEditingCategoryID}
            renameCategoryName={renameCategoryName}
            onRenameCategoryNameChange={setRenameCategoryName}
            saveRenameCategory={saveRenameCategory}
            onDeleteCategory={(id, name) => setCategoryToDelete({ id, name })}
          />
        )}

        {!canDeleteCategories && (
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            At least one category is required.
          </Text>
        )}

        <AddButtons onAddCategory={() => setAddMode("category")} onAddGroup={() => setAddMode("group")} />
      </SettingsCard>

      <AddCategoryDialog
        isOpen={addMode === "category"}
        isDuplicate={isDuplicate}
        categoryName={addCategoryName}
        onNameChange={setAddCategoryName}
        selectedGroupID={addCategoryGroupID}
        onGroupChange={setAddCategoryGroupID}
        onConfirm={handleAddCategoryConfirm}
        onClose={() => { setAddMode(null); setAddCategoryName(""); setAddCategoryGroupID(null); }}
        groups={groups}
      />
      <AddGroupDialog
        isOpen={addMode === "group"}
        groupName={addGroupName}
        onNameChange={setAddGroupName}
        onConfirm={handleAddGroupConfirm}
        onClose={() => { setAddMode(null); setAddGroupName(""); }}
      />
      <DeleteCategoryDialog
        categoryToDelete={categoryToDelete}
        onConfirm={() => { if (categoryToDelete) { deleteCategory(categoryToDelete.id); setCategoryToDelete(null); } }}
        onClose={() => setCategoryToDelete(null)}
      />
      <DeleteGroupDialog
        groupToDelete={groupToDelete}
        onConfirm={() => { if (groupToDelete) { deleteGroup(groupToDelete.id); setGroupToDelete(null); } }}
        onClose={() => setGroupToDelete(null)}
      />
      <GroupAssignmentSheet
        isOpen={assigningCategory !== null}
        selectedCategory={assigningCategory}
        groups={groups}
        onAssign={(gid) => { if (assigningCategory) setCategoryGroup(assigningCategory.id, gid ?? undefined); }}
        onClose={() => setAssigningCategory(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 12, lineHeight: 18 },
});
