/**
 * SwipeableRow wraps a checklist item with swipe-left-to-reveal delete functionality,
 * mirroring iOS UITableView trailing swipe actions.
 */
import { useState, useRef, useCallback, type ReactNode } from "react";
import { HapticService } from "@/services/hapticService";

interface SwipeableRowProps {
  children: ReactNode;
  onDelete: () => void;
}

const SwipeableRow = ({ children, onDelete }: SwipeableRowProps) => {
  const [offsetX, setOffsetX] = useState(0);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    startXRef.current = e.clientX;
    isDraggingRef.current = false;
    hasDraggedRef.current = false;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) {
      const dx = e.clientX - startXRef.current;
      if (Math.abs(dx) > 5) {
        isDraggingRef.current = true;
        hasDraggedRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      } else {
        return;
      }
    }

    const dx = e.clientX - startXRef.current;
    if (dx < 0) {
      // Only allow left swipe
      const newOffset = Math.max(dx, -80); // Max reveal of 80px
      setOffsetX(newOffset);
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      isDraggingRef.current = false;

      if (offsetX < -40) {
        // Snap to revealed
        setOffsetX(-80);
        HapticService.medium();
      } else {
        // Snap back
        setOffsetX(0);
        HapticService.error();
      }
    }
  }, [offsetX]);

  const handleDelete = useCallback(() => {
    HapticService.heavy();
    onDelete();
  }, [onDelete]);

  return (
    <div className="relative overflow-hidden">
      {/* Delete button (revealed on swipe) */}
      <button
        className="absolute right-0 top-0 h-full w-20 flex items-center justify-center bg-danger text-white font-semibold text-sm active:scale-[0.96] transition-transform"
        onClick={handleDelete}
        style={{
          transform: `translateX(${80 + offsetX}px)`,
        }}
      >
        Delete
      </button>

      {/* Main content */}
      <div
        className="relative transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(${offsetX}px)`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableRow;