import { describe, expect, it } from "vitest";

import { clinicalPtBR, t } from "./index";

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
});
