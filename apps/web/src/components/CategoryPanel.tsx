// src/components/CategoryPanel.tsx
// Main content panel showing the checklist items for the selected category.

import { useState, useRef, useEffect } from "react";
import type { JSX } from "react";
import type { Category } from "@/models/types";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { HapticService } from "@/services/hapticService";
import { AddItemInput } from "./AddItemInput";
import { ChecklistItemRow } from "./ChecklistItemRow";
import { EmptyState } from "./EmptyState";
import { ListMetaBar } from "./ListMetaBar";
import { RenameItemDialog } from "./RenameItemDialog";
import { noGroupIcon, noItemsIcon } from "./CategoryPanelIcons";

/** Props for the {@link CategoryPanel} component. */
interface CategoryPanelProps {
  /** The selected category to display, or `null` when none is selected. */
  category: Category | null;
  /** Ref forwarded to the scrollable list container for scroll-position tracking. */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

// MARK: - Component

/** Displays the selected category's items with add input, sort controls, and
 *  checklist rows with inline edit/delete actions. Shows contextual empty states when appropriate. */
export function CategoryPanel({ category, scrollContainerRef }: CategoryPanelProps): JSX.Element | null {
  const store = useCategoriesStore();
  const [tappedId, setTappedId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string } | null>(null);
  const [editName, setEditName] = useState("");
  const prevItemsLengthRef = useRef<number>(category?.items.length ?? 0);

  useEffect(() => {
    prevItemsLengthRef.current = category?.items.length ?? 0;
  });

  const justAddedFirstItem =
    prevItemsLengthRef.current === 0 && (category?.items.length ?? 0) > 0;

  // ── Empty states ──

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
    return <div className="flex-1" />;
  }

  if (category.items.length === 0) {
    return (
      <div className="flex-1 flex flex-col px-3 pt-2">
        <AddItemInput />
        <EmptyState
          icon={noItemsIcon}
          title="No items yet"
          subtitle="Add your first item above."
        />
      </div>
    );
  }

  // ── Sort logic ──

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

  const uncheckedItems = sortedItems.filter((item) => !item.isChecked);
  const allChecked = uncheckedItems.length === 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 px-3 pt-0">
      {/* ── Sticky header: sort row + add input ── */}
      <div className="shrink-0 pb-1">
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
        <div className="mt-2">
          <AddItemInput focusOnMount={justAddedFirstItem} />
        </div>
      </div>

      {/* ── Scrollable list ── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, black 12px, black calc(100% - 16px), transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 12px, black calc(100% - 16px), transparent)",
        }}
      >
        <ul className="flex flex-col gap-1.5 pt-3 pb-4">
          {sortedItems.map((item) => (
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
          ))}
        </ul>
      </div>

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
    </div>
  );
};


