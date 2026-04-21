import { Request, Response } from 'express';
import { PrismaUserRepository } from '../../../infrastructure/repositories/PrismaUserRepository';
import { sendResetEmail } from '../../../services/mail.service';
import crypto from 'crypto';

export class PasswordResetController {
  static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }
    // Recherche de l'utilisateur
    const userRepo = new PrismaUserRepository();
    const user = await userRepo.findByEmail(email);
    if (!user) {
      // Pour la sécurité, on ne précise pas si l'email existe ou non
      return res.status(200).json({ message: 'Si cet email existe, un lien a été envoyé.' });
    }
    // Générer un token sécurisé
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    // Stocker le token et l'expiration dans la base (à ajouter dans le modèle User si pas déjà fait)
    await userRepo.saveResetToken(user.id, token, expires);
    // Générer le lien de réinitialisation
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl && process.env.NODE_ENV === 'production') {
      console.error("FRONTEND_URL n'est pas défini dans les variables d'environnement (production)");
      return res.status(500).json({ message: "Erreur de configuration serveur : FRONTEND_URL manquant." });
    }
    const link = `${frontendUrl}/incident/reset-password?token=${token}`;
    // Envoyer l'email
    await sendResetEmail(email, link);
    return res.status(200).json({ message: 'Si cet email existe, un lien a été envoyé.' });
  }

  static async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token et nouveau mot de passe requis' });
    }
    const userRepo = new PrismaUserRepository();
    // Recherche de l'utilisateur par token
    const user = await userRepo.findByResetToken(token);
    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }
    // Mettre à jour le mot de passe et supprimer le token
    await userRepo.updatePasswordAndClearToken(user.id, password);
    return res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
  }
}
