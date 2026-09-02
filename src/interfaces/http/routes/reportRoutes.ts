import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// Tous les utilisateurs connectés peuvent voir les rapports
// (chacun voit selon ses droits — le service filtre)
const REPORT_ROLES = ['ADMIN', 'EMPLOYE', 'MANAGER', 'CONTROLEUR'] as const;

router.get(
  '/weekly/available-weeks',
  requireRole(...REPORT_ROLES),
  ReportController.getAvailableWeeks,
);

router.get(
  '/weekly/current',
  requireRole(...REPORT_ROLES),
  ReportController.getWeeklyReport,
);

router.get(
  '/weekly',
  requireRole(...REPORT_ROLES),
  ReportController.getWeeklyReport,
);

router.post(
  '/weekly/export/pdf',
  requireRole(...REPORT_ROLES),
  ReportController.exportPdf,
);

router.post(
  '/weekly/export/excel',
  requireRole(...REPORT_ROLES),
  ReportController.exportExcel,
);

router.post(
  '/statistics/export/pdf',
  requireRole(...REPORT_ROLES),
  ReportController.exportStatisticsPdf,
);

router.post(
  '/pilotage/export/pdf',
  requireRole(...REPORT_ROLES),
  ReportController.exportPilotagePdf,
);

export default router;
