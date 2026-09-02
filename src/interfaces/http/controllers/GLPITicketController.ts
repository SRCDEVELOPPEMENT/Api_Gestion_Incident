import { Request, Response, NextFunction } from "express";
import prisma from "../../../infrastructure/database/prisma";
import { GLPITicketQuerySchema } from "../../../presentation/http/schemas/GLPITicketQuerySchema";
import { buildGLPITicketWhere } from "../../../presentation/http/mappers/glpiTicketFilterMapper";
import { AuthUser } from "../../../domain/entities/AuthUser";

/* ─── Libellés GLPI ─── */
const STATUS_LABELS: Record<string, string> = {
  "1": "Nouveau",
  "2": "En cours",
  "3": "En attente",
  "4": "Résolu",
  "5": "Clôturé",
  "6": "Annulé",
};

// GLPI priority/urgency/impact : 1=Très basse … 5=Très haute
const LEVEL_LABELS: Record<string, string> = {
  "1": "Très basse",
  "2": "Basse",
  "3": "Moyenne",
  "4": "Haute",
  "5": "Très haute",
};

function levelLabel(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  return LEVEL_LABELS[String(value)] ?? String(value);
}

export class GLPITicketController {
  /**
   * POST /api/v1/glpi-tickets/query
   * Table serveur paginée/filtrée sur la table locale GLPITicket (sync GLPI).
   */
  static async query(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = (req as any).user as AuthUser | undefined;
      if (!authUser?.id) return res.status(401).json({ message: "Unauthorized" });

      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          message: "Body JSON vide. Vérifie express.json() et Content-Type.",
        });
      }

      const parsed = GLPITicketQuerySchema.parse(req.body);

      const where = buildGLPITicketWhere(parsed.filters, parsed.logic);
      const orderBy = parsed.sort.length
        ? parsed.sort.map((s) => ({ [s.field]: s.dir }))
        : [{ glpiId: "desc" }];

      const skip = (parsed.page - 1) * parsed.pageSize;
      const take = parsed.pageSize;

      const [tickets, total] = await Promise.all([
        prisma.gLPITicket.findMany({
          where,
          orderBy: orderBy as any,
          skip,
          take,
        }),
        prisma.gLPITicket.count({ where }),
      ]);

      const totalPages = Math.ceil(total / take);

      const data = tickets.map((t) => ({
        id: t.id,
        glpiId: t.glpiId,
        ticketNumber: t.ticketNumber,
        title: t.title,
        description: t.description,
        status: t.status,
        statusLabel: STATUS_LABELS[String(t.status)] ?? t.status,
        priority: t.priority,
        priorityLabel: levelLabel(t.priority),
        urgency: t.urgency,
        urgencyLabel: levelLabel(t.urgency),
        impact: t.impact,
        impactLabel: levelLabel(t.impact),
        categoryName: t.categoryName,
        entityName: t.entityName,
        locationName: t.locationName,
        requesterName: t.requesterName,
        assigneeName: t.assigneeName,
        openedAt: t.openedAt,
        dueAt: t.dueAt,
        resolvedAt: t.resolvedAt,
        closedAt: t.closedAt,
        lastSyncedAt: t.lastSyncedAt,
      }));

      return res.json({
        data,
        total,
        page: parsed.page,
        pageSize: parsed.pageSize,
        totalPages,
      });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        return res.status(400).json({
          message: "Payload de filtre invalide",
          issues: error.issues,
        });
      }

      console.error("[GLPI TICKETS QUERY] ERROR:", error);
      return res.status(500).json({
        message: "Erreur serveur pendant la requête",
        error: String(error?.message ?? error),
      });
    }
  }
}
