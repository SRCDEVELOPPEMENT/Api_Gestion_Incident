import { Router } from 'express';
import { TypeController } from '../controllers/TypeController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', requireRole("ADMIN"), TypeController.create);
router.get('/', requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"), TypeController.getAll);
router.get('/:id', requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"), TypeController.getById);
router.patch('/:id', requireRole("ADMIN"), TypeController.update);
router.delete('/:id', requireRole('ADMIN'), TypeController.delete);

export default router;