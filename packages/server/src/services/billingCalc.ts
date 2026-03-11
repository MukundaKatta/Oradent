import type { InsuranceInfo, FeeScheduleItem } from '@prisma/client';

interface CoveragePercent {
  preventive: number;
  basic: number;
  major: number;
  orthodontic: number;
}

const CDT_CATEGORIES: Record<string, keyof CoveragePercent> = {
  // Diagnostic
  D0: 'preventive',
  // Preventive
  D1: 'preventive',
  // Restorative
  D2: 'basic',
  // Endodontics
  D3: 'major',
  // Periodontics
  D4: 'basic',
  // Prosthodontics
  D5: 'major',
  // Implant
  D6: 'major',
  // Oral Surgery
  D7: 'basic',
  // Orthodontics
  D8: 'orthodontic',
  // Adjunctive
  D9: 'preventive',
};

function getCoverageCategory(cdtCode: string): keyof CoveragePercent {
  const prefix = cdtCode.substring(0, 2);
  return CDT_CATEGORIES[prefix] || 'basic';
}

export function estimateInsuranceCoverage(
  cdtCode: string,
  fee: number,
  insurance: InsuranceInfo | null
): { insurancePays: number; patientPays: number } {
  if (!insurance) {
    return { insurancePays: 0, patientPays: fee };
  }

  const coverage = insurance.coveragePercent as unknown as CoveragePercent;
  if (!coverage) {
    return { insurancePays: 0, patientPays: fee };
  }

  const category = getCoverageCategory(cdtCode);
  const coveragePercent = coverage[category] || 0;

  // Check remaining benefits
  const remaining = insurance.remainingBenefit ?? Infinity;
  const deductibleRemaining = Math.max(0, (insurance.deductible || 0) - (insurance.deductibleMet || 0));

  const afterDeductible = Math.max(0, fee - deductibleRemaining);
  let insurancePays = (afterDeductible * coveragePercent) / 100;
  insurancePays = Math.min(insurancePays, remaining);

  const patientPays = fee - insurancePays;

  return {
    insurancePays: Math.round(insurancePays * 100) / 100,
    patientPays: Math.round(patientPays * 100) / 100,
  };
}

export function calculateTreatmentPlanEstimate(
  items: Array<{ cdtCode: string; fee: number }>,
  insurance: InsuranceInfo | null
): { totalFee: number; insuranceEst: number; patientEst: number } {
  let totalFee = 0;
  let insuranceEst = 0;
  let remainingBenefit = insurance?.remainingBenefit ?? Infinity;

  for (const item of items) {
    totalFee += item.fee;
    const estimate = estimateInsuranceCoverage(item.cdtCode, item.fee, insurance);
    const actualInsurance = Math.min(estimate.insurancePays, remainingBenefit);
    insuranceEst += actualInsurance;
    remainingBenefit -= actualInsurance;
  }

  return {
    totalFee: Math.round(totalFee * 100) / 100,
    insuranceEst: Math.round(insuranceEst * 100) / 100,
    patientEst: Math.round((totalFee - insuranceEst) * 100) / 100,
  };
}
