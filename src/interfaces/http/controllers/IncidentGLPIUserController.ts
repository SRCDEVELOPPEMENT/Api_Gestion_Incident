import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class IncidentGLPIUserController {
  // POST /api/v1/incidents/:id/assign-glpi-users
  static async assign(req: Request, res: Response) {
    const incidentId = Number(req.params.id);
    const { glpiUserIds } = req.body; // array of GLPIUser ids
    if (!Array.isArray(glpiUserIds)) {
      return res.status(400).json({ error: 'glpiUserIds doit être un tableau' });
    }
    try {
      // Supprimer les assignations existantes pour cet incident
      await prisma.incidentGLPIUser.deleteMany({ where: { incidentId } });
      // Créer les nouvelles assignations
      if (glpiUserIds.length > 0) {
        await prisma.incidentGLPIUser.createMany({
          data: glpiUserIds.map((glpiUserId: number) => ({ incidentId, glpiUserId })),
        });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Erreur lors de l’assignation des utilisateurs GLPI à l’incident' });
    }
  }
}
