/**
 * SwipeableRow wraps a checklist item with swipe-left-to-reveal delete functionality,
 * mirroring iOS UITableView trailing swipe actions.
 */
import { useState, useRef, useCallback, type ReactNode, type JSX } from "react";
import { HapticService } from "@/services/hapticService";

interface SwipeableRowProps {
  children: ReactNode;
  onDelete: () => void;
}

const SwipeableRow = ({ children, onDelete }: SwipeableRowProps): JSX.Element => {
  const [offsetX, setOffsetX] = useState(0);
  // isDragging is kept as state (not just a ref) so that the transition style
  // re-evaluates on the same render cycle as offsetX, preventing stale closures
  // from showing a spring animation during active drag.
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);
  // Once we decide this gesture is vertical (scroll / page-swipe), lock it out
  const isLockedOutRef = useRef(false);
  // Capture offsetX at the moment the drag begins so that both left-swipe-to-open
  // and right-swipe-to-close work correctly from any starting position.
  const offsetAtDragStartRef = useRef(0);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Ignore right-click, middle-click, etc.
    if (e.button !== 0) return;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    offsetAtDragStartRef.current = offsetX;
    isDraggingRef.current = false;
    isLockedOutRef.current = false;
  }, [offsetX]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Already decided this gesture belongs to a parent (page swipe / scroll)
    if (isLockedOutRef.current) return;

    if (!isDraggingRef.current) {
      const dx = e.clientX - startXRef.current;
      const dy = e.clientY - startYRef.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Wait for enough movement to determine intent
      if (absDx < 5 && absDy < 5) return;

      // If the gesture is more vertical than horizontal, lock out —
      // let it propagate to the parent for page-swiping or scrolling.
      if (absDy >= absDx) {
        isLockedOutRef.current = true;
        return;
      }

      // Clearly horizontal — claim the pointer for row swipe
      isDraggingRef.current = true;
      setIsDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      e.stopPropagation(); // prevent page-level handler from also processing
    }

    const dx = e.clientX - startXRef.current;
    // Allow both left-swipe (open) and right-swipe (close); clamp to [-80, 0]
    const newOffset = offsetAtDragStartRef.current + dx;
    setOffsetX(Math.min(0, Math.max(newOffset, -80)));
    if (isDraggingRef.current) {
      e.stopPropagation(); // prevent page-level handler from also processing
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      isDraggingRef.current = false;
      // Clear isDragging state so both panels animate with the spring on snap
      setIsDragging(false);

      if (offsetX < -40) {
        // Snap to fully revealed
        setOffsetX(-80);
        HapticService.medium();
      } else {
        // Snap closed
        setOffsetX(0);
        HapticService.light();
      }
    }
  }, [offsetX]);

  /** Close the swipe-reveal when the row content is tapped while open.
   *  Stops propagation so the child item's onClick does not also fire. */
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    if (offsetX !== 0) {
      e.stopPropagation();
      setOffsetX(0);
    }
  }, [offsetX]);

  const handleDelete = useCallback(() => {
    HapticService.heavy();
    onDelete();
  }, [onDelete]);

  return (
    <div className="relative overflow-hidden rounded-[14px]">
      {/* Delete button (revealed on swipe) */}
      <div
        className="absolute right-0 top-0 h-full w-20 flex items-center justify-center"
        style={{
          backgroundColor: "var(--color-danger)",
          borderRadius: "0 14px 14px 0",
          transform: `translate3d(${80 + offsetX}px, 0, 0)`,
          transition: !isDragging ? "transform 300ms cubic-bezier(0.34,1.56,0.64,1)" : "none",
        }}
      >
        <button
          className="flex flex-col items-center justify-center gap-1 w-full h-full active:opacity-75"
          onClick={handleDelete}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <span className="text-white text-xs font-semibold">Delete</span>
        </button>
      </div>

      {/* Main content */}
      <div
        style={{
          transform: `translate3d(${offsetX}px, 0, 0)`,
          transition: !isDragging ? "transform 300ms cubic-bezier(0.34,1.56,0.64,1)" : "none",
        }}
        onClick={handleContentClick}
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

export { SwipeableRow };