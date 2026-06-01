import { useEffect, useRef } from "react";

/**
 * setInterval hook with dynamic delay and automatic cleanup.
 * Pass `null` as the delay to pause the interval.
 *
 * @example
 * // Poll every 5 seconds
 * useInterval(() => {
 *   fetchNewAppointments();
 * }, 5000);
 *
 * // Pause by setting delay to null
 * useInterval(callback, isPaused ? null : 1000);
 */
export function useInterval(
  callback: () => void,
  delay: number | null
): void {
  const savedCallback = useRef<() => void>(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) return;

    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}
