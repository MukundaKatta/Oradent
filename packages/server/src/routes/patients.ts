import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const createPatientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().transform((s) => new Date(s)),
  gender: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7),
  phoneSecondary: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  notes: z.string().optional(),
});

const updatePatientSchema = createPatientSchema.partial();

// List patients with search and pagination
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const search = (req.query.search as string) || '';
  const status = req.query.status as string;
  const sortBy = (req.query.sortBy as string) || 'lastName';
  const sortOrder = (req.query.sortOrder as string) === 'desc' ? 'desc' : 'asc';

  const where: Record<string, unknown> = {
    practiceId: req.auth!.practiceId,
  };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where: where as any,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        insurancePrimary: { select: { company: true, memberId: true } },
        _count: { select: { appointments: true, treatments: true } },
      },
    }),
    prisma.patient.count({ where: where as any }),
  ]);

  res.json({
    patients,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// Export patients as CSV
router.get('/export/csv', async (req: Request, res: Response) => {
  const patients = await prisma.patient.findMany({
    where: { practiceId: req.auth!.practiceId },
    select: {
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      gender: true,
      email: true,
      phone: true,
      phoneSecondary: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      status: true,
      lastVisit: true,
      createdAt: true,
    },
    orderBy: { lastName: 'asc' },
  });

  const headers = [
    'First Name', 'Last Name', 'Date of Birth', 'Gender', 'Email',
    'Phone', 'Secondary Phone', 'Address', 'City', 'State', 'Zip',
    'Status', 'Last Visit', 'Created',
  ];

  const csvRows = [
    headers.join(','),
    ...patients.map((p) => [
      p.firstName, p.lastName,
      p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
      p.gender || '', p.email || '', p.phone, p.phoneSecondary || '',
      `"${(p.address || '').replace(/"/g, '""')}"`,
      p.city || '', p.state || '', p.zipCode || '', p.status,
      p.lastVisit ? new Date(p.lastVisit).toISOString().split('T')[0] : '',
      new Date(p.createdAt).toISOString().split('T')[0],
    ].join(',')),
  ];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="patients-${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csvRows.join('\n'));
});

// Get patient by ID
router.get('/:id', async (req: Request, res: Response) => {
  const patient = await prisma.patient.findFirst({
    where: {
      id: req.params.id,
      practiceId: req.auth!.practiceId,
    },
    include: {
      medicalHistory: true,
      insurancePrimary: true,
      insuranceSecondary: true,
      dentalChart: true,
      _count: {
        select: {
          appointments: true,
          treatments: true,
          images: true,
          invoices: true,
        },
      },
    },
  });

  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  res.json(patient);
});

// Quick summary for patient (used in popovers/tooltips)
router.get('/:id/summary', async (req: Request, res: Response) => {
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.id, practiceId: req.auth!.practiceId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      phone: true,
      email: true,
      status: true,
      lastVisit: true,
      nextAppointment: true,
      medicalHistory: {
        select: { allergies: true, conditions: true, medications: true },
      },
      insurancePrimary: {
        select: { company: true, memberId: true, remainingBenefit: true },
      },
      _count: {
        select: { appointments: true, treatments: true },
      },
    },
  });

  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      patientId: req.params.id,
      startTime: { gte: new Date() },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
    select: { id: true, startTime: true, type: true, status: true },
    orderBy: { startTime: 'asc' },
    take: 3,
  });

  const outstandingBalance = await prisma.invoice.aggregate({
    _sum: { patientPortion: true },
    where: {
      patientId: req.params.id,
      status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
    },
  });

  res.json({
    ...patient,
    upcomingAppointments,
    outstandingBalance: outstandingBalance._sum.patientPortion || 0,
    alerts: {
      hasAllergies: Array.isArray(patient.medicalHistory?.allergies) && (patient.medicalHistory?.allergies as string[]).length > 0,
      hasMedicalConditions: Array.isArray(patient.medicalHistory?.conditions) && (patient.medicalHistory?.conditions as string[]).length > 0,
      hasOverdueBalance: (outstandingBalance._sum.patientPortion || 0) > 0,
      needsRecall: !patient.nextAppointment && patient.lastVisit &&
        new Date().getTime() - new Date(patient.lastVisit).getTime() > 180 * 24 * 60 * 60 * 1000,
    },
  });
});

// Create patient
router.post('/', async (req: Request, res: Response) => {
  const data = createPatientSchema.parse(req.body);

  const patient = await prisma.patient.create({
    data: {
      ...data,
      practiceId: req.auth!.practiceId,
    },
  });

  res.status(201).json(patient);
});

// Update patient
router.put('/:id', async (req: Request, res: Response) => {
  const data = updatePatientSchema.parse(req.body);

  const existing = await prisma.patient.findFirst({
    where: { id: req.params.id, practiceId: req.auth!.practiceId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const patient = await prisma.patient.update({
    where: { id: req.params.id },
    data,
  });

  res.json(patient);
});

// Archive patient
router.patch('/:id/archive', async (req: Request, res: Response) => {
  const existing = await prisma.patient.findFirst({
    where: { id: req.params.id, practiceId: req.auth!.practiceId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const patient = await prisma.patient.update({
    where: { id: req.params.id },
    data: { status: 'ARCHIVED' },
  });

  res.json(patient);
});

// Medical history
router.put('/:id/medical-history', async (req: Request, res: Response) => {
  const medicalSchema = z.object({
    allergies: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
    conditions: z.array(z.string()).optional(),
    bloodType: z.string().optional(),
    isPregnant: z.boolean().optional(),
    smokingStatus: z.string().optional(),
    alcoholUse: z.string().optional(),
    previousSurgeries: z.array(z.string()).optional(),
    familyHistory: z.array(z.string()).optional(),
    notes: z.string().optional(),
  });

  const data = medicalSchema.parse(req.body);

  const existing = await prisma.patient.findFirst({
    where: { id: req.params.id, practiceId: req.auth!.practiceId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const history = await prisma.medicalHistory.upsert({
    where: { patientId: req.params.id },
    create: { patientId: req.params.id, ...data },
    update: data,
  });

  res.json(history);
});

// Insurance info
router.put('/:id/insurance/:type', async (req: Request, res: Response) => {
  const insuranceSchema = z.object({
    company: z.string().min(1),
    planName: z.string().optional(),
    groupNumber: z.string().optional(),
    memberId: z.string().min(1),
    subscriberName: z.string().min(1),
    subscriberDob: z.string().transform((s) => new Date(s)).optional(),
    relationship: z.string().default('self'),
    effectiveDate: z.string().transform((s) => new Date(s)).optional(),
    expirationDate: z.string().transform((s) => new Date(s)).optional(),
    annualMax: z.number().optional(),
    remainingBenefit: z.number().optional(),
    deductible: z.number().optional(),
    deductibleMet: z.number().optional(),
    coveragePercent: z.object({
      preventive: z.number(),
      basic: z.number(),
      major: z.number(),
      orthodontic: z.number(),
    }).optional(),
    notes: z.string().optional(),
  });

  const data = insuranceSchema.parse(req.body);
  const type = req.params.type as 'primary' | 'secondary';

  if (type !== 'primary' && type !== 'secondary') {
    res.status(400).json({ error: 'Type must be primary or secondary' });
    return;
  }

  const existing = await prisma.patient.findFirst({
    where: { id: req.params.id, practiceId: req.auth!.practiceId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  const fieldName = type === 'primary' ? 'patientPrimaryId' : 'patientSecondaryId';

  const insurance = await prisma.insuranceInfo.upsert({
    where: { [fieldName]: req.params.id } as any,
    create: {
      [fieldName]: req.params.id,
      ...data,
    },
    update: data,
  });

  res.json(insurance);
});

export default router;
