import { Request, Response, NextFunction } from 'express';
import { 
    CreateSiteUseCase, 
    GetAllSitesUseCase,
    GetSiteByIdUseCase,
    UpdateSiteUseCase, 
    DeleteSiteUseCase
} from '../../../application/usecases/SiteUseCases';
import { PrismaSiteRepository } from '../../../infrastructure/repositories/PrismaSiteRepository';
import { z } from 'zod';
import { NotFoundError } from '../../../domain/errors/AppError';

const createSiteSchema = z.object({
  name: z.string().min(2)
});

export class SiteController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSiteSchema.parse((req as any).body);
      const repo = new PrismaSiteRepository();
      const useCase = new CreateSiteUseCase(repo);
      const createdByUserId = (req as any).user.id;
      const site = await useCase.execute({ ...data, createdByUserId });
      return (res as any).status(201).json(site);
    } catch (error) {
      // Fix: Type 'NextFunction' has no call signatures.
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
        // Fix: Type 'NextFunction' has no call signatures.
        (next as any)(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
      try {
        const data = createSiteSchema.partial().parse((req as any).body);
        const repo = new PrismaSiteRepository();
        const useCase = new UpdateSiteUseCase(repo);
        const site = await useCase.execute(Number(req.params.id), data);
        return (res as any).json(site);
      } catch (error) {
          // Fix: Type 'NextFunction' has no call signatures.
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
        // Fix: Type 'NextFunction' has no call signatures.
        (next as any)(error);
      }
  }
}