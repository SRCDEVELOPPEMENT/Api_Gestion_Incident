import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', requireRole("ADMIN"), CategoryController.create);
router.get('/', requireRole("ADMIN", "EMPLOYE", "MANAGER"), CategoryController.getAll);
router.get('/:id', requireRole("ADMIN", "EMPLOYE", "MANAGER"), CategoryController.getById);
router.patch('/:id', requireRole("ADMIN"), CategoryController.update);
router.delete('/:id', requireRole("ADMIN"), CategoryController.delete);

export default router;