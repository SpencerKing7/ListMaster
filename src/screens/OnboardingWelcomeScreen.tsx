// src/screens/OnboardingWelcomeScreen.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function OnboardingWelcomeScreen() {
  const navigate = useNavigate();
  const [isEntered, setIsEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsEntered(true), 60);
    return () => clearTimeout(t);
  }, []);

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

      {/* Hero block */}
      <div className="flex flex-col items-center gap-5">
        {/* App icon */}
        <div
          style={{
            opacity: isEntered ? 1 : 0,
            transform: isEntered ? "scale(1) translateY(0)" : "scale(0.82) translateY(12px)",
            transition: "opacity 480ms cubic-bezier(0,0,0.2,1), transform 560ms cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <div
            className="w-24 h-24 rounded-[26px] flex items-center justify-center"
            style={{
              background: `linear-gradient(145deg, var(--color-brand-green), var(--color-brand-teal))`,
              boxShadow: "0 12px 40px rgba(57,179,133,0.30), 0 2px 8px rgba(57,179,133,0.15)",
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="9" y1="6" x2="20" y2="6" />
              <line x1="9" y1="12" x2="20" y2="12" />
              <line x1="9" y1="18" x2="20" y2="18" />
              <polyline points="4 6 5 7 7 5" />
              <polyline points="4 12 5 13 7 11" />
              <polyline points="4 18 5 19 7 17" />
            </svg>
          </div>
        </div>

        {/* Wordmark + tagline */}
        <div
          className="flex flex-col items-center gap-2"
          style={{
            opacity: isEntered ? 1 : 0,
            transform: isEntered ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 480ms 60ms cubic-bezier(0,0,0.2,1), transform 480ms 60ms cubic-bezier(0,0,0.2,1)",
          }}
        >
          <h1
            className="text-5xl font-bold"
            style={{ color: "var(--color-brand-green)", letterSpacing: "-0.02em" }}
          >
            List Master
          </h1>
          <p className="text-text-secondary text-center text-sm">
            Your personal checklist companion
          </p>
        </div>
      </div>

      <div className="flex-1" />

      {/* CTA */}
      <div
        className="w-full"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)",
          opacity: isEntered ? 1 : 0,
          transform: isEntered ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 480ms 120ms cubic-bezier(0,0,0.2,1), transform 480ms 120ms cubic-bezier(0,0,0.2,1)",
        }}
      >
        <Button
          className="w-full h-14 rounded-2xl text-base font-semibold text-white press-scale"
          style={{
            background: `linear-gradient(135deg, var(--color-brand-green) 0%, var(--color-brand-teal) 100%)`,
            boxShadow: "0 6px 24px rgba(57,179,133,0.35)",
          }}
          onClick={() => navigate("/setup")}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
