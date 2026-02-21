import { Router } from 'express';
import { SiteController } from '../controllers/SiteController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', requireRole("ADMIN"), SiteController.create);
router.get('/', requireRole("ADMIN", "EMPLOYE", "MANAGER"), SiteController.getAll);
router.get('/:id', requireRole("ADMIN", "EMPLOYE", "MANAGER"), SiteController.getById);
router.patch('/:id', requireRole("ADMIN"), SiteController.update);
router.delete('/:id', requireRole("ADMIN"), SiteController.delete);

export default router;