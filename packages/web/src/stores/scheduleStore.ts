import { create } from "zustand";

export type ScheduleView = "day" | "week" | "month";

interface ScheduleState {
  currentDate: Date;
  view: ScheduleView;
  selectedProviderId: string | null;
  selectedChairId: string | null;

  // Actions
  setDate: (date: Date) => void;
  setView: (view: ScheduleView) => void;
  nextPeriod: () => void;
  prevPeriod: () => void;
  today: () => void;
  setSelectedProvider: (providerId: string | null) => void;
  setSelectedChair: (chairId: string | null) => void;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function shiftDate(date: Date, view: ScheduleView, direction: 1 | -1): Date {
  switch (view) {
    case "day":
      return addDays(date, direction);
    case "week":
      return addDays(date, 7 * direction);
    case "month":
      return addMonths(date, direction);
  }
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  currentDate: new Date(),
  view: "day",
  selectedProviderId: null,
  selectedChairId: null,

  setDate: (date: Date) => set({ currentDate: date }),

  setView: (view: ScheduleView) => set({ view }),

  nextPeriod: () => {
    const { currentDate, view } = get();
    set({ currentDate: shiftDate(currentDate, view, 1) });
  },

  prevPeriod: () => {
    const { currentDate, view } = get();
    set({ currentDate: shiftDate(currentDate, view, -1) });
  },

  today: () => set({ currentDate: new Date() }),

  setSelectedProvider: (providerId: string | null) =>
    set({ selectedProviderId: providerId }),

  setSelectedChair: (chairId: string | null) =>
    set({ selectedChairId: chairId }),
}));
