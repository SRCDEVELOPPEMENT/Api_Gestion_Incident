import prisma from '../infrastructure/database/prisma';

/* ------------------------------------------------------------------ */
/*  Types du rapport hebdomadaire                                      */
/* ------------------------------------------------------------------ */

export interface WeeklyReportPeriod {
  weekNumber: number;
  year: number;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  label: string;     // "Semaine 30 — 2026"
}

export interface WeeklyReportKpi {
  created: number;
  resolved: number;
  resolutionRate: number | null;       // null si 0 création (N/A)
  cappedRate: number;                   // min(rate, 100)
  extraResolvedFromStock: number;       // max(0, resolved - created)
  backlogStart: number;                 // stock actif au début de la semaine
  backlogEnd: number;                   // stock actif à la fin de la semaine
  avgResolutionHours: number | null;
  avgTakeInChargeHours: number | null;
}

export interface WeeklyReportComparison {
  previousWeek: WeeklyReportKpi;
  resolutionRateChange: number | null;   // points de pourcentage
  createdChange: number | null;          // %
  resolvedChange: number | null;         // %
  backlogEndChange: number | null;       // %
  avgResolutionChange: number | null;    // %
}

export interface WeeklyReportByPriority {
  name: string;
  created: number;
  resolved: number;
  rate: number | null;
}

export interface WeeklyReportByService {
  name: string;
  created: number;
  resolved: number;
  rate: number | null;
}

export interface WeeklyReportTrendDay {
  dayLabel: string;     // "Lun 21", "Mar 22", …
  date: string;         // ISO
  created: number;
  resolved: number;
}

export interface WeeklyReportData {
  period: WeeklyReportPeriod;
  kpi: WeeklyReportKpi;
  byPriority: WeeklyReportByPriority[];
  byService: WeeklyReportByService[];
  dailyTrend: WeeklyReportTrendDay[];
  comparison: WeeklyReportComparison | null; // null si pas de S-1
  incidents: WeeklyReportIncidentDetail[];   // max 50 lignes
}

export interface WeeklyReportIncidentDetail {
  reference: string;
  description: string;
  status: string;
  priority: string;
  serviceEmetteur: string;
  serviceRecepteur: string;
  createdAt: string;
  rootCause: string | null;
  proposedSolution: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers ISO week                                                   */
/* ------------------------------------------------------------------ */

function getWeekNumber(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week: weekNo, year: d.getUTCFullYear() };
}

function weekStartEnd(week: number, year: number): { start: Date; end: Date } {
  const firstJan = new Date(Date.UTC(year, 0, 1));
  const dayNum = firstJan.getUTCDay() || 7;
  const daysToFirstMonday = (dayNum <= 4 ? 1 - dayNum : 8 - dayNum);
  const firstMonday = new Date(firstJan.getTime() + daysToFirstMonday * 86400000);
  const monday = new Date(firstMonday.getTime() + (week - 1) * 7 * 86400000);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  return {
    start: new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate(), 0, 0, 0, 0)),
    end: new Date(Date.UTC(sunday.getUTCFullYear(), sunday.getUTCMonth(), sunday.getUTCDate(), 23, 59, 59, 999)),
  };
}

function formatPeriod(start: Date, end: Date): WeeklyReportPeriod {
  const { week, year } = getWeekNumber(start);
  return {
    weekNumber: week,
    year,
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    label: `Semaine ${week} — ${year}`,
  };
}

/* ------------------------------------------------------------------ */
/*  Helper accès (copie de la logique IncidentService)                 */
/* ------------------------------------------------------------------ */

function isAdminLike(roles: string[]): boolean {
  const upper = roles.map((r) => r.toUpperCase());
  return upper.includes('ADMIN') || upper.includes('MANAGER') || upper.includes('CONTROLEUR');
}

function buildUserFilter(user: { id: number; roles: string[]; siteId?: number }) {
  if (isAdminLike(user.roles)) return {};
  return {
    OR: [
      { reporterId: user.id },
      ...(user.siteId !== undefined && user.siteId !== null
        ? [{ incidentSites: { some: { siteId: user.siteId } } }]
        : []),
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  WeeklyReportService                                                */
/* ------------------------------------------------------------------ */

export class WeeklyReportService {
  /**
   * Calcule le backlog (incidents OPEN ou IN_PROGRESS) à une date donnée.
   */
  private async backlogAt(
    date: Date,
    user: { id: number; roles: string[]; siteId?: number },
  ): Promise<number> {
    const userFilter = buildUserFilter(user);
    return prisma.incident.count({
      where: {
        deletedAt: null,
        ...userFilter,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        createdAt: { lte: date },
        OR: [
          { resolvedAt: null },
          { resolvedAt: { gt: date } },
        ],
      },
    });
  }

  /**
   * Point central : agrège tous les indicateurs d'une semaine.
   */
  async getWeeklyReport(
    week: number,
    year: number,
    user: { id: number; roles: string[]; siteId?: number },
  ): Promise<WeeklyReportData> {
    const { start, end } = weekStartEnd(week, year);
    const period = formatPeriod(start, end);

    const userFilter = buildUserFilter(user);
    const baseWhere: any = { deletedAt: null, ...userFilter };

    // ── 1. Incidents créés et résolus durant la semaine ──
    const [created, resolved, createdIncidents, resolvedIncidents] = await Promise.all([
      // Nombre d'incidents créés dans la semaine
      prisma.incident.count({
        where: { ...baseWhere, createdAt: { gte: start, lte: end } },
      }),
      // Nombre d'incidents résolus dans la semaine
      prisma.incident.count({
        where: { ...baseWhere, resolvedAt: { gte: start, lte: end } },
      }),
      // Incidents créés (pour stats par priorité/service)
      prisma.incident.findMany({
        where: { ...baseWhere, createdAt: { gte: start, lte: end } },
        select: { criticality: true, reporter: { select: { site: { select: { name: true } } } } },
      }),
      // Incidents résolus (pour stats par priorité/service)
      prisma.incident.findMany({
        where: { ...baseWhere, resolvedAt: { gte: start, lte: end } },
        select: { criticality: true, reporter: { select: { site: { select: { name: true } } } } },
      }),
    ]);

    // ── 2. Backlog début / fin de semaine ──
    const weekStartMinus1ms = new Date(start.getTime() - 1);
    const [backlogStart, backlogEnd] = await Promise.all([
      this.backlogAt(weekStartMinus1ms, user),
      this.backlogAt(end, user),
    ]);

    // ── 3. Taux (cappé) ──
    const rawRate = created > 0 ? Math.round((resolved / created) * 10000) / 100 : null;
    const cappedRate = rawRate !== null ? Math.min(rawRate, 100) : 0;
    const extraResolvedFromStock = Math.max(0, resolved - created);

    // ── 4. Temps moyens ──
    const lifecycleRows = await prisma.incident.findMany({
      where: {
        ...baseWhere,
        resolvedAt: { gte: start, lte: end },
        createdAt: { lte: end },
      },
      select: { createdAt: true, takenInChargeAt: true, resolvedAt: true },
    });

    const avgHours = (milestone: 'takenInChargeAt' | 'resolvedAt'): number | null => {
      const deltas = lifecycleRows
        .filter((r) => r[milestone] != null)
        .map((r) => Math.max(0, (r[milestone]!.getTime() - r.createdAt.getTime()) / 3600000));
      if (deltas.length === 0) return null;
      return Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 100) / 100;
    };

    // ── 5. Par priorité ──
    const priorityMap = new Map<string, { created: number; resolved: number }>();
    const priorityOrder = ['Critique', 'Haute', 'Moyenne', 'Basse'];

    const mapCriticality = (c: string): string => {
      switch (c) {
        case 'Critique': return 'Critique';
        case 'Haute': return 'Haute';
        case 'Moyenne': return 'Moyenne';
        case 'Faible': return 'Basse';
        default: return c;
      }
    };

    for (const inc of createdIncidents) {
      const label = mapCriticality(inc.criticality);
      const entry = priorityMap.get(label) ?? { created: 0, resolved: 0 };
      entry.created++;
      priorityMap.set(label, entry);
    }
    for (const inc of resolvedIncidents) {
      const label = mapCriticality(inc.criticality);
      const entry = priorityMap.get(label) ?? { created: 0, resolved: 0 };
      entry.resolved++;
      priorityMap.set(label, entry);
    }

    const byPriority: WeeklyReportByPriority[] = priorityOrder
      .map((name) => {
        const entry = priorityMap.get(name) ?? { created: 0, resolved: 0 };
        return {
          name,
          created: entry.created,
          resolved: entry.resolved,
          rate: entry.created > 0
            ? Math.round((entry.resolved / entry.created) * 10000) / 100
            : null,
        };
      })
      .filter((p) => p.created > 0 || p.resolved > 0);

    // ── 6. Par service (site du déclarant) ──
    const serviceMap = new Map<string, { created: number; resolved: number }>();
    for (const inc of createdIncidents) {
      const siteName = (inc.reporter as any)?.site?.name ?? 'Non défini';
      const entry = serviceMap.get(siteName) ?? { created: 0, resolved: 0 };
      entry.created++;
      serviceMap.set(siteName, entry);
    }
    for (const inc of resolvedIncidents) {
      const siteName = (inc.reporter as any)?.site?.name ?? 'Non défini';
      const entry = serviceMap.get(siteName) ?? { created: 0, resolved: 0 };
      entry.resolved++;
      serviceMap.set(siteName, entry);
    }

    const byService: WeeklyReportByService[] = Array.from(serviceMap.entries())
      .map(([name, v]) => ({
        name,
        created: v.created,
        resolved: v.resolved,
        rate: v.created > 0
          ? Math.round((v.resolved / v.created) * 10000) / 100
          : null,
      }))
      .sort((a, b) => b.created - a.created);

    // ── 7. Trend journalier ──
    // ── Trend journalier optimisé (1 seul appel Prisma) ──
    const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const dailyTrend: WeeklyReportTrendDay[] = [];

    // Un seul fetch pour toute la semaine
    const weekIncidents = await prisma.incident.findMany({
      where: {
        ...baseWhere,
        OR: [
          { createdAt: { gte: start, lte: end } },
          { resolvedAt: { gte: start, lte: end } },
        ],
      },
      select: { createdAt: true, resolvedAt: true },
    });

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(start.getTime() + i * 86400000);
      const dayEnd = new Date(dayStart.getTime() + 86400000 - 1);

      const dayCreated = weekIncidents.filter(
        (inc) => inc.createdAt >= dayStart && inc.createdAt <= dayEnd,
      ).length;
      const dayResolved = weekIncidents.filter(
        (inc) => inc.resolvedAt !== null && inc.resolvedAt! >= dayStart && inc.resolvedAt! <= dayEnd,
      ).length;

      dailyTrend.push({
        dayLabel: `${dayLabels[dayStart.getUTCDay()]} ${dayStart.getUTCDate()}`,
        date: dayStart.toISOString().slice(0, 10),
        created: dayCreated,
        resolved: dayResolved,
      });
    }

    // ── 8. Comparaison avec S-1 ──
    let comparison: WeeklyReportComparison | null = null;
    if (week > 1 || (week === 1 && year > 2025)) {
      const prevWeek = week > 1 ? week - 1 : 52;
      const prevYear = week > 1 ? year : year - 1;
      const prev = await this.getWeeklyReport(prevWeek, prevYear, user);

      comparison = {
        previousWeek: prev.kpi,
        resolutionRateChange:
          rawRate !== null && prev.kpi.resolutionRate !== null
            ? Math.round((rawRate - prev.kpi.resolutionRate) * 100) / 100
            : null,
        createdChange:
          prev.kpi.created > 0
            ? Math.round(((created - prev.kpi.created) / prev.kpi.created) * 10000) / 100
            : null,
        resolvedChange:
          prev.kpi.resolved > 0
            ? Math.round(((resolved - prev.kpi.resolved) / prev.kpi.resolved) * 10000) / 100
            : null,
        backlogEndChange:
          prev.kpi.backlogEnd > 0
            ? Math.round(((backlogEnd - prev.kpi.backlogEnd) / prev.kpi.backlogEnd) * 10000) / 100
            : null,
        avgResolutionChange:
          avgHours('resolvedAt') !== null && prev.kpi.avgResolutionHours !== null
            ? Math.round(((avgHours('resolvedAt')! - prev.kpi.avgResolutionHours!) / prev.kpi.avgResolutionHours) * 10000) / 100
            : null,
      };
    }

    // ── 9. Incidents détaillés (créés ou résolus pendant la semaine, max 50) ──
    const INCIDENT_LIMIT = 50;
    const rawIncidents = await prisma.incident.findMany({
      where: {
        ...baseWhere,
        createdAt: { gte: start, lte: end },
      },
      select: {
        reference: true,
        description: true,
        status: true,
        criticality: true,
        createdAt: true,
        rootCause: true,
        proposedSolution: true,
        reporter: { select: { site: { select: { name: true } } } },
        incidentSites: { include: { site: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: INCIDENT_LIMIT + 1,
    });

    const hasMore = rawIncidents.length > INCIDENT_LIMIT;
    const limitedIncidents = rawIncidents.slice(0, INCIDENT_LIMIT);

    const incidents: WeeklyReportIncidentDetail[] = limitedIncidents.map((inc) => {
      const mapPriority = (c: string) => {
        switch (c) { case 'Critique': return 'Critique'; case 'Haute': return 'Haute'; case 'Moyenne': return 'Moyenne'; case 'Faible': return 'Basse'; default: return c; }
      };
      const sites = (inc as any).incidentSites ?? [];
      const recepteur = Array.isArray(sites)
        ? sites.map((s: any) => s?.site?.name).filter(Boolean).join(', ')
        : '';
      return {
        reference: inc.reference,
        description: inc.description.length > 100 ? inc.description.slice(0, 100) + '…' : inc.description,
        status: inc.status,
        priority: mapPriority(inc.criticality),
        serviceEmetteur: (inc.reporter as any)?.site?.name ?? 'Non défini',
        serviceRecepteur: recepteur || '—',
        createdAt: inc.createdAt.toISOString().slice(0, 10),
        rootCause: inc.rootCause,
        proposedSolution: inc.proposedSolution,
      };
    });

    return {
      period,
      kpi: {
        created,
        resolved,
        resolutionRate: rawRate,
        cappedRate,
        extraResolvedFromStock,
        backlogStart,
        backlogEnd,
        avgResolutionHours: avgHours('resolvedAt'),
        avgTakeInChargeHours: avgHours('takenInChargeAt'),
      },
      byPriority,
      byService,
      dailyTrend,
      comparison,
      incidents,
    };
  }

  /** Raccourci : rapport de la semaine courante */
  async getCurrentWeekReport(
    user: { id: number; roles: string[]; siteId?: number },
  ): Promise<WeeklyReportData> {
    const now = new Date();
    const { week, year } = getWeekNumber(now);
    return this.getWeeklyReport(week, year, user);
  }

  /**
   * Génère une liste continue de toutes les semaines depuis le premier incident
   * jusqu'à la semaine courante (incluse). Utile pour voir les semaines sans
   * création d'incident, et toujours voir la semaine en cours.
   */
  async getAvailableWeeks(
    user: { id: number; roles: string[]; siteId?: number },
  ): Promise<WeeklyReportPeriod[]> {
    const userFilter = buildUserFilter(user);

    // Trouver la date du premier incident (pour la borne min)
    const firstIncident = await prisma.incident.findFirst({
      where: { deletedAt: null, ...userFilter },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const now = new Date();
    const currentWeek = getWeekNumber(now);

    // Semaine du premier incident, ou semaine courante si aucun incident
    const minWeek = firstIncident
      ? getWeekNumber(firstIncident.createdAt)
      : currentWeek;

    // Générer une plage continue de minWeek → currentWeek
    const weeks: WeeklyReportPeriod[] = [];
    let w = minWeek.week;
    let y = minWeek.year;

    while (true) {
      const { start, end } = weekStartEnd(w, y);
      weeks.push(formatPeriod(start, end));

      // Condition d'arrêt : on a dépassé la semaine courante
      if (y === currentWeek.year && w >= currentWeek.week) break;
      if (y > currentWeek.year) break;

      // Semaine suivante
      w++;
      if (w > 52) {
        // Gestion des années ISO (53 semaines possibles)
        const checkDate = new Date(y, 11, 31);
        const maxWeek = getWeekNumber(checkDate).week;
        if (w > maxWeek) {
          w = 1;
          y++;
        }
      }
    }

    // Tri décroissant (la plus récente en premier)
    return weeks.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.weekNumber - a.weekNumber;
    });
  }
}
