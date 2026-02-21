import { Router } from 'express';
import { SubCategoryController } from '../controllers/SubCategoryController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', requireRole("ADMIN"), SubCategoryController.create);
router.get('/', requireRole("ADMIN", "EMPLOYE", "MANAGER"), SubCategoryController.getAll);
router.get('/:id', requireRole("ADMIN", "EMPLOYE", "MANAGER"), SubCategoryController.getById);
router.patch('/:id', requireRole("ADMIN"), SubCategoryController.update);
router.delete('/:id', requireRole("ADMIN"), SubCategoryController.delete);

export default router;