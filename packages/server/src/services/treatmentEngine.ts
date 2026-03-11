import { callClaude } from './claudeAI';
import { logger } from '../utils/logger';
import type { ToothCondition, MedicalHistory, InsuranceInfo, FeeScheduleItem } from '@prisma/client';

const TREATMENT_SUGGESTION_PROMPT = `You are an expert dental treatment planning AI assistant. Based on the following patient dental chart conditions and medical history, suggest a comprehensive treatment plan.

Provide a treatment plan organized by priority:
Priority 1 — Urgent (pain, infection, structural failure)
Priority 2 — Soon (progressive conditions, at-risk teeth)
Priority 3 — Elective (cosmetic, optimization)

For each item provide:
- tooth_number, surfaces
- cdt_code, description
- rationale (why this treatment)
- estimated_fee
- insurance_coverage_estimate
- alternatives (other treatment options with pros/cons)
- sequencing_notes (what must come before/after)

Return ONLY valid JSON: { "treatment_plan": [...], "summary": "...", "total_estimated_cost": 0, "total_insurance_estimate": 0 }`;

export async function suggestTreatment(
  dentalChart: ToothCondition[],
  medicalHistory: MedicalHistory | null,
  insurance: InsuranceInfo | null,
  feeSchedule: FeeScheduleItem[]
): Promise<unknown> {
  try {
    const conditions = dentalChart.map((t) => ({
      tooth: t.toothNumber,
      conditions: t.conditions,
      status: t.status,
    }));

    const medicalAlerts: string[] = [];
    if (medicalHistory) {
      const allergies = medicalHistory.allergies as string[];
      const meds = medicalHistory.medications as string[];
      const conds = medicalHistory.conditions as string[];
      if (allergies?.length) medicalAlerts.push(`Allergies: ${allergies.join(', ')}`);
      if (meds?.length) medicalAlerts.push(`Medications: ${meds.join(', ')}`);
      if (conds?.length) medicalAlerts.push(`Conditions: ${conds.join(', ')}`);
      if (medicalHistory.isPregnant) medicalAlerts.push('Patient is pregnant');
    }

    const coverage = insurance
      ? {
          company: insurance.company,
          coveragePercent: insurance.coveragePercent,
          remainingBenefit: insurance.remainingBenefit,
          deductible: insurance.deductible,
          deductibleMet: insurance.deductibleMet,
        }
      : null;

    const relevantFees = feeSchedule.slice(0, 50).map((f) => ({
      code: f.cdtCode,
      description: f.description,
      fee: f.fee,
    }));

    const userMessage = `
Patient dental conditions: ${JSON.stringify(conditions)}
Medical history alerts: ${medicalAlerts.join('; ') || 'None'}
Insurance coverage: ${coverage ? JSON.stringify(coverage) : 'No insurance'}
Fee schedule (sample): ${JSON.stringify(relevantFees)}
    `.trim();

    const response = await callClaude(TREATMENT_SUGGESTION_PROMPT, userMessage);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI treatment response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error(error, 'Treatment suggestion failed');
    throw error;
  }
}
