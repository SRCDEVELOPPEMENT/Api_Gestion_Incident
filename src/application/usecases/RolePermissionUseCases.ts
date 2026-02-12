import { IRolePermissionRepository } from '../../domain/repositories/IRolePermissionRepository';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { NotFoundError, BadRequestError } from '../../domain/errors/AppError';

/**
 * 🔹 Synchronise complètement les permissions d’un rôle
 * (remplace toutes les permissions existantes)
 */
export class UpdateRolePermissionsUseCase {
  constructor(
    private rolePermissionRepo: IRolePermissionRepository,
    private roleRepo: IRoleRepository,
    private permissionRepo: IPermissionRepository
  ) {}

  async execute(roleId: number, permissionIds: number[]): Promise<void> {
    // 1. Vérifier que le rôle existe
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new NotFoundError(`Role with ID ${roleId} not found`);
    }

    // 2. Vérifier que toutes les permissions existent
    for (const permissionId of permissionIds) {
      const permission = await this.permissionRepo.findById(permissionId);
      if (!permission) {
        throw new NotFoundError(
          `Permission with ID ${permissionId} not found`
        );
      }
    }

    // 3. Synchronisation complète (transactionnelle côté repository)
    await this.rolePermissionRepo.replacePermissions(roleId, permissionIds);
  }
}

/**
 * 🔹 Récupérer les permissions (IDs) associées à un rôle
 */
export class GetPermissionsByRoleUseCase {
  constructor(
    private rolePermissionRepo: IRolePermissionRepository,
    private roleRepo: IRoleRepository
  ) {}

  async execute(roleId: number): Promise<number[]> {
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      throw new NotFoundError(`Role with ID ${roleId} not found`);
    }

    return this.rolePermissionRepo.getPermissionsByRole(roleId);
  }
}
