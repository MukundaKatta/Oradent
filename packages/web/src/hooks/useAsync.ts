import { useState, useCallback, useRef, useEffect } from "react";

export interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export interface UseAsyncResult<T, A extends unknown[]> extends AsyncState<T> {
  execute: (...args: A) => Promise<T | null>;
  reset: () => void;
}

/**
 * Execute an async function with loading, error, and data states.
 * The async function is only executed when `execute()` is called.
 *
 * @example
 * const { data, isLoading, error, execute } = useAsync(
 *   async (id: string) => {
 *     const res = await fetch(`/api/patients/${id}`);
 *     return res.json();
 *   }
 * );
 *
 * // Later:
 * await execute("patient-123");
 */
export function useAsync<T, A extends unknown[] = []>(
  asyncFn: (...args: A) => Promise<T>
): UseAsyncResult<T, A> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  // Track whether the component is still mounted
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: A): Promise<T | null> => {
      setState({ data: null, error: null, isLoading: true });
      try {
        const result = await asyncFn(...args);
        if (mountedRef.current) {
          setState({ data: result, error: null, isLoading: false });
        }
        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error(String(err));
        if (mountedRef.current) {
          setState({ data: null, error, isLoading: false });
        }
        return null;
      }
    },
    [asyncFn]
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return { ...state, execute, reset };
}
