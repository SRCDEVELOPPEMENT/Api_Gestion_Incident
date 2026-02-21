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
import { IncidentService } from '../../../services/IncidentService';
import { IncidentQuerySchema } from "../../../presentation/http/schemas/IncidentQuerySchema";
import { buildIncidentWhere } from "../../../presentation/http/mappers/incidentFilterMapper";

const incidentSchema = z.object({
  reporterName: z.string().min(2, "Nom du déclarant obligatoire"), // ✅ AJOUT
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
  personneIds: z.preprocess(
    (val) => {
      if (!val) return [];
      return Array.isArray(val) ? val : [val];
    },
    z.array(z.coerce.number()).optional()
  ),
  dueDate: z.string(),
  urgency: z.enum(['Faible', 'Moyenne', 'Haute', 'Immédiate']),
  criticality: z.enum(['Faible', 'Moyenne', 'Haute', 'Critique']),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED']).optional(),
});


  function hasAdminLikeAccess(user: any): boolean {
    return (
      user?.roles?.some((r: any) =>
        typeof r === "string"
          ? r === "ADMIN" || r === "MANAGER" || r === "CONTROLEUR"
          : r?.name === "ADMIN" ||
            r?.role?.name === "ADMIN" ||
            r?.name === "MANAGER" ||
            r?.role?.name === "MANAGER" ||
            r?.name === "CONTROLEUR" ||
            r?.role?.name === "CONTROLEUR"
      ) ?? false
    );
  }

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
      const authUser = (req as any).user as AuthUser | undefined;
      if (!authUser?.id) return res.status(401).json({ message: "Unauthorized" });

      const rawPage = Number(req.query.page);
      const rawSize = Number(req.query.size ?? req.query.limit);

      const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
      const size = Number.isFinite(rawSize) && rawSize > 0 ? Math.min(rawSize, 100) : 10;

      const userId = Number(authUser.id);
      if (Number.isNaN(userId)) return res.status(400).json({ message: "Invalid user id" });

      const skip = (page - 1) * size;
      const take = size;

      const isAdmin = hasAdminLikeAccess(authUser);

      const repo = new PrismaIncidentRepository();

      const result = await repo.findAll(
        userId,
        isAdmin,
        skip,
        take,
        {},
        { createdAt: "desc" }
      );

      return res.json(result);
    } catch (error) {
      next(error);
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

      // ✅ ADMIN ou MANAGER = voit tout
      const isAdmin = hasAdminLikeAccess(user);

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

  // static async generatePdf(req: Request, res: Response, next: NextFunction) {
  //   try {

  //     if (!(req as any).user) {
  //       return res.status(401).json({ message: 'Unauthorized' });
  //     }

  //     const incidentId = req.params.id;

  //     const user = (req as any).user as AuthUser;

  //     const isAdmin =
  //       user.roles?.some((r: any) =>
  //         typeof r === 'string'
  //           ? r === 'ADMIN'
  //           : r?.name === 'ADMIN' || r?.role?.name === 'ADMIN'
  //       ) ?? false;

  //     const repo = new PrismaIncidentRepository();

  //     const incident = await repo.findById(
  //       incidentId,
  //       user.id,
  //       isAdmin
  //     );

  //     if (!incident) {
  //       return res.status(404).json({ message: 'Incident introuvable ou accès refusé' });
  //     }

  //     const templatePath = path.join(
  //       process.cwd(),
  //       'templates/incident-report.html'
  //     );

  //     const template = await fs.readFile(templatePath, 'utf8');

  //     const receiverSites =
  //       incident.sites?.length
  //         ? incident.sites.map(site => site.name).join(', ')
  //         : '—';

  //     const ImpactedSites =
  //       incident.impactedSites?.length
  //         ? incident.impactedSites.map(site => site.name).join(', ')
  //         : '—';

  //     const emitterService =
  //       incident.serviceEmitter;

  //     const personnesList =
  //       incident.personnes?.length
  //         ? `<ul>${incident.personnes
  //             .map(p => `<li>${p.fullname}</li>`)
  //             .join('')}</ul>`
  //         : '—';

  //     const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
  //     const logoBuffer = await fs.readFile(logoPath);
  //     const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  //     const html = template
  //       .replace('{{reference}}', incident.reference)
  //       .replace(
  //         '{{createdAt}}',
  //         incident.createdAt
  //           ? new Date(incident.createdAt).toISOString().slice(0, 10)
  //           : '—'
  //       )
  //       .replace(
  //         '{{dueDate}}',
  //         incident.dueDate
  //           ? new Date(incident.dueDate).toISOString().slice(0, 10)
  //           : '—'
  //       )        
  //       .replace('{{creator}}', '—')
  //       .replace('{{emitterService}}', emitterService ?? '—')
  //       .replace('{{receiverService}}', receiverSites)
  //       .replace('{{incidentSite}}', ImpactedSites)
  //       .replace('{{status}}', incident.status)
  //       .replace('{{criticality}}', incident.criticality ?? '—')
  //       .replace('{{priority}}', incident.urgency ?? '—')
  //       .replace('{{category}}', incident.category ?? '—')
  //       .replace('{{process}}', incident.processDomain ?? '—')
  //       .replace('{{cause}}', incident.subCategory ?? '—')
  //       .replace('{{description}}', incident.description ?? '—')
  //       .replace('{{personnes}}', personnesList)
  //       .replace('{{scope}}', incident.scope ?? '—')
  //       .replace('{{actions}}', '—')
  //       .replace('{{proposal}}', '—')
  //       .replace('{{observation}}', '—')
  //       .replace('{{LOGO_URL}}', logoBase64);

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
      if (!(req as any).user) return res.status(401).json({ message: "Unauthorized" });

      const incidentId = req.params.id;
      const user = (req as any).user as AuthUser;

      const isAdmin =
        user.roles?.some((r: any) =>
          typeof r === "string"
            ? r === "ADMIN"
            : r?.name === "ADMIN" || r?.role?.name === "ADMIN"
        ) ?? false;

      const repo = new PrismaIncidentRepository();
      const incident = await repo.findById(incidentId, user.id, isAdmin);

      if (!incident) {
        return res.status(404).json({ message: "Incident introuvable ou accès refusé" });
      }

      const templatePath = path.join(process.cwd(), "templates", "incident-report.html");
      const logoPath = path.join(process.cwd(), "assets", "logo.png");

      const template = await fs.readFile(templatePath, "utf8");
      const logoBuffer = await fs.readFile(logoPath);
      const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

      const receiverSites = incident.sites?.length ? incident.sites.map(s => s.name).join(", ") : "—";
      const impactedSites = incident.impactedSites?.length ? incident.impactedSites.map(s => s.name).join(", ") : "—";
      const personnesList =
        incident.personnes?.length ? `<ul>${incident.personnes.map(p => `<li>${p.fullname}</li>`).join("")}</ul>` : "—";

      const html = template
        .replace("{{reference}}", incident.reference)
        .replace("{{createdAt}}", incident.createdAt ? new Date(incident.createdAt).toISOString().slice(0, 10) : "—")
        .replace("{{dueDate}}", incident.dueDate ? new Date(incident.dueDate).toISOString().slice(0, 10) : "—")
        .replace("{{creator}}", incident.reporterName ?? "—")
        .replace("{{emitterService}}", incident.serviceEmitter ?? "—")
        .replace("{{receiverService}}", receiverSites)
        .replace("{{incidentSite}}", impactedSites)
        .replace("{{status}}", incident.status)
        .replace("{{criticality}}", incident.criticality ?? "—")
        .replace("{{priority}}", incident.urgency ?? "—")
        .replace("{{category}}", incident.category ?? "—")
        .replace("{{process}}", incident.processDomain ?? "—")
        .replace("{{cause}}", incident.subCategory ?? "—")
        .replace("{{description}}", incident.description ?? "—")
        .replace("{{personnes}}", personnesList)
        .replace("{{scope}}", incident.scope ?? "—")
        .replace("{{actions}}", "—")
        .replace("{{proposal}}", "—")
        .replace("{{observation}}", "—")
        .replace("{{LOGO_URL}}", logoBase64);

      const outDir = path.join(process.cwd(), "uploads", "incidents");
      await fs.mkdir(outDir, { recursive: true });

      const outputPath = path.join(outDir, `incident_${incident.id}.pdf`);
      await IncidentPdfService.generate(html, outputPath);

      await fs.access(outputPath);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="incident_${incident.id}.pdf"`);

      return res.sendFile(outputPath, (err) => {
        if (err) return next(err);
      });
    } catch (error) {
      console.error("generatePdf error:", error);
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

  static async getStatusStats(req: any, res: any) {
    try {

      const authUser = req.user;

      const dbUser = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      });

      if (!dbUser) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }

      //const roles = dbUser.roles.map(r => r.role.name);
      const roles = dbUser.roles
        .map(r => r.role?.name)
        .filter(Boolean)
        .map((name: string) => name.toUpperCase());
            const incidentService = new IncidentService();

      const stats = await incidentService.getStatusStats({
        id: dbUser.id,
        roles: roles,
        siteId: dbUser.siteId ?? undefined
      });

      res.json(stats);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur récupération stats' });
    }
  }


  static async query(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = (req as any).user as AuthUser | undefined;
      if (!authUser?.id) return res.status(401).json({ message: "Unauthorized" });

      // ✅ log brut
      console.log("[INCIDENTS QUERY] raw body:", req.body);

      // ✅ body vide => erreur claire
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          message: "Body JSON vide. Vérifie express.json() et Content-Type.",
        });
      }

      // ✅ parse Zod
      const parsed = IncidentQuerySchema.parse(req.body);
      console.log("[INCIDENTS QUERY] parsed:", parsed);

      const isAdmin = hasAdminLikeAccess(authUser);
      const userId = Number(authUser.id);

      // ✅ build where + order
      const whereUI = buildIncidentWhere(parsed.filters, parsed.logic);
      const orderBy = parsed.sort.length
        ? parsed.sort.map((s) => ({ [s.field]: s.dir }))
        : [{ createdAt: "desc" }];

      console.log("[INCIDENTS QUERY] whereUI:", JSON.stringify(whereUI));
      console.log("[INCIDENTS QUERY] orderBy:", JSON.stringify(orderBy));

      const skip = (parsed.page - 1) * parsed.pageSize;
      const take = parsed.pageSize;

      const repo = new PrismaIncidentRepository();
      const result = await repo.findAll(userId, isAdmin, skip, take, whereUI, orderBy as any);

      return res.json(result);
    } catch (error: any) {
      // ✅ si ZodError => 400 clair
      if (error?.name === "ZodError") {
        console.error("[INCIDENTS QUERY] ZodError:", error.issues);
        return res.status(400).json({
          message: "Payload de filtre invalide",
          issues: error.issues,
        });
      }

      console.error("[INCIDENTS QUERY] ERROR:", error);
      next(error);
    }
  }

}