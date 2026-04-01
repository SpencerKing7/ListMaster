/**
 * PageTransitionWrapper provides iOS-style push/pop slide transitions for route
 * changes, mirroring UINavigationController behavior.
 *
 * Architecture: React keys each route page by location.key, so every navigation
 * mounts a brand-new element. A snapshot of the previous page is kept alive just
 * long enough to play its exit animation — the two layers are z-stacked so they
 * animate independently.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router";

interface PageTransitionWrapperProps {
  children: ReactNode;
}

// MARK: - Route depth helper

function getRouteDepth(pathname: string): number {
  return pathname.split("/").filter(Boolean).length;
}

// MARK: - Component

const PageTransitionWrapper = ({ children }: PageTransitionWrapperProps) => {
  const location = useLocation();

  // Snapshot of the previous page's rendered children kept alive during exit.
  const [prevChildren, setPrevChildren] = useState<ReactNode>(null);
  const [prevExitClass, setPrevExitClass] = useState("");
  const [enterClass, setEnterClass] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Track the depth of the previous route to determine direction.
  const prevDepthRef = useRef(getRouteDepth(location.pathname));
  const prevKeyRef = useRef(location.key);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // First render — nothing to transition from.
    if (prevKeyRef.current === location.key) return;

    const currentDepth = getRouteDepth(location.pathname);
    const prevDepth = prevDepthRef.current;

    let newEnterClass = "";
    let newExitClass = "";

    if (currentDepth >= prevDepth) {
      // Forward push
      newEnterClass = "page-enter-from-right";
      newExitClass = "page-exit-to-left";
    } else {
      // Back pop
      newEnterClass = "page-enter-from-left";
      newExitClass = "page-exit-to-right";
    }

    // Capture the outgoing page before children updates.
    setPrevChildren(children);
    setPrevExitClass(newExitClass);
    setEnterClass(newEnterClass);
    setIsTransitioning(true);

    // Update refs for next transition.
    prevDepthRef.current = currentDepth;
    prevKeyRef.current = location.key;

    // Clear the outgoing snapshot once the animation finishes.
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPrevChildren(null);
      setPrevExitClass("");
      setEnterClass("");
      setIsTransitioning(false);
    }, 380); // Match --duration-page

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      {/* Outgoing page — plays exit animation then is removed */}
      {isTransitioning && prevChildren && (
        <div
          key="prev"
          className={`absolute inset-0 ${prevExitClass}`}
          style={{ willChange: "transform" }}
        >
          {prevChildren}
        </div>
      )}

      {/* Incoming page — plays enter animation, sits on top */}
      <div
        key={location.key}
        className={`relative w-full h-full ${isTransitioning ? enterClass : ""}`}
        style={{ willChange: isTransitioning ? "transform" : "auto" }}
      >
        {children}
      </div>
    </div>
  );
};

export default PageTransitionWrapper;