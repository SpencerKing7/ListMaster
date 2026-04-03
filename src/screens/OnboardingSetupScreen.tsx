// src/screens/OnboardingSetupScreen.tsx
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSyncStore } from "@/store/useSyncStore";

export default function OnboardingSetupScreen() {
  const store = useCategoriesStore();
  const settings = useSettingsStore();
  const sync = useSyncStore();

  const [nameText, setNameText] = useState("");
  const [categoryInputText, setCategoryInputText] = useState("");
  const [pendingCategories, setPendingCategories] = useState<string[]>([]);

  // ── Sync code entry ──
  const [syncCodeText, setSyncCodeText] = useState("");
  const syncCodeInputRef = useRef<HTMLInputElement>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus name field on mount
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const trimmedName = nameText.trim();
  const trimmedCategoryInput = categoryInputText.trim();
  const trimmedSyncCode = syncCodeText.trim();

  // Form is valid if either: (name + ≥1 category) OR a sync code is entered
  const isFormValid = trimmedSyncCode.length > 0 || (trimmedName.length > 0 && pendingCategories.length > 0);

  // When a sync code is present, dim the manual fields to signal they'll be ignored
  const isManualSectionDimmed = trimmedSyncCode.length > 0;

  function addCategoryToList() {
    const trimmed = categoryInputText.trim();
    if (!trimmed) return;
    // Reject case-insensitive duplicates
    if (
      pendingCategories.some(
        (name) => name.toLowerCase() === trimmed.toLowerCase()
      )
    )
      return;
    setPendingCategories((prev) => [...prev, trimmed]);
    setCategoryInputText("");
    // Blur then refocus so iOS resets the keyboard shift state (auto-capitalize)
    categoryInputRef.current?.blur();
    requestAnimationFrame(() => categoryInputRef.current?.focus());
  }

  function removePendingCategory(name: string) {
    setPendingCategories((prev) => prev.filter((c) => c !== name));
  }

  /** Single finish handler — routes to sync path if a code is entered, otherwise manual setup. */
  async function completeOnboarding() {
    if (!isFormValid) return;

    // Dismiss keyboard so viewport height settles before MainScreen mounts
    (document.activeElement as HTMLElement | null)?.blur();

    if (trimmedSyncCode.length > 0) {
      // ── Sync path: adopt the code, data loads from cloud ──
      await sync.adoptSyncCode(trimmedSyncCode);
    } else {
      // ── Manual path: save name + categories ──
      settings.setUserName(trimmedName);
      store.setCategories(pendingCategories);
    }

    // Wait for the iOS keyboard dismiss animation (~300ms) before transitioning
    setTimeout(() => {
      window.scrollTo(0, 0);
      settings.completeOnboarding();
    }, 350);
  }

  return (
    <div className="relative min-h-dvh flex flex-col">
      {/* Base background */}
      <div
        className="absolute -z-10"
        style={{
          top: "calc(-1 * env(safe-area-inset-top, 0px))",
          left: 0,
          right: 0,
          bottom: "calc(-1 * env(safe-area-inset-bottom, 0px))",
          backgroundColor: "var(--color-surface-background)",
        }}
      />
      {/* Gradient overlay */}
      <div
        className="absolute -z-10"
        style={{
          top: "calc(-1 * env(safe-area-inset-top, 0px))",
          left: 0,
          right: 0,
          bottom: "calc(-1 * env(safe-area-inset-bottom, 0px))",
          background: "var(--gradient-brand-wide)",
        }}
      />

      <div className="flex-1" />

      {/* Header */}
      <div className="flex flex-col items-center gap-4 px-8">
        <h1
          className="text-[28px] font-bold text-center leading-tight"
          style={{ color: "var(--color-brand-green)" }}
        >
          Welcome to List Master!
        </h1>
        <p className="text-text-secondary text-center text-sm">
          Let's get you set up with your categories
        </p>
      </div>

      {/* Form */}
      <div
        className="flex flex-col gap-6 px-8 mt-10 transition-opacity duration-200"
        style={{ opacity: isManualSectionDimmed ? 0.4 : 1, pointerEvents: isManualSectionDimmed ? "none" : "auto" }}
      >
        {/* Name input */}
        <div className="flex flex-col gap-2">
          <label
            className="font-semibold"
            style={{ color: "var(--color-brand-teal)" }}
          >
            Your Name
          </label>
          <Input
            ref={nameInputRef}
            placeholder="Enter your name"
            value={nameText}
            onChange={(e) => setNameText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                nameInputRef.current?.blur();
                requestAnimationFrame(() => categoryInputRef.current?.focus());
              }
            }}
            className="h-12 rounded-[14px] border-transparent px-4 text-text-primary placeholder:text-[color:var(--color-text-secondary)] focus-visible:border-[color:var(--color-brand-green)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-green)]/30"
            style={{ backgroundColor: "var(--color-surface-input)", color: "var(--color-text-primary)" }}
            autoCapitalize="words"
          />
        </div>

        {/* Category input */}
        <div className="flex flex-col gap-2">
          <label
            className="font-semibold"
            style={{ color: "var(--color-brand-teal)" }}
          >
            Categories
          </label>
          <div className="flex gap-2 items-center">
            <Input
              ref={categoryInputRef}
              placeholder="e.g., Groceries, Tasks…"
              value={categoryInputText}
              onChange={(e) => setCategoryInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategoryToList();
                }
              }}
              className="h-12 rounded-[14px] border-transparent px-4 flex-1 focus-visible:border-[color:var(--color-brand-green)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-green)]/30"
              style={{ backgroundColor: "var(--color-surface-input)", color: "var(--color-text-primary)" }}
              enterKeyHint="send"
              autoCapitalize="words"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={addCategoryToList}
              disabled={trimmedCategoryInput.length === 0}
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
                  opacity: trimmedCategoryInput.length === 0 ? 0.35 : 1,
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
        {pendingCategories.length > 0 && (
          <div className="flex flex-col gap-2">
            {pendingCategories.map((name) => (
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
                <span className="text-sm text-text-primary flex-1">
                  {name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 text-text-secondary hover:text-text-primary"
                  onClick={() => removePendingCategory(name)}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="12" cy="12" r="10" opacity="0.3" />
                    <line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="2" />
                    <line x1="16" y1="8" x2="8" y2="16" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3 px-8 mt-8">
        <div className="flex-1 border-t" style={{ borderColor: "var(--color-text-secondary)", opacity: 0.2 }} />
        <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>or</span>
        <div className="flex-1 border-t" style={{ borderColor: "var(--color-text-secondary)", opacity: 0.2 }} />
      </div>

      {/* ── Sync code section ── */}
      <div className="flex flex-col gap-2 px-8 mt-6">
        <label
          className="font-semibold"
          style={{ color: "var(--color-brand-teal)" }}
        >
          Enter a Sync Code
        </label>
        <p className="text-xs -mt-1" style={{ color: "var(--color-text-secondary)" }}>
          Have a code from another device? Enter it here to sync your data instead.
        </p>
        <Input
          ref={syncCodeInputRef}
          value={syncCodeText}
          onChange={(e) => setSyncCodeText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              completeOnboarding();
            }
          }}
          placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
          className="h-12 rounded-[14px] border-transparent px-4 font-mono text-sm focus-visible:border-[color:var(--color-brand-green)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-green)]/30"
          style={{ backgroundColor: "var(--color-surface-input)", color: "var(--color-text-primary)" }}
          autoCapitalize="characters"
          spellCheck={false}
        />
      </div>

      <div className="flex-1" />

      {/* Finish button */}
      <div
        className="px-8"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)", marginTop: "32px" }}
      >
        <Button
          className="w-full h-14 rounded-2xl text-base font-semibold text-white disabled:opacity-60 press-scale"
          style={{
            background: `linear-gradient(135deg, var(--color-brand-green) 0%, var(--color-brand-teal) 100%)`,
            boxShadow: "0 6px 24px rgba(57,179,133,0.35)",
          }}
          disabled={!isFormValid}
          onClick={completeOnboarding}
        >
          Finish Setup
        </Button>
      </div>
    </div>
  );
}

