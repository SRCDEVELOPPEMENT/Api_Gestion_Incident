import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { SiteController } from '../controllers/SiteController';

const router = Router();

// 🔐 Auth obligatoire
router.use(authenticate);

// 🔒 ADMIN / MANAGER uniquement
router.get(
  '/',
  requireRole('ADMIN', 'MANAGER'),
);

router.get(
  '/sites',
  requireRole('ADMIN', 'MANAGER'),
  SiteController.getAll
);

export default router;
