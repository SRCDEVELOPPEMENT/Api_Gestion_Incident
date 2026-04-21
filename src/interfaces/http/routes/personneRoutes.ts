import { Router } from 'express';
import { PersonneController } from '../controllers/PersonneController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

/* ---------------- CREATE ---------------- */
router.post(
  '/',
  requireRole("ADMIN"),
  PersonneController.create
);

/* ---------------- GET ALL ---------------- */
router.get(
  '/',
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
  PersonneController.getAll
);

/* ---------------- GET BY ID ---------------- */
router.get(
  '/:id',
  requireRole("ADMIN", "EMPLOYE", "MANAGER", "CONTROLEUR"),
  PersonneController.getById
);

/* ---------------- UPDATE ---------------- */
router.patch(
  '/:id',
  requireRole("ADMIN"),
  PersonneController.update
);

/* ---------------- DELETE ---------------- */
router.delete(
  '/:id',
  requireRole("ADMIN"),
  PersonneController.delete
);

export default router;
