import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', requireRole("ADMIN", "EMPLOYE"), UserController.getAll);
router.get('/:id', requireRole("ADMIN", "EMPLOYE"), UserController.getById);
router.put('/:id', requireRole("ADMIN"), UserController.update);
router.delete('/:id', requireRole("ADMIN"), UserController.delete);
// ✅ CRÉATION UTILISATEUR
router.post(
  '/',
  requireRole("ADMIN"),
  UserController.create
);
export default router;