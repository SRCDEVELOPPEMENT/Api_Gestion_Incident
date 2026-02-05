import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { upload } from '../middlewares/multer';
import { authenticate, requirePermission } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

// Créer une tâche pour un incident
router.post(
  '/',
  requirePermission('TASK_CREATE'),
  upload.array('attachments'),
  TaskController.create
);

// Toutes les tâches (admin / arbitre)
router.get(
  '/',
  requirePermission('TASK_READ'),
  TaskController.getAll
);

// Détails d’une tâche
router.get(
  '/:id',
  requirePermission('TASK_READ'),
  TaskController.getById
);

// Mise à jour
router.patch(
  '/:id',
  requirePermission('TASK_UPDATE'),
  TaskController.update
);

// Suppression
router.delete(
  '/:id',
  requirePermission('TASK_DELETE'),
  TaskController.delete
);

export default router;
