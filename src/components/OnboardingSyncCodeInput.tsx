// src/components/OnboardingSyncCodeInput.tsx
// Sync code entry section used in the onboarding setup screen.

import { useRef, type JSX } from "react";
import { Input } from "@/components/ui/input";

/** Props for the sync-code input section. */
interface OnboardingSyncCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

// MARK: - Component

/** Sync code input with label and description. */
export function OnboardingSyncCodeInput({
  value,
  onChange,
  onSubmit,
}: OnboardingSyncCodeInputProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-2 px-8 mt-6">
      <label className="font-semibold" style={{ color: "var(--color-brand-teal)" }}>
        Enter a Sync Code
      </label>
      <p className="text-xs -mt-1" style={{ color: "var(--color-text-secondary)" }}>
        Have a code from another device? Enter it here to sync your data instead.
      </p>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
        className="h-12 rounded-[14px] border-transparent px-4 font-mono text-sm focus-visible:border-[color:var(--color-brand-green)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-green)]/30"
        style={{ backgroundColor: "var(--color-surface-input)", color: "var(--color-text-primary)" }}
        autoCapitalize="characters"
        spellCheck={false}
      />
    </div>
  );
}
