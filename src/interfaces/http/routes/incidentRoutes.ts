import { Router } from 'express';
import { IncidentController } from '../controllers/IncidentController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
//import { uploadIncidentFiles } from '../middlewares/upload';
import { upload } from '../middlewares/upload';
import { TaskController } from '../controllers/TaskController';
import prisma from '../../../infrastructure/database/prisma';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireRole("ADMIN", "EMPLOYE"),
  upload.array('attachments'),
  IncidentController.create
);

router.get('/', 
  requireRole("ADMIN", "EMPLOYE"), 
  IncidentController.getAll
);

router.get('/:id', 
  requireRole("ADMIN", "EMPLOYE"), 
  IncidentController.getById
);

router.put(
  '/:id',
  requireRole("ADMIN", "EMPLOYE"),
  upload.array('attachments'),
  IncidentController.update
);

router.delete('/:id', requireRole("ADMIN", "EMPLOYE"), IncidentController.delete);

router.get(
  '/:incidentId/attachments',
  requireRole("ADMIN", "EMPLOYE"),
  IncidentController.getAttachments
);

router.get(
  '/:incidentId/tasks',
  requireRole("ADMIN", "EMPLOYE"),
  TaskController.getByIncident
);

router.delete(
  '/:incidentId/attachments/:attachmentId',
  requireRole("ADMIN", "EMPLOYE"),
  IncidentController.deleteAttachment
);

router.get(
  '/:id/report/pdf',
  requireRole("ADMIN", "EMPLOYE"),
  IncidentController.generatePdf
);

router.get(
  '/:incidentId/attachments/:attachmentId/download',
  requireRole("ADMIN", "EMPLOYE"),
  IncidentController.downloadAttachment
);

// router.get(
//   '/stats/simple', 
//   requireRole("ADMIN", "EMPLOYE"),
//   async (req, res) => {
//   try {
//     const [open, inProgress, resolved, cancelled] = await Promise.all([
//       prisma.incident.count({ where: { status: 'OPEN' } }),
//       prisma.incident.count({ where: { status: 'IN_PROGRESS' } }),
//       prisma.incident.count({ where: { status: 'RESOLVED' } }),
//       prisma.incident.count({ where: { status: 'CANCELLED' } }),
//     ]);

//     res.json({
//       open,
//       inProgress,
//       closed: resolved,
//       cancelled,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Erreur récupération stats' });
//   }
// });


router.get(
  '/stats/simple',
  requireRole("ADMIN", "EMPLOYE"),
  IncidentController.getStatusStats
);

export default router;