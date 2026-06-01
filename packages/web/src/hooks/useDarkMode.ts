import { useState, useEffect, useCallback } from "react";

/**
 * Toggle dark mode, persist the preference to localStorage, and manage the
 * "dark" class on the <html> element for Tailwind CSS dark mode.
 *
 * @example
 * const { isDark, toggle, enable, disable } = useDarkMode();
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean>(false);

  // Hydrate from localStorage or system preference on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("oradent-dark-mode");
      if (stored !== null) {
        setIsDark(JSON.parse(stored) as boolean);
      } else {
        // Fall back to system preference
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        setIsDark(prefersDark);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Sync the dark class and localStorage whenever isDark changes
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      window.localStorage.setItem("oradent-dark-mode", JSON.stringify(isDark));
    } catch {
      // Ignore
    }
  }, [isDark]);

  const toggle = useCallback(() => setIsDark((prev) => !prev), []);
  const enable = useCallback(() => setIsDark(true), []);
  const disable = useCallback(() => setIsDark(false), []);

  return { isDark, toggle, enable, disable } as const;
}
