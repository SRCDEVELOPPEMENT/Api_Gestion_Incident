import { ISubCategoryRepository } from '../../domain/repositories/ISubCategoryRepository';
import { SubCategory, CreateSubCategoryDTO, UpdateSubCategoryDTO } from '../../domain/entities/SubCategory';
import prisma from '../database/prisma';

export class PrismaSubCategoryRepository implements ISubCategoryRepository {
  async create(data: CreateSubCategoryDTO): Promise<SubCategory> {
    const subCategory = await prisma.subCategory.create({ data });
    return subCategory as unknown as SubCategory;
  }

  async findById(id: number): Promise<SubCategory | null> {
    const subCategory = await prisma.subCategory.findFirst({
      where: { id, deletedAt: null }
    });
    return subCategory as unknown as SubCategory;
  }

  // async findAll(skip: number = 0, take: number = 20): Promise<SubCategory[]> {
  //   const subCategories = await prisma.subCategory.findMany({ 
  //       skip, 
  //       take,
  //       where: { deletedAt: null }
  //   });
  //   return subCategories as unknown as SubCategory[];
  // }

  async findAll(): Promise<SubCategory[]> {
    const subCategories = await prisma.subCategory.findMany({
      where: { deletedAt: null }
    });
    return subCategories as unknown as SubCategory[];
  }

  async update(id: number, data: UpdateSubCategoryDTO): Promise<SubCategory> {
    const { categoryId, ...rest } = data;

    const subCategory = await prisma.subCategory.update({
      where: { id },
      data: {
        ...rest,

        // ✅ au lieu de categoryId direct
        ...(typeof categoryId === "number"
          ? { category: { connect: { id: categoryId } } }
          : {}),
      },
    });

    return subCategory as unknown as SubCategory;
  }
  
  async delete(id: string): Promise<void> {
    await prisma.subCategory.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() }
    });
  }
}