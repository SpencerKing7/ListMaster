// src/components/CategoryPanel.tsx
// Main content panel showing the checklist items for the selected category.

import { useState } from "react";
import type { JSX } from "react";
import type { Category } from "@/models/types";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { HapticService } from "@/services/hapticService";
import { SwipeableRow } from "./SwipeableRow";
import { AddItemInput } from "./AddItemInput";
import { ChecklistItemRow } from "./ChecklistItemRow";
import { EmptyState } from "./EmptyState";
import { ListMetaBar } from "./ListMetaBar";

interface CategoryPanelProps {
  category: Category | null;
}

// MARK: - Icons (used by EmptyState)

const noGroupIcon = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    style={{ color: "var(--color-brand-teal)" }}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);

const noItemsIcon = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    style={{ color: "var(--color-brand-teal)" }}>
    <line x1="9" y1="6" x2="20" y2="6" />
    <line x1="9" y1="12" x2="20" y2="12" />
    <line x1="9" y1="18" x2="20" y2="18" />
    <polyline points="4 6 5 7 7 5" />
    <polyline points="4 12 5 13 7 11" />
    <polyline points="4 18 5 19 7 17" />
  </svg>
);

// MARK: - Component

/** Displays the selected category's items with add input, sort controls, and
 *  swipeable checklist rows. Shows contextual empty states when appropriate. */
const CategoryPanel = ({ category }: CategoryPanelProps): JSX.Element | null => {
  const store = useCategoriesStore();
  const [tappedId, setTappedId] = useState<string | null>(null);

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
      <div className="flex-1 flex flex-col px-4 pt-2">
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
    <div className="flex-1 flex flex-col min-h-0 px-4 pt-1">
      {/* ── Sticky header: input + sort row ── */}
      <div className="shrink-0 pb-1">
        <AddItemInput />
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
      </div>

      {/* ── Scrollable list ── */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, black 24px, black calc(100% - 32px), transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 24px, black calc(100% - 32px), transparent)",
        }}
      >
        <ul className="flex flex-col gap-2 pt-3 pb-10">
          {sortedItems.map((item) => (
            <SwipeableRow
              key={item.id}
              onDelete={() => store.deleteItemFromSelectedCategory(item.id)}
            >
              <ChecklistItemRow
                item={item}
                isTapped={tappedId === item.id}
                onTap={() => {
                  setTappedId(item.id);
                  setTimeout(() => setTappedId(null), 120);
                  store.toggleItemInSelectedCategory(item.id);
                  HapticService.light();
                }}
              />
            </SwipeableRow>
          ))}
        </ul>
      </div>
    </div>
  );
};

export { CategoryPanel };
