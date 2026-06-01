import { useState, useEffect, useRef } from "react";

/**
 * Returns the current vertical scroll position (window.scrollY) using
 * requestAnimationFrame for throttling to maintain smooth performance.
 *
 * @example
 * const scrollY = useScrollPosition();
 * const showBackToTop = scrollY > 400;
 */
export function useScrollPosition(): number {
  const [scrollY, setScrollY] = useState<number>(
    typeof window !== "undefined" ? window.scrollY : 0
  );
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Set initial scroll position on mount
    setScrollY(window.scrollY);

    const handleScroll = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return scrollY;
}
