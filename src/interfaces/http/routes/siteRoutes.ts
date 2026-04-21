import { Router } from 'express';
import { SiteController } from '../controllers/SiteController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', requireRole("ADMIN"), SiteController.create);
router.get('/', requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"), SiteController.getAll);
router.get('/:id', requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"), SiteController.getById);
router.patch('/:id', requireRole("ADMIN"), SiteController.update);
router.delete('/:id', requireRole("ADMIN"), SiteController.delete);
router.get(
  "/by-type/:typeId",
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
  SiteController.getByTypeId
);
export default router;