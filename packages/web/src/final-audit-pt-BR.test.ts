import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");
}

describe("auditoria final de textos visíveis pt-BR", () => {
  it("localiza o histórico de tratamentos sem alterar os status internos", () => {
    const timeline = source("./components/treatments/TreatmentTimeline.tsx");

    expect(timeline).toContain("clinicalPtBR.treatmentPlanStatus.COMPLETED");
    expect(timeline).toContain("clinicalPtBR.treatmentPlanStatus.IN_PROGRESS");
    expect(timeline).toContain("clinicalPtBR.treatmentPlanStatus.PROPOSED");
    expect(timeline).not.toContain("label: 'Completed'");
    expect(timeline).not.toContain("label: 'In Progress'");
    expect(timeline).not.toContain("label: 'Planned'");
    expect(timeline).not.toContain('procedure{');
    expect(timeline).not.toContain('<span>Tooth #');
    expect(timeline).not.toContain('<span>Surface:');
    expect(timeline).not.toContain('<span>Provider:');
  });

  it("cobre abas, formulários e metadados com textos pt-BR", () => {
    const settings = source("./app/(dashboard)/settings/page.tsx");
    const invoice = source("./components/billing/CreateInvoice.tsx");
    const claim = source("./components/billing/InsuranceClaimForm.tsx");
    const layout = source("./app/layout.tsx");

    expect(settings).toContain("ptBR.settings.tabs.practice");
    expect(settings).toContain("ptBR.settings.tabs.preferences");
    expect(settings).not.toContain("label: 'Team'");
    expect(settings).not.toContain("label: 'Chairs'");
    expect(settings).not.toContain("label: 'Practice Info'");
    expect(settings).not.toContain("label: 'Preferences'");
    expect(invoice).not.toContain("'Fix item errors'");
    expect(claim).not.toContain('placeholder="e.g.');
    expect(layout).toContain("Oradent | Gestão de clínicas odontológicas");
  });
});
