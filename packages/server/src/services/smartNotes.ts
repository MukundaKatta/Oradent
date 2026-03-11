import { callClaude } from './claudeAI';
import { logger } from '../utils/logger';

const SMART_NOTE_PROMPT = `You are an expert dental clinical note writer. Convert the dentist's brief clinical shorthand into a properly formatted SOAP note.

Use proper dental terminology and clinical language. Include relevant ICD-10 and CDT codes where appropriate.

Format the output as valid JSON:
{
  "subjective": "Patient's chief complaint and history of present illness",
  "objective": "Clinical findings, exam results, radiographic findings",
  "assessment": "Diagnosis with ICD-10 codes",
  "plan": "Treatment plan with CDT codes and follow-up",
  "icd10_codes": ["K04.02 - Irreversible pulpitis"],
  "cdt_codes": ["D3330 - Root canal, molar"]
}`;

export async function generateSmartNote(
  briefNote: string,
  noteType: string
): Promise<unknown> {
  try {
    const userMessage = `Note type: ${noteType}\nBrief clinical note: ${briefNote}`;

    const response = await callClaude(SMART_NOTE_PROMPT, userMessage);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse smart note response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error(error, 'Smart note generation failed');
    throw error;
  }
}
