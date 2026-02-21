import { Router } from 'express';
import { IncidentController } from '../controllers/IncidentController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/upload';
import { TaskController } from '../controllers/TaskController';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireRole("ADMIN", "EMPLOYE", "MANAGER"),
  upload.array('attachments'),
  IncidentController.create
);

router.get('/', 
  requireRole("ADMIN", "EMPLOYE", "MANAGER"), 
  IncidentController.getAll
);

router.get('/:id', 
  requireRole("ADMIN", "EMPLOYE", "MANAGER"), 
  IncidentController.getById
);

router.put(
  '/:id',
  requireRole("ADMIN", "EMPLOYE", "MANAGER"),
  upload.array('attachments'),
  IncidentController.update
);

router.delete('/:id', requireRole("ADMIN", "EMPLOYE", "MANAGER"), IncidentController.delete);

router.get(
  '/:incidentId/attachments',
  requireRole("ADMIN", "EMPLOYE", "MANAGER"),
  IncidentController.getAttachments
);

router.get(
  '/:incidentId/tasks',
  requireRole("ADMIN", "EMPLOYE", "MANAGER"),
  TaskController.getByIncident
);

router.delete(
  '/:incidentId/attachments/:attachmentId',
  requireRole("ADMIN", "EMPLOYE", "MANAGER"),
  IncidentController.deleteAttachment
);

router.get(
  '/:id/report/pdf',
  requireRole("ADMIN", "EMPLOYE", "MANAGER"),
  IncidentController.generatePdf
);

router.get(
  '/:incidentId/attachments/:attachmentId/download',
  requireRole("ADMIN", "EMPLOYE", "MANAGER"),
  IncidentController.downloadAttachment
);


router.get(
  '/stats/simple',
  requireRole("ADMIN", "EMPLOYE", "MANAGER"),
  IncidentController.getStatusStats
);


router.post(
  "/query",
  requireRole("ADMIN", "EMPLOYE", "MANAGER"),
  IncidentController.query
);

export default router;