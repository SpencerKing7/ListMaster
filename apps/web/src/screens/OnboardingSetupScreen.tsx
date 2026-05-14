// src/screens/OnboardingSetupScreen.tsx
// Onboarding step where the user enters categories, or a sync code.

import { useState } from "react";
import type { JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCategoriesStore } from "@/store/useCategoriesStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSyncStore } from "@/store/useSyncStore";
import { OnboardingCategoryInput } from "@/components/OnboardingCategoryInput";
import { OnboardingSyncCodeInput } from "@/components/OnboardingSyncCodeInput";

/** Onboarding setup page — collects name + categories or a sync code. */
export function OnboardingSetupScreen(): JSX.Element {
  const store = useCategoriesStore();
  const settings = useSettingsStore();
  const sync = useSyncStore();
  const navigate = useNavigate();

  const [pendingCategories, setPendingCategories] = useState<string[]>(store.categories.map(c => c.name));
  const [syncCodeText, setSyncCodeText] = useState("");

  const trimmedSyncCode = syncCodeText.trim();
  const isFormValid = trimmedSyncCode.length > 0 || pendingCategories.length > 0;
  const isManualSectionDimmed = trimmedSyncCode.length > 0;

  async function finishSetup(): Promise<void> {
    if (!isFormValid) return;
    (document.activeElement as HTMLElement | null)?.blur();

    if (trimmedSyncCode.length > 0) {
      // adoptSyncCode fetches cloud data and dispatches SYNC_LOAD via the
      // registered callback before returning, so data is in the store now.
      // Complete onboarding directly — no need for the /sync interstitial.
      await sync.adoptSyncCode(trimmedSyncCode);
      settings.completeOnboarding();
    } else {
      store.setCategories(pendingCategories);
      setTimeout(() => {
        window.scrollTo(0, 0);
        navigate("/sync");
      }, 350);
    }
  }

  return (
    <div className="relative min-h-dvh flex flex-col">
      {/* Base background */}
      <div
        className="absolute -z-10"
        style={{
          top: "calc(-1 * env(safe-area-inset-top, 0px))",
          left: 0, right: 0,
          bottom: "calc(-1 * env(safe-area-inset-bottom, 0px))",
          backgroundColor: "var(--color-surface-background)",
        }}
      />
      {/* Gradient overlay */}
      <div
        className="absolute -z-10"
        style={{
          top: "calc(-1 * env(safe-area-inset-top, 0px))",
          left: 0, right: 0,
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

      {/* Manual setup form */}
      <div
        className="flex flex-col gap-6 px-8 mt-10 transition-opacity duration-200"
        style={{ opacity: isManualSectionDimmed ? 0.4 : 1, pointerEvents: isManualSectionDimmed ? "none" : "auto" }}
      >
        <OnboardingCategoryInput
          categories={pendingCategories}
          onAdd={(name) => setPendingCategories((prev) => [...prev, name])}
          onRemove={(name) => setPendingCategories((prev) => prev.filter((c) => c !== name))}
        />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 px-8 mt-8">
        <div className="flex-1 border-t" style={{ borderColor: "var(--color-text-secondary)", opacity: 0.2 }} />
        <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>or</span>
        <div className="flex-1 border-t" style={{ borderColor: "var(--color-text-secondary)", opacity: 0.2 }} />
      </div>

      <OnboardingSyncCodeInput
        value={syncCodeText}
        onChange={setSyncCodeText}
        onSubmit={finishSetup}
      />

      <div className="flex-1" />

      {/* Finish button */}
      <div
        className="px-8"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)", marginTop: "32px" }}
      >
        <Button
          className="w-full h-14 rounded-2xl text-base font-semibold text-white disabled:opacity-60 press-scale"
          style={{
            background: "linear-gradient(135deg, var(--color-brand-green) 0%, var(--color-brand-teal) 100%)",
            boxShadow: "0 6px 24px rgba(57,179,133,0.35)",
          }}
          disabled={!isFormValid}
          onClick={finishSetup}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
