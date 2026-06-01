import { useState, useEffect, useRef, useCallback } from "react";

export interface WindowSize {
  width: number;
  height: number;
}

/**
 * Returns the current window dimensions { width, height } with a debounced
 * resize listener to avoid excessive re-renders.
 *
 * @param debounceMs - Debounce delay in milliseconds (default 150)
 *
 * @example
 * const { width, height } = useWindowSize();
 * const isMobile = width < 768;
 */
export function useWindowSize(debounceMs: number = 150): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleResize = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, debounceMs);
  }, [debounceMs]);

  useEffect(() => {
    // Set initial size on mount (SSR safety)
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleResize]);

  return size;
}
