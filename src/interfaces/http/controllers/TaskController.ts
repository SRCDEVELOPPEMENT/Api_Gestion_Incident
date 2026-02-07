import { Request, Response } from 'express';
import { PrismaTaskRepository } from '../../../infrastructure/repositories/PrismaTaskRepository';
import { 
    CreateTaskUseCase, 
    GetAllTasksUseCase, 
    GetTasksByIncidentUseCase, 
    UpdateTaskUseCase, 
    DeleteTaskUseCase, 
    GetTaskByIdUseCase
} from '../../../application/usecases/TaskUseCases';
import { z } from 'zod';

const taskSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    incidentId: z.coerce.number()
});

export class TaskController {

    static async create(req: Request, res: Response) {
    try {
        const authUser = (req as any).user;
        if (!authUser?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
        }

        // ⚠️ multer DOIT être actif
        const files = req.files as Express.Multer.File[] | undefined;

        console.log('BODY:', req.body);     // 🧪 debug
        console.log('FILES:', req.files);   // 🧪 debug

        const parsed = taskSchema.parse(req.body);

        const data = {
        ...parsed,
        incidentId: Number(parsed.incidentId),
        userId: Number(authUser.id)
        };

        const repo = new PrismaTaskRepository();
        const useCase = new CreateTaskUseCase(repo);

        const result = await useCase.execute(data, files);

        return res.status(201).json(result);
    } catch (error: any) {
        console.error(error);
        return res.status(400).json({ error: error.message });
    }
    }

    static async getAll(req: Request, res: Response) {
        const repo = new PrismaTaskRepository();
        const useCase = new GetAllTasksUseCase(repo);
        const result = await useCase.execute(Number((req as any).query.skip) || 0, Number((req as any).query.take) || 20);
        return (res as any).json(result);
    }

    static async getById(req: Request, res: Response) {
        const repo = new PrismaTaskRepository();
        const useCase = new GetTaskByIdUseCase(repo);
        const result = await useCase.execute((req as any).params.id);
        if (!result) return (res as any).status(404).json({ message: 'Not found' });
        return (res as any).json(result);
    }

    static async update(req: Request, res: Response) {
        try {
            const data = taskSchema.partial().parse((req as any).body);
            const repo = new PrismaTaskRepository();
            const useCase = new UpdateTaskUseCase(repo);
            const result = await useCase.execute((req as any).params.id, data);
            return (res as any).json(result);
        } catch (error: any) {
            return (res as any).status(400).json({ error: error.message });
        }
    }

    static async delete(req: Request, res: Response) {
            try {
            const repo = new PrismaTaskRepository();
            const useCase = new DeleteTaskUseCase(repo);
            await useCase.execute(Number(req.params.id));
            return (res as any).status(204).send();
        } catch (error: any) {
            return (res as any).status(400).json({ error: error.message });
        }
    }

    static async getByIncident(req: Request, res: Response) {
        const incidentId = Number(req.params.incidentId);

        if (Number.isNaN(incidentId)) {
            return res.status(400).json({ message: 'Invalid incidentId' });
        }

        const repo = new PrismaTaskRepository();
        const useCase = new GetTasksByIncidentUseCase(repo);

        const tasks = await useCase.execute(incidentId);

        return res.json(tasks);
    }

}