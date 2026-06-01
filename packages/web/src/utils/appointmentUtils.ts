import type { AppointmentStatus } from "@/types";

/**
 * Get the display color (hex) for an appointment status.
 */
export function getStatusColor(status: AppointmentStatus): string {
  const colors: Record<AppointmentStatus, string> = {
    SCHEDULED: "#3b82f6",
    CONFIRMED: "#14b8a6",
    CHECKED_IN: "#f59e0b",
    IN_CHAIR: "#8b5cf6",
    COMPLETED: "#22c55e",
    CANCELLED: "#64748b",
    NO_SHOW: "#ef4444",
    RESCHEDULED: "#6366f1",
  };
  return colors[status] ?? "#78716c";
}

/**
 * Get the human-readable label for an appointment status.
 */
export function getStatusLabel(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    SCHEDULED: "Scheduled",
    CONFIRMED: "Confirmed",
    CHECKED_IN: "Checked In",
    IN_CHAIR: "In Chair",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    NO_SHOW: "No Show",
    RESCHEDULED: "Rescheduled",
  };
  return labels[status] ?? status;
}

/**
 * Valid status transitions for appointments.
 */
const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  SCHEDULED: ["CONFIRMED", "CANCELLED", "RESCHEDULED"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED", "RESCHEDULED", "NO_SHOW"],
  CHECKED_IN: ["IN_CHAIR", "CANCELLED"],
  IN_CHAIR: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: ["SCHEDULED"],
  NO_SHOW: ["SCHEDULED"],
  RESCHEDULED: ["SCHEDULED", "CONFIRMED"],
};

/**
 * Check if a status transition is allowed.
 */
export function canTransitionTo(
  from: AppointmentStatus,
  to: AppointmentStatus
): boolean {
  return (STATUS_TRANSITIONS[from] ?? []).includes(to);
}

export interface TimeSlot {
  start: Date;
  end: Date;
  label: string;
}

/**
 * Generate time slots between a start and end time with a given duration.
 *
 * @param startTime - Start of the day (e.g. "08:00")
 * @param endTime - End of the day (e.g. "17:00")
 * @param durationMinutes - Duration of each slot in minutes
 * @param date - The date for the slots (defaults to today)
 */
export function getTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
  date: Date = new Date()
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const baseDate = new Date(date);
  baseDate.setHours(0, 0, 0, 0);

  const startMs = (startHour * 60 + startMin) * 60 * 1000;
  const endMs = (endHour * 60 + endMin) * 60 * 1000;
  const durationMs = durationMinutes * 60 * 1000;

  for (let current = startMs; current + durationMs <= endMs; current += durationMs) {
    const slotStart = new Date(baseDate.getTime() + current);
    const slotEnd = new Date(baseDate.getTime() + current + durationMs);

    const formatTime = (d: Date) =>
      d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

    slots.push({
      start: slotStart,
      end: slotEnd,
      label: `${formatTime(slotStart)} - ${formatTime(slotEnd)}`,
    });
  }

  return slots;
}

export interface AppointmentSlot {
  startTime: string;
  endTime: string;
}

/**
 * Check if a given time slot is available (does not overlap with existing appointments).
 */
export function isSlotAvailable(
  slot: AppointmentSlot,
  appointments: AppointmentSlot[]
): boolean {
  const slotStart = new Date(slot.startTime).getTime();
  const slotEnd = new Date(slot.endTime).getTime();

  return !appointments.some((apt) => {
    const aptStart = new Date(apt.startTime).getTime();
    const aptEnd = new Date(apt.endTime).getTime();
    // Overlap exists if one starts before the other ends and vice versa
    return slotStart < aptEnd && slotEnd > aptStart;
  });
}
