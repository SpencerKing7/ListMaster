// src/components/CategoryPanel.tsx
import { useState, useEffect } from "react";
import type { Category } from "@/models/types";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { HapticService } from "@/services/hapticService";
import SwipeableRow from "./SwipeableRow";

interface CategoryPanelProps {
  category: Category | null;
}

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
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
        <div
          className={`flex flex-col items-center transition-all duration-220 ease-decelerate ${mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-92"
            }`}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--color-brand-teal)" }}
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          <p className="text-base font-medium" style={{ color: "var(--color-brand-teal)" }}>
            No items yet
          </p>
          <p className="text-sm text-text-secondary text-center">
            Tap below to add your first item.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-1">      <ul className="flex flex-col gap-2">
      {category.items.map((item) => (
        <SwipeableRow
          key={item.id}
          onDelete={() => store.deleteItemFromSelectedCategory(item.id)}
        >
          <li
            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-[14px] cursor-pointer ${tappedId === item.id ? "scale-[0.97] opacity-80" : ""
              }`}
            style={{
              backgroundColor: "var(--color-surface-card)",
              boxShadow: "0 2px 4px rgba(var(--color-brand-deep-green-rgb), 0.08)",
              opacity: item.isChecked ? 0.7 : 1.0,
              transition: tappedId === item.id ? "transform 80ms ease-out, opacity 80ms ease-out" : "none",
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
                stroke="var(--color-brand-green)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" fill="var(--color-brand-green)" />
                <polyline points="9 12 11 14 15 10" stroke="white" strokeWidth="2" />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--color-brand-teal)", opacity: 0.7 }}
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" />
              </svg>
            )}

            {/* Item name */}
            <span
              className={`text-base ${item.isChecked
                ? "line-through text-text-secondary"
                : "font-medium text-text-primary"
                }`}
              style={
                item.isChecked
                  ? { textDecorationColor: "color-mix(in srgb, var(--color-brand-green) 40%, transparent)" }
                  : undefined
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
