import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createLabCase,
  updateLabCase,
  getLabCases,
  getLabCaseById,
  updateLabCaseStatus,
  getLabCaseStats,
  LabCaseStatus,
} from '../services/labCaseService';

const router = Router();
router.use(authenticate);

// GET /stats must come before /:id to avoid matching "stats" as an id
router.get('/stats', (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const stats = getLabCaseStats(practiceId);
  res.json(stats);
});

// GET / - list lab cases with optional filters
router.get('/', (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const status = req.query.status as LabCaseStatus | undefined;
  const lab = req.query.lab as string | undefined;
  const type = req.query.type as string | undefined;
  const patientId = req.query.patientId as string | undefined;

  const cases = getLabCases({
    practiceId,
    status,
    labName: lab,
    type,
    patientId,
  });

  res.json(cases);
});

// POST / - create a new lab case
router.post('/', (req: Request, res: Response) => {
  const practiceId = req.auth!.practiceId;
  const {
    patientId,
    providerId,
    labName,
    type,
    description,
    toothNumbers,
    shade,
    dueDate,
    cost,
    notes,
  } = req.body;

  if (!patientId || !providerId || !labName || !type || !description) {
    res.status(400).json({ error: 'Missing required fields: patientId, providerId, labName, type, description' });
    return;
  }

  const labCase = createLabCase({
    practiceId,
    patientId,
    providerId,
    labName,
    type,
    description,
    toothNumbers: toothNumbers || [],
    shade,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    cost,
    notes,
  });

  res.status(201).json(labCase);
});

// GET /:id - get a single lab case
router.get('/:id', (req: Request, res: Response) => {
  const labCase = getLabCaseById(req.params.id);
  if (!labCase) {
    res.status(404).json({ error: 'Lab case not found' });
    return;
  }

  res.json(labCase);
});

// PUT /:id - update a lab case
router.put('/:id', (req: Request, res: Response) => {
  const updated = updateLabCase(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Lab case not found' });
    return;
  }

  res.json(updated);
});

// PUT /:id/status - update lab case status with transition validation
router.put('/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  if (!status) {
    res.status(400).json({ error: 'status is required' });
    return;
  }

  const result = updateLabCaseStatus(req.params.id, status as LabCaseStatus);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json(result.labCase);
});

export default router;
