import { IIncidentRepository } from '../../domain/repositories/IIncidentRepository';
import { Incident, CreateIncidentDTO, UpdateIncidentDTO } from '../../domain/entities/Incident';
import prisma from '../database/prisma';
import { Prisma } from '@prisma/client';

export class PrismaIncidentRepository implements IIncidentRepository {

async create(
  data: CreateIncidentDTO,
  reporterId: string,
  files?: Express.Multer.File[]
): Promise<Incident> {

  const { siteIds, assignedUserIds, ...rest } = data;

  const created = await prisma.$transaction(async (tx) => {
    return tx.incident.create({
      data: {
        // ✅ champs métier explicites
        reference: data.reference!,
        description: rest.description,
        subProcessId: Number(rest.subProcessId),
        subCategoryId: Number(rest.subCategoryId),
        categoryId: Number(rest.categoryId),
        otherSubCategory: rest.otherSubCategory,
        processDomainId: Number(rest.processDomainId),
        dueDate: new Date(rest.dueDate),
        scope: rest.scope,
        urgency: rest.urgency,
        criticality: rest.criticality,

        status: 'OPEN',

        // ✅ clés étrangères DIRECTES (UncheckedInput)
        userId: Number(reporterId),
        reporterId: Number(reporterId),

        // ✅ relation Incident ↔ Sites
        incidentSites: {
          create: siteIds.map(siteId => ({
            siteId: Number(siteId)
          }))
        },

        // ✅ relation Incident ↔ Users assignés (optionnel)
        ...(assignedUserIds && assignedUserIds.length > 0 && {
          incidentUsers: {
            create: assignedUserIds.map(userId => ({
              userId: Number(userId)
            }))
          },
        }),

        ...(files && files.length > 0 && {
        attachments: {
          create: files.map(file => ({
            fileName: file.originalname,
            url: `/uploads/incidents/${file.filename}`,
            uploadedAt: new Date()
          }))
        }
      })
      },

      include: {
        incidentSites: { include: { site: true } },
        incidentUsers: { include: { user: true } },
        attachments: true,
        tasks: true
      }
    });
  });

  return this.mapToDomain(created);
}


  async findById(id: string): Promise<Incident | null> {
    const incident = await prisma.incident.findFirst({
      where: { id : (Number(id)), deletedAt: null },
      include: {
        incidentSites: { include: { site: true } },
        incidentUsers: { include: { user: true } },
        attachments: true,
        tasks: true
      }
    });

    return incident ? this.mapToDomain(incident) : null;
  }

  async findAll(
    skip = 0,
    take = 20,
    where: any = {},
    orderBy: any = { createdAt: 'desc' }
  ): Promise<Incident[]> {
    const incidents = await prisma.incident.findMany({
      skip,
      take,
      where: { ...where, deletedAt: null },
      orderBy,
      include: {
        incidentSites: { include: { site: true } },
        incidentUsers: { include: { user: true } },
        attachments: true,
        tasks: true
      }
    });

    return incidents.map(i => this.mapToDomain(i));
  }

  async update(id: string, data: UpdateIncidentDTO): Promise<Incident> {
    const { siteIds, assignedUserIds, attachments, ...rest } = data;

    const updateData: Prisma.IncidentUpdateInput = {
      ...rest
    };

    // 🔗 Incident ↔ Sites
    if (siteIds) {
      updateData.incidentSites = {
        deleteMany: {},
        create: siteIds.map(siteId => ({
          site: {
            connect: { id: Number(siteId) }
          }
        }))
      };
    }

    // 🔗 Incident ↔ Users assignés
    if (assignedUserIds) {
      updateData.incidentUsers = {
        deleteMany: {},
        create: assignedUserIds.map(userId => ({
          user: {
            connect: { id: Number(userId) }
          }
        }))
      };
    }

    // 📎 Pièces jointes
    if (attachments) {
      updateData.attachments = {
        create: attachments.map(att => ({
          fileName: att.fileName,
          url: att.url,
          uploadedAt: new Date()
        }))
      };
    }

    const updated = await prisma.incident.update({
      where: { id : (Number(id)) },
      data: updateData,
      include: {
        incidentSites: { include: { site: true } },
        incidentUsers: { include: { user: true } },
        attachments: true,
        tasks: true
      }
    });

    return this.mapToDomain(updated);
  }

  // async update(
  //   id: string,
  //   data: UpdateIncidentDTO,
  //   files?: Express.Multer.File[]
  // ): Promise<Incident> {

  //   const { siteIds, assignedUserIds, ...rest } = data;

  //   const updateData: any = {
  //     ...rest,
  //   };

  //   if (siteIds) {
  //     updateData.incidentSites = {
  //       deleteMany: {},
  //       create: siteIds.map(siteId => ({ siteId: Number(siteId) }))
  //     };
  //   }

  //   if (assignedUserIds) {
  //     updateData.incidentUsers = {
  //       deleteMany: {},
  //       create: assignedUserIds.map(userId => ({ userId: Number(userId) }))
  //     };
  //   }

  //   if (files && files.length > 0) {
  //     updateData.attachments = {
  //       create: files.map(file => ({
  //         fileName: file.originalname,
  //         url: `/uploads/incidents/${file.filename}`,
  //         mimeType: file.mimetype,
  //         size: file.size,
  //         uploadedAt: new Date()
  //       }))
  //     };
  //   }

  //   const updated = await prisma.incident.update({
  //     where: { id },
  //     data: updateData,
  //     include: {
  //       incidentSites: { include: { site: true } },
  //       incidentUsers: { include: { user: true } },
  //       attachments: true,
  //       tasks: true
  //     }
  //   });

  //   return this.mapToDomain(updated);
  // }

  async delete(id: string): Promise<void> {
    await prisma.incident.update({
      where: { id : (Number(id)) },
      data: { deletedAt: new Date() }
    });
  }

  private mapToDomain(prismaIncident: any): Incident {
    return {
      id: String(prismaIncident.id),
      reference: prismaIncident.reference,
      description: prismaIncident.description,
      status: prismaIncident.status,
      reporterId: String(prismaIncident.reporterId), // ✅ CORRECT
      dueDate: prismaIncident.dueDate,
      urgency: prismaIncident.urgency,
      criticality: prismaIncident.criticality,
      scope: prismaIncident.scope,
      subProcessId: prismaIncident.subProcessId,
      subCategoryId: prismaIncident.subCategoryId,
      processDomainId: prismaIncident.processDomainId,
      categoryId: prismaIncident.categoryId,
      createdAt: prismaIncident.createdAt,
      updatedAt: prismaIncident.updatedAt,
      deletedAt: prismaIncident.deletedAt,
      tasks: prismaIncident.tasks || [],
      sites: prismaIncident.incidentSites?.map((i: any) => i.site) || [],
      assignedUsers: prismaIncident.incidentUsers?.map((i: any) => i.user) || [],
      attachments: prismaIncident.attachments || []
    };
  }
}
