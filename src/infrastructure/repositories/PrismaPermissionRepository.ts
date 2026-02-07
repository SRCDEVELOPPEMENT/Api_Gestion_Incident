import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { Permission, CreatePermissionDTO, UpdatePermissionDTO } from '../../domain/entities/Permission';
import prisma from '../database/prisma';

export class PrismaPermissionRepository implements IPermissionRepository {
  async create(data: CreatePermissionDTO): Promise<Permission> {
    const permission = await prisma.permission.create({
      data: {
        code: data.code,
        description: data.description
      }
    });
    return permission as unknown as Permission;
  }

  async findAll(): Promise<Permission[]> {
    const permissions = await prisma.permission.findMany();
    return permissions as unknown as Permission[];
  }

  async findById(id: number): Promise<Permission | null> {
    const permission = await prisma.permission.findUnique({
      where: { id : Number(id) }
    });
    return permission as unknown as Permission;
  }

  async findByAction(code: string): Promise<Permission | null> {
    const permission = await prisma.permission.findUnique({
      where: { code }
    });
    return permission as unknown as Permission;
  }

  async update(id: number, data: UpdatePermissionDTO): Promise<Permission> {
    const permission = await prisma.permission.update({
      where: { id : Number(id) },
      data: {
        code: data.code,
        description: data.description
      }
    });
    return permission as unknown as Permission;
  }

  async delete(id: number): Promise<void> {
    await prisma.permission.delete({
      where: { id : Number(id) }
    });
  }
}
