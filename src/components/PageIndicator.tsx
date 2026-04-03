/**
 * PageIndicator renders a row of dots indicating the current page position,
 * similar to iOS UIPageControl. The active dot stretches into a pill shape.
 */
import type { JSX } from "react";

interface PageIndicatorProps {
  count: number;
  activeIndex: number;
}

export function PageIndicator({ count, activeIndex }: PageIndicatorProps): JSX.Element {
  return (
    <div className="flex justify-center items-center gap-[6px] py-2" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const isActive = i === activeIndex;
        return (
          <div
            key={i}
            style={{
              width: isActive ? "18px" : "6px",
              height: "6px",
              borderRadius: "9999px",
              backgroundColor: isActive
                ? "var(--color-brand-green)"
                : "var(--color-text-secondary)",
              opacity: isActive ? 1 : 0.4,
              willChange: "width, background-color, opacity",
              transition:
                "width 280ms cubic-bezier(0.34,1.56,0.64,1), background-color 280ms ease-out, opacity 280ms ease-out",
            }}
          />
        );
      })}
    </div>
  );
}