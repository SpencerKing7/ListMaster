// src/components/CategoryPanel.tsx
import { useState, useEffect, useRef } from "react";
import type { Category } from "@/models/types";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { HapticService } from "@/services/hapticService";
import SwipeableRow from "./SwipeableRow";

interface CategoryPanelProps {
  category: Category | null;
}

// MARK: - Add Item Input

/** Inline input row for adding new items. Lives inside the scrollable list
 *  so the iOS keyboard scrolls it into view naturally — no position:fixed hacks. */
const AddItemInput = () => {
  const store = useCategoriesStore();
  const [newItemName, setNewItemName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmedName = newItemName.trim();

  function addItem() {
    if (!trimmedName || !store.selectedCategory) return;
    store.addItemToSelectedCategory(trimmedName);
    setNewItemName("");
    HapticService.light();
    // Blur then refocus so iOS resets the keyboard shift state (auto-capitalize)
    inputRef.current?.blur();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="px-1">
      <div
        className="flex items-center h-12 rounded-[16px] px-4 gap-2"
        style={{
          backgroundColor: "var(--color-surface-card)",
          boxShadow: "var(--elevation-card)",
        }}
      >
        <input
          ref={inputRef}
          placeholder="Add an item"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          className="flex-1 bg-transparent font-medium outline-none placeholder:opacity-40"
          style={{
            color: "var(--color-text-primary)",
            caretColor: "var(--color-brand-green)",
            fontSize: "var(--text-size-base)",
          }}
          enterKeyHint="send"
          autoCapitalize="sentences"
          autoComplete="off"
          autoCorrect="off"
        />
        <button
          className="press-scale shrink-0 p-1 rounded-lg transition-all disabled:opacity-25"
          style={{ color: "var(--color-brand-green)" }}
          disabled={trimmedName.length === 0}
          onClick={addItem}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// MARK: - Category Panel

const CategoryPanel = ({ category }: CategoryPanelProps) => {
  const store = useCategoriesStore();
  const [tappedId, setTappedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!category) {
    return <div className="flex-1" />;
  }

  if (category.items.length === 0) {
    return (
      <div className="flex-1 flex flex-col px-4 pt-2">
        <AddItemInput />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
          <div
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0) scale(1)" : "translateY(12px) scale(0.92)",
              transition: "opacity 220ms cubic-bezier(0,0,0.2,1), transform 220ms cubic-bezier(0,0,0.2,1)",
            }}
            className="flex flex-col items-center gap-2"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(var(--color-brand-deep-green-rgb), 0.10)" }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--color-brand-teal)" }}
              >
                <line x1="9" y1="6" x2="20" y2="6" />
                <line x1="9" y1="12" x2="20" y2="12" />
                <line x1="9" y1="18" x2="20" y2="18" />
                <polyline points="4 6 5 7 7 5" />
                <polyline points="4 12 5 13 7 11" />
                <polyline points="4 18 5 19 7 17" />
              </svg>
            </div>
            <p className="text-base font-medium" style={{ color: "var(--color-brand-teal)" }}>
              No items yet
            </p>
            <p className="text-sm text-text-secondary text-center">
              Add your first item above.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Per-category sort order and direction — fall back for legacy data without the fields.
  const sortOrder = category.sortOrder ?? "date";
  const sortDirection = category.sortDirection ?? "asc";

  // Sort a copy of items based on the current sortOrder and sortDirection.
  // Unchecked items always appear before checked items; within each group
  // items are ordered either by creation date or alphabetically, then
  // flipped if direction is "desc".
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

  return (
    <div className="flex-1 overflow-y-auto px-4 py-1">
      <AddItemInput />
      {/* List meta row — item count (left) + sort controls (right) */}
      <div className="flex items-center justify-between mt-4 mb-2 px-1">
        <span
          className="text-xs font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {sortedItems.length} {sortedItems.length === 1 ? "item" : "items"}
        </span>
        <div className="flex items-center gap-2">
          {/* Sort order toggle */}
          <button
            className="flex items-center gap-1 press-scale"
            style={{ color: "var(--color-text-secondary)", touchAction: "manipulation" }}
            onClick={() => {
              const next = sortOrder === "date" ? "alpha" : "date";
              store.setCategorySortOrder(category.id, next);
              HapticService.light();
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M7 12h10M11 18h2" />
            </svg>
            <span className="text-xs font-semibold">
              {sortOrder === "alpha" ? "A–Z" : "Date Added"}
            </span>
          </button>
          {/* Divider */}
          <span style={{ color: "var(--color-text-secondary)", opacity: 0.3, fontSize: "11px" }}>|</span>
          {/* Sort direction toggle */}
          <button
            className="flex items-center gap-0.5 press-scale"
            style={{ color: "var(--color-text-secondary)", touchAction: "manipulation" }}
            onClick={() => {
              const next = sortDirection === "asc" ? "desc" : "asc";
              store.setCategorySortDirection(category.id, next);
              HapticService.light();
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: "transform 200ms ease-out",
                transform: sortDirection === "desc" ? "scaleY(-1)" : "scaleY(1)",
              }}
            >
              <path d="M12 5v14M5 12l7-7 7 7" />
            </svg>
            <span className="text-xs font-semibold">
              {sortDirection === "asc" ? "Asc" : "Desc"}
            </span>
          </button>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {sortedItems.map((item) => (
          <SwipeableRow
            key={item.id}
            onDelete={() => store.deleteItemFromSelectedCategory(item.id)}
          >
            <li
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-[14px] cursor-pointer ${tappedId === item.id ? "scale-[0.97] opacity-80" : ""
                }`}
              style={{
                backgroundColor: item.isChecked
                  ? "rgba(var(--color-brand-deep-green-rgb), 0.04)"
                  : "var(--color-surface-card)",
                boxShadow: item.isChecked ? "none" : "var(--elevation-card)",
                transition: tappedId === item.id
                  ? "transform 80ms ease-out, opacity 80ms ease-out"
                  : "background-color 200ms ease-out, box-shadow 200ms ease-out",
              }}
              onClick={() => {
                setTappedId(item.id);
                setTimeout(() => setTappedId(null), 120);
                store.toggleItemInSelectedCategory(item.id);
                HapticService.light();
              }}
            >
              {/* Circle / Checkmark icon */}
              {item.isChecked ? (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" fill="var(--color-brand-green)" />
                  <polyline points="9 12 11 14 15 10" stroke="white" strokeWidth="2.2" />
                </svg>
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "var(--color-brand-teal)", opacity: 0.6 }}
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" />
                </svg>
              )}

              {/* Item name */}
              <span
                className={`flex-1 ${item.isChecked
                  ? "line-through"
                  : "font-medium"
                  }`}
                style={
                  item.isChecked
                    ? {
                      fontSize: "var(--text-size-base)",
                      color: "var(--color-text-secondary)",
                      textDecorationColor: "rgba(var(--color-brand-green-rgb), 0.45)",
                    }
                    : {
                      fontSize: "var(--text-size-base)",
                      color: "var(--color-text-primary)",
                    }
                }
              >
                {item.name}
              </span>
            </li>
          </SwipeableRow>
        ))}
      </ul>
    </div>
  );
};

export default CategoryPanel;
