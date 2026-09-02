import { IIncidentRepository } from '../../domain/repositories/IIncidentRepository';
import { Incident, CreateIncidentDTO, UpdateIncidentDTO } from '../../domain/entities/Incident';
import prisma from '../database/prisma';
import { Prisma } from '@prisma/client';
import { PaginatedResult } from '../../shared/types/PaginatedResult';

export class PrismaIncidentRepository implements IIncidentRepository {

  private async accessWhere(userId: number, isAdmin: boolean) {
    if (isAdmin) return { deletedAt: null };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { siteId: true }
    });


    if (!user?.siteId) {
      // Pas de site, mais il doit voir ses propres incidents
      return {
        deletedAt: null,
        reporterId: userId
      };
    }

    return {
      deletedAt: null,
      OR: [
        { reporterId: userId },
        { incidentSites: { some: { siteId: user.siteId } } }
      ]
    };
  }

  async reopen(
    id: string,
    userId: number,
    isAdmin: boolean
  ): Promise<Incident> {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      throw new Error("Invalid incident id");
    }

    // ✅ sécurité: vérifier que l'user a le droit de voir l'incident
    const allowed = await this.findById(id, userId, isAdmin);
    if (!allowed) throw new Error("Incident introuvable ou accès refusé");

    const status = String((allowed as any).status ?? "").toUpperCase();
    if (status !== "CLOSED" && status !== "CANCELLED") {
      throw new Error("Seuls les incidents clôturés ou annulés peuvent être rouverts");
    }

    const updated = await prisma.incident.update({
      where: { id: numericId },
      // ✅ réouverture : l'incident n'est plus résolu, on conserve la prise en charge initiale
      data: { status: "OPEN", resolvedAt: null },
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
        tasks: true,
        comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
        incidentGLPIUser: { include: { glpiUser: true } },
      },
    });

    return this.mapToDomain(updated);
  }

  async create(
    data: CreateIncidentDTO,
    reporterId: string,
    files?: Express.Multer.File[]
  ): Promise<Incident> {

    const { siteIds, impactedSiteIds, personneIds, rootCause, proposedSolution, glpiUserIds, ...rest } = data;
    const [year, month, day] = rest.dueDate.split('-').map(Number);

    const created = await prisma.$transaction(async (tx) => {
      return tx.incident.create({
        data: {
          reporterName: rest.reporterName,
          glpiTicketId:
            rest.glpiTicketId !== undefined && rest.glpiTicketId !== null && String(rest.glpiTicketId).trim() !== ""
              ? Number(rest.glpiTicketId)
              : null,
          reference: data.reference!,
          description: rest.description,
          categoryId: Number(rest.categoryId),
          otherSubCategory: rest.otherSubCategory,
          subProcessId: rest.subProcessId ? Number(rest.subProcessId) : undefined,
          subCategoryId: rest.subCategoryId ? Number(rest.subCategoryId) : undefined,
          processDomainId: rest.processDomainId ? Number(rest.processDomainId) : undefined,
          dueDate: new Date(year, month - 1, day),
          scope: rest.scope ?? "",
          urgency: rest.urgency,
          criticality: rest.criticality,
          status: 'OPEN',
          userId: Number(reporterId),
          reporterId: Number(reporterId),
          incidentSites: {
            create: siteIds.map(siteId => ({ siteId: Number(siteId) }))
          },
          rootCause: rootCause ?? null,
          proposedSolution: proposedSolution ?? null,
          ...(impactedSiteIds && impactedSiteIds.length > 0 && {
            incidentImpactedSites: {
              create: impactedSiteIds.map(siteId => ({ siteId: Number(siteId) }))
            }
          }),
          ...(personneIds && personneIds.length > 0 && {
            incidentPersonnes: {
              create: personneIds.map(personneId => ({ personneId: Number(personneId) }))
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
          }),

          // Ajout premium : utilisateurs GLPI assignés
          ...(glpiUserIds && Array.isArray(glpiUserIds) && glpiUserIds.length > 0 && {
            incidentGLPIUser: {
              create: glpiUserIds.map((glpiUserId: number) => ({ glpiUserId: Number(glpiUserId) }))
            }
          })
        } as Prisma.IncidentUncheckedCreateInput,
        include: {
          reporter: { include: { site: true } },
          incidentSites: { include: { site: true } },
          incidentImpactedSites: { include: { site: true } },
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
    const access = await this.accessWhere(userId, isAdmin);
    const whereClause: Prisma.IncidentWhereInput = {
      AND: [access, { id: Number(id) }],
    };
    const incident = await prisma.incident.findFirst({
      where: whereClause,
      include: {
        reporter: { include: { site: true } },
        category: true,
        processDomain: true,
        subCategory: true,
        subProcess: true,
        incidentSites: { include: { site: true } },
        incidentImpactedSites: { include: { site: true } },
        incidentPersonnes: { include: { personne: true } },
        comments: {
          include: { user: { select: { id: true, username: true } } },
          orderBy: { createdAt: "asc" },
        },
        attachments: true,
        tasks: true,
        incidentGLPIUser: { include: { glpiUser: true } },
      },
    });
    return incident ? this.mapToDomain(incident) : null;
  }

  async findAll(
    userId: number,
    isAdmin: boolean,
    skip: number = 0,
    take: number = 10,
    where: Prisma.IncidentWhereInput = {},
    orderBy: Prisma.IncidentOrderByWithRelationInput = { createdAt: "desc" }
  ): Promise<PaginatedResult<Incident>> {
    const safeTake = Math.max(1, take);
    const safeSkip = Math.max(0, skip);

    // ✅ Filtre sécurité (le “droit de voir”)
    const access = await this.accessWhere(userId, isAdmin);

    // ✅ On combine : sécurité AND filtres UI
    const whereClause: Prisma.IncidentWhereInput = {
      AND: [access, where],
    };

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        skip: safeSkip,
        take: safeTake,
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
          tasks: true,
          incidentGLPIUser: { include: { glpiUser: true } },
        },
      }),
      prisma.incident.count({ where: whereClause }),
    ]);

    const page = Math.floor(safeSkip / safeTake) + 1;
    const totalPages = Math.ceil(total / safeTake);

    return {
      data: incidents.map((i) => this.mapToDomain(i)),
      total,
      page,
      totalPages,
    };
  }

  async findAllByUser(
    userId: number,
    isAdmin: boolean,
    skip = 0,
    take = 10,
    filters: Prisma.IncidentWhereInput = {},
    orderBy?: Prisma.IncidentOrderByWithRelationInput
  ): Promise<PaginatedResult<Incident>> {
    const safeTake = Math.max(1, take);
    const safeSkip = Math.max(0, skip);

    // ✅ même règle que findAll/findById : ADMIN ou MANAGER => voit tout
    const access = await this.accessWhere(userId, isAdmin);

    const whereClause: Prisma.IncidentWhereInput = {
      AND: [access, filters],
    };

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where: whereClause,
        skip: safeSkip,
        take: safeTake,
        orderBy: orderBy ?? { createdAt: "desc" },
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
          tasks: true,
          comments: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { user: true },
          },
          incidentGLPIUser: { include: { glpiUser: true } },
        },
      }),
      prisma.incident.count({ where: whereClause }),
    ]);

    const page = Math.floor(safeSkip / safeTake) + 1;
    const totalPages = Math.ceil(total / safeTake);

    return {
      data: incidents.map((i) => this.mapToDomain(i)),
      total,
      page,
      totalPages,
    };
  }


  async update(
    id: string,
    data: UpdateIncidentDTO,
    files?: Express.Multer.File[]
  ): Promise<Incident> {

    const { siteIds, impactedSiteIds, personneIds, attachments, rootCause, proposedSolution, ...rest } = data;

    // ✅ helper : évite "" -> 0 et autres valeurs vides
    const hasValue = (v: unknown) =>
      v !== undefined && v !== null && String(v).trim() !== "";

    const updateData: Prisma.IncidentUncheckedUpdateInput = {
      ...(hasValue(rest.reporterName) && { reporterName: String(rest.reporterName).trim() }),

      ...(hasValue(rest.status) && { status: rest.status }),
      ...(hasValue(rest.description) && { description: rest.description }),
      ...(rest.scope !== undefined && { scope: rest.scope }),

      ...(hasValue(rest.urgency) && { urgency: rest.urgency }),
      ...(hasValue(rest.criticality) && { criticality: rest.criticality }),

      ...(hasValue(rest.subProcessId) && { subProcessId: Number(rest.subProcessId) }),
      ...(hasValue(rest.subCategoryId) && { subCategoryId: Number(rest.subCategoryId) }),
      ...(hasValue(rest.categoryId) && { categoryId: Number(rest.categoryId) }),
      ...(hasValue(rest.processDomainId) && { processDomainId: Number(rest.processDomainId) }),

      ...(hasValue(rest.dueDate) && { dueDate: new Date(String(rest.dueDate)) }),
      ...(hasValue(rootCause) && { rootCause: String(rootCause) }),
      ...(hasValue(proposedSolution) && { proposedSolution: String(proposedSolution) }),
    };

    // ✅ Horodatage du cycle de vie sur transition de statut
    //    (1 seule lecture, uniquement si un statut est transmis)
    if (hasValue(rest.status)) {
      const newStatus = String(rest.status).toUpperCase();
      const now = new Date();
      const current = await prisma.incident.findUnique({
        where: { id: Number(id) },
        select: { takenInChargeAt: true },
      });

      if (newStatus === "IN_PROGRESS" && !current?.takenInChargeAt) {
        // 1ère prise en charge seulement (on ne réinitialise jamais)
        (updateData as any).takenInChargeAt = now;
      } else if (newStatus === "CLOSED") {
        (updateData as any).resolvedAt = now;
        // une résolution implique une prise en charge : on la fixe si absente
        if (!current?.takenInChargeAt) (updateData as any).takenInChargeAt = now;
      } else if (newStatus === "OPEN") {
        // réouverture via update générique : l'incident n'est plus résolu
        (updateData as any).resolvedAt = null;
      }
    }

    // ✅ GLPI ticket: autoriser set / clear
    if (rest.glpiTicketId !== undefined) {
      const v = rest.glpiTicketId as any;

      // si null ou "" => on supprime le lien
      if (v === null || String(v).trim() === "") {
        (updateData as any).glpiTicketId = null; // ou glpiTicketId
      } else {
        (updateData as any).glpiTicketId = Number(v); // ou glpiTicketId
      }
    }

    // ✅ Sites responsables
    if (Array.isArray(siteIds)) {
      updateData.incidentSites = {
        deleteMany: {},
        create: siteIds
          .filter(hasValue)
          .map((siteId) => ({ siteId: Number(siteId) })), // ✅ même logique que create()
      };
    }

    // ✅ Sites impactés
    if (Array.isArray(impactedSiteIds)) {
      updateData.incidentImpactedSites = {
        deleteMany: {},
        create: impactedSiteIds
          .filter(hasValue)
          .map((siteId) => ({ siteId: Number(siteId) })),
      };
    }

    // ✅ Personnes assignées (UNE SEULE FOIS)
    if (Array.isArray(personneIds)) {
      updateData.incidentPersonnes = {
        deleteMany: {},
        create: personneIds
          .filter(hasValue)
          .map((personneId) => ({ personneId: Number(personneId) })),
      };
    }

    // ✅ PJ (si tu en ajoutes pendant l'update)
    const attachmentCreates = [
      ...(attachments ?? []).map((att) => ({
        fileName: att.fileName,
        url: att.url,
        uploadedAt: new Date(),
      })),
      ...(files ?? []).map((file) => ({
        fileName: file.originalname,
        url: `/uploads/incidents/${file.filename}`,
        uploadedAt: new Date(),
      })),
    ];

    if (attachmentCreates.length > 0) {
      updateData.attachments = { create: attachmentCreates };
    }

    const updated = await prisma.incident.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        reporter: { include: { site: true } },
        incidentSites: { include: { site: true } },
        incidentImpactedSites: { include: { site: true } },
        incidentPersonnes: { include: { personne: true } },
        comments: { include: { user: true }, orderBy: { createdAt: "asc" } }, // ✅ au bon niveau
        attachments: true,
        tasks: true,
      },
    });

    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.incident.update({
      where: { id: (Number(id)) },
      data: { deletedAt: new Date() }
    });
  }

  async close(
    id: string,
    userId: number,
    isAdmin: boolean,
    comment: string
  ): Promise<Incident> {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      throw new Error("Invalid incident id");
    }

    const trimmed = String(comment ?? "").trim();
    if (!trimmed) throw new Error("Le commentaire de clôture est obligatoire");
    if (trimmed.length < 3) throw new Error("Le commentaire de clôture est trop court");

    // ✅ sécurité: vérifier que l'user a le droit de voir l'incident
    const allowed = await this.findById(id, userId, isAdmin);
    if (!allowed) throw new Error("Incident introuvable ou accès refusé");

    const status = String((allowed as any).status ?? "").toUpperCase();
    if (status === "CLOSED" || status === "CANCELLED") {
      throw new Error("Incident déjà clôturé/annulé");
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.incidentComment.create({
        data: {
          incidentId: numericId,
          userId,
          content: trimmed,
        },
      });

      const now = new Date();
      const current = await tx.incident.findUnique({
        where: { id: numericId },
        select: { takenInChargeAt: true },
      });

      return tx.incident.update({
        where: { id: numericId },
        data: {
          status: "CLOSED",
          resolvedAt: now,
          // une résolution implique une prise en charge : on la fixe si absente
          ...(current?.takenInChargeAt ? {} : { takenInChargeAt: now }),
        },
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
          tasks: true,
          comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
        },
      });
    });

    return this.mapToDomain(updated);
  }

  private mapToDomain(prismaIncident: any): Incident {
    return {
      id: String(prismaIncident.id),
      userId: prismaIncident.userId,
      reference: prismaIncident.reference,
      description: prismaIncident.description,
      status: prismaIncident.status,
      reporterId: String(prismaIncident.reporterId),
      reporterName: prismaIncident.reporterName ?? "",
      glpiTicketId: prismaIncident.glpiTicketId ?? null,
      serviceEmitter: prismaIncident.reporter?.site?.name ?? null,
      dueDate: prismaIncident.dueDate,
      urgency: prismaIncident.urgency,
      criticality: prismaIncident.criticality,
      scope: prismaIncident.scope ?? "",
      subProcessId: prismaIncident.subProcessId,
      subCategoryId: prismaIncident.subCategoryId,
      processDomainId: prismaIncident.processDomainId,
      processDomain: prismaIncident.processDomain ? prismaIncident.processDomain.name : null,
      categoryId: prismaIncident.categoryId,
      category: prismaIncident.category ? prismaIncident.category.name : null,
      subCategory: prismaIncident.subCategory ? prismaIncident.subCategory.name : null,
      subProcess: prismaIncident.subProcess ? prismaIncident.subProcess.name : null,
      createdAt: prismaIncident.createdAt,
      updatedAt: prismaIncident.updatedAt,
      deletedAt: prismaIncident.deletedAt,
      tasks: prismaIncident.tasks || [],
      sites: prismaIncident.incidentSites?.map((i: any) => i.site) || [],
      otherSubCategory: prismaIncident.otherSubCategory ?? null,
      impactedSites: prismaIncident.incidentImpactedSites?.map((i: any) => i.site) || [],
      personnes: prismaIncident.incidentPersonnes?.map((i: any) => i.personne) || [],
      attachments: prismaIncident.attachments || [],
      rootCause: prismaIncident.rootCause ?? null,
      proposedSolution: prismaIncident.proposedSolution ?? null,
      comments: prismaIncident.comments?.map((c: any) => ({
        id: String(c.id),
        content: c.content,
        userId: String(c.userId),
        createdAt: c.createdAt,
        user: c.user
          ? {
              id: String(c.user.id),
              username: c.user.username ?? null,
            }
          : undefined,
      })) ?? [],
      // Premium: expose assigned GLPI users (array of glpiUser objects)
      glpiUsers: Array.isArray(prismaIncident.incidentGLPIUser)
        ? prismaIncident.incidentGLPIUser.map((igu: any) => igu.glpiUser)
        : [],
    };
  }
  
}
