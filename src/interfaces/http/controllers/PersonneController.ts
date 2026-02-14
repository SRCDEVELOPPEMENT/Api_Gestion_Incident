import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import {
  CreatePersonneUseCase,
  GetAllPersonnesUseCase,
  GetPersonneByIdUseCase,
  UpdatePersonneUseCase,
  DeletePersonneUseCase
} from '../../../application/usecases/PersonneUseCases';

import { PrismaPersonneRepository } from '../../../infrastructure/repositories/PrismaPersonneRepository';

/* ---------------- VALIDATION ---------------- */

const personneSchema = z.object({
  fullname: z.string().min(3, "Le nom complet doit contenir au moins 3 caractères")
});

export class PersonneController {

  /* ---------------- CREATE ---------------- */

  static async create(req: Request, res: Response, next: NextFunction) {
    try {

      const validatedData = personneSchema.parse(req.body);

      const repo = new PrismaPersonneRepository();
      const useCase = new CreatePersonneUseCase(repo);

      const personne = await useCase.execute(validatedData);

      return res.status(201).json(personne);

    } catch (error) {
      next(error);
    }
  }

  /* ---------------- GET ALL ---------------- */

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {

      const page = Number(req.query.page) || 1;
      const size = Number(req.query.size) || 50;

      const skip = (page - 1) * size;

      const repo = new PrismaPersonneRepository();
      const useCase = new GetAllPersonnesUseCase(repo);

      const personnes = await useCase.execute(skip, size);

      return res.json(personnes);

    } catch (error) {
      next(error);
    }
  }

  /* ---------------- GET BY ID ---------------- */

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {

      const { id } = req.params;

      const repo = new PrismaPersonneRepository();
      const useCase = new GetPersonneByIdUseCase(repo);

      const personne = await useCase.execute(id);

      if (!personne) {
        return res.status(404).json({ message: "Personne introuvable" });
      }

      return res.json(personne);

    } catch (error) {
      next(error);
    }
  }

  /* ---------------- UPDATE ---------------- */

  static async update(req: Request, res: Response, next: NextFunction) {
    try {

      const { id } = req.params;

      const validatedData = personneSchema.partial().parse(req.body);

      const repo = new PrismaPersonneRepository();
      const useCase = new UpdatePersonneUseCase(repo);

      const updated = await useCase.execute(id, validatedData);

      return res.json(updated);

    } catch (error) {
      next(error);
    }
  }

  /* ---------------- DELETE ---------------- */

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {

      const { id } = req.params;

      const repo = new PrismaPersonneRepository();
      const useCase = new DeletePersonneUseCase(repo);

      await useCase.execute(id);

      return res.status(204).send();

    } catch (error) {
      next(error);
    }
  }

}
