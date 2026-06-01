import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { createServer } from 'http';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { prisma } from './config/database';
import { env } from './config/env';
import { redis } from './config/redis';
import { ensureUploadDir, uploadDir } from './config/storage';
import { startAppointmentReminders } from './jobs/appointmentReminder';
import { startClaimFollowUp } from './jobs/claimFollowUp';
import { startDailyDigest } from './jobs/dailyDigest';
import { startOverdueInvoiceCheck } from './jobs/overdueInvoices';
import { startReminderJob } from './jobs/reminderJob';
import { startCleanupJob } from './jobs/cleanupJob';
import { activityTracker } from './middleware/activityTracker';
import { auditMiddleware } from './middleware/auditMiddleware';
import { hipaaHeaders } from './middleware/hipaaHeaders';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter, authLimiter, uploadLimiter, aiLimiter } from './middleware/rateLimiter';
import { requestId } from './middleware/requestId';
import { requestLogger } from './middleware/requestLogger';
import { sanitizeInput } from './middleware/sanitize';
import { requestTimeout } from './middleware/timeout';
import { logger } from './utils/logger';
import { initializeWebSocket } from './websocket/liveUpdates';

import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import dentalChartRoutes from './routes/dentalChart';
import appointmentRoutes from './routes/appointments';
import treatmentRoutes from './routes/treatments';
import billingRoutes from './routes/billing';
import imagingRoutes from './routes/imaging';
import aiRoutes from './routes/ai';
import reportRoutes from './routes/reports';
import settingsRoutes from './routes/settings';
import communicationsRoutes from './routes/communications';
import inventoryRoutes from './routes/inventory';
import waitlistRoutes from './routes/waitlist';
import referralsRoutes from './routes/referrals';
import labCasesRoutes from './routes/labCases';
import patientPortalRoutes from './routes/patientPortal';
import feeScheduleRoutes from './routes/feeSchedule';
import documentsRoutes from './routes/documents';
import reportingRoutes from './routes/reporting';
import searchRoutes from './routes/search';
import notificationsRoutes from './routes/notifications';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(requestId);
app.use(requestLogger);
app.use(hipaaHeaders);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xContentTypeOptions: true,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? false : '*'),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInput);
app.use(requestTimeout(30000));
app.use(apiLimiter);
app.use(auditMiddleware);

// Static files for uploads
ensureUploadDir();
app.use('/uploads', express.static(uploadDir));

// API Documentation
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Oradent API',
      version: '1.0.0',
      description: 'Dental Practice Management System API',
      contact: { name: 'Oradent Support', email: 'support@oradent.com' },
    },
    servers: [{ url: `/api`, description: 'API Server' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
          },
        },
        Patient: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            dateOfBirth: { type: 'string', format: 'date' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'] },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            patientId: { type: 'string', format: 'uuid' },
            providerId: { type: 'string', format: 'uuid' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            type: { type: 'string', enum: ['EXAM', 'CLEANING', 'FILLING', 'CROWN', 'ROOT_CANAL', 'EXTRACTION', 'IMPLANT', 'COSMETIC', 'EMERGENCY', 'CONSULTATION', 'FOLLOW_UP', 'OTHER'] },
            status: { type: 'string', enum: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_CHAIR', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'] },
          },
        },
        Invoice: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            invoiceNumber: { type: 'string' },
            patientId: { type: 'string', format: 'uuid' },
            total: { type: 'number' },
            status: { type: 'string', enum: ['DRAFT', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID', 'WRITE_OFF'] },
          },
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication & authorization' },
      { name: 'Patients', description: 'Patient management' },
      { name: 'Appointments', description: 'Scheduling & appointments' },
      { name: 'Treatments', description: 'Treatment plans & clinical notes' },
      { name: 'Billing', description: 'Invoicing, payments & insurance claims' },
      { name: 'Imaging', description: 'Dental imaging & X-rays' },
      { name: 'AI', description: 'AI-powered analysis & suggestions' },
      { name: 'Reports', description: 'Analytics & reporting' },
      { name: 'Settings', description: 'Practice configuration' },
    ],
  },
  apis: [],
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Oradent API Docs',
}));

// Health check
app.get('/api/health', async (_req, res) => {
  let database: 'connected' | 'disconnected' = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'connected';
  } catch {
    database = 'disconnected';
  }

  let redisStatus: 'connected' | 'disconnected' = 'disconnected';
  try {
    await redis.ping();
    redisStatus = 'connected';
  } catch {
    redisStatus = 'disconnected';
  }

  const memUsage = process.memoryUsage();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database,
    redis: redisStatus,
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
    },
  });
});

// Readiness check — verifies database and Redis connectivity
app.get('/api/health/ready', async (_req, res) => {
  const checks: Record<string, string> = {};
  let healthy = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
    healthy = false;
  }

  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
    healthy = false;
  }

  const status = healthy ? 'ready' : 'not_ready';
  res.status(healthy ? 200 : 503).json({ status, checks, timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/dental-chart', dentalChartRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/imaging', uploadLimiter, imagingRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/communications', communicationsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/lab-cases', labCasesRoutes);
app.use('/api/patient-portal', patientPortalRoutes);
app.use('/api/fee-schedule', feeScheduleRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/reporting', reportingRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationsRoutes);

// Activity tracking
app.use(activityTracker());

// Error handler
app.use(errorHandler);

// WebSocket
initializeWebSocket(httpServer);

// Start server
httpServer.listen(env.PORT, () => {
  logger.info(`Oradent server running on port ${env.PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);

  // Start background jobs
  startAppointmentReminders();
  startClaimFollowUp();
  startDailyDigest();
  startOverdueInvoiceCheck();
  startReminderJob();
  startCleanupJob();
});

// Graceful shutdown
function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, starting graceful shutdown...`);
  httpServer.close(async () => {
    await prisma.$disconnect();
    logger.info('Server shut down gracefully');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
