import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPatientDashboard,
  submitAppointmentRequest,
  getPatientDocuments,
  getPatientMessages,
  createPatientMessage,
} from '../services/patientPortalService';

const router = Router();
router.use(authenticate);

// GET /dashboard/:patientId - patient dashboard data
router.get('/dashboard/:patientId', async (req: Request, res: Response) => {
  try {
    const dashboard = await getPatientDashboard(req.params.patientId);
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load patient dashboard' });
  }
});

// POST /appointment-requests - submit an appointment request
router.post('/appointment-requests', (req: Request, res: Response) => {
  const { patientId, preferredDate, preferredTime, type, reason, notes } = req.body;

  if (!patientId || !preferredDate || !preferredTime || !type) {
    res.status(400).json({
      error: 'Missing required fields: patientId, preferredDate, preferredTime, type',
    });
    return;
  }

  const request = submitAppointmentRequest(patientId, {
    preferredDate,
    preferredTime,
    type,
    reason,
    notes,
  });

  res.status(201).json(request);
});

// GET /documents/:patientId - patient documents
router.get('/documents/:patientId', async (req: Request, res: Response) => {
  try {
    const documents = await getPatientDocuments(req.params.patientId);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load patient documents' });
  }
});

// GET /messages/:patientId - patient messages
router.get('/messages/:patientId', (req: Request, res: Response) => {
  const messages = getPatientMessages(req.params.patientId);
  res.json(messages);
});

// POST /messages - send a message
router.post('/messages', (req: Request, res: Response) => {
  const { patientId, subject, body, direction } = req.body;

  if (!patientId || !subject || !body) {
    res.status(400).json({ error: 'Missing required fields: patientId, subject, body' });
    return;
  }

  const message = createPatientMessage(
    patientId,
    subject,
    body,
    direction || 'outbound',
  );

  res.status(201).json(message);
});

export default router;
