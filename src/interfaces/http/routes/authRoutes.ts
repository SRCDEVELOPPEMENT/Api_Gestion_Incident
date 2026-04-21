import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authLimiter } from '../middlewares/securityMiddleware';
import { authenticate } from '../middlewares/authMiddleware';
import { PasswordResetController } from '../controllers/PasswordResetController';

const router = Router();

router.post('/register', AuthController.register);
// Protection brute-force spécifiquement sur le login
//router.post('/login', authLimiter as any, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
// Session rehydration endpoint
router.get('/me', authenticate, AuthController.me);
router.post('/login', AuthController.login);


// Mot de passe oublié
router.post('/forgot-password', PasswordResetController.forgotPassword);
// Réinitialisation effective du mot de passe
router.post('/reset-password', PasswordResetController.resetPassword);

export default router;