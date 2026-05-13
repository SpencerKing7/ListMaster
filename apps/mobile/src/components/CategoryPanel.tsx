// src/components/CategoryPanel.tsx — Main content panel showing checklist items for the selected category.
import { useState, useRef, useEffect } from "react";
import { View, FlatList, Text, StyleSheet } from "react-native";
import Svg, { Path, Rect, Line } from "react-native-svg";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { HapticService } from "@/services/hapticService";
import { AddItemInput } from "@/components/AddItemInput";
import { ChecklistItemRow } from "@/components/ChecklistItemRow";
import { EmptyState } from "@/components/EmptyState";
import { ListMetaBar } from "@/components/ListMetaBar";
import { RenameItemDialog } from "@/components/RenameItemDialog";
import type { ChecklistItem } from "@/models/types";

// MARK: - Component

/** Displays the selected category's items with add input, sort controls, and delete buttons. */
export function CategoryPanel() {
  const { theme } = useSettingsStore();

  const noGroupIcon = (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={theme.brandGreen} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </Svg>
  );

  const noItemsIcon = (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={theme.brandGreen} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={3} width={18} height={18} rx={2} ry={2} />
      <Line x1={3} y1={9} x2={21} y2={9} />
      <Line x1={9} y1={21} x2={9} y2={9} />
    </Svg>
  );
  const store = useCategoriesStore();
  const category = store.selectedCategory;

  const [tappedId, setTappedId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string } | null>(null);
  const [editName, setEditName] = useState("");
  const prevItemsLengthRef = useRef<number>(category?.items.length ?? 0);

  useEffect(() => {
    prevItemsLengthRef.current = category?.items.length ?? 0;
  });

  const justAddedFirstItem =
    prevItemsLengthRef.current === 0 && (category?.items.length ?? 0) > 0;

  // MARK: - Empty states

  if (!category) {
    if (store.hasGroups && store.categoriesInSelectedGroup.length === 0) {
      return (
        <EmptyState
          icon={noGroupIcon}
          title="No lists in this group"
          subtitle="Assign lists to this group in Settings."
        />
      );
    }
    return <View style={{ flex: 1 }} />;
  }

  if (category.items.length === 0) {
    return (
      <View style={[styles.emptyWithInput, { backgroundColor: theme.surfaceBackground }]}>
        <AddItemInput />
        <EmptyState
          icon={noItemsIcon}
          title="No items yet"
          subtitle="Add your first item above."
        />
      </View>
    );
  }

  // MARK: - Sort logic

  const sortOrder = category.sortOrder ?? "date";
  const sortDirection = category.sortDirection ?? "asc";

  const sortedItems = [...category.items].sort((a, b) => {
    if (a.isChecked !== b.isChecked) return a.isChecked ? 1 : -1;
    let cmp: number;
    if (sortOrder === "alpha") {
      cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    } else {
      cmp = (a.createdAt ?? 0) - (b.createdAt ?? 0);
    }
    return sortDirection === "desc" ? -cmp : cmp;
  });

  const uncheckedCount = sortedItems.filter(i => !i.isChecked).length;
  const allChecked = uncheckedCount === 0;

  function renderItem({ item }: { item: ChecklistItem }) {
    return (
      <ChecklistItemRow
        key={item.id}
        item={item}
        isTapped={tappedId === item.id}
        onTap={() => {
          setTappedId(item.id);
          setTimeout(() => setTappedId(null), 120);
          store.toggleItemInSelectedCategory(item.id);
          HapticService.light();
        }}
        onEdit={() => {
          setEditingItem({ id: item.id, name: item.name });
          setEditName(item.name);
        }}
        onDelete={() => {
          store.deleteItemFromSelectedCategory(item.id);
          HapticService.medium();
        }}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceBackground }]}>
      {/* Sticky header: sort row + add input */}
      <View style={styles.header}>
        <ListMetaBar
          itemCount={sortedItems.length}
          allChecked={allChecked}
          sortOrder={sortOrder}
          sortDirection={sortDirection}
          onCheckAll={() => store.checkAllItemsInSelectedCategory()}
          onUncheckAll={() => store.uncheckAllItemsInSelectedCategory()}
          onChangeSortOrder={(next) => store.setCategorySortOrder(category.id, next)}
          onChangeSortDirection={(next) => store.setCategorySortDirection(category.id, next)}
        />
        <View style={styles.inputWrapper}>
          <AddItemInput focusOnMount={justAddedFirstItem} />
        </View>
      </View>

      {/* Scrollable list */}
      <FlatList
        data={sortedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <RenameItemDialog
        itemToRename={editingItem}
        value={editName}
        onValueChange={setEditName}
        onSave={() => {
          if (editingItem && editName.trim().length > 0) {
            store.renameItemInSelectedCategory(editingItem.id, editName.trim());
            HapticService.light();
          }
          setEditingItem(null);
          setEditName("");
        }}
        onClose={() => {
          setEditingItem(null);
          setEditName("");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  emptyWithInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  header: {
    paddingBottom: 4,
  },
  inputWrapper: {
    marginTop: 8,
  },
  list: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  separator: {
    height: 6,
  },
});
