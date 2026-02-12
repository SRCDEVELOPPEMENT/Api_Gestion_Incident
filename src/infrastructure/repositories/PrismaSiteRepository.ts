import { ISiteRepository } from '../../domain/repositories/ISiteRepository';
import { Site, CreateSiteDTO } from '../../domain/entities/Site';
import prisma from '../database/prisma';

export class PrismaSiteRepository implements ISiteRepository {

  async create(data: CreateSiteDTO): Promise<Site> {
    const site = await prisma.site.create({
      data: {
        name: data.name,
        createdByUserId: data.createdByUserId // ✅ correction
      },
      include: {
        createdBy: true
      }
    });
    return site as unknown as Site;
  }

  async findAll(skip: number = 0, take: number = 20): Promise<Site[]> {
    const sites = await prisma.site.findMany({
      skip,
      take,
      where: { deletedAt: null }
    });
    return sites as unknown as Site[];
  }

  async findById(id: number): Promise<Site | null> {
    const site = await prisma.site.findFirst({
      where: { id, deletedAt: null }
    });
    return site as unknown as Site;
  }

  async update(id: number, data: Partial<Site>): Promise<Site> {
    const site = await prisma.site.update({
      where: { id },
      data: {
        name: data.name
      },
      include: {
        createdBy: true
      }
    });

    return this.mapToSite(site);
  }

  async delete(id: number): Promise<void> {
    await prisma.site.update({ 
        where: { id },
        data: { deletedAt: new Date() }
    });
  }

  private mapToSite(prismaSite: any): Site {
      return {
        id: prismaSite.id,
        name: prismaSite.name,
        createdByUserId: prismaSite.createdByUserId,
        createdBy: prismaSite.createdBy
          ? {
              id: prismaSite.createdBy.id,
              username: prismaSite.createdBy.username
            }
          : undefined,
        createdAt: prismaSite.createdAt,
        updatedAt: prismaSite.updatedAt,
        deletedAt: prismaSite.deletedAt
      };
  }
}