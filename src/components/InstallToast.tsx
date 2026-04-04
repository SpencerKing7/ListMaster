// src/components/InstallToast.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import type { JSX } from "react";
import { InstallPromptService } from "@/services/installPromptService";

interface InstallToastProps {
  /** Called when user taps the toast body (not ×). Parent opens InstallSheet. */
  onOpenInstallSheet: () => void;
  /** When true, the toast must not show (a sheet is already open). */
  isSuppressed: boolean;
}

/** Dismissible toast prompting existing browser users to install the PWA. */
export function InstallToast({ onOpenInstallSheet, isSuppressed }: InstallToastProps): JSX.Element | null {
  const [isVisible, setIsVisible] = useState(false);
  const [isEntered, setIsEntered] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const shouldShowRef = useRef<boolean>(false);
  const isExitingRef = useRef<boolean>(false);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusListenerRef = useRef<(() => void) | null>(null);
  const toastRef = useRef<HTMLDivElement | null>(null);

  const showToast = useCallback(() => {
    if (isSuppressed) return;
    setIsVisible(true);
    requestAnimationFrame(() => setIsEntered(true));
    autoDismissTimerRef.current = setTimeout(() => {
      setIsExiting(true);
    }, 20000);
  }, [isSuppressed]);

  useEffect(() => {
    // Check persistence
    if (!InstallPromptService.shouldShow()) {
      shouldShowRef.current = false;
      return;
    }

    // Check standalone
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      shouldShowRef.current = false;
      return;
    }

    shouldShowRef.current = true;

    // Start delay timer
    delayTimerRef.current = setTimeout(() => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA") {
        // Defer until focus leaves
        const handler = () => {
          document.removeEventListener("focusout", handler);
          focusListenerRef.current = null;
          showToast();
        };
        document.addEventListener("focusout", handler);
        focusListenerRef.current = handler;
      } else {
        showToast();
      }
    }, 2000);

    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
      if (focusListenerRef.current) {
        document.removeEventListener("focusout", focusListenerRef.current);
      }
    };
  }, [showToast]);

  const handleBodyTap = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    setIsExiting(true);
    setTimeout(() => onOpenInstallSheet(), 250);
  }, [onOpenInstallSheet]);

  const handleDismissTap = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    InstallPromptService.recordDismissal();
    setIsExiting(true);
  }, []);

  const handleTransitionEnd = useCallback(() => {
    if (isExiting) {
      setIsVisible(false);
    }
  }, [isExiting]);

  if (!shouldShowRef.current || !isVisible) return null;

  return (
    <div
      ref={toastRef}
      className={`fixed left-4 right-4 z-40 flex items-center gap-3 p-4 rounded-2xl ${isExiting ? "pointer-events-none" : ""
        }`}
      style={{
        bottom: "calc(env(safe-area-inset-bottom) + 92px)",
        backgroundColor: "var(--color-surface-card)",
        border: "1px solid var(--color-border-subtle)",
        boxShadow: "var(--elevation-card)",
        touchAction: "manipulation",
        cursor: "pointer",
        transform: isEntered && !isExiting ? "translateY(0)" : "translateY(100%)",
        transition: isEntered ? "transform 380ms var(--spring-snap)" : "none",
        opacity: isExiting ? 0 : 1,
        transitionProperty: isExiting ? "opacity" : "transform",
        transitionDuration: isExiting ? "400ms" : "380ms",
        transitionTimingFunction: isExiting ? "ease-out" : "var(--spring-snap)",
      }}
      onClick={handleBodyTap}
      onTransitionEnd={handleTransitionEnd}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-brand-green)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <div className="flex-1 min-w-0 flex flex-col">
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Install List Master
        </span>
        <span
          className="text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Add to home screen for offline access
        </span>
      </div>
      <button
        type="button"
        className="flex items-center justify-center w-8 h-8 rounded-full active:scale-[0.9]"
        style={{ touchAction: "manipulation" }}
        onClick={(e) => {
          e.stopPropagation();
          handleDismissTap();
        }}
        aria-label="Dismiss"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-text-secondary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}