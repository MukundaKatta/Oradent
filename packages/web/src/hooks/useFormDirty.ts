import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Track whether form values have changed from their initial values.
 * Optionally warns the user via `beforeunload` when navigating away
 * with unsaved changes.
 *
 * @example
 * const { isDirty, setValues, reset } = useFormDirty(
 *   { name: "John", email: "john@example.com" },
 *   { warnOnUnload: true }
 * );
 */
export function useFormDirty<T extends Record<string, unknown>>(
  initialValues: T,
  options: { warnOnUnload?: boolean } = {}
) {
  const { warnOnUnload = true } = options;
  const initialRef = useRef<T>(initialValues);
  const [currentValues, setCurrentValues] = useState<T>(initialValues);

  const isDirty = !shallowEqual(initialRef.current, currentValues);

  // beforeunload warning
  useEffect(() => {
    if (!warnOnUnload || !isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, warnOnUnload]);

  const setValues = useCallback(
    (values: Partial<T> | ((prev: T) => T)) => {
      if (typeof values === "function") {
        setCurrentValues(values);
      } else {
        setCurrentValues((prev) => ({ ...prev, ...values }));
      }
    },
    []
  );

  const reset = useCallback(
    (newInitial?: T) => {
      if (newInitial) {
        initialRef.current = newInitial;
        setCurrentValues(newInitial);
      } else {
        setCurrentValues(initialRef.current);
      }
    },
    []
  );

  return { isDirty, currentValues, setValues, reset } as const;
}

function shallowEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}
