import fs from 'fs';
import { callClaudeVision } from './claudeAI';
import { logger } from '../utils/logger';

const XRAY_ANALYSIS_PROMPT = `You are an expert dental radiograph analyst AI assistant helping a dentist review dental X-rays. Analyze this dental radiograph and provide findings in the following JSON structure.

IMPORTANT: You are an AI assistant providing analysis to help the dentist. All findings must be reviewed and confirmed by the licensed dentist before any clinical decisions are made. This is NOT a diagnosis — it is a decision-support tool.

Analyze for:
1. Carious lesions (cavities) — location, size, proximity to pulp
2. Periapical pathology — radiolucencies, abscesses, granulomas
3. Periodontal bone loss — horizontal/vertical, severity
4. Existing restorations — quality, secondary caries, overhangs
5. Root abnormalities — resorption, fractures, dilaceration
6. Impacted teeth
7. Calculus deposits
8. Any other notable findings

For each finding, provide:
- tooth_number (Universal numbering)
- finding_type
- location (surface/area)
- severity (mild/moderate/severe)
- confidence (0.0-1.0)
- description (brief clinical description)
- recommendation (suggested action)

Return ONLY valid JSON: { "findings": [...], "summary": "...", "image_quality": "good/fair/poor", "image_type": "periapical/bitewing/panoramic", "overallConfidence": 0.0-1.0 }`;

export interface XrayFinding {
  tooth_number: number;
  finding_type: string;
  location: string;
  severity: 'mild' | 'moderate' | 'severe';
  confidence: number;
  description: string;
  recommendation: string;
}

export interface XrayAnalysisResult {
  findings: XrayFinding[];
  summary: string;
  image_quality: string;
  image_type: string;
  overallConfidence: number;
}

export async function analyzeXray(
  filePath: string,
  imageType: string
): Promise<XrayAnalysisResult> {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    const base64 = imageBuffer.toString('base64');

    const ext = filePath.toLowerCase();
    let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg';
    if (ext.endsWith('.png')) mediaType = 'image/png';
    else if (ext.endsWith('.webp')) mediaType = 'image/webp';

    const response = await callClaudeVision(
      XRAY_ANALYSIS_PROMPT,
      base64,
      mediaType,
      `This is a ${imageType} dental radiograph. Please analyze it thoroughly.`
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON');
    }

    const result = JSON.parse(jsonMatch[0]) as XrayAnalysisResult;
    return result;
  } catch (error) {
    logger.error(error, 'X-ray analysis failed');
    throw error;
  }
}
