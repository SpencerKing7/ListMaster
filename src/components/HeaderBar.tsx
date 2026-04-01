// src/components/HeaderBar.tsx
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/store/useSettingsStore";
import CategoryPicker from "./CategoryPicker";

interface HeaderBarProps {
  onOpenSettings: () => void;
  scrolled?: boolean;
}

const HeaderBar = ({ onOpenSettings, scrolled = false }: HeaderBarProps) => {
  const { userName } = useSettingsStore();
  const trimmedName = userName.trim();

  return (
    <header
      className="sticky top-0 z-10 px-4 pt-2 pb-4"
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
        background:
          "linear-gradient(to bottom, var(--color-surface-background) 0%, var(--color-surface-background) 70%, transparent 100%)",
      }}
    >
      <div className="flex items-baseline gap-2 mb-6">
        {trimmedName.length > 0 && (
          <p
            className={`font-semibold flex-1 transition-all duration-220 ease-out ${scrolled ? "text-base opacity-70" : "text-xl"
              }`}
            style={{
              color: "var(--color-brand-green)",
              transform: scrolled ? "scale(0.85)" : "scale(1)",
            }}
          >
            Welcome, {trimmedName}
          </p>
        )}
        {trimmedName.length === 0 && <div className="flex-1" />}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          className="shrink-0"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="var(--color-brand-teal)"
            stroke="none"
          >
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.04 7.04 0 0 0-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.26.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" />
          </svg>
        </Button>
      </div>
      <CategoryPicker />
    </header>
  );
};

export default HeaderBar;
