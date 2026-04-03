/**
 * ActionSheet provides iOS-style bottom sheet alerts with distinct action buttons,
 * mirroring UIAlertController action sheets.
 */
import { useEffect, useState } from "react";
import type { JSX } from "react";
import { createPortal } from "react-dom";

// Module-level counter so multiple simultaneous ActionSheets (e.g. rapid open/close)
// don't prematurely re-enable body scroll when one closes while another is still open.
let overlayCount = 0;

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    destructive?: boolean;
  }>;
  cancelLabel?: string;
}

const ActionSheet = ({
  isOpen,
  onClose,
  title,
  message,
  actions,
  cancelLabel = "Cancel"
}: ActionSheetProps): JSX.Element | null => {
  // isMounted keeps the DOM alive during exit animation; isVisible drives CSS states
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      // One rAF ensures the DOM is committed before triggering the transition
      const raf = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setIsVisible(false);
      const t = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isMounted) {
      overlayCount += 1;
      document.body.style.overflow = "hidden";
    }
    return () => {
      if (isMounted) {
        overlayCount -= 1;
        if (overlayCount === 0) {
          document.body.style.overflow = "";
        }
      }
    };
  }, [isMounted]);

  if (!isMounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundColor: "var(--color-surface-overlay)",
          opacity: isVisible ? 1 : 0,
        }}
      />

      {/* Sheet */}
      <div
        className="relative w-full max-w-sm mx-4 mb-4 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--color-surface-card)",
          boxShadow: "var(--elevation-sheet)",
          transform: isVisible ? "translateY(0)" : "translateY(110%)",
          transition: isVisible
            ? "transform 280ms cubic-bezier(0,0,0.2,1)"
            : "transform 240ms cubic-bezier(0.4,0,1,1)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content */}
        <div className="px-6 pt-6 pb-4">
          {title && (
            <h2
              className="text-base font-semibold text-center mb-1.5"
              style={{ color: "var(--color-text-primary)" }}
            >
              {title}
            </h2>
          )}
          {message && (
            <p
              className="text-sm text-center mb-5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {message}
            </p>
          )}

          {/* Divider before actions */}
          <div
            className="h-px mb-3 -mx-6"
            style={{ backgroundColor: "rgba(var(--color-brand-deep-green-rgb), 0.10)" }}
          />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                className="w-full py-3 px-4 rounded-xl text-center font-semibold text-sm press-scale"
                style={
                  action.destructive
                    ? { color: "var(--color-danger)", backgroundColor: "rgba(212,75,74,0.10)" }
                    : { color: "var(--color-brand-green)", backgroundColor: "var(--color-surface-green-tint)" }
                }
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cancel button — visually separated */}
        <div
          className="px-6 pb-4 pt-2"
          style={{ borderTop: "1px solid rgba(var(--color-brand-deep-green-rgb), 0.08)" }}
        >
          <button
            className="w-full py-3 px-4 rounded-xl text-center font-semibold text-sm press-scale"
            style={{
              backgroundColor: "var(--color-surface-input)",
              color: "var(--color-text-primary)",
            }}
            onClick={onClose}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export { ActionSheet };
