import { Request, Response, NextFunction } from 'express';
import { PrismaTypeRepository } from '../../../infrastructure/repositories/PrismaTypeRepository';
import { 
    CreateTypeUseCase,
    GetAllTypesUseCase,
    GetTypeByIdUseCase,
    UpdateTypeUseCase,
    DeleteTypeUseCase
} from '../../../application/usecases/TypeUseCases';
import { z } from 'zod';

const typeSchema = z.object({
    name: z.string().min(1)
});

export class TypeController {

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = typeSchema.parse((req as any).body);
            const createdByUserId = Number((req as any).user.id);

            const repo = new PrismaTypeRepository();
            const useCase = new CreateTypeUseCase(repo);

            const result = await useCase.execute({
            ...data,
            createdByUserId,
            });

            return (res as any).status(201).json(result);
        } catch (error) {
            (next as any)(error);
        }
    }
    

    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = Number((req as any).query.page) || 1;
            const size = Number((req as any).query.size) || 10;
            
            const repo = new PrismaTypeRepository();
            const useCase = new GetAllTypesUseCase(repo);
            const result = await useCase.execute({ page, size });
            return (res as any).json(result);
        } catch (error) {
            // Fix: Type 'NextFunction' has no call signatures.
            (next as any)(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "ID invalide" });
            }

            const repo = new PrismaTypeRepository();
            const useCase = new GetTypeByIdUseCase(repo);

            const type = await useCase.execute(id);

            if (!type) {
            return res.status(404).json({ message: "Type introuvable" });
            }

            return res.json(type);
        } catch (error) {
            next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "ID invalide" });
            }

            const data = typeSchema.partial().parse((req as any).body);

            const repo = new PrismaTypeRepository();
            const useCase = new UpdateTypeUseCase(repo);

            const result = await useCase.execute(id, data);
            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "ID invalide" });
        }

        const repo = new PrismaTypeRepository();
        const useCase = new DeleteTypeUseCase(repo);

        await useCase.execute(id);
        return res.status(204).send();
    } catch (error) {
        next(error);
    }
    }
}