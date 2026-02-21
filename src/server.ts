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
import subCategoryRoutes from './interfaces/http/routes/subCategoryRoutes';
import subProcessRoutes from './interfaces/http/routes/subProcessRoutes';

import { errorHandler } from './interfaces/http/middlewares/errorHandler';
import { correlationMiddleware } from './interfaces/http/middlewares/correlationMiddleware';
import { requestLogger, auditLogger } from './interfaces/http/middlewares/loggingMiddleware';
import { globalLimiter } from './interfaces/http/middlewares/securityMiddleware';
import { HealthController } from './interfaces/http/controllers/HealthController';
import { bootstrapAdmin } from './bootstrap/admin.bootstrap';
import roleRoutes from './interfaces/http/routes/roleRoutes';
import permissionRoutes from './interfaces/http/routes/permissionRoutes';
import settingsRoutes from './interfaces/http/routes/settingsRoutes';
import personneRoutes from './interfaces/http/routes/personneRoutes';
import glpiRoutes from './interfaces/http/routes/glpiRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// async function startServer() {
//   // ✅ ICI EXACTEMENT
//   await bootstrapAdmin();

//   app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//   });
// }

// startServer().catch((err) => {
//   console.error('Failed to start server', err);
//   process.exit(1);
// });

/* -------------------------------------------------- */
/* 1. Sécurité & infra                                */
/* -------------------------------------------------- */

app.use(helmet() as any);
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
}) as any);

app.use(globalLimiter as any);
app.use(correlationMiddleware);
app.use(requestLogger);

/* -------------------------------------------------- */
/* 2. Body parser CONDITIONNEL                        */
/* -------------------------------------------------- */

app.use((req, res, next) => {
  // ❌ NE PAS parser le multipart (multer s’en charge)
  if (
    req.method === 'POST' &&
    req.path === '/api/v1/incidents'
  ) {
    return next();
  }

  // ✅ JSON pour TOUT le reste (auth inclus)
  express.json()(req, res, next);
});

/* -------------------------------------------------- */
/* 3. Routes publiques                                */
/* -------------------------------------------------- */

app.get('/health', HealthController.health);
app.get('/ready', HealthController.ready);

/* -------------------------------------------------- */
/* 4. Routes API                                      */
/* -------------------------------------------------- */

app.use('/api/v1', auditLogger);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/incidents', incidentRoutes);
app.use('/api/v1/sites', siteRoutes);
app.use('/api/v1/site-types', siteTypeRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/processes', processRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/sub-categories', subCategoryRoutes);
app.use('/api/v1/sub-processes', subProcessRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/permissions', permissionRoutes);
app.use('/settings', settingsRoutes);
app.use('/api/v1/personnes', personneRoutes);
app.use("/api/v1/glpi", glpiRoutes);

/* -------------------------------------------------- */
/* 5. 404 & erreurs                                   */
/* -------------------------------------------------- */

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

app.use(errorHandler as any);

/* -------------------------------------------------- */
/* 6. Start                                           */
/* -------------------------------------------------- */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
