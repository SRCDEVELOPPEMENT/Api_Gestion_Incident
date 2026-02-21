import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { SiteController } from '../controllers/SiteController';

const router = Router();

// 🔐 Auth obligatoire
router.use(authenticate);

// 🔒 ADMIN uniquement
router.get(
  '/',
  requireRole('ADMIN'),
);

router.get(
  '/sites',
  requireRole('ADMIN'),
  SiteController.getAll
);

export default router;
