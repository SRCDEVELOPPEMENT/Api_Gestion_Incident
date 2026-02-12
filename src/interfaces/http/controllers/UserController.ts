import { Request, Response, NextFunction } from 'express';
import { PrismaUserRepository } from '../../../infrastructure/repositories/PrismaUserRepository';
import { 
  GetAllUsersUseCase, 
  GetUserUseCase,
  UpdateUserUseCase, 
  DeleteUserUseCase 
} from '../../../application/usecases/UserUseCases';
import { z } from 'zod';
import { NotFoundError } from '../../../domain/errors/AppError';
import { UpdateUserDTO, User } from '../../../domain/entities/User';

const updateSchema = z.object({
  username: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.number().int()).optional(),
  siteId: z.number().int().nullable().optional() // ✅ AJOUT
});

const createUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.number().int()).optional(),
  siteId: z.number().int().nullable().optional() // ✅ AJOUT
});

export class UserController {

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = new PrismaUserRepository();
      const useCase = new GetAllUsersUseCase(repo);

      const skip = Number(req.query.skip) || 0;
      const take = Number(req.query.take) || 20;

      const users = await useCase.execute(skip, take);

      const safeUsers = users.map(({ password, ...rest }) => rest);

      return res.json(safeUsers);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid user id'
        });
      }

      const repo = new PrismaUserRepository();
      const useCase = new GetUserUseCase(repo);

      const user = await useCase.execute(id);
      if (!user) throw new NotFoundError('User not found');

      const { password, ...rest } = user;
      return res.json(rest);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const data = updateSchema.parse(req.body);

      const repo = new PrismaUserRepository();
      const useCase = new UpdateUserUseCase(repo);

      const user = await useCase.execute(id, data);

      return res.json(user);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid user id'
        });
      }

      const repo = new PrismaUserRepository();
      const useCase = new DeleteUserUseCase(repo);

      await useCase.execute(id);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

static async create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createUserSchema.parse(req.body);

    const repo = new PrismaUserRepository();
    const user = await repo.create(data);

    return res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

}
