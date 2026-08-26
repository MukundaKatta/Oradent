import { differenceInYears, format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const NOT_INFORMED = "Não informado";

/**
 * Format a number as USD currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string or Date object as a readable date (e.g., "Jan 15, 2025").
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return NOT_INFORMED;
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

/**
 * Format a date string or Date object as a readable date with time (e.g., "Jan 15, 2025 2:30 PM").
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return NOT_INFORMED;
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

/**
 * Format a date as a short time (e.g., "2:30 PM").
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return NOT_INFORMED;
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "HH:mm", { locale: ptBR });
}

/**
 * Format a date as relative time (e.g., "3 days ago").
 */
export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return NOT_INFORMED;
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}

/**
 * Format a US phone number (e.g., "(555) 123-4567").
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return NOT_INFORMED;
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Get initials from a full name (e.g., "John Doe" -> "JD").
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Calculate a patient's age from their date of birth.
 */
export function getPatientAge(dob: string | Date | null | undefined): number | null {
  if (!dob) return null;
  const d = typeof dob === "string" ? parseISO(dob) : dob;
  return differenceInYears(new Date(), d);
}

/**
 * Format a patient's age with label (e.g., "34 yrs").
 */
export function formatAge(dob: string | Date | null | undefined): string {
  const age = getPatientAge(dob);
  if (age === null) return NOT_INFORMED;
  return `${age} ${age === 1 ? "ano" : "anos"}`;
}

/**
 * Format a tooth number with universal numbering (1-32 for permanent, A-T for deciduous).
 */
export function formatToothNumber(num: number, isDeciduous: boolean = false): string {
  if (isDeciduous) {
    const letter = String.fromCharCode(64 + num); // 1->A, 2->B, etc.
    return `#${letter}`;
  }
  return `#${num}`;
}

/**
 * Format a patient's full name.
 */
export function formatPatientName(
  firstName: string | undefined,
  lastName: string | undefined
): string {
  if (!firstName && !lastName) return NOT_INFORMED;
  return `${firstName || ""} ${lastName || ""}`.trim();
}

/**
 * Format file size in human-readable format.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 bytes";
  const k = 1024;
  const sizes = ["bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value)} ${sizes[i]}`;
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}
