import { useState, useEffect, useCallback } from "react";

/**
 * useState that persists to localStorage with SSR safety.
 * On the server, the initial value is used. On the client, the stored value is
 * hydrated after mount to avoid hydration mismatches.
 *
 * @example
 * const [name, setName] = useLocalStorageState("patient-name", "");
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount (SSR safety)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch {
      // If JSON.parse fails or localStorage is unavailable, keep initial value
    }
    setHydrated(true);
  }, [key]);

  // Persist to localStorage whenever storedValue changes (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // localStorage might be full or unavailable
    }
  }, [key, storedValue, hydrated]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) =>
        value instanceof Function ? value(prev) : value
      );
    },
    []
  );

  const removeValue = useCallback(() => {
    setStoredValue(initialValue);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
