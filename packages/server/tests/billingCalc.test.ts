import { describe, it, expect } from 'vitest';
import { estimateInsuranceCoverage, calculateTreatmentPlanEstimate } from '../src/services/billingCalc';
import type { InsuranceInfo } from '@prisma/client';

function insurance(overrides: Partial<InsuranceInfo> = {}): InsuranceInfo {
  return {
    id: 'ins-1',
    patientPrimaryId: 'patient-1',
    patientSecondaryId: null,
    company: 'Delta Dental',
    planName: null,
    groupNumber: null,
    memberId: 'M123',
    subscriberName: 'Jane Doe',
    subscriberDob: null,
    relationship: 'self',
    effectiveDate: null,
    expirationDate: null,
    annualMax: null,
    remainingBenefit: 1000,
    deductible: 50,
    deductibleMet: 0,
    coveragePercent: { preventive: 100, basic: 80, major: 50, orthodontic: 50 },
    verifiedAt: null,
    notes: null,
    ...overrides,
  } as unknown as InsuranceInfo;
}

describe('estimateInsuranceCoverage', () => {
  it('bills the patient in full when there is no insurance on file', () => {
    const result = estimateInsuranceCoverage('D0120', 100, null);
    expect(result).toEqual({ insurancePays: 0, patientPays: 100, category: 'none' });
  });

  it('does not apply the deductible to preventive care', () => {
    const result = estimateInsuranceCoverage('D0120', 100, insurance());
    expect(result.category).toBe('preventive');
    expect(result.insurancePays).toBe(100);
    expect(result.patientPays).toBe(0);
  });

  it('applies the deductible before computing the covered percentage for non-preventive care', () => {
    // D2140 (basic, 80%): fee 100 - deductible 50 = 50 subject to coverage -> 40 covered, 60 patient
    const result = estimateInsuranceCoverage('D2140', 100, insurance());
    expect(result.category).toBe('basic');
    expect(result.insurancePays).toBe(40);
    expect(result.patientPays).toBe(60);
  });

  it('classifies a crown as major even though its D2xxx prefix defaults to basic', () => {
    const result = estimateInsuranceCoverage('D2740', 100, insurance());
    expect(result.category).toBe('major');
  });

  it('never pays out more than the remaining benefit', () => {
    const result = estimateInsuranceCoverage('D2740', 5000, insurance({ remainingBenefit: 200 }));
    expect(result.insurancePays).toBe(200);
  });
});

describe('calculateTreatmentPlanEstimate', () => {
  it('depletes the remaining benefit across multiple items in the same plan', () => {
    // Two D2740 crowns at 80% coverage on major (2400 each): full coverage
    // would be 1200 each, but only 1000 of benefit remains overall.
    const insuranceWithMajorCoverage = insurance({
      remainingBenefit: 1000,
      deductibleMet: 50,
      coveragePercent: { preventive: 100, basic: 80, major: 100, orthodontic: 50 },
    });
    const result = calculateTreatmentPlanEstimate(
      [
        { cdtCode: 'D2740', fee: 1200 },
        { cdtCode: 'D2740', fee: 1200 },
      ],
      insuranceWithMajorCoverage
    );

    expect(result.totalFee).toBe(2400);
    expect(result.insuranceEst).toBe(1000); // capped at the remaining benefit
    expect(result.patientEst).toBe(1400);
    expect(result.breakdown[0].insurancePays + result.breakdown[1].insurancePays).toBe(1000);
  });

  it('bills the full amount to the patient when there is no insurance', () => {
    const result = calculateTreatmentPlanEstimate(
      [{ cdtCode: 'D0120', fee: 80 }, { cdtCode: 'D2740', fee: 900 }],
      null
    );
    expect(result.totalFee).toBe(980);
    expect(result.insuranceEst).toBe(0);
    expect(result.patientEst).toBe(980);
  });
});
