import { Router } from 'express';
import { SiteTypeController } from '../controllers/SiteTypeController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', requireRole('SITETYPE_CREATE'), SiteTypeController.create);
router.get('/', requireRole('SITETYPE_READ'), SiteTypeController.getAll);
router.get('/:id', requireRole('SITETYPE_READ'), SiteTypeController.getById);
router.put('/:id', requireRole('SITETYPE_UPDATE'), SiteTypeController.update);
router.delete('/:id', requireRole('SITETYPE_DELETE'), SiteTypeController.delete);

export default router;