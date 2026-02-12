import { Router } from 'express';
import { ProcessController } from '../controllers/ProcessController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', requireRole("ADMIN"), ProcessController.create);
router.get('/', requireRole("ADMIN", "EMPLOYE"), ProcessController.getAll);
router.get('/:id', requireRole("ADMIN", "EMPLOYE"), ProcessController.getById);
router.patch('/:id', requireRole("ADMIN"), ProcessController.update);
router.delete('/:id', requireRole("ADMIN"), ProcessController.delete);

export default router;