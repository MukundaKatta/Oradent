import { describe, expect, it } from "vitest";
import { t } from "@/i18n";

describe("patient clinical workflow translations", () => {
  it("provides Portuguese labels for patient, clinical chart, and imaging workflows", () => {
    expect(t("patientWorkflow.list.title")).toBe("Pacientes");
    expect(t("patientWorkflow.chart.dentalChart")).toBe("Odontograma");
    expect(t("patientWorkflow.imaging.uploadImage")).toBe("Enviar imagem");
  });
});
