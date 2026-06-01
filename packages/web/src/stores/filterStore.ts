import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PatientStatus, AppointmentStatus, InvoiceStatus } from "@/types";

export interface PatientFilters {
  search: string;
  status: PatientStatus | "ALL";
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface AppointmentFilters {
  providerId: string | null;
  status: AppointmentStatus | "ALL";
  dateRange: { start: string; end: string } | null;
  type: string | "ALL";
}

export interface BillingFilters {
  status: InvoiceStatus | "ALL";
  dateRange: { start: string; end: string } | null;
  search: string;
  minAmount: number | null;
  maxAmount: number | null;
}

interface FilterState {
  patientFilters: PatientFilters;
  appointmentFilters: AppointmentFilters;
  billingFilters: BillingFilters;

  setPatientFilters: (filters: Partial<PatientFilters>) => void;
  resetPatientFilters: () => void;

  setAppointmentFilters: (filters: Partial<AppointmentFilters>) => void;
  resetAppointmentFilters: () => void;

  setBillingFilters: (filters: Partial<BillingFilters>) => void;
  resetBillingFilters: () => void;

  resetAllFilters: () => void;
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
  type: "ALL",
};

const DEFAULT_BILLING_FILTERS: BillingFilters = {
  status: "ALL",
  dateRange: null,
  search: "",
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

      resetPatientFilters: () =>
        set({ patientFilters: { ...DEFAULT_PATIENT_FILTERS } }),

      setAppointmentFilters: (filters) =>
        set((state) => ({
          appointmentFilters: { ...state.appointmentFilters, ...filters },
        })),

      resetAppointmentFilters: () =>
        set({ appointmentFilters: { ...DEFAULT_APPOINTMENT_FILTERS } }),

      setBillingFilters: (filters) =>
        set((state) => ({
          billingFilters: { ...state.billingFilters, ...filters },
        })),

      resetBillingFilters: () =>
        set({ billingFilters: { ...DEFAULT_BILLING_FILTERS } }),

      resetAllFilters: () =>
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
