/**
 * ActionSheet provides iOS-style bottom sheet alerts with distinct action buttons,
 * mirroring UIAlertController action sheets.
 */
import { useEffect } from "react";

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
}: ActionSheetProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full max-w-sm mx-4 mb-4 bg-surface-card rounded-2xl shadow-xl transform transition-transform duration-280 ease-decelerate"
        style={{
          backgroundColor: "var(--color-surface-card)",
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content */}
        <div className="p-6">
          {title && (
            <h2 className="text-lg font-semibold text-center mb-2" style={{ color: "var(--color-text-primary)" }}>
              {title}
            </h2>
          )}
          {message && (
            <p className="text-sm text-center mb-6" style={{ color: "var(--color-text-secondary)" }}>
              {message}
            </p>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {actions.map((action, index) => (
              <button
                key={index}
                className={`w-full py-3 px-4 rounded-xl text-center font-semibold transition-all active:scale-[0.96] ${action.destructive
                    ? "text-danger bg-danger/10"
                    : "text-brand-green bg-brand-green/10"
                  }`}
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

        {/* Cancel button - separate and rounded */}
        <div className="p-4 pt-2">
          <button
            className="w-full py-3 px-4 rounded-xl text-center font-semibold text-text-primary bg-surface-input transition-all active:scale-[0.96]"
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
    </div>
  );
};

export default ActionSheet;