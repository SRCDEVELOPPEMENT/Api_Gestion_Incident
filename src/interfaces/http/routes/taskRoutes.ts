import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { upload } from '../middlewares/multer';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// Créer une tâche pour un incident
router.post(
  '/',
  requireRole("ADMIN", "EMPLOYE", "MANAGER"),
  upload.array('attachments'),
  TaskController.create
);

// Toutes les tâches (admin / arbitre)
router.get(
  '/',
  requireRole("ADMIN", "EMPLOYE", "MANAGER"),
  TaskController.getAll
);

// Détails d’une tâche
router.get(
  '/:id',
  requireRole("ADMIN", "EMPLOYE", "MANAGER"),
  TaskController.getById
);

// Mise à jour
router.patch(
  '/:id',
  requireRole("ADMIN", "EMPLOYE", "MANAGER"),
  upload.array('attachments'),
  TaskController.update
);

router.post(
    '/:taskId/attachments',
    requireRole("ADMIN", "EMPLOYE", "MANAGER"),
    upload.array('attachments'),
    TaskController.addAttachments
);


// Suppression
router.delete(
  '/:id',
  requireRole("ADMIN", "EMPLOYE", "MANAGER"),
  TaskController.delete
);

router.delete(
  '/:taskId/attachments',
  requireRole("ADMIN", "EMPLOYE", "MANAGER"),
  TaskController.deleteAllAttachments
);

export default router;
