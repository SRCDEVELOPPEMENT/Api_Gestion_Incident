import { ISiteRepository } from '../../domain/repositories/ISiteRepository';
import { Site, CreateSiteDTO } from '../../domain/entities/Site';
import prisma from '../database/prisma';

export class PrismaSiteRepository implements ISiteRepository {

  async create(data: CreateSiteDTO): Promise<Site> {
    const site = await prisma.site.create({
      data: {
        name: data.name,
        createdByUserId: data.createdByUserId, // ✅ correction
        typeId: data.typeId // ✅ ajouté
      },
      include: {
        createdBy: true,
        type: true // ✅ inclure la relation
      }
    });
    return site as unknown as Site;
  }

    async findAll(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: Site[];
    total: number;
    page: number;
    totalPages: number;
  }> {

    const skip = (page - 1) * limit;

    const [sites, total] = await Promise.all([
      prisma.site.findMany({
        skip,
        take: limit,
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' }, // optionnel mais recommandé
        include: {
          createdBy: true,
          type: true // ✅ ajouté
        }
      }),
      prisma.site.count({
        where: { deletedAt: null }
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: sites as unknown as Site[],
      total,
      page,
      totalPages
    };
  }

  async findById(id: number): Promise<Site | null> {
    const site = await prisma.site.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: true,
        type: true // ✅ ajouté
      }
    });
    return site as unknown as Site;
  }

  async update(id: number, data: Partial<Site>): Promise<Site> {
    const site = await prisma.site.update({
      where: { id },
      data: {
        name: data.name,
        typeId: data.typeId // ✅ ajouté
      },
      include: {
        createdBy: true,
        type: true
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
        typeId: prismaSite.typeId, // ✅ ajouté
        type: prismaSite.type
        ? {
            id: prismaSite.type.id,
            name: prismaSite.type.name
          }
        : undefined,
        createdAt: prismaSite.createdAt,
        updatedAt: prismaSite.updatedAt,
        deletedAt: prismaSite.deletedAt
      };
  }

  async findByTypeId(typeId: number, page = 1, limit = 10): Promise<{
    data: Site[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [total, rows] = await Promise.all([
      prisma.site.count({
        where: { typeId },
      }),
      prisma.site.findMany({
        where: { typeId },
        skip,
        take: limit,
        orderBy: { id: "desc" },
        include: {
          createdBy: true,
          type: true,
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: rows.map((s) => this.mapToSite(s as any)),
      total,
      page,
      totalPages,
    };
  }  

}