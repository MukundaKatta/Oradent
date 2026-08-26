import {
  Calendar,
  Users,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  Stethoscope,
  Image,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

import { clinicalPtBR, ptBR } from "@/i18n";

// ═══════════════════ APPOINTMENT TYPES ═══════════════════

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = { ...clinicalPtBR.appointmentType };

export const APPOINTMENT_TYPE_COLORS: Record<string, string> = {
  EXAM: "#14b8a6",
  CLEANING: "#22c55e",
  FILLING: "#3b82f6",
  CROWN: "#f59e0b",
  ROOT_CANAL: "#8b5cf6",
  EXTRACTION: "#64748b",
  IMPLANT: "#06b6d4",
  COSMETIC: "#ec4899",
  EMERGENCY: "#ef4444",
  CONSULTATION: "#6366f1",
  FOLLOW_UP: "#a855f7",
  OTHER: "#78716c",
};

export const APPOINTMENT_TYPE_DURATIONS: Record<string, number> = {
  EXAM: 30,
  CLEANING: 60,
  FILLING: 45,
  CROWN: 90,
  ROOT_CANAL: 90,
  EXTRACTION: 60,
  IMPLANT: 120,
  COSMETIC: 60,
  EMERGENCY: 30,
  CONSULTATION: 30,
  FOLLOW_UP: 20,
  OTHER: 30,
};

// ═══════════════════ APPOINTMENT STATUS ═══════════════════

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = { ...clinicalPtBR.appointmentStatus };

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "#3b82f6",
  CONFIRMED: "#14b8a6",
  CHECKED_IN: "#f59e0b",
  IN_CHAIR: "#8b5cf6",
  COMPLETED: "#22c55e",
  CANCELLED: "#64748b",
  NO_SHOW: "#ef4444",
  RESCHEDULED: "#6366f1",
};

// ═══════════════════ TOOTH CONDITIONS ═══════════════════

export const TOOTH_CONDITION_TYPES: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  cavity: { label: clinicalPtBR.dentalCondition.cavity, color: "#ef4444", icon: "circle" },
  filling: { label: clinicalPtBR.dentalCondition.filling, color: "#3b82f6", icon: "square" },
  filling_composite: { label: clinicalPtBR.dentalCondition.filling_composite, color: "#3b82f6", icon: "square" },
  filling_amalgam: { label: clinicalPtBR.dentalCondition.filling_amalgam, color: "#64748b", icon: "square" },
  crown: { label: clinicalPtBR.dentalCondition.crown, color: "#f59e0b", icon: "pentagon" },
  root_canal: { label: clinicalPtBR.dentalCondition.root_canal, color: "#8b5cf6", icon: "triangle" },
  extraction_needed: { label: clinicalPtBR.dentalCondition.extraction_needed, color: "#ef4444", icon: "x" },
  missing: { label: clinicalPtBR.dentalCondition.missing, color: "#64748b", icon: "x" },
  implant: { label: clinicalPtBR.dentalCondition.implant, color: "#06b6d4", icon: "diamond" },
  bridge: { label: clinicalPtBR.dentalCondition.bridge, color: "#f97316", icon: "link" },
  veneer: { label: clinicalPtBR.dentalCondition.veneer, color: "#ec4899", icon: "rectangle" },
  sealant: { label: clinicalPtBR.dentalCondition.sealant, color: "#22c55e", icon: "shield" },
  watch: { label: clinicalPtBR.dentalCondition.watch, color: "#eab308", icon: "eye" },
  fracture: { label: clinicalPtBR.dentalCondition.fracture, color: "#ef4444", icon: "zap" },
  abscess: { label: clinicalPtBR.dentalCondition.abscess, color: "#dc2626", icon: "alert" },
  impacted: { label: clinicalPtBR.dentalCondition.impacted, color: "#78716c", icon: "arrow-down" },
  periodontal: { label: clinicalPtBR.dentalCondition.periodontal, color: "#f97316", icon: "waves" },
};

export const TOOTH_SURFACES = ["M", "O", "D", "B", "L"] as const;
export type ToothSurface = (typeof TOOTH_SURFACES)[number];

export const TOOTH_SURFACE_LABELS: Record<string, string> = { ...clinicalPtBR.toothSurface };

// ═══════════════════ CDT CODE CATEGORIES ═══════════════════

export const CDT_CATEGORIES: Record<string, { label: string; range: string }> = {
  diagnostic: { label: clinicalPtBR.cdtCategory.diagnostic, range: "D0100-D0999" },
  preventive: { label: clinicalPtBR.cdtCategory.preventive, range: "D1000-D1999" },
  restorative: { label: clinicalPtBR.cdtCategory.restorative, range: "D2000-D2999" },
  endodontics: { label: clinicalPtBR.cdtCategory.endodontics, range: "D3000-D3999" },
  periodontics: { label: clinicalPtBR.cdtCategory.periodontics, range: "D4000-D4999" },
  prosthodontics_removable: { label: clinicalPtBR.cdtCategory.prosthodontics_removable, range: "D5000-D5899" },
  maxillofacial: { label: clinicalPtBR.cdtCategory.maxillofacial, range: "D5900-D5999" },
  implant: { label: clinicalPtBR.cdtCategory.implant, range: "D6000-D6199" },
  prosthodontics_fixed: { label: clinicalPtBR.cdtCategory.prosthodontics_fixed, range: "D6200-D6999" },
  oral_surgery: { label: clinicalPtBR.cdtCategory.oral_surgery, range: "D7000-D7999" },
  orthodontics: { label: clinicalPtBR.cdtCategory.orthodontics, range: "D8000-D8999" },
  adjunctive: { label: clinicalPtBR.cdtCategory.adjunctive, range: "D9000-D9999" },
};

// ═══════════════════ INVOICE STATUS ═══════════════════

export const INVOICE_STATUS_LABELS: Record<string, string> = { ...ptBR.invoice.status };

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "#78716c",
  PENDING: "#f59e0b",
  PARTIALLY_PAID: "#3b82f6",
  PAID: "#22c55e",
  OVERDUE: "#ef4444",
  VOID: "#64748b",
  WRITE_OFF: "#a855f7",
};

// ═══════════════════ CLAIM STATUS ═══════════════════

export const CLAIM_STATUS_LABELS: Record<string, string> = { ...ptBR.claim.status };

// ═══════════════════ PROVIDER ROLES ═══════════════════

export const PROVIDER_ROLE_LABELS: Record<string, string> = { ...ptBR.provider.role };

// ═══════════════════ NAVIGATION ═══════════════════

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  children?: { label: string; href: string }[];
  roles?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: ptBR.navigation.schedule,
    href: "/schedule",
    icon: Calendar,
  },
  {
    label: ptBR.navigation.patients,
    href: "/patients",
    icon: Users,
  },
  {
    label: ptBR.navigation.clinical,
    href: "/clinical",
    icon: Stethoscope,
    children: [
      { label: ptBR.navigation.dentalChart, href: "/clinical/chart" },
      { label: ptBR.navigation.treatmentPlans, href: "/clinical/treatment-plans" },
      { label: ptBR.navigation.clinicalNotes, href: "/clinical/notes" },
      { label: ptBR.navigation.perioChart, href: "/clinical/perio" },
    ],
  },
  {
    label: ptBR.navigation.imaging,
    href: "/imaging",
    icon: Image,
  },
  {
    label: ptBR.navigation.billing,
    href: "/billing",
    icon: DollarSign,
    children: [
      { label: ptBR.navigation.invoices, href: "/billing/invoices" },
      { label: ptBR.navigation.payments, href: "/billing/payments" },
      { label: ptBR.navigation.insuranceClaims, href: "/billing/claims" },
      { label: ptBR.navigation.feeSchedule, href: "/billing/fee-schedule" },
    ],
  },
  {
    label: ptBR.navigation.reports,
    href: "/reports",
    icon: BarChart3,
    children: [
      { label: ptBR.navigation.production, href: "/reports/production" },
      { label: ptBR.navigation.collections, href: "/reports/collections" },
      { label: ptBR.navigation.appointments, href: "/reports/appointments" },
      { label: ptBR.navigation.patients, href: "/reports/patients" },
    ],
    roles: ["OWNER", "DENTIST"],
  },
  {
    label: ptBR.navigation.documents,
    href: "/documents",
    icon: FileText,
  },
  {
    label: ptBR.navigation.tasks,
    href: "/tasks",
    icon: ClipboardList,
  },
  {
    label: ptBR.navigation.settings,
    href: "/settings",
    icon: Settings,
    roles: ["OWNER"],
    children: [
      { label: ptBR.navigation.practice, href: "/settings/practice" },
      { label: ptBR.navigation.providers, href: "/settings/providers" },
      { label: ptBR.navigation.chairs, href: "/settings/chairs" },
      { label: ptBR.navigation.feeSchedule, href: "/settings/fee-schedule" },
      { label: ptBR.navigation.integrations, href: "/settings/integrations" },
    ],
  },
];

// ═══════════════════ MISC ═══════════════════

export const GENDER_OPTIONS = [
  { value: "male", label: ptBR.patient.gender.male },
  { value: "female", label: ptBR.patient.gender.female },
  { value: "other", label: ptBR.patient.gender.other },
  { value: "prefer_not_to_say", label: ptBR.patient.gender.prefer_not_to_say },
];

export const US_STATES = [
  { value: "AL", label: ptBR.usState.AL },
  { value: "AK", label: ptBR.usState.AK },
  { value: "AZ", label: ptBR.usState.AZ },
  { value: "AR", label: ptBR.usState.AR },
  { value: "CA", label: ptBR.usState.CA },
  { value: "CO", label: ptBR.usState.CO },
  { value: "CT", label: ptBR.usState.CT },
  { value: "DE", label: ptBR.usState.DE },
  { value: "FL", label: ptBR.usState.FL },
  { value: "GA", label: ptBR.usState.GA },
  { value: "HI", label: ptBR.usState.HI },
  { value: "ID", label: ptBR.usState.ID },
  { value: "IL", label: ptBR.usState.IL },
  { value: "IN", label: ptBR.usState.IN },
  { value: "IA", label: ptBR.usState.IA },
  { value: "KS", label: ptBR.usState.KS },
  { value: "KY", label: ptBR.usState.KY },
  { value: "LA", label: ptBR.usState.LA },
  { value: "ME", label: ptBR.usState.ME },
  { value: "MD", label: ptBR.usState.MD },
  { value: "MA", label: ptBR.usState.MA },
  { value: "MI", label: ptBR.usState.MI },
  { value: "MN", label: ptBR.usState.MN },
  { value: "MS", label: ptBR.usState.MS },
  { value: "MO", label: ptBR.usState.MO },
  { value: "MT", label: ptBR.usState.MT },
  { value: "NE", label: ptBR.usState.NE },
  { value: "NV", label: ptBR.usState.NV },
  { value: "NH", label: ptBR.usState.NH },
  { value: "NJ", label: ptBR.usState.NJ },
  { value: "NM", label: ptBR.usState.NM },
  { value: "NY", label: ptBR.usState.NY },
  { value: "NC", label: ptBR.usState.NC },
  { value: "ND", label: ptBR.usState.ND },
  { value: "OH", label: ptBR.usState.OH },
  { value: "OK", label: ptBR.usState.OK },
  { value: "OR", label: ptBR.usState.OR },
  { value: "PA", label: ptBR.usState.PA },
  { value: "RI", label: ptBR.usState.RI },
  { value: "SC", label: ptBR.usState.SC },
  { value: "SD", label: ptBR.usState.SD },
  { value: "TN", label: ptBR.usState.TN },
  { value: "TX", label: ptBR.usState.TX },
  { value: "UT", label: ptBR.usState.UT },
  { value: "VT", label: ptBR.usState.VT },
  { value: "VA", label: ptBR.usState.VA },
  { value: "WA", label: ptBR.usState.WA },
  { value: "WV", label: ptBR.usState.WV },
  { value: "WI", label: ptBR.usState.WI },
  { value: "WY", label: ptBR.usState.WY },
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = { ...ptBR.payment.method };

export const ITEMS_PER_PAGE = 25;
