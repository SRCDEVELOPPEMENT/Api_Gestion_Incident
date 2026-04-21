import { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '../../../application/usecases/RegisterUserUseCase';
import { LoginUserUseCase } from '../../../application/usecases/LoginUserUseCase';
import { RefreshTokenUseCase } from '../../../application/usecases/RefreshTokenUseCase';
import { LogoutUseCase } from '../../../application/usecases/LogoutUseCase';
import { PrismaUserRepository } from '../../../infrastructure/repositories/PrismaUserRepository';
import { PrismaRefreshTokenRepository } from '../../../infrastructure/repositories/PrismaRefreshTokenRepository';
import { z } from 'zod';
import { UnauthorizedError } from '../../../domain/errors/AppError';

const matriculeRegex = /^[A-Z]{2}\d+$/;

const registerSchema = z.object({
  matricule: z.string().regex(matriculeRegex, 'Matricule invalid'),
  username: z.string().min(3),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().regex(/^[^\s@]+@(?:[^\s@]+\.)*groupesorepco\.com$/, 'Email domain invalid'),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"],
});

const authSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse((req as any).body);
      // On retire confirmPassword avant d'envoyer à la couche métier
      const { confirmPassword, ...userData } = data;
      const userRepo = new PrismaUserRepository();
      const useCase = new RegisterUserUseCase(userRepo);
      const user = await useCase.execute(userData);

      const { password, ...userWithoutPassword } = user;
      return (res as any).status(201).json(userWithoutPassword);
    } catch (error: any) {
      (next as any)(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = authSchema.parse(req.body);

      const userRepo = new PrismaUserRepository();
      const tokenRepo = new PrismaRefreshTokenRepository();
      const useCase = new LoginUserUseCase(userRepo);

      const result = await useCase.execute(data);

      return res.status(200).json({
        message: 'Login successful',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        roles: result.roles
      });
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return next(new UnauthorizedError('Invalid credentials'));
      }
      return next(error);
    }
  }

  static async me(req: Request, res: Response) {
    return res.status(200).json((req as any).user);
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const body = (req as any).body;
      const refreshToken = body.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedError('No refresh token provided');
      }

      const userRepo = new PrismaUserRepository();
      const tokenRepo = new PrismaRefreshTokenRepository();

      const useCase = new RefreshTokenUseCase(tokenRepo, userRepo);
      const tokens = await useCase.execute(refreshToken);

      return (res as any).status(200).json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (error: any) {
      (next as any)(new UnauthorizedError(error.message || 'Invalid or expired session'));
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const body = (req as any).body;
      const refreshToken = body.refreshToken;

      if (refreshToken) {
        const tokenRepo = new PrismaRefreshTokenRepository();
        const useCase = new LogoutUseCase(tokenRepo);
        await useCase.execute(refreshToken);
      }

      return (res as any).status(204).send();
    } catch (error: any) {
      (next as any)(error);
    }
  }
}
