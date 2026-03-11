import { callClaude } from './claudeAI';
import { logger } from '../utils/logger';
import type { Patient, InsuranceInfo, TreatmentPlan, TreatmentPlanItem, Practice, ToothCondition } from '@prisma/client';

const PRE_AUTH_PROMPT = `You are an expert dental insurance pre-authorization letter writer. Draft a professional pre-authorization letter that maximizes the chance of approval.

Include:
- Proper dental terminology
- Clinical justification for each procedure
- Relevant ICD-10 diagnosis codes
- CDT procedure codes
- Narrative explaining medical necessity
- Supporting clinical findings

Return valid JSON:
{
  "letter": "Full letter text",
  "diagnosis_codes": ["K04.02"],
  "procedure_codes": ["D3330"],
  "clinical_justification": "Summary of medical necessity"
}`;

type PatientWithRelations = Patient & {
  insurancePrimary: InsuranceInfo | null;
  dentalChart: ToothCondition[];
};

type PlanWithItems = TreatmentPlan & {
  items: TreatmentPlanItem[];
};

export async function draftPreAuthLetter(
  patient: PatientWithRelations,
  plan: PlanWithItems,
  practice: Practice
): Promise<unknown> {
  try {
    const userMessage = `
Practice: ${practice.name}, ${practice.address}, NPI: ${practice.npi || 'N/A'}
Patient: ${patient.firstName} ${patient.lastName}, DOB: ${patient.dateOfBirth.toISOString().split('T')[0]}
Insurance: ${patient.insurancePrimary?.company || 'N/A'}, Member ID: ${patient.insurancePrimary?.memberId || 'N/A'}

Treatment Plan: ${plan.name}
Procedures:
${plan.items.map((item) => `- ${item.cdtCode}: ${item.description} (Tooth #${item.toothNumber || 'N/A'}, Fee: $${item.fee})`).join('\n')}

Dental conditions:
${patient.dentalChart.map((t) => `Tooth #${t.toothNumber}: ${JSON.stringify(t.conditions)}`).join('\n')}
    `.trim();

    const response = await callClaude(PRE_AUTH_PROMPT, userMessage, { maxTokens: 4096 });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse pre-auth letter response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error(error, 'Pre-auth letter drafting failed');
    throw error;
  }
}
