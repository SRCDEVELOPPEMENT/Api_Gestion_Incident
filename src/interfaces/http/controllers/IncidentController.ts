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
      // Basic filtering
      const filters: any = {};
      if ((req as any).query.status) filters.status = (req as any).query.status;
      if ((req as any).query.userId) filters.userId = (req as any).query.userId;

      const incidents = await useCase.execute({ page, size, filters, sortBy, sortOrder });
      return (res as any).json(incidents);
    } catch (error) {
      // Fix: Type 'NextFunction' has no call signatures.
      (next as any)(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = new PrismaIncidentRepository();
      const useCase = new GetIncidentByIdUseCase(repo);
      const incident = await useCase.execute((req as any).params.id);
      if (!incident) throw new NotFoundError('Incident not found');
      return (res as any).json(incident);
    } catch (error) {
      // Fix: Type 'NextFunction' has no call signatures.
      (next as any)(error);
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

  // static async deleteAttachment(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const incidentId = Number(req.params.incidentId);
  //     const attachmentId = Number(req.params.attachmentId);

  //     // Vérifier que la PJ existe et appartient bien à l’incident
  //     const attachment = await prisma.attachment.findFirst({
  //       where: {
  //         id: attachmentId,
  //         incidentId,
  //       },
  //     });

  //     if (!attachment) {
  //       return res.status(404).json({
  //         status: 'error',
  //         code: 'NOT_FOUND',
  //         message: 'Attachment not found for this incident',
  //       });
  //     }

  //     await prisma.attachment.delete({
  //       where: { id: attachmentId },
  //     });

  //     return res.status(204).send();
  //   } catch (error) {
  //     next(error);
  //   }
  // }

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


// static async generatePdf(req: Request, res: Response, next: NextFunction) {
//   try {
//     const incidentId = Number(req.params.id);

//     const incident = await prisma.incident.findUnique({
//       where: { id: incidentId },
//     });

//     if (!incident) {
//       return res.status(404).json({ message: 'Incident introuvable' });
//     }

//     const templatePath = path.join(
//       process.cwd(),
//       'templates/incident-report.html'
//     );

//     const template = await fs.readFile(templatePath, 'utf8');

//     const html = template
//       // 🔹 En-tête / Références
//       .replace('{{reference}}', `INC${incident.id}`)
//       .replace('{{createdAt}}', incident.createdAt.toISOString().slice(0, 10))
//       .replace('{{dueDate}}', incident.dueDate.toISOString().slice(0, 10))

//       // 🔹 Acteurs / Services
//       .replace(
//         '{{creator}}',
//         incident.reporterId ? String(incident.reporterId) : '—'
//       )
//       .replace('{{emitterService}}', incident.scope ?? '—')
//       .replace(
//         '{{receiverService}}',
//         incident.processDomainId ? String(incident.processDomainId) : '—'
//       )

//       // 🔹 Sites / Numéros
//       .replace('{{incidentSite}}', '—')
//       .replace('{{dsNumber}}', String(incident.id))

//       // 🔹 Statut / Priorité
//       .replace('{{status}}', incident.status)
//       .replace('{{priority}}', incident.urgency)

//       // 🔹 Classification
//       .replace(
//         '{{category}}',
//         incident.categoryId ? String(incident.categoryId) : '—'
//       )
//       .replace(
//         '{{process}}',
//         incident.processDomainId ? String(incident.processDomainId) : '—'
//       )

//       // 🔹 Contenu métier
//       .replace('{{description}}', incident.description)
//       .replace('{{scope}}', incident.scope ?? '—')
//       .replace(
//         '{{cause}}',
//         incident.subCategoryId ? String(incident.subCategoryId) : '—'
//       )

//       // 🔹 Sections libres
//       .replace('{{actions}}', '—')
//       .replace('{{proposal}}', '—')
//       .replace('{{observation}}', '—')

//       // 🔹 Logo
//       .replace(
//         '{{LOGO_URL}}',
//         'file://' + path.join(process.cwd(), 'assets/logo.png')
//       );

//     const outputPath = path.join(
//       process.cwd(),
//       'uploads',
//       'incidents',
//       `incident_${incident.id}.pdf`
//     );

//     await IncidentPdfService.generate(html, outputPath);

//     return res.sendFile(outputPath);
//   } catch (error) {
//     next(error);
//   }
// }


static async generatePdf(req: Request, res: Response, next: NextFunction) {
  try {
    const incidentId = req.params.id;

    // ✅ UTILISER LE REPOSITORY (PAS PRISMA DIRECT)
    const repo = new PrismaIncidentRepository();
    const incident = await repo.findById(incidentId);

    if (!incident) {
      return res.status(404).json({ message: 'Incident introuvable' });
    }

    const templatePath = path.join(
      process.cwd(),
      'templates/incident-report.html'
    );

    const template = await fs.readFile(templatePath, 'utf8');

    // 🔹 Nom & Prénom = IncidentUser(s)
    const incidentUsers =
      incident.assignedUsers && incident.assignedUsers.length > 0
        ? incident.assignedUsers
            .map(user => `${user.username ?? ''}`.trim())
            .join(', ')
        : '—';

    // 🔹 Récepteur Incident = IncidentSite(s)
    const receiverIncident =
      incident.impactedSites && incident.impactedSites.length > 0
        ? incident.impactedSites.map(site => site.name).join(', ')
        : '—';
        
    // ======================================================
    // 🔥 ICI : CONSTRUCTION DE L’URL DU LOGO (OBLIGATOIRE)
    // ======================================================
    const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
    //const logoUrl = pathToFileURL(logoPath).href;
    const logoBuffer = await fs.readFile(logoPath);
    const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    // ======================================================

    const html = template
      // ======================
      // EN-TÊTE
      // ======================
      .replace('{{reference}}', incident.reference)
      .replace('{{createdAt}}', incident.createdAt.toISOString().slice(0, 10))
      .replace('{{dueDate}}', incident.dueDate.toISOString().slice(0, 10))

      // ======================
      // ACTEURS / SERVICES
      // ======================
      .replace('{{creator}}', incidentUsers)
      .replace('{{emitterService}}', '—')
      .replace('{{receiverService}}', receiverIncident) // ✅ ICI

      // ======================
      // SITES / NUMÉROS
      // ======================
      .replace(
        '{{incidentSite}}',
        incident.impactedSites.length > 0
          ? incident.impactedSites.map(s => s.name).join(', ')
          : '—'
      )
      //.replace('{{dsNumber}}', incident.reference)

      // ======================
      // STATUT / PRIORITÉ
      // ======================
      .replace('{{status}}', incident.status)
      .replace('{{priority}}', incident.urgency)

      // ======================
      // CLASSIFICATION MÉTIER
      // ======================
      .replace('{{category}}', incident.category ?? '—')
      .replace('{{process}}', incident.processDomain ?? '—')
      .replace('{{cause}}', incident.subCategory ?? '—')

      // ======================
      // CONTENU
      // ======================
      .replace('{{description}}', incident.description)
      .replace('{{scope}}', incident.scope ?? '—')

      // ======================
      // SECTIONS LIBRES
      // ======================
      .replace('{{actions}}', '—')
      .replace('{{proposal}}', '—')
      .replace('{{observation}}', '—')

      // ======================
      // LOGO
      // ======================
      // 🔥 UTILISATION DE logoUrl ICI
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

}