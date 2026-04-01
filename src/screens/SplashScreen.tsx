/** Full-screen branded splash shown to returning users on app launch. */
import { useState, useEffect } from "react";

interface SplashScreenProps {
  onFinished: () => void;
}

const SplashScreen = ({ onFinished }: SplashScreenProps) => {
  const [isFading, setIsFading] = useState(false);
  const [isEntered, setIsEntered] = useState(false);

  useEffect(() => {
    // Slight delay so the initial paint commits before the animation starts
    const enterTimer = setTimeout(() => setIsEntered(true), 40);

    const fadeTimer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        onFinished();
      }, 420);
    }, 1400);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(fadeTimer);
    };
  }, [onFinished]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5"
      style={{
        background: `linear-gradient(160deg, var(--color-brand-deep-green) 0%, var(--color-brand-green) 55%, var(--color-brand-teal) 100%)`,
        opacity: isFading ? 0 : 1,
        transition: "opacity 420ms ease-out",
      }}
    >
      {/* App icon */}
      <div
        style={{
          opacity: isEntered ? 1 : 0,
          transform: isEntered ? "scale(1) translateY(0)" : "scale(0.78) translateY(10px)",
          transition: "opacity 500ms cubic-bezier(0,0,0.2,1), transform 600ms cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div
          className="w-20 h-20 rounded-[22px] flex items-center justify-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.18)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          <svg
            width="44"
            height="44"
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

      {/* Wordmark */}
      <div
        style={{
          opacity: isEntered ? 1 : 0,
          transform: isEntered ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 500ms 80ms cubic-bezier(0,0,0.2,1), transform 500ms 80ms cubic-bezier(0,0,0.2,1)",
        }}
      >
        <h1
          className="text-3xl font-bold text-white text-center"
          style={{ letterSpacing: "-0.02em" }}
        >
          List Master
        </h1>
        <p
          className="text-sm text-center mt-1"
          style={{ color: "rgba(255,255,255,0.65)", letterSpacing: "0.04em" }}
        >
          YOUR CHECKLIST COMPANION
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;