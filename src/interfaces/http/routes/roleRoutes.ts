import { Router } from 'express';
import { RoleController } from '../controllers/RoleController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// 🔐 Secure all routes
router.use(authenticate);

// =====================
// CRUD Roles
// =====================

router.post('/', requireRole("ADMIN"), RoleController.create);
router.get('/', requireRole("ADMIN", "EMPLOYE"), RoleController.getAll);
router.get('/:id', requireRole("ADMIN", "EMPLOYE"), RoleController.getById);
router.put('/:id', requireRole("ADMIN"), RoleController.update);
router.delete('/:id', requireRole("ADMIN"), RoleController.delete);

export default router;
