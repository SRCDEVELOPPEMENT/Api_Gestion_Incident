import { Request, Response, NextFunction } from 'express';
import { PrismaRolePermissionRepository } from '../../../infrastructure/repositories/PrismaRolePermissionRepository';
import { PrismaRoleRepository } from '../../../infrastructure/repositories/PrismaRoleRepository';
import { PrismaPermissionRepository } from '../../../infrastructure/repositories/PrismaPermissionRepository';
import {
  GetPermissionsByRoleUseCase,
  UpdateRolePermissionsUseCase
} from '../../../application/usecases/RolePermissionUseCases';

export class RolePermissionController {

  /**
   * GET /api/v1/roles/:id/permissions
   */
  static async getPermissionsByRole(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const roleId = Number(req.params.id);
      if (Number.isNaN(roleId)) {
        return res.status(400).json({ message: 'Invalid roleId' });
      }

      const useCase = new GetPermissionsByRoleUseCase(
        new PrismaRolePermissionRepository(),
        new PrismaRoleRepository()
      );

      const permissions = await useCase.execute(roleId);
      return res.json(permissions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/roles/:id/permissions
   * Body: { permissionIds: number[] }
   */
  static async updatePermissions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const roleId = Number(req.params.id);
      const { permissionIds } = req.body;

      if (
        Number.isNaN(roleId) ||
        !Array.isArray(permissionIds) ||
        !permissionIds.every(id => Number.isInteger(id))
      ) {
        return res.status(400).json({ message: 'Invalid payload' });
      }

      const useCase = new UpdateRolePermissionsUseCase(
        new PrismaRolePermissionRepository(),
        new PrismaRoleRepository(),
        new PrismaPermissionRepository()
      );

      await useCase.execute(roleId, permissionIds);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
