import { useState, useEffect, useMemo } from "react";

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
}

/**
 * Countdown timer hook that counts down to a target date.
 * Returns the remaining time broken down into days, hours, minutes, and seconds.
 *
 * @example
 * const { days, hours, minutes, seconds, isExpired } = useCountdown(
 *   new Date("2025-12-31T23:59:59")
 * );
 */
export function useCountdown(targetDate: Date | string): CountdownResult {
  const target = useMemo(
    () => (typeof targetDate === "string" ? new Date(targetDate) : targetDate),
    [targetDate]
  );

  const calculateTimeLeft = (): CountdownResult => {
    const now = new Date().getTime();
    const difference = target.getTime() - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isExpired: true,
      };
    }

    const totalSeconds = Math.floor(difference / 1000);

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      totalSeconds,
      isExpired: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState<CountdownResult>(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      const result = calculateTimeLeft();
      setTimeLeft(result);

      if (result.isExpired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return timeLeft;
}
