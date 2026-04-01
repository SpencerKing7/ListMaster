// src/screens/OnboardingWelcomeScreen.tsx
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function OnboardingWelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center px-8">
      {/* Base background */}
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: "var(--color-surface-background)" }}
      />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-brand-wide)" }}
      />

      <div className="flex-1" />

      <div className="flex flex-col items-center gap-4">
        <h1
          className="text-5xl font-bold"
          style={{ color: "var(--color-brand-green)" }}
        >
          List Master
        </h1>
        <p className="text-text-secondary text-center text-sm">
          Your personal checklist companion
        </p>
      </div>

      <div className="flex-1" />

      <div className="w-full pb-[60px]">
        <Button
          className="w-full h-14 rounded-2xl text-base font-semibold text-white"
          style={{ backgroundColor: "var(--color-brand-green)" }}
          onClick={() => navigate("/setup")}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
