/** Full-screen branded splash shown to returning users on app launch. */
import { useState, useEffect } from "react";

interface SplashScreenProps {
  onFinished: () => void;
}

const SplashScreen = ({ onFinished }: SplashScreenProps) => {
  const [isFading, setIsFading] = useState(false);
  const [scale, setScale] = useState(0.9);

  useEffect(() => {
    // Animate scale from 0.9 to 1 over 1.2s
    const scaleTimer = setTimeout(() => {
      setScale(1);
    }, 0); // Start immediately

    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        onFinished();
      }, 400); // Match fade-out duration
    }, 1200); // Display duration

    return () => {
      clearTimeout(scaleTimer);
      clearTimeout(timer);
    };
  }, [onFinished]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: "var(--color-brand-green)",
        opacity: isFading ? 0 : 1,
        transition: "opacity 400ms ease-out",
      }}
    >
      <h1
        className="text-3xl font-bold text-white"
        style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          transform: `scale(${scale})`,
          transition: "transform 1.2s ease-out",
        }}
      >
        List Master
      </h1>
    </div>
  );
};

export default SplashScreen;