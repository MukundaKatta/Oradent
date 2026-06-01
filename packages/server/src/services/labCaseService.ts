import { logger } from '../utils/logger';

export type LabCaseStatus =
  | 'CREATED'
  | 'SENT_TO_LAB'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'RECEIVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface LabCase {
  id: string;
  practiceId: string;
  patientId: string;
  providerId: string;
  labName: string;
  type: string;
  description: string;
  toothNumbers: number[];
  shade?: string;
  status: LabCaseStatus;
  sentDate?: Date;
  dueDate?: Date;
  receivedDate?: Date;
  cost?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store as placeholder
const labCases: LabCase[] = [];
let caseCounter = 0;

const VALID_TRANSITIONS: Record<LabCaseStatus, LabCaseStatus[]> = {
  CREATED: ['SENT_TO_LAB', 'CANCELLED'],
  SENT_TO_LAB: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['RECEIVED', 'REJECTED'],
  RECEIVED: [],
  REJECTED: ['SENT_TO_LAB'],
  CANCELLED: [],
};

export function createLabCase(
  data: Omit<LabCase, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
): LabCase {
  caseCounter += 1;
  const labCase: LabCase = {
    ...data,
    id: `lab_${caseCounter}`,
    status: 'CREATED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  labCases.push(labCase);
  logger.info({ labCaseId: labCase.id, practiceId: data.practiceId }, 'Lab case created');
  return labCase;
}

export function updateLabCase(
  id: string,
  updates: Partial<Omit<LabCase, 'id' | 'createdAt' | 'updatedAt'>>,
): LabCase | null {
  const index = labCases.findIndex((c) => c.id === id);
  if (index === -1) return null;

  labCases[index] = {
    ...labCases[index],
    ...updates,
    updatedAt: new Date(),
  };

  logger.info({ labCaseId: id }, 'Lab case updated');
  return labCases[index];
}

export function getLabCases(filters: {
  practiceId?: string;
  status?: LabCaseStatus;
  labName?: string;
  type?: string;
  patientId?: string;
}): LabCase[] {
  return labCases.filter((c) => {
    if (filters.practiceId && c.practiceId !== filters.practiceId) return false;
    if (filters.status && c.status !== filters.status) return false;
    if (filters.labName && c.labName !== filters.labName) return false;
    if (filters.type && c.type !== filters.type) return false;
    if (filters.patientId && c.patientId !== filters.patientId) return false;
    return true;
  });
}

export function getLabCaseById(id: string): LabCase | null {
  return labCases.find((c) => c.id === id) ?? null;
}

export function updateLabCaseStatus(
  id: string,
  newStatus: LabCaseStatus,
): { success: boolean; labCase?: LabCase; error?: string } {
  const labCase = labCases.find((c) => c.id === id);
  if (!labCase) {
    return { success: false, error: 'Lab case not found' };
  }

  const allowed = VALID_TRANSITIONS[labCase.status];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      error: `Cannot transition from ${labCase.status} to ${newStatus}`,
    };
  }

  labCase.status = newStatus;
  labCase.updatedAt = new Date();

  if (newStatus === 'SENT_TO_LAB') labCase.sentDate = new Date();
  if (newStatus === 'RECEIVED') labCase.receivedDate = new Date();

  logger.info({ labCaseId: id, newStatus }, 'Lab case status updated');
  return { success: true, labCase };
}

export function getLabCaseStats(practiceId: string) {
  const cases = labCases.filter((c) => c.practiceId === practiceId);

  const byStatus: Record<string, number> = {};
  const byLab: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let totalCost = 0;

  for (const c of cases) {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    byLab[c.labName] = (byLab[c.labName] || 0) + 1;
    byType[c.type] = (byType[c.type] || 0) + 1;
    if (c.cost) totalCost += c.cost;
  }

  return {
    total: cases.length,
    byStatus,
    byLab,
    byType,
    totalCost,
  };
}
