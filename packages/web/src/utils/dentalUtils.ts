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
const SURFACE_NAMES: Record<string, string> = {
  M: "Mesial",
  O: "Occlusal",
  D: "Distal",
  B: "Buccal",
  L: "Lingual",
  I: "Incisal",
  F: "Facial",
};

/**
 * Get the full surface name from its abbreviation.
 *
 * @example
 * surfaceAbbreviation("M") // "Mesial"
 * surfaceAbbreviation("O") // "Occlusal"
 */
export function surfaceAbbreviation(surface: string): string {
  return SURFACE_NAMES[surface.toUpperCase()] ?? surface;
}

/**
 * CDT code category ranges mapping code prefixes to category names.
 */
export const cdtCodeCategories: Record<string, string> = {
  D0: "Diagnostic",
  D1: "Preventive",
  D2: "Restorative",
  D3: "Endodontics",
  D4: "Periodontics",
  D5: "Prosthodontics",
  D6: "Implant Services / Prosthodontics (Fixed)",
  D7: "Oral & Maxillofacial Surgery",
  D8: "Orthodontics",
  D9: "Adjunctive General Services",
};

/**
 * Get the tooth type for a given tooth number (universal numbering system).
 */
export function getToothType(num: number): ToothType {
  // Molars: 1-3, 14-19, 30-32
  const molars = [1, 2, 3, 14, 15, 16, 17, 18, 19, 30, 31, 32];
  if (molars.includes(num)) return "molar";

  // Premolars: 4-5, 12-13, 20-21, 28-29
  const premolars = [4, 5, 12, 13, 20, 21, 28, 29];
  if (premolars.includes(num)) return "premolar";

  // Canines: 6, 11, 22, 27
  const canines = [6, 11, 22, 27];
  if (canines.includes(num)) return "canine";

  // Incisors: 7-10, 23-26
  return "incisor";
}
