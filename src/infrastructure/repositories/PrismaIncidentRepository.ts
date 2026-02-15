import { IIncidentRepository } from '../../domain/repositories/IIncidentRepository';
import { Incident, CreateIncidentDTO, UpdateIncidentDTO } from '../../domain/entities/Incident';
import prisma from '../database/prisma';
import { Prisma } from '@prisma/client';
import { PaginatedResult } from '../../shared/types/PaginatedResult';

export class PrismaIncidentRepository implements IIncidentRepository {

  async create(
    data: CreateIncidentDTO,
    reporterId: string,
    files?: Express.Multer.File[]
  ): Promise<Incident> {

    const { siteIds, impactedSiteIds, personneIds, ...rest } = data;

    const created = await prisma.$transaction(async (tx) => {
      return tx.incident.create({
        data: {
          // ✅ champs métier explicites
          reference: data.reference!,
          description: rest.description,
          categoryId: Number(rest.categoryId),
          otherSubCategory: rest.otherSubCategory,
          subProcessId: rest.subProcessId
            ? Number(rest.subProcessId)
            : undefined,

          subCategoryId: rest.subCategoryId
            ? Number(rest.subCategoryId)
            : undefined,

          processDomainId: rest.processDomainId
            ? Number(rest.processDomainId)
            : undefined,
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

          ...(personneIds && personneIds.length > 0 && {
            incidentPersonnes: {
              create: personneIds.map(personneId => ({
                personneId: Number(personneId)
              }))
            }
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
          reporter: {
            include: {
              site: true
            }
          },
          incidentSites: { include: { site: true } },
          incidentImpactedSites: { include: { site: true } }, // ✅
          incidentPersonnes: { include: { personne: true } },
          attachments: true,
          tasks: true
        }
      });
    });

    return this.mapToDomain(created);
  }


  async findById(
    id: string,
    userId: number,
    isAdmin: boolean
  ): Promise<Incident | null> {

    const numericId = Number(id);

    const where: Prisma.IncidentWhereInput = {
      id: numericId,
      deletedAt: null
    };

    if (!isAdmin) {
      // 🔹 récupérer le site de l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { siteId: true }
      });

      if (!user?.siteId) return null;

      where.OR = [
        { reporterId: userId },
        {
          incidentSites: {
            some: {
              siteId: user.siteId
            }
          }
        }
      ];
    }

    const incident = await prisma.incident.findFirst({
      where,
      include: {
        reporter: {
          include: {
            site: true
          }
        },
        category: true,
        processDomain: true,
        subCategory: true,
        subProcess: true,
        incidentSites: { include: { site: true } },
        incidentImpactedSites: { include: { site: true } },
        incidentPersonnes: { include: { personne: true } },
        attachments: true,
        tasks: true
      }
    });

    if (!incident) return null;

    return this.mapToDomain(incident);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    where: Prisma.IncidentWhereInput = {},
    orderBy: Prisma.IncidentOrderByWithRelationInput = { createdAt: 'desc' }
  ): Promise<PaginatedResult<Incident>> {

    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const skip = (safePage - 1) * safeLimit;

    const whereClause: Prisma.IncidentWhereInput = {
      deletedAt: null,
      ...where
    };

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        skip,
        take: safeLimit,
        where: whereClause,
        orderBy,
        include: {
          reporter: { include: { site: true } },
          category: true,
          processDomain: true,
          subCategory: true,
          subProcess: true,
          incidentSites: { include: { site: true } },
          incidentImpactedSites: { include: { site: true } },
          incidentPersonnes: { include: { personne: true } },
          attachments: true,
          tasks: true
        }
      }),
      prisma.incident.count({
        where: whereClause
      })
    ]);

    return {
      data: incidents.map(i => this.mapToDomain(i)),
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit)
    };
  }


  async findAllByUser(
    userId: number,
    skip = 0,
    take = 10,
    filters: Prisma.IncidentWhereInput = {},
    orderBy?: Prisma.IncidentOrderByWithRelationInput
  ): Promise<PaginatedResult<Incident>> {

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { siteId: true }
    });

    if (!user || !user.siteId) {
      return {
        data: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }

    const whereClause: Prisma.IncidentWhereInput = {
      deletedAt: null,
      AND: [
        {
          OR: [
            { reporterId: userId },
            {
              incidentSites: {
                some: {
                  siteId: user.siteId
                }
              }
            }
          ]
        },
        filters
      ]
    };

    // 🔥 1️⃣ TOTAL COUNT
    const total = await prisma.incident.count({
      where: whereClause
    });

    // 🔥 2️⃣ DATA PAGINÉE
    const incidents = await prisma.incident.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: orderBy ?? { createdAt: 'desc' },
      include: {
        reporter: {
          include: {
            site: true
          }
        },
        incidentSites: { include: { site: true } },
        incidentPersonnes: { include: { personne: true } },
        attachments: true,
        tasks: true
      }
    });

    const page = Math.floor(skip / take) + 1;
    const totalPages = Math.ceil(total / take);

    return {
      data: incidents.map(i => this.mapToDomain(i)),
      total,
      page,
      totalPages
    };
  }


  async update(
    id: string,
    data: UpdateIncidentDTO,
    files?: Express.Multer.File[]
  ): Promise<Incident> {

    const { siteIds, impactedSiteIds, personneIds, attachments, ...rest } = data;

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

      ...(personneIds && {
        incidentPersonnes: {
          deleteMany: {},
          create: personneIds.map(id => ({
            personne: { connect: { id: Number(id) } }
          }))
        }
      })
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

    if (personneIds) {
      updateData.incidentPersonnes = {
        deleteMany: {},
        create: personneIds.map(personneId => ({
          personneId: Number(personneId)
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
        reporter: {
          include: {
            site: true
          }
        },
        incidentSites: { include: { site: true } },
        incidentImpactedSites: { include: { site: true } },
        incidentPersonnes: { include: { personne: true } },
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
      // 🔥 SERVICE ÉMETTEUR
      serviceEmitter:
        prismaIncident.reporter?.site?.name ?? null,
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
      // 🔥 AJOUTER CETTE LIGNE
      otherSubCategory: prismaIncident.otherSubCategory ?? null,
      // ✅ NOUVEAU
      impactedSites:
        prismaIncident.incidentImpactedSites?.map((i: any) => i.site) || [],
      //assignedUsers: prismaIncident.incidentUsers?.map((i: any) => i.user) || [],
      personnes:
        prismaIncident.incidentPersonnes?.map((i: any) => i.personne) || [],

      attachments: prismaIncident.attachments || [],
    };
  }

}
