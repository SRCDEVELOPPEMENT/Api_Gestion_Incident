import { Router } from 'express';
import { IncidentController } from '../controllers/IncidentController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/upload';
import { TaskController } from '../controllers/TaskController';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
  upload.array('attachments'),
  IncidentController.create
);

router.get('/', 
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
  IncidentController.getAll
);

router.get('/:id', 
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
  IncidentController.getById
);

router.put(
  '/:id',
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
  upload.array('attachments'),
  IncidentController.update
);

router.delete(
  '/:id', 
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
  IncidentController.delete
);

router.get(
  '/:incidentId/attachments',
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
  IncidentController.getAttachments
);

router.get(
  '/:incidentId/tasks',
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
  TaskController.getByIncident
);

router.delete(
  '/:incidentId/attachments/:attachmentId',
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
  IncidentController.deleteAttachment
);

router.get(
  '/:id/report/pdf',
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
  IncidentController.generatePdf
);

router.get(
  '/:incidentId/attachments/:attachmentId/download',
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
  IncidentController.downloadAttachment
);


router.get(
  '/stats/simple',
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
  IncidentController.getStatusStats
);

router.post(
  "/export/pdf",
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
  IncidentController.exportPdf
);

router.post(
  "/export/excel",
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
  IncidentController.exportExcel
);

router.post(
  "/query",
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
  IncidentController.query
);

router.put("/:id/close",
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
IncidentController.close);

export default router;