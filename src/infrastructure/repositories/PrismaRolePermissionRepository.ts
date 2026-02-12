import { IRolePermissionRepository } from '../../domain/repositories/IRolePermissionRepository';
import prisma from '../database/prisma';

export class PrismaRolePermissionRepository
  implements IRolePermissionRepository
{
  /**
   * 🔹 Remplace complètement les permissions d’un rôle
   * (stratégie de synchronisation complète)
   */
  async replacePermissions(
    roleId: number,
    permissionIds: number[]
  ): Promise<void> {
    await prisma.$transaction(async tx => {
      // 1. Supprimer toutes les permissions existantes du rôle
      await tx.rolePermission.deleteMany({
        where: { roleId }
      });

      // 2. Réinsérer les permissions sélectionnées
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({
            roleId,
            permissionId
          }))
        });
      }
    });
  }

  /**
   * 🔹 Récupérer les IDs des permissions associées à un rôle
   */
  async getPermissionsByRole(roleId: number): Promise<number[]> {
    const results = await prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true }
    });

    return results.map(r => r.permissionId);
  }
}
