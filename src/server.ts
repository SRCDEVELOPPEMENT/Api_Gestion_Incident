import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import incidentRoutes from './interfaces/http/routes/incidentRoutes';
import authRoutes from './interfaces/http/routes/authRoutes';
import siteRoutes from './interfaces/http/routes/siteRoutes';
import siteTypeRoutes from './interfaces/http/routes/siteTypeRoutes';
import userRoutes from './interfaces/http/routes/userRoutes';
import taskRoutes from './interfaces/http/routes/taskRoutes';
import processRoutes from './interfaces/http/routes/processRoutes';
import categoryRoutes from './interfaces/http/routes/categoryRoutes';

import { errorHandler } from './interfaces/http/middlewares/errorHandler';
import { correlationMiddleware } from './interfaces/http/middlewares/correlationMiddleware';
import { requestLogger, auditLogger } from './interfaces/http/middlewares/loggingMiddleware';
import { globalLimiter } from './interfaces/http/middlewares/securityMiddleware';
import { HealthController } from './interfaces/http/controllers/HealthController';
import { bootstrapAuth } from './infrastructure/bootstrap/bootstrapAuth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * 1. Security headers (always first)
 */
app.use(helmet() as any);

/**
 * 2. CORS
 */
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
};
app.use(cors(corsOptions) as any);

/**
 * 3. Global rate limiter
 */
app.use(globalLimiter);

/**
 * 4. Infrastructure middlewares
 */
app.use(correlationMiddleware);
app.use(express.json() as any);
app.use(requestLogger);

/**
 * 5. Public routes
 */
app.get('/health', HealthController.health);
app.get('/ready', HealthController.ready);

/**
 * 6. API root (important for diagnostics)
 */
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    name: 'Incident Management API',
    version: 'v1',
    status: 'running',
  });
});

/**
 * 7. Auth routes (NO audit here)
 */
app.use('/api/v1/auth', authRoutes);

/**
 * 8. Audit logger ONLY for business routes
 */
app.use('/api/v1', auditLogger);

/**
 * 9. Business routes
 */
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/sites', siteRoutes);
app.use('/api/v1/site-types', siteTypeRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/processes', processRoutes);
app.use('/api/v1/categories', categoryRoutes);

/**
 * 10. 404 handler (clean, explicit)
 */
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    code: 'RESOURCE_NOT_FOUND',
    message: 'Endpoint not found',
    correlationId: (req as any).correlationId,
  });
});

/**
 * 11. Global error handler (last)
 */
app.use(errorHandler as any);

(async () => {
  await bootstrapAuth();
})();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
