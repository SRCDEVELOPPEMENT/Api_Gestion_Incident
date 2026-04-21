import { Router } from 'express';
import { SubProcessController } from '../controllers/SubProcessController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', requireRole("ADMIN"), SubProcessController.create);
router.get('/', requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"), SubProcessController.getAll);
router.get('/:id', requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"), SubProcessController.getById);
router.patch('/:id', requireRole("ADMIN"), SubProcessController.update);
router.delete('/:id', requireRole("ADMIN"), SubProcessController.delete);

export default router;