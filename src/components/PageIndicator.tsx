/**
 * PageIndicator renders a row of dots indicating the current page position,
 * similar to iOS UIPageControl.
 */
interface PageIndicatorProps {
  count: number;
  activeIndex: number;
}

export default function PageIndicator({ count, activeIndex }: PageIndicatorProps) {
  return (
    <div className="flex justify-center items-center gap-2 py-2">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all duration-200 ${i === activeIndex
              ? "bg-brand-green scale-125"
              : "bg-text-secondary/30 scale-100"
            }`}
        />
      ))}
    </div>
  );
}