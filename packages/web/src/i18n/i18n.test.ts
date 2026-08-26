import { describe, expect, it } from "vitest";

import { clinicalPtBR, ptBR, t } from "./index";
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
  CDT_CATEGORIES,
  CLAIM_STATUS_LABELS,
  GENDER_OPTIONS,
  INVOICE_STATUS_LABELS,
  NAV_ITEMS,
  PAYMENT_METHOD_LABELS,
  PROVIDER_ROLE_LABELS,
  TOOTH_CONDITION_TYPES,
  TOOTH_SURFACE_LABELS,
  US_STATES,
} from "@/lib/constants";

describe("catálogos pt-BR", () => {
  it("traduz status de consulta", () => {
    expect(clinicalPtBR.appointmentStatus.COMPLETED).toBe("Concluída");
    expect(Object.values(clinicalPtBR.appointmentStatus).every(Boolean)).toBe(true);
  });

  it("usa fallback para chave desconhecida", () => {
    expect(t("clinical.appointmentStatus.UNKNOWN", "Desconhecida")).toBe("Desconhecida");
  });

  it("humaniza caminhos desconhecidos sem fallback explícito", () => {
    expect(t("patients.prefer_not_to_say")).toBe("Prefer not to say");
  });

  it("mantém os rótulos legados conectados aos catálogos pt-BR", () => {
    expect(APPOINTMENT_TYPE_LABELS.EXAM).toBe(clinicalPtBR.appointmentType.EXAM);
    expect(APPOINTMENT_STATUS_LABELS.COMPLETED).toBe(clinicalPtBR.appointmentStatus.COMPLETED);
    expect(TOOTH_CONDITION_TYPES.cavity.label).toBe(clinicalPtBR.dentalCondition.cavity);
    expect(TOOTH_SURFACE_LABELS.B).toBe(clinicalPtBR.toothSurface.B);
    expect(CDT_CATEGORIES.diagnostic.label).toBe(clinicalPtBR.cdtCategory.diagnostic);
    expect(INVOICE_STATUS_LABELS.PAID).toBe(ptBR.invoice.status.PAID);
    expect(CLAIM_STATUS_LABELS.APPROVED).toBe(ptBR.claim.status.APPROVED);
    expect(PAYMENT_METHOD_LABELS.CASH).toBe(ptBR.payment.method.CASH);
    expect(PROVIDER_ROLE_LABELS.OWNER).toBe(ptBR.provider.role.OWNER);
    expect(GENDER_OPTIONS[0].label).toBe(ptBR.patient.gender.male);
    expect(NAV_ITEMS[0].label).toBe(ptBR.navigation.schedule);
    expect(US_STATES.find(({ value }) => value === "CA")?.label).toBe(ptBR.usState.CA);
  });
});
