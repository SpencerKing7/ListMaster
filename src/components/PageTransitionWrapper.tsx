/**
 * PageTransitionWrapper provides iOS-style push/pop slide transitions for route changes,
 * mirroring UINavigationController behavior.
 */
import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router";

interface PageTransitionWrapperProps {
  children: ReactNode;
}

const PageTransitionWrapper = ({ children }: PageTransitionWrapperProps) => {
  const location = useLocation();
  const [transitionClass, setTransitionClass] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Calculate route depth (simple heuristic: more path segments = deeper)
    const getRouteDepth = (pathname: string) => {
      return pathname.split("/").filter(Boolean).length;
    };

    const currentDepth = getRouteDepth(location.pathname);
    const prevDepth = getRouteDepth(window.history.state?.previousPathname || "/");

    let enterClass = "";
    let exitClass = "";

    if (currentDepth > prevDepth) {
      // Forward navigation (push): new page slides in from right
      enterClass = "animate-slide-in-right";
      exitClass = "animate-slide-out-left";
    } else if (currentDepth < prevDepth) {
      // Back navigation (pop): new page slides in from left
      enterClass = "animate-slide-in-left";
      exitClass = "animate-slide-out-right";
    }

    if (enterClass && exitClass) {
      setIsTransitioning(true);
      setTransitionClass(`${enterClass} ${exitClass}`);

      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setTransitionClass("");
      }, 380); // Match --duration-page

      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <div
      className={`relative w-full h-full ${isTransitioning ? transitionClass : ""}`}
      style={{
        // Define the animations using CSS variables
        // These would be better in a CSS file, but for now inline
      }}
    >
      {children}
    </div>
  );
};

export default PageTransitionWrapper;