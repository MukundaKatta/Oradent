import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PatientFilters {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface AppointmentFilters {
  providerId: string | null;
  status: string;
  dateRange: { start: string; end: string } | null;
  view: "day" | "week" | "month";
}

export interface BillingFilters {
  status: string;
  dateRange: { start: string; end: string } | null;
  minAmount: number | null;
  maxAmount: number | null;
}

interface FilterState {
  patientFilters: PatientFilters;
  appointmentFilters: AppointmentFilters;
  billingFilters: BillingFilters;

  setPatientFilters: (filters: Partial<PatientFilters>) => void;
  setAppointmentFilters: (filters: Partial<AppointmentFilters>) => void;
  setBillingFilters: (filters: Partial<BillingFilters>) => void;
  resetFilters: () => void;
}

const DEFAULT_PATIENT_FILTERS: PatientFilters = {
  search: "",
  status: "ALL",
  sortBy: "lastName",
  sortOrder: "asc",
};

const DEFAULT_APPOINTMENT_FILTERS: AppointmentFilters = {
  providerId: null,
  status: "ALL",
  dateRange: null,
  view: "day",
};

const DEFAULT_BILLING_FILTERS: BillingFilters = {
  status: "ALL",
  dateRange: null,
  minAmount: null,
  maxAmount: null,
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      patientFilters: { ...DEFAULT_PATIENT_FILTERS },
      appointmentFilters: { ...DEFAULT_APPOINTMENT_FILTERS },
      billingFilters: { ...DEFAULT_BILLING_FILTERS },

      setPatientFilters: (filters) =>
        set((state) => ({
          patientFilters: { ...state.patientFilters, ...filters },
        })),

      setAppointmentFilters: (filters) =>
        set((state) => ({
          appointmentFilters: { ...state.appointmentFilters, ...filters },
        })),

      setBillingFilters: (filters) =>
        set((state) => ({
          billingFilters: { ...state.billingFilters, ...filters },
        })),

      resetFilters: () =>
        set({
          patientFilters: { ...DEFAULT_PATIENT_FILTERS },
          appointmentFilters: { ...DEFAULT_APPOINTMENT_FILTERS },
          billingFilters: { ...DEFAULT_BILLING_FILTERS },
        }),
    }),
    {
      name: "oradent-filter-store",
    }
  )
);
