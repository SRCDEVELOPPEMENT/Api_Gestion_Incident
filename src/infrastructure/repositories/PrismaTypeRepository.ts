import { ITypeRepository } from '../../domain/repositories/ITypeRepository';
import { Type, CreateTypeDTO } from '../../domain/entities/Type';
import prisma from '../database/prisma';

export class PrismaTypeRepository implements ITypeRepository {
  async create(data: CreateTypeDTO): Promise<Type> {
    const created = await prisma.type.create({ data });
    return created as unknown as Type;
  }

  async findById(id: number): Promise<Type | null> {
    const found = await prisma.type.findFirst({
      where: { id, deletedAt: null }
    });
    return found as unknown as Type;
  }

  async findAll(skip: number = 0, take: number = 20, where: any = {}): Promise<Type[]> {
    const list = await prisma.type.findMany({
      skip,
      take,
      where: { ...where, deletedAt: null }
    });
    return list as unknown as Type[];
  }

  async update(id: number, data: Partial<Pick<Type, "name">>): Promise<Type> {
    const updated = await prisma.type.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
      },
    });
    return updated as unknown as Type;
  }

  async delete(id: number): Promise<void> {
    await prisma.type.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}