import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GlpiUserController {
  // GET /api/v1/glpi-users
  static async getAll(req: Request, res: Response) {
    try {
      const users = await prisma.gLPIUser.findMany({
        orderBy: { fullName: 'asc' },
      });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs GLPI' });
    }
  }
}
