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

    const { siteIds, impactedSiteIds, assignedUserIds, ...rest } = data;

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

          ...(impactedSiteIds && impactedSiteIds.length > 0 && {
            incidentImpactedSites: {
              create: impactedSiteIds.map(siteId => ({
                siteId: Number(siteId)
              }))
            }
          }),
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
          incidentImpactedSites: { include: { site: true } }, // ✅
          incidentUsers: { include: { user: true } },
          attachments: true,
          tasks: true
        }
      });
    });

    return this.mapToDomain(created);
  }

  // async findById(id: string): Promise<Incident | null> {
  //   const incident = await prisma.incident.findFirst({
  //     where: { id : (Number(id)), deletedAt: null },
  //     include: {
  //       incidentSites: { include: { site: true } },
  //       incidentUsers: { include: { user: true } },
  //       attachments: true,
  //       tasks: true
  //     }
  //   });

  //   return incident ? this.mapToDomain(incident) : null;
  // }

  async findById(id: string): Promise<Incident | null> {
    const incident = await prisma.incident.findFirst({
      where: { id: Number(id), deletedAt: null },
      include: {
        category: true,
        processDomain: true,
        subCategory: true,
        subProcess: true,
        incidentSites: {
          include: { site: true }
        },
        incidentImpactedSites: { include: { site: true } }, // ✅ AJOUT
        incidentUsers: {
          include: { user: true }
        },
        attachments: true,
        tasks: true
      }
    });

    if (!incident) return null;

    return this.mapToDomain({
      ...incident,
      sites: incident.incidentSites.map(is => is.site) // ✅ LIGNE CLÉ
    });
  }

  // async findAll(
  //   skip = 0,
  //   take = 20,
  //   where: any = {},
  //   orderBy: any = { createdAt: 'desc' }
  // ): Promise<Incident[]> {
  //   const incidents = await prisma.incident.findMany({
  //     skip,
  //     take,
  //     where: { ...where, deletedAt: null },
  //     orderBy,
  //     include: {
  //       incidentSites: { include: { site: true } },
  //       incidentUsers: { include: { user: true } },
  //       attachments: true,
  //       tasks: true
  //     }
  //   });

  //   return incidents.map(i => this.mapToDomain(i));
  // }
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
        category: true,
        processDomain: true,
        subCategory: true,
        subProcess: true,
        incidentSites: {
          include: { site: true }
        },
        incidentImpactedSites: { include: { site: true } }, // ✅ AJOUT
        incidentUsers: {
          include: { user: true }
        },
        attachments: true,
        tasks: true
      }
    });

    return incidents.map(i =>
      this.mapToDomain({
        ...i,
        sites: i.incidentSites.map(is => is.site) // ✅ LIGNE CLÉ
      })
    );
  }


  // async update(id: string, data: UpdateIncidentDTO, files?: Express.Multer.File[]): Promise<Incident> {
  //   const { siteIds, impactedSiteIds, assignedUserIds, attachments, ...rest } = data;

  //   const updateData: Prisma.IncidentUncheckedUpdateInput = {
  //     ...(rest.description && { description: rest.description }),
  //     ...(rest.scope !== undefined && { scope: rest.scope }),
  //     ...(rest.urgency && { urgency: rest.urgency }),
  //     ...(rest.criticality && { criticality: rest.criticality }),

  //     ...(rest.subProcessId && { subProcessId: Number(rest.subProcessId) }),
  //     ...(rest.subCategoryId && { subCategoryId: Number(rest.subCategoryId) }),
  //     ...(rest.categoryId && { categoryId: Number(rest.categoryId) }),
  //     ...(rest.processDomainId && { processDomainId: Number(rest.processDomainId) }),
  //     ...(rest.status && { status: rest.status }),
  //     ...(rest.dueDate && { dueDate: new Date(rest.dueDate) }),
  //   };
  //   // const updateData: Prisma.IncidentUpdateInput = {
  //   //   ...rest
  //   // };

  //   // 🔗 Incident ↔ Sites
  //   if (siteIds) {
  //     updateData.incidentSites = {
  //       deleteMany: {},
  //       create: siteIds.map(siteId => ({
  //         site: {
  //           connect: { id: Number(siteId) }
  //         }
  //       }))
  //     };
  //   }

  //   // 🔗 Sites concernés (NOUVEAU)
  //   // if (impactedSiteIds) {
  //   //   updateData.incidentImpactedSites = {
  //   //     deleteMany: {},
  //   //     create: impactedSiteIds.map(siteId => ({
  //   //       site: { connect: { id: Number(siteId) } }
  //   //     }))
  //   //   };
  //   // }
  //   // if (impactedSiteIds && impactedSiteIds.length > 0) {
  //   //   updateData.incidentImpactedSites = {
  //   //     deleteMany: {},
  //   //     create: impactedSiteIds.map(siteId => ({
  //   //       siteId: Number(siteId)
  //   //     }))
  //   //   };
  //   // }
  //   if (impactedSiteIds) {
  //     updateData.incidentImpactedSites = {
  //       deleteMany: {},
  //       create: impactedSiteIds.map(siteId => ({
  //         siteId: Number(siteId)
  //       }))
  //     };
  //   }

  //   // 🔗 Incident ↔ Users assignés
  //   if (assignedUserIds) {
  //     updateData.incidentUsers = {
  //       deleteMany: {},
  //       create: assignedUserIds.map(userId => ({
  //         user: {
  //           connect: { id: Number(userId) }
  //         }
  //       }))
  //     };
  //   }

  //   // 📎 Pièces jointes
  //   // if (attachments && attachments.length > 0) {
  //   //   updateData.attachments = {
  //   //     create: attachments.map(att => ({
  //   //       fileName: att.fileName,
  //   //       url: att.url,
  //   //       uploadedAt: new Date()
  //   //     }))
  //   //   };
  //   // }

  //   // 📎 Pièces jointes depuis fichiers (Multer)
  //   // if (files && files.length > 0) {
  //   //   updateData.attachments = {
  //   //     ...(updateData.attachments ?? {}),
  //   //     create: [
  //   //       ...(attachments ?? []).map(att => ({
  //   //         fileName: att.fileName,
  //   //         url: att.url,
  //   //         uploadedAt: new Date()
  //   //       })),
  //   //       ...files.map(file => ({
  //   //         fileName: file.originalname,
  //   //         url: `/uploads/incidents/${file.filename}`,
  //   //         uploadedAt: new Date()
  //   //       }))
  //   //     ]
  //   //   };
  //   // }
    
  //   const updated = await prisma.incident.update({
  //     where: { id: (Number(id)) },
  //     data: updateData,
  //     include: {
  //       incidentSites: { include: { site: true } },
  //       incidentImpactedSites: { include: { site: true } }, // ✅
  //       incidentUsers: { include: { user: true } },
  //       attachments: true,
  //       tasks: true
  //     }
  //   });

  //   return this.mapToDomain(updated);
  // }

    async update(
    id: string,
    data: UpdateIncidentDTO,
    files?: Express.Multer.File[]
  ): Promise<Incident> {

    const { siteIds, impactedSiteIds, assignedUserIds, attachments, ...rest } = data;

    const updateData: Prisma.IncidentUncheckedUpdateInput = {
      ...(rest.status && { status: rest.status }), // ✅ CRITIQUE
      ...(rest.description && { description: rest.description }),
      ...(rest.scope !== undefined && { scope: rest.scope }),
      ...(rest.urgency && { urgency: rest.urgency }),
      ...(rest.criticality && { criticality: rest.criticality }),
      ...(rest.subProcessId && { subProcessId: Number(rest.subProcessId) }),
      ...(rest.subCategoryId && { subCategoryId: Number(rest.subCategoryId) }),
      ...(rest.categoryId && { categoryId: Number(rest.categoryId) }),
      ...(rest.processDomainId && { processDomainId: Number(rest.processDomainId) }),
      ...(rest.dueDate && { dueDate: new Date(rest.dueDate) }),
    };

    if (siteIds) {
      updateData.incidentSites = {
        deleteMany: {},
        create: siteIds.map(siteId => ({
          site: { connect: { id: Number(siteId) } }
        }))
      };
    }

    if (impactedSiteIds) {
      updateData.incidentImpactedSites = {
        deleteMany: {},
        create: impactedSiteIds.map(siteId => ({
          siteId: Number(siteId)
        }))
      };
    }

    if (assignedUserIds) {
      updateData.incidentUsers = {
        deleteMany: {},
        create: assignedUserIds.map(userId => ({
          user: { connect: { id: Number(userId) } }
        }))
      };
    }

    const attachmentCreates = [
      ...(attachments ?? []).map(att => ({
        fileName: att.fileName,
        url: att.url,
        uploadedAt: new Date()
      })),
      ...(files ?? []).map(file => ({
        fileName: file.originalname,
        url: `/uploads/incidents/${file.filename}`,
        uploadedAt: new Date()
      }))
    ];

    if (attachmentCreates.length > 0) {
      updateData.attachments = { create: attachmentCreates };
    }

    const updated = await prisma.incident.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        incidentSites: { include: { site: true } },
        incidentImpactedSites: { include: { site: true } },
        incidentUsers: { include: { user: true } },
        attachments: true,
        tasks: true
      }
    });

    return this.mapToDomain(updated);
  }


  async delete(id: string): Promise<void> {
    await prisma.incident.update({
      where: { id: (Number(id)) },
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
      processDomain: prismaIncident.processDomain
        ? prismaIncident.processDomain.name
        : null,
      categoryId: prismaIncident.categoryId,
      category: prismaIncident.category
        ? prismaIncident.category.name
        : null,
      subCategory: prismaIncident.subCategory
        ? prismaIncident.subCategory.name
        : null,
      subProcess: prismaIncident.subProcess
        ? prismaIncident.subProcess.name
        : null,
      createdAt: prismaIncident.createdAt,
      updatedAt: prismaIncident.updatedAt,
      deletedAt: prismaIncident.deletedAt,
      tasks: prismaIncident.tasks || [],
      sites: prismaIncident.incidentSites?.map((i: any) => i.site) || [],

      // ✅ NOUVEAU
      impactedSites:
        prismaIncident.incidentImpactedSites?.map((i: any) => i.site) || [],
      assignedUsers: prismaIncident.incidentUsers?.map((i: any) => i.user) || [],
      attachments: prismaIncident.attachments || []
    };
  }
}
