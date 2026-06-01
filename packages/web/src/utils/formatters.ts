import { format, formatDistanceToNow, parseISO } from "date-fns";

/**
 * Format a US phone number as (XXX) XXX-XXXX.
 * Handles 10-digit and 11-digit (with leading 1) numbers.
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Format a Social Security Number as XXX-XX-XXXX.
 */
export function formatSSN(ssn: string): string {
  const cleaned = ssn.replace(/\D/g, "");
  if (cleaned.length !== 9) return ssn;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
}

/**
 * Format a value in cents as a USD currency string.
 *
 * @example
 * formatCurrency(1599) // "$15.99"
 * formatCurrency(0)    // "$0.00"
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Format a date with an optional format string.
 * Uses date-fns format tokens.
 *
 * @param date - ISO date string or Date object
 * @param fmt - date-fns format string (default "MMM d, yyyy")
 *
 * @example
 * formatDate("2025-01-15")             // "Jan 15, 2025"
 * formatDate("2025-01-15", "yyyy-MM-dd") // "2025-01-15"
 */
export function formatDate(
  date: string | Date,
  fmt: string = "MMM d, yyyy"
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt);
}

/**
 * Format a date as relative time (e.g. "3 days ago", "in 2 hours").
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}
