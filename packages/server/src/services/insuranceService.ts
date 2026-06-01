import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface EligibilityResult {
  eligible: boolean;
  copay: number;
  deductible: number;
  deductibleMet: number;
  remaining: number;
  annualMax: number;
  planName: string | null;
  company: string;
  verifiedAt: Date;
}

export interface ClaimSubmissionResult {
  claimId: string;
  status: string;
  submittedAt: Date;
  trackingNumber: string;
}

export interface ClaimStatusResult {
  claimId: string;
  status: string;
  amountClaimed: number;
  amountApproved: number | null;
  amountPaid: number | null;
  adjustments: ClaimAdjustment[];
  lastUpdated: Date;
}

export interface ClaimAdjustment {
  code: string;
  reason: string;
  amount: number;
}

export interface EOBData {
  claimId: string;
  claimNumber: string | null;
  patient: { firstName: string; lastName: string };
  provider: string;
  serviceDate: string;
  treatments: EOBLineItem[];
  totalCharged: number;
  totalAllowed: number;
  totalPaid: number;
  patientResponsibility: number;
  remarks: string[];
}

export interface EOBLineItem {
  cdtCode: string;
  description: string;
  charged: number;
  allowed: number;
  paid: number;
  patientOwes: number;
  adjustmentReason: string;
}

/**
 * Verify insurance eligibility for a patient.
 * Returns mock/placeholder data; integrate with a real clearinghouse in production.
 */
export async function verifyEligibility(
  patientId: string,
  _providerId: string
): Promise<EligibilityResult> {
  const patient = await prisma.patient.findUniqueOrThrow({
    where: { id: patientId },
    include: { insurancePrimary: true },
  });

  const insurance = patient.insurancePrimary;

  if (!insurance) {
    return {
      eligible: false,
      copay: 0,
      deductible: 0,
      deductibleMet: 0,
      remaining: 0,
      annualMax: 0,
      planName: null,
      company: 'None',
      verifiedAt: new Date(),
    };
  }

  // Check if plan is active based on dates
  const now = new Date();
  const isActive =
    (!insurance.effectiveDate || insurance.effectiveDate <= now) &&
    (!insurance.expirationDate || insurance.expirationDate >= now);

  // Mock eligibility response based on stored insurance data
  const result: EligibilityResult = {
    eligible: isActive,
    copay: 25, // Placeholder copay
    deductible: insurance.deductible ?? 50,
    deductibleMet: insurance.deductibleMet ?? 0,
    remaining: insurance.remainingBenefit ?? (insurance.annualMax ?? 1500),
    annualMax: insurance.annualMax ?? 1500,
    planName: insurance.planName,
    company: insurance.company,
    verifiedAt: new Date(),
  };

  // Update verification timestamp
  try {
    await prisma.insuranceInfo.update({
      where: { id: insurance.id },
      data: { verifiedAt: new Date() },
    });
  } catch (error) {
    logger.error(error, 'Failed to update insurance verification timestamp');
  }

  return result;
}

/**
 * Submit an insurance claim for an invoice.
 * Returns mock/placeholder data; integrate with a real clearinghouse in production.
 */
export async function submitClaim(
  invoiceId: string
): Promise<ClaimSubmissionResult> {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: {
      patient: { include: { insurancePrimary: true } },
      treatments: true,
      insuranceClaim: true,
    },
  });

  // If a claim already exists, update it; otherwise create one
  const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  let claim;
  if (invoice.insuranceClaim) {
    claim = await prisma.insuranceClaim.update({
      where: { id: invoice.insuranceClaim.id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        claimNumber,
      },
    });
  } else {
    claim = await prisma.insuranceClaim.create({
      data: {
        invoiceId,
        claimNumber,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        amountClaimed: invoice.insurancePortion,
      },
    });
  }

  return {
    claimId: claim.id,
    status: claim.status,
    submittedAt: claim.submittedAt ?? new Date(),
    trackingNumber: claimNumber,
  };
}

/**
 * Get the current status of an insurance claim.
 * Returns mock/placeholder data; integrate with a real clearinghouse in production.
 */
export async function getClaimStatus(
  claimId: string
): Promise<ClaimStatusResult> {
  const claim = await prisma.insuranceClaim.findUniqueOrThrow({
    where: { id: claimId },
  });

  // Mock adjustments based on claim status
  const adjustments: ClaimAdjustment[] = [];
  if (
    claim.status === 'PARTIALLY_APPROVED' ||
    claim.status === 'DENIED'
  ) {
    adjustments.push({
      code: 'CO-45',
      reason: 'Charge exceeds fee schedule/maximum allowable',
      amount:
        claim.amountClaimed - (claim.amountApproved ?? claim.amountClaimed),
    });
  }

  return {
    claimId: claim.id,
    status: claim.status,
    amountClaimed: claim.amountClaimed,
    amountApproved: claim.amountApproved,
    amountPaid: claim.amountPaid,
    adjustments,
    lastUpdated: claim.updatedAt,
  };
}

/**
 * Get the Explanation of Benefits (EOB) for a claim.
 * Returns mock/placeholder data; integrate with a real clearinghouse in production.
 */
export async function getEOB(claimId: string): Promise<EOBData> {
  const claim = await prisma.insuranceClaim.findUniqueOrThrow({
    where: { id: claimId },
    include: {
      invoice: {
        include: {
          patient: { select: { firstName: true, lastName: true } },
          treatments: {
            include: { provider: { select: { name: true } } },
          },
        },
      },
    },
  });

  const invoice = claim.invoice;
  const providerName =
    invoice.treatments.length > 0
      ? invoice.treatments[0].provider.name
      : 'Unknown';

  // Build mock line items from treatments
  const lineItems: EOBLineItem[] = invoice.treatments.map((t) => {
    const allowed = Math.round(t.fee * 0.85 * 100) / 100; // Mock: 85% of charged
    const paid = Math.round(allowed * 0.8 * 100) / 100; // Mock: 80% coverage
    return {
      cdtCode: t.cdtCode,
      description: t.description,
      charged: t.fee,
      allowed,
      paid,
      patientOwes: Math.round((t.fee - paid) * 100) / 100,
      adjustmentReason:
        t.fee > allowed ? 'Exceeds maximum allowable' : 'None',
    };
  });

  const totalCharged = lineItems.reduce((s, l) => s + l.charged, 0);
  const totalAllowed = lineItems.reduce((s, l) => s + l.allowed, 0);
  const totalPaid = claim.amountPaid ?? lineItems.reduce((s, l) => s + l.paid, 0);

  return {
    claimId: claim.id,
    claimNumber: claim.claimNumber,
    patient: {
      firstName: invoice.patient.firstName,
      lastName: invoice.patient.lastName,
    },
    provider: providerName,
    serviceDate: invoice.date.toISOString().split('T')[0],
    treatments: lineItems,
    totalCharged: Math.round(totalCharged * 100) / 100,
    totalAllowed: Math.round(totalAllowed * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    patientResponsibility: Math.round((totalCharged - totalPaid) * 100) / 100,
    remarks: [
      'This is a mock Explanation of Benefits.',
      'In production, this data would come from the insurance clearinghouse.',
    ],
  };
}
