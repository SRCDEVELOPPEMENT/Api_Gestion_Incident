import { Request, Response, NextFunction } from 'express';
import {
  CreateSiteUseCase,
  GetAllSitesUseCase,
  GetSiteByIdUseCase,
  UpdateSiteUseCase,
  DeleteSiteUseCase,
  GetSitesByTypeIdUseCase
} from '../../../application/usecases/SiteUseCases';
import { PrismaSiteRepository } from '../../../infrastructure/repositories/PrismaSiteRepository';
import { z } from 'zod';
import { NotFoundError } from '../../../domain/errors/AppError';

// ✅ Accepte number ou string, convertit en number, valide int > 0
const typeIdSchema = z.coerce.number().int().positive();

const createSiteSchema = z.object({
  name: z.string().min(2),
  typeId: typeIdSchema, // ✅ obligatoire
});

// ✅ En update : on autorise la modification partielle, mais si typeId est fourni, il doit être valide
const updateSiteSchema = z.object({
  name: z.string().min(2).optional(),
  typeId: typeIdSchema.optional(),
});

export class SiteController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSiteSchema.parse((req as any).body);
      const repo = new PrismaSiteRepository();
      const useCase = new CreateSiteUseCase(repo);
      const createdByUserId = (req as any).user.id;

      // ✅ typeId est bien présent dans data
      const site = await useCase.execute({ ...data, createdByUserId });
      return (res as any).status(201).json(site);
    } catch (error) {
      (next as any)(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const repo = new PrismaSiteRepository();
      const useCase = new GetAllSitesUseCase(repo);

      const result = await useCase.execute(page, limit);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = new PrismaSiteRepository();
      const useCase = new GetSiteByIdUseCase(repo);
      const site = await useCase.execute(Number(req.params.id));
      if (!site) throw new NotFoundError('Site not found');
      return (res as any).json(site);
    } catch (error) {
      (next as any)(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      // ✅ IMPORTANT: utiliser updateSiteSchema (et pas createSiteSchema.partial())
      const data = updateSiteSchema.parse((req as any).body);

      const repo = new PrismaSiteRepository();
      const useCase = new UpdateSiteUseCase(repo);

      const site = await useCase.execute(Number(req.params.id), data);
      return (res as any).json(site);
    } catch (error) {
      (next as any)(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = new PrismaSiteRepository();
      const useCase = new DeleteSiteUseCase(repo);
      await useCase.execute(Number(req.params.id));
      return (res as any).status(204).send();
    } catch (error) {
      (next as any)(error);
    }
  }

// ✅ NEW: GET /sites/by-type/:typeId?page=1&limit=10
  static async getByTypeId(req: Request, res: Response, next: NextFunction) {
    try {
      const typeId = typeIdSchema.parse(req.params.typeId);
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);

      const repo = new PrismaSiteRepository();
      const useCase = new GetSitesByTypeIdUseCase(repo);

      const result = await useCase.execute(typeId, page, limit);
      return res.json(result);
    } catch (error) {
      (next as any)(error);
    }
  }

}