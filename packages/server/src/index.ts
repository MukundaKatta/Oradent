import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { createServer } from 'http';

import { env } from './config/env';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { ensureUploadDir, uploadDir } from './config/storage';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { auditMiddleware } from './middleware/auditMiddleware';
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

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);
app.use(auditMiddleware);

// Static files for uploads
ensureUploadDir();
app.use('/uploads', express.static(uploadDir));

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: String(error) });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/dental-chart', dentalChartRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/treatments', treatmentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/imaging', imagingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// Error handler
app.use(errorHandler);

// WebSocket
initializeWebSocket(httpServer);

// Start server
httpServer.listen(env.PORT, () => {
  logger.info(`Oradent server running on port ${env.PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close();
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

export default app;
