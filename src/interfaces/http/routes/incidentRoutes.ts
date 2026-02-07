import { Router } from 'express';
import { IncidentController } from '../controllers/IncidentController';
import { authenticate, requirePermission } from '../middlewares/authMiddleware';
import { uploadIncidentFiles } from '../middlewares/upload';
import { TaskController } from '../controllers/TaskController';

const router = Router();

router.use(authenticate);


router.post(
  '/',
  requirePermission('incident:create'),
  uploadIncidentFiles,
  IncidentController.create
);

router.get('/', requirePermission('INCIDENT_READ'), IncidentController.getAll);
router.get('/:id', requirePermission('INCIDENT_READ'), IncidentController.getById);
//router.put('/:id', requirePermission('INCIDENT_UPDATE'), IncidentController.update);
router.put(
  '/:id',
  requirePermission('INCIDENT_UPDATE'),
  uploadIncidentFiles,
  IncidentController.update
);
router.delete('/:id', requirePermission('INCIDENT_DELETE'), IncidentController.delete);
router.get(
  '/:incidentId/attachments',
  requirePermission('INCIDENT_READ'),
  IncidentController.getAttachments
);
router.get(
  '/:incidentId/tasks',
  requirePermission('TASK_READ'),
  TaskController.getByIncident
);

router.delete(
  '/:incidentId/attachments/:attachmentId',
  requirePermission('INCIDENT_UPDATE'),
  IncidentController.deleteAttachment
);

router.get(
  '/:id/report/pdf',
  requirePermission('INCIDENT_READ'),
  IncidentController.generatePdf
);

export default router;