import { Request, Response, NextFunction } from 'express';
import {
  CreateIncidentUseCase,
  GetAllIncidentsUseCase,
  GetIncidentByIdUseCase,
  UpdateIncidentUseCase,
  DeleteIncidentUseCase
} from '../../../application/usecases/IncidentUseCases';
import { PrismaIncidentRepository } from '../../../infrastructure/repositories/PrismaIncidentRepository';
import { z } from 'zod';
import { NotFoundError } from '../../../domain/errors/AppError';
import { CreateIncidentDTO, UpdateIncidentDTO } from '../../../domain/entities/Incident';

const incidentSchema = z.object({
  description: z.string().min(5),
  scope: z.string().optional().nullable(),
  siteIds: z.preprocess(
    (val) => Array.isArray(val) ? val : [val],
    z.array(z.string()).min(1)
  ),
  categoryId: z.string(),
  subCategoryId: z.string().optional(),
  otherSubCategory: z.string().optional(),
  processDomainId: z.string().optional(),
  subProcessId: z.string().optional(),
  assignedUserIds: z.preprocess(
    (val) => {
      if (!val) return [];
      return Array.isArray(val) ? val : [val];
    },
    z.array(z.string()).optional()
  ),
  dueDate: z.string(),
  urgency: z.enum(['Faible', 'Moyenne', 'Haute', 'Immédiate']),
  criticality: z.enum(['Faible', 'Moyenne', 'Haute', 'Critique'])
});

export class IncidentController {

  static async create(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      /**
       * 1️⃣ Sécurité : utilisateur authentifié
       */
      const authUser = (req as any).user;
      if (!authUser?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      /**
       * 2️⃣ Validation Zod (body uniquement)
       */
      //const validatedData = incidentSchema.parse(req.body);
      const validatedData = incidentSchema.parse(req.body) as CreateIncidentDTO;
      /**
       * 3️⃣ Fichiers (multer)
       */
      const files = req.files as Express.Multer.File[] | undefined;
      /**
       * 4️⃣ Initialisation UseCase
       */
      const repo = new PrismaIncidentRepository();
      const useCase = new CreateIncidentUseCase(repo);

      /**
       * 5️⃣ Exécution métier
       */
      //const validatedData = incidentSchema.parse(req.body);
      const incident = await useCase.execute(
        validatedData,
        authUser.id,
        files
      );

      /**
       * 6️⃣ Réponse
       */
      return res.status(201).json(incident);

    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = new PrismaIncidentRepository();
      const useCase = new GetAllIncidentsUseCase(repo);

      const page = Number((req as any).query.page) || 1;
      const size = Number((req as any).query.size) || 10;
      const sortBy = (req as any).query.sortBy as string;
      const sortOrder = (req as any).query.sortOrder as 'asc' | 'desc';
      // Basic filtering
      const filters: any = {};
      if ((req as any).query.status) filters.status = (req as any).query.status;
      if ((req as any).query.userId) filters.userId = (req as any).query.userId;

      const incidents = await useCase.execute({ page, size, filters, sortBy, sortOrder });
      return (res as any).json(incidents);
    } catch (error) {
      // Fix: Type 'NextFunction' has no call signatures.
      (next as any)(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = new PrismaIncidentRepository();
      const useCase = new GetIncidentByIdUseCase(repo);
      const incident = await useCase.execute((req as any).params.id);
      if (!incident) throw new NotFoundError('Incident not found');
      return (res as any).json(incident);
    } catch (error) {
      // Fix: Type 'NextFunction' has no call signatures.
      (next as any)(error);
    }
  }

  // static async update(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const parsedData = incidentSchema.partial().parse((req as any).body);
  //     const validatedData = {
  //       ...parsedData,
  //       scope: parsedData.scope ?? undefined
  //     } as UpdateIncidentDTO;
  //     const repo = new PrismaIncidentRepository();
  //     const useCase = new UpdateIncidentUseCase(repo);
  //     const incident = await useCase.execute((req as any).params.id, validatedData);
  //     return (res as any).json(incident);
  //   } catch (error) {
  //     // Fix: Type 'NextFunction' has no call signatures.
  //     (next as any)(error);
  //   }
  // }

  // static async update(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const authUser = (req as any).user;
  //     if (!authUser?.id) {
  //       return res.status(401).json({ message: 'Unauthorized' });
  //     }

  //     const validatedData = incidentSchema.partial().parse(req.body);

  //     const files = (req as any).files as Express.Multer.File[] | undefined;

  //     const repo = new PrismaIncidentRepository();
  //     const useCase = new UpdateIncidentUseCase(repo);

  //     const incident = await useCase.execute(
  //       req.params.id,
  //       validatedData,
  //       files
  //     );

  //     return res.json(incident);
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = new PrismaIncidentRepository();
      const useCase = new DeleteIncidentUseCase(repo);
      await useCase.execute((req as any).params.id);
      return (res as any).status(204).send();
    } catch (error) {
      // Fix: Type 'NextFunction' has no call signatures.
      (next as any)(error);
    }
  }
}