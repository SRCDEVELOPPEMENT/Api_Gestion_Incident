import { Router } from 'express';
import { GlpiUserController } from '../controllers/GlpiUserController';

const router = Router();

// GET /api/v1/glpi-users
router.get('/', GlpiUserController.getAll);

export default router;
