import { Request, Response, NextFunction } from 'express';
import {
  CreateIncidentUseCase,
  GetAllIncidentsUseCase,
  GetIncidentByIdUseCase,
  UpdateIncidentUseCase,
  DeleteIncidentUseCase
} from '../../../application/usecases/IncidentUseCases';
import { PrismaIncidentRepository } from '../../../infrastructure/repositories/PrismaIncidentRepository';
import { z } from 'zod';
import { NotFoundError } from '../../../domain/errors/AppError';
import { CreateIncidentDTO, UpdateIncidentDTO } from '../../../domain/entities/Incident';
import prisma from '../../../infrastructure/database/prisma';
import { pathToFileURL } from 'url';

import fs from 'fs/promises';
import path from 'path';
import { IncidentPdfService } from '../../../domain/services/IncidentPdfService';
import { AuthUser } from '../../../domain/entities/AuthUser';

const incidentSchema = z.object({
  description: z.string().min(5),
  scope: z.string().optional().nullable(),
  siteIds: z.preprocess(
    (val) => Array.isArray(val) ? val : [val],
    z.array(z.string()).min(1)
  ),
  // 🔗 Sites concernés (NOUVEAU)
  impactedSiteIds: z.preprocess(
    (val) => {
      if (!val) return [];
      return Array.isArray(val) ? val : [val];
    },
    z.array(z.string())
  ),
  categoryId: z.string(),
  subCategoryId: z.string().optional(),
  otherSubCategory: z.string().optional(),
  processDomainId: z.string().optional(),
  subProcessId: z.string().optional(),
  assignedUserIds: z.preprocess(
    (val) => {
      if (!val) return [];
      return Array.isArray(val) ? val : [val];
    },
    z.array(z.string()).optional()
  ),
  dueDate: z.string(),
  urgency: z.enum(['Faible', 'Moyenne', 'Haute', 'Immédiate']),
  criticality: z.enum(['Faible', 'Moyenne', 'Haute', 'Critique']),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED']).optional(),
});

export class IncidentController {

  static async create(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      /**
       * 1️⃣ Sécurité : utilisateur authentifié
       */
      const authUser = (req as any).user;
      if (!authUser?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      /**
       * 2️⃣ Validation Zod (body uniquement)
       */
      //const validatedData = incidentSchema.parse(req.body);
      const validatedData = incidentSchema.parse(req.body) as CreateIncidentDTO;
      /**
       * 3️⃣ Fichiers (multer)
       */
      const files = req.files as Express.Multer.File[] | undefined;
      /**
       * 4️⃣ Initialisation UseCase
       */
      const repo = new PrismaIncidentRepository();
      const useCase = new CreateIncidentUseCase(repo);

      /**
       * 5️⃣ Exécution métier
       */
      //const validatedData = incidentSchema.parse(req.body);
      const incident = await useCase.execute(
        validatedData,
        authUser.id,
        files
      );

      /**
       * 6️⃣ Réponse
       */
      return res.status(201).json(incident);

    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = new PrismaIncidentRepository();
      const useCase = new GetAllIncidentsUseCase(repo);

      const page = Number((req as any).query.page) || 1;
      const size = Number((req as any).query.size) || 10;
      const sortBy = (req as any).query.sortBy as string;
      const sortOrder = (req as any).query.sortOrder as 'asc' | 'desc';

      // 🔐 utilisateur authentifié (source unique de vérité)
      const user = (req as any).user;
      if (!user) {
        return (res as any).status(401).json({ message: 'Unauthorized' });
      }

      // 🔎 filtres AUTORISÉS (sans userId venant du front)
      const filters: any = {};
      if ((req as any).query.status) {
        filters.status = (req as any).query.status;
      }

      const incidents = await useCase.execute({
        page,
        size,
        userId: Number(user.id),
        role: user.roles?.[0] ?? 'USER',
        filters,
        sortBy,
        sortOrder
      });

      return (res as any).json(incidents);
    } catch (error) {
      (next as any)(error);
    }
  }


  static async getById(req: Request, res: Response, next: NextFunction) {
    try {

      if (!(req as any).user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const repo = new PrismaIncidentRepository();
      const useCase = new GetIncidentByIdUseCase(repo);

      const user = (req as any).user as AuthUser;
      // const isAdmin =
      //   user.roles?.some(r => r.role.name === 'ADMIN') ?? false;

      const isAdmin =
        user.roles?.some((r: any) =>
          typeof r === 'string'
            ? r === 'ADMIN'
            : r?.name === 'ADMIN' || r?.role?.name === 'ADMIN'
      ) ?? false;

      const incident = await useCase.execute(
        req.params.id,
        user.id,
        isAdmin
      );

      if (!incident) {
        return res.status(404).json({ message: 'Incident not found' });
      }

      return res.json(incident);

    } catch (error) {
      next(error);
    }
  }


  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = (req as any).user;
      if (!authUser?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const validatedData = incidentSchema.partial().parse(req.body) as UpdateIncidentDTO;

      const files = (req as any).files as Express.Multer.File[] | undefined;

      const repo = new PrismaIncidentRepository();
      const useCase = new UpdateIncidentUseCase(repo);

      const incident = await useCase.execute(
        req.params.id,
        validatedData,
        files
      );

      return res.json(incident);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = new PrismaIncidentRepository();
      const useCase = new DeleteIncidentUseCase(repo);
      await useCase.execute((req as any).params.id);
      return (res as any).status(204).send();
    } catch (error) {
      // Fix: Type 'NextFunction' has no call signatures.
      (next as any)(error);
    }
  }

  static async getAttachments(req: Request, res: Response) {
      const incidentId = Number(req.params.incidentId);

      const attachments = await prisma.attachment.findMany({
        where: {
          incidentId,
        },
        orderBy: {
          uploadedAt: 'desc',
        },
      });

      return res.json(attachments);
  }

  static async deleteAttachment(req: Request, res: Response, next: NextFunction) {
    try {
      const incidentId = Number(req.params.incidentId);
      const attachmentId = Number(req.params.attachmentId);

      const attachment = await prisma.attachment.findFirst({
        where: { id: attachmentId, incidentId },
      });

      if (!attachment) {
        return res.status(404).json({ message: 'Attachment not found' });
      }

      // 🔥 SUPPRESSION FICHIER
      if (attachment.url) {
        const absolutePath = path.resolve(attachment.url);
        await fs.unlink(absolutePath).catch(() => {
          // optionnel : log si fichier déjà absent
        });
      }

      // 🔥 SUPPRESSION DB
      await prisma.attachment.delete({
        where: { id: attachmentId },
      });

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async generatePdf(req: Request, res: Response, next: NextFunction) {
    try {

      if (!(req as any).user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const incidentId = req.params.id;

      const user = (req as any).user as AuthUser;

      const isAdmin =
        user.roles?.some((r: any) =>
          typeof r === 'string'
            ? r === 'ADMIN'
            : r?.name === 'ADMIN' || r?.role?.name === 'ADMIN'
        ) ?? false;

      const repo = new PrismaIncidentRepository();

      const incident = await repo.findById(
        incidentId,
        user.id,
        isAdmin
      );

      if (!incident) {
        return res.status(404).json({ message: 'Incident introuvable ou accès refusé' });
      }

      const templatePath = path.join(
        process.cwd(),
        'templates/incident-report.html'
      );

      const template = await fs.readFile(templatePath, 'utf8');

      const receiverSites =
        incident.sites?.length
          ? incident.sites.map(site => site.name).join(', ')
          : '—';

      const ImpactedSites =
        incident.impactedSites?.length
          ? incident.impactedSites.map(site => site.name).join(', ')
          : '—';

      const emitterService =
        incident.serviceEmitter;

      const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
      const logoBuffer = await fs.readFile(logoPath);
      const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;

      const html = template
        .replace('{{reference}}', incident.reference)
        .replace(
          '{{createdAt}}',
          incident.createdAt
            ? new Date(incident.createdAt).toISOString().slice(0, 10)
            : '—'
        )
        .replace(
          '{{dueDate}}',
          incident.dueDate
            ? new Date(incident.dueDate).toISOString().slice(0, 10)
            : '—'
        )        
        .replace('{{creator}}', '—')
        .replace('{{emitterService}}', emitterService ?? '—')
        .replace('{{receiverService}}', receiverSites)
        .replace('{{incidentSite}}', ImpactedSites)
        .replace('{{status}}', incident.status)
        .replace('{{criticality}}', incident.criticality ?? '—')
        .replace('{{priority}}', incident.urgency ?? '—')
        .replace('{{category}}', incident.category ?? '—')
        .replace('{{process}}', incident.processDomain ?? '—')
        .replace('{{cause}}', incident.subCategory ?? '—')
        .replace('{{description}}', incident.description ?? '—')
        .replace('{{scope}}', incident.scope ?? '—')
        .replace('{{actions}}', '—')
        .replace('{{proposal}}', '—')
        .replace('{{observation}}', '—')
        .replace('{{LOGO_URL}}', logoBase64);

      const outputPath = path.join(
        process.cwd(),
        'uploads',
        'incidents',
        `incident_${incident.id}.pdf`
      );

      await IncidentPdfService.generate(html, outputPath);

      return res.sendFile(outputPath);

    } catch (error) {
      next(error);
    }
  }

  static async downloadAttachment(req: Request, res: Response) {
    const { attachmentId } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id: Number(attachmentId) }
    });

    if (!attachment) {
      return res.status(404).json({ message: 'Fichier introuvable' });
    }

    const filePath = path.join(process.cwd(), attachment.url);

    return res.download(filePath, attachment.fileName);
  }

  static async getStatusStats(req: Request, res: Response) {
    try {
      const repo = new PrismaIncidentRepository();
      const stats = await repo.getStatusStats();
      res.json(stats);
    } catch (error) {
      console.error('Erreur récupération stats:', error);
      res.status(500).json({ message: 'Erreur récupération statistiques' });
    }
  }

}