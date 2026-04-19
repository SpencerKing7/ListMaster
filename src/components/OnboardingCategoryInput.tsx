// src/components/OnboardingCategoryInput.tsx
// Category input + pending category list used in the onboarding setup screen.

import { useState, useRef, type JSX } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Props for the onboarding category input section. */
interface OnboardingCategoryInputProps {
  categories: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}

// MARK: - Component

/** Category input field with an add button and animated pending-category list. */
export function OnboardingCategoryInput({
  categories,
  onAdd,
  onRemove,
}: OnboardingCategoryInputProps): JSX.Element {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmed = text.trim();

  function addCategory(): void {
    if (!trimmed) return;
    if (categories.some((n) => n.toLowerCase() === trimmed.toLowerCase())) return;
    onAdd(trimmed);
    setText("");
    // Reset caret position so iOS recalculates shift state without keyboard dismissal
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      inputRef.current.setSelectionRange(0, 0);
    });
  }

  return (
    <>
      {/* Category input */}
      <div className="flex flex-col gap-2">
        <label className="font-semibold" style={{ color: "var(--color-brand-teal)" }}>
          Categories
        </label>
        <div className="flex gap-2 items-center">
          <Input
            ref={inputRef}
            placeholder="e.g., Groceries, Tasks…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCategory();
              }
            }}
            className="h-12 rounded-[14px] border-transparent px-4 flex-1 focus-visible:border-[color:var(--color-brand-green)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-green)]/30"
            style={{ backgroundColor: "var(--color-surface-input)", color: "var(--color-text-primary)" }}
            enterKeyHint="send"
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={addCategory}
            disabled={trimmed.length === 0}
            className="shrink-0 h-8 w-8 p-0"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                color: "var(--color-brand-green)",
                opacity: trimmed.length === 0 ? 0.35 : 1,
                transition: "opacity 150ms ease-out",
              }}
            >
              <circle cx="12" cy="12" r="10" fill="currentColor" />
              <line x1="12" y1="8" x2="12" y2="16" stroke="white" />
              <line x1="8" y1="12" x2="16" y2="12" stroke="white" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Pending categories list */}
      {categories.length > 0 && (
        <div className="flex flex-col gap-2">
          {categories.map((name) => (
            <div
              key={name}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border animate-in fade-in slide-in-from-top-1 duration-200"
              style={{
                backgroundColor: "var(--color-surface-input)",
                borderColor: "rgba(var(--color-brand-deep-green-rgb), 0.20)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="var(--color-brand-green)"
                stroke="white"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <span className="text-sm text-text-primary flex-1">{name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 p-0 text-text-secondary hover:text-text-primary"
                onClick={() => onRemove(name)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" opacity="0.3" />
                  <line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="2" />
                  <line x1="16" y1="8" x2="8" y2="16" stroke="currentColor" strokeWidth="2" />
                </svg>
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
