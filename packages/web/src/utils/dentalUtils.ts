type ToothType = "molar" | "premolar" | "canine" | "incisor";

/**
 * Universal numbering system: tooth number (1-32) to full name.
 */
const TOOTH_NAMES: Record<number, string> = {
  1: "Upper Right Third Molar",
  2: "Upper Right Second Molar",
  3: "Upper Right First Molar",
  4: "Upper Right Second Premolar",
  5: "Upper Right First Premolar",
  6: "Upper Right Canine",
  7: "Upper Right Lateral Incisor",
  8: "Upper Right Central Incisor",
  9: "Upper Left Central Incisor",
  10: "Upper Left Lateral Incisor",
  11: "Upper Left Canine",
  12: "Upper Left First Premolar",
  13: "Upper Left Second Premolar",
  14: "Upper Left First Molar",
  15: "Upper Left Second Molar",
  16: "Upper Left Third Molar",
  17: "Lower Left Third Molar",
  18: "Lower Left Second Molar",
  19: "Lower Left First Molar",
  20: "Lower Left Second Premolar",
  21: "Lower Left First Premolar",
  22: "Lower Left Canine",
  23: "Lower Left Lateral Incisor",
  24: "Lower Left Central Incisor",
  25: "Lower Right Central Incisor",
  26: "Lower Right Lateral Incisor",
  27: "Lower Right Canine",
  28: "Lower Right First Premolar",
  29: "Lower Right Second Premolar",
  30: "Lower Right First Molar",
  31: "Lower Right Second Molar",
  32: "Lower Right Third Molar",
};

/**
 * Convert a tooth number (1-32) to its full anatomical name.
 */
export function toothNumberToName(num: number): string {
  return TOOTH_NAMES[num] ?? `Tooth #${num}`;
}

/**
 * Get the quadrant (1-4) for a given tooth number.
 * Quadrant 1: Upper Right (1-8)
 * Quadrant 2: Upper Left (9-16)
 * Quadrant 3: Lower Left (17-24)
 * Quadrant 4: Lower Right (25-32)
 */
export function getQuadrant(toothNum: number): 1 | 2 | 3 | 4 {
  if (toothNum >= 1 && toothNum <= 8) return 1;
  if (toothNum >= 9 && toothNum <= 16) return 2;
  if (toothNum >= 17 && toothNum <= 24) return 3;
  return 4;
}

/**
 * Map of surface abbreviations to their full names.
 */
export const surfaceAbbreviations: Record<string, string> = {
  M: "Mesial",
  D: "Distal",
  B: "Buccal",
  L: "Lingual",
  O: "Occlusal",
  I: "Incisal",
};

/**
 * Get the tooth type for a given tooth number (universal numbering system).
 */
export function getToothType(num: number): ToothType {
  const molars = [1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32];
  if (molars.includes(num)) return "molar";

  const premolars = [4, 5, 12, 13, 20, 21, 28, 29];
  if (premolars.includes(num)) return "premolar";

  const canines = [6, 11, 22, 27];
  if (canines.includes(num)) return "canine";

  return "incisor";
}

/**
 * Common CDT procedure codes with category and description.
 */
export const cdtCategories: { code: string; category: string; description: string }[] = [
  { code: "D0120", category: "Diagnostic", description: "Periodic oral evaluation" },
  { code: "D0140", category: "Diagnostic", description: "Limited oral evaluation - problem focused" },
  { code: "D0150", category: "Diagnostic", description: "Comprehensive oral evaluation - new or established patient" },
  { code: "D0210", category: "Diagnostic", description: "Intraoral - complete series of radiographic images" },
  { code: "D0220", category: "Diagnostic", description: "Intraoral - periapical first radiographic image" },
  { code: "D0274", category: "Diagnostic", description: "Bitewings - four radiographic images" },
  { code: "D0330", category: "Diagnostic", description: "Panoramic radiographic image" },
  { code: "D1110", category: "Preventive", description: "Prophylaxis - adult" },
  { code: "D1120", category: "Preventive", description: "Prophylaxis - child" },
  { code: "D1206", category: "Preventive", description: "Topical application of fluoride varnish" },
  { code: "D1351", category: "Preventive", description: "Sealant - per tooth" },
  { code: "D2140", category: "Restorative", description: "Amalgam - one surface, primary or permanent" },
  { code: "D2150", category: "Restorative", description: "Amalgam - two surfaces, primary or permanent" },
  { code: "D2391", category: "Restorative", description: "Resin-based composite - one surface, posterior" },
  { code: "D2392", category: "Restorative", description: "Resin-based composite - two surfaces, posterior" },
  { code: "D2740", category: "Restorative", description: "Crown - porcelain/ceramic" },
  { code: "D3310", category: "Endodontics", description: "Endodontic therapy, anterior tooth" },
  { code: "D4341", category: "Periodontics", description: "Periodontal scaling and root planing - four or more teeth, per quadrant" },
  { code: "D7140", category: "Oral Surgery", description: "Extraction, erupted tooth or exposed root" },
  { code: "D7210", category: "Oral Surgery", description: "Extraction, erupted tooth requiring removal of bone and/or sectioning" },
];

/**
 * Primary (deciduous) tooth letter-to-number mapping.
 * Letters A-T map to deciduous tooth positions.
 * In universal numbering: A-J are upper (right to left), K-T are lower (left to right).
 */
const PRIMARY_TOOTH_NUMBERS = new Set([
  // A-T correspond to specific positions; in practice we check if a
  // given universal tooth number is in the deciduous range.
  // Deciduous teeth use letters A-T but can also be referenced by
  // their universal numbers which overlap with the adult range
  // when using the deciduous numbering convention.
]);

/**
 * Check if a tooth number represents a primary (deciduous) tooth.
 * In the universal numbering system, primary teeth are identified by
 * letters A-T. When represented as numbers, primary teeth use positions
 * 1-20 in the deciduous notation (separate from the adult 1-32 system).
 *
 * This function accepts a numeric value 1-20 representing deciduous
 * teeth A(1) through T(20) and returns true for valid deciduous positions.
 */
export function isToothPrimary(num: number): boolean {
  return Number.isInteger(num) && num >= 1 && num <= 20;
}
