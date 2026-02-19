import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { upload } from '../middlewares/multer';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// Créer une tâche pour un incident
router.post(
  '/',
  requireRole("ADMIN", "EMPLOYE"),
  upload.array('attachments'),
  TaskController.create
);

// Toutes les tâches (admin / arbitre)
router.get(
  '/',
  requireRole("ADMIN", "EMPLOYE"),
  TaskController.getAll
);

// Détails d’une tâche
router.get(
  '/:id',
  requireRole("ADMIN", "EMPLOYE"),
  TaskController.getById
);

// Mise à jour
router.patch(
  '/:id',
  requireRole("ADMIN", "EMPLOYE"),
  upload.array('attachments'),
  TaskController.update
);

router.post(
    '/:taskId/attachments',
    requireRole("ADMIN", "EMPLOYE"),
    upload.array('attachments'),
    TaskController.addAttachments
);


// Suppression
router.delete(
  '/:id',
  requireRole("ADMIN", "EMPLOYE"),
  TaskController.delete
);

router.delete(
  '/:taskId/attachments',
  requireRole("ADMIN", "EMPLOYE"),
  TaskController.deleteAllAttachments
);

export default router;
