import prisma from '../infrastructure/database/prisma';

export class IncidentService {
  async getStatusStats(user: {
    id: number;
    roles: string[];
    siteId?: number;
  }) {
    // ✅ Normalisation : insensible à la casse
    const rolesUpper = Array.isArray(user.roles)
      ? user.roles.map(r => String(r).toUpperCase())
      : [];

    // ✅ ADMIN / MANAGER / CONTROLEUR => voient tout (même logique que la liste incidents)
    const isAdminLike =
      rolesUpper.includes('ADMIN') ||
      rolesUpper.includes('MANAGER') ||
      rolesUpper.includes('CONTROLEUR');

    let whereCondition: any = {
      deletedAt: null,
    };

    // ✅ Si pas "admin-like", on garde ta logique actuelle (reporter ou site)
    if (!isAdminLike) {
      whereCondition = {
        deletedAt: null,
        OR: [
          { reporterId: user.id },
          ...(user.siteId !== undefined && user.siteId !== null
            ? [
                {
                  incidentSites: {
                    some: {
                      siteId: user.siteId,
                    },
                  },
                },
              ]
            : []),
        ],
      };
    }

    const [open, inProgress, closed, cancelled, lifecycleRows] = await Promise.all([
      prisma.incident.count({
        where: { ...whereCondition, status: 'OPEN' },
      }),
      prisma.incident.count({
        where: { ...whereCondition, status: 'IN_PROGRESS' },
      }),
      prisma.incident.count({
        where: { ...whereCondition, status: 'CLOSED' },
      }),
      prisma.incident.count({
        where: { ...whereCondition, status: 'CANCELLED' },
      }),
      // ✅ Lignes nécessaires au calcul des temps moyens (mêmes droits d'accès)
      prisma.incident.findMany({
        where: whereCondition,
        select: { createdAt: true, takenInChargeAt: true, resolvedAt: true },
      }),
    ]);

    // Moyenne (en minutes) d'un écart createdAt -> jalon, sur les lignes renseignées.
    // null si aucune donnée -> le front affiche "—" plutôt qu'un faux "0".
    const averageMinutesFrom = (milestone: 'takenInChargeAt' | 'resolvedAt') => {
      const deltas = lifecycleRows
        .filter(row => row[milestone] != null)
        .map(row =>
          Math.max(
            0,
            (row[milestone]!.getTime() - row.createdAt.getTime()) / 60000
          )
        );

      if (deltas.length === 0) return null;
      return Math.round(deltas.reduce((sum, d) => sum + d, 0) / deltas.length);
    };

    return {
      open,
      inProgress,
      closed,
      cancelled,
      avgTakeInChargeMinutes: averageMinutesFrom('takenInChargeAt'),
      avgResolutionMinutes: averageMinutesFrom('resolvedAt'),
    };
  }

  /**
   * Renvoie la tendance des incidents ouverts vs résolus sur les 7 derniers jours.
   * Chaque entrée contient :
   *   - name : libellé du jour (ex: "J-6", "Aujourd'hui")
   *   - ouverts : nombre d'incidents créés ce jour-là
   *   - resolus : nombre d'incidents résolus ce jour-là
   *
   * Respecte les mêmes règles d'accès que getStatusStats :
   *   - ADMIN / MANAGER / CONTROLEUR → voient tout
   *   - autres → voient leurs incidents ou ceux de leur site
   */
  async getTrend7Days(user: {
    id: number;
    roles: string[];
    siteId?: number;
  }): Promise<Array<{ name: string; ouverts: number; resolus: number }>> {
    const rolesUpper = Array.isArray(user.roles)
      ? user.roles.map(r => String(r).toUpperCase())
      : [];

    const isAdminLike =
      rolesUpper.includes('ADMIN') ||
      rolesUpper.includes('MANAGER') ||
      rolesUpper.includes('CONTROLEUR');

    let baseWhere: any = {
      deletedAt: null,
    };

    if (!isAdminLike) {
      baseWhere = {
        deletedAt: null,
        OR: [
          { reporterId: user.id },
          ...(user.siteId !== undefined && user.siteId !== null
            ? [
                {
                  incidentSites: {
                    some: {
                      siteId: user.siteId,
                    },
                  },
                },
              ]
            : []),
        ],
      };
    }

    // Construire les 7 derniers jours (incluant aujourd'hui)
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));

    const days: Array<{ name: string; start: Date; end: Date }> = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart.getTime() - i * 86400000);
      const dayEnd = i === 0
        ? new Date(todayStart.getTime() + 86400000)
        : new Date(todayStart.getTime() - (i - 1) * 86400000);

      const label = i === 0 ? "Aujourd'hui" : `J-${i}`;
      days.push({ name: label, start: dayStart, end: dayEnd });
    }

    // Récupérer tous les incidents avec createdAt et resolvedAt dans la fenêtre
    const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 86400000);

    const incidents = await prisma.incident.findMany({
      where: {
        ...baseWhere,
        OR: [
          { createdAt: { gte: sevenDaysAgo } },
          { resolvedAt: { gte: sevenDaysAgo } },
        ],
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    // Compter par jour
    return days.map(({ name, start, end }) => {
      const ouverts = incidents.filter(inc =>
        inc.createdAt >= start && inc.createdAt < end
      ).length;

      const resolus = incidents.filter(inc =>
        inc.resolvedAt !== null &&
        inc.resolvedAt! >= start &&
        inc.resolvedAt! < end
      ).length;

      return { name, ouverts, resolus };
      });
  }

  /**
   * Renvoie la répartition des incidents par service (site du déclarant).
   * Résultat trié par volume décroissant.
   *
   * Respecte les mêmes règles d'accès que getStatusStats.
   */
  async getByService(user: {
      id: number;
      roles: string[];
      siteId?: number;
  }): Promise<Array<{ name: string; value: number }>> {
      const rolesUpper = Array.isArray(user.roles)
        ? user.roles.map(r => String(r).toUpperCase())
        : [];

      const isAdminLike =
        rolesUpper.includes('ADMIN') ||
        rolesUpper.includes('MANAGER') ||
        rolesUpper.includes('CONTROLEUR');

      const baseWhere: any = { deletedAt: null };

      let userFilter: any = {};
      if (!isAdminLike) {
        userFilter = {
          OR: [
            { reporterId: user.id },
            ...(user.siteId !== undefined && user.siteId !== null
              ? [{ incidentSites: { some: { siteId: user.siteId } } }]
              : []),
          ],
        };
      }

      // Récupérer les incidents avec leur site déclarant
      const incidents = await prisma.incident.findMany({
        where: { ...baseWhere, ...userFilter },
        select: {
          reporter: {
            select: {
              site: { select: { name: true } },
            },
          },
        },
      });

      // Grouper par site
      const map = new Map<string, number>();
      for (const inc of incidents) {
        const siteName = inc.reporter?.site?.name ?? 'Non défini';
        map.set(siteName, (map.get(siteName) ?? 0) + 1);
      }

      return Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }

  /**
   * Renvoie la répartition des incidents par criticité (priorité).
   * Résultat trié par priorité décroissante (Critique > Haute > Moyenne > Faible).
   *
   * Renvoie également backlogCritical : nombre d'incidents ouverts de criticité "Critique".
   *
   * Respecte les mêmes règles d'accès que getStatusStats.
   */
  async getByPriority(user: {
      id: number;
      roles: string[];
      siteId?: number;
  }): Promise<{
      byPriority: Array<{ name: string; value: number }>;
      backlogCritical: number;
  }> {
      const rolesUpper = Array.isArray(user.roles)
        ? user.roles.map(r => String(r).toUpperCase())
        : [];

      const isAdminLike =
        rolesUpper.includes('ADMIN') ||
        rolesUpper.includes('MANAGER') ||
        rolesUpper.includes('CONTROLEUR');

      const baseWhere: any = { deletedAt: null };

      let userFilter: any = {};
      if (!isAdminLike) {
        userFilter = {
          OR: [
            { reporterId: user.id },
            ...(user.siteId !== undefined && user.siteId !== null
              ? [{ incidentSites: { some: { siteId: user.siteId } } }]
              : []),
          ],
        };
      }

      const where = { ...baseWhere, ...userFilter };

      // Récupérer les criticality de tous les incidents non supprimés
      const incidents = await prisma.incident.findMany({
        where,
        select: {
          criticality: true,
          status: true,
        },
      });

      // Compter par criticité
      const map = new Map<string, number>();
      let backlogCritical = 0;

      const mapPriority = (criticalityRaw: string): string => {
        // Les valeurs stockées sont 'Faible', 'Moyenne', 'Haute', 'Critique'
        // Le frontend affiche 'Critique', 'Haute', 'Moyenne', 'Basse'
        switch (criticalityRaw) {
          case 'Critique': return 'Critique';
          case 'Haute': return 'Haute';
          case 'Moyenne': return 'Moyenne';
          case 'Faible': return 'Basse';
          default: return criticalityRaw;
        }
      };

      for (const inc of incidents) {
        const label = mapPriority(inc.criticality);
        map.set(label, (map.get(label) ?? 0) + 1);

        if (inc.status === 'OPEN' && inc.criticality === 'Critique') {
          backlogCritical++;
        }
      }

      // Ordre fixe : Critique, Haute, Moyenne, Basse
      const order = ['Critique', 'Haute', 'Moyenne', 'Basse'];
      const byPriority = order
        .map(name => ({ name, value: map.get(name) ?? 0 }))
        .filter(item => item.value > 0);

      return { byPriority, backlogCritical };
  }

  /**
   * Renvoie le nombre d'incidents actifs (OPEN ou IN_PROGRESS)
   * dont la date d'échéance (dueDate) est passée.
   *
   * Respecte les mêmes règles d'accès que getStatusStats.
   */
  async getOverdue(user: {
      id: number;
      roles: string[];
      siteId?: number;
  }): Promise<number> {
      const rolesUpper = Array.isArray(user.roles)
        ? user.roles.map(r => String(r).toUpperCase())
        : [];

      const isAdminLike =
        rolesUpper.includes('ADMIN') ||
        rolesUpper.includes('MANAGER') ||
        rolesUpper.includes('CONTROLEUR');

      const baseWhere: any = { deletedAt: null };

      let userFilter: any = {};
      if (!isAdminLike) {
        userFilter = {
          OR: [
            { reporterId: user.id },
            ...(user.siteId !== undefined && user.siteId !== null
              ? [{ incidentSites: { some: { siteId: user.siteId } } }]
              : []),
          ],
        };
      }

      const now = new Date();

      const count = await prisma.incident.count({
        where: {
          ...baseWhere,
          ...userFilter,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          dueDate: { lt: now },
        },
      });

            return count;
  }

  /**
   * Renvoie les compteurs d'activité du jour :
   *   - createdToday       : incidents créés aujourd'hui
   *   - takenInChargeToday : incidents passés en prise en charge aujourd'hui
   *   - resolvedToday      : incidents résolus aujourd'hui
   *   - urgentActive       : incidents actifs (OPEN ou IN_PROGRESS) avec criticalité Critique ou urgence Immédiate
   *
   * Respecte les mêmes règles d'accès que getStatusStats.
   */
  async getDailyActivity(user: {
    id: number;
    roles: string[];
    siteId?: number;
  }): Promise<{
    createdToday: number;
    takenInChargeToday: number;
    resolvedToday: number;
    urgentActive: number;
  }> {
    const rolesUpper = Array.isArray(user.roles)
      ? user.roles.map(r => String(r).toUpperCase())
      : [];

    const isAdminLike =
      rolesUpper.includes('ADMIN') ||
      rolesUpper.includes('MANAGER') ||
      rolesUpper.includes('CONTROLEUR');

    let baseWhere: any = { deletedAt: null };

    let userFilter: any = {};
    if (!isAdminLike) {
      userFilter = {
        OR: [
          { reporterId: user.id },
          ...(user.siteId !== undefined && user.siteId !== null
            ? [{ incidentSites: { some: { siteId: user.siteId } } }]
            : []),
        ],
      };
    }

    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    const [createdToday, takenInChargeToday, resolvedToday, urgentActive] = await Promise.all([
      prisma.incident.count({
        where: {
          ...baseWhere,
          ...userFilter,
          createdAt: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.incident.count({
        where: {
          ...baseWhere,
          ...userFilter,
          takenInChargeAt: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.incident.count({
        where: {
          ...baseWhere,
          ...userFilter,
          resolvedAt: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.incident.count({
        where: {
          ...baseWhere,
          ...userFilter,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          OR: [
            { criticality: 'Critique' },
            { urgency: 'Immédiate' },
          ],
        },
      }),
    ]);

        return {
      createdToday,
      takenInChargeToday,
      resolvedToday,
      urgentActive,
    };
  }

  /**
   * Renvoie le décompte des incidents groupés par catégorie, sous-catégorie,
   * processus et sous-processus, avec répartition par statut.
   *
   * Résultat :
   *   - categories    : [{ name, total, open, inProgress, closed, cancelled }] trié par total décroissant
   *   - subCategories : [{ name, categoryName, total }] trié par total décroissant
   *   - processes     : [{ name, total }] trié par total décroissant
   *   - subProcesses  : [{ name, processName, total }] trié par total décroissant
   *
   * Respecte les mêmes règles d'accès que getStatusStats.
   */
    async getByCategoryProcess(user: {
    id: number;
    roles: string[];
    siteId?: number;
    dateFrom?: Date;
  }): Promise<{
    categories: Array<{ name: string; total: number; open: number; inProgress: number; closed: number; cancelled: number }>;
    subCategories: Array<{ name: string; categoryName: string; total: number }>;
    processes: Array<{ name: string; total: number }>;
    subProcesses: Array<{ name: string; processName: string; total: number }>;
  }> {
    const rolesUpper = Array.isArray(user.roles)
      ? user.roles.map(r => String(r).toUpperCase())
      : [];

    const isAdminLike =
      rolesUpper.includes('ADMIN') ||
      rolesUpper.includes('MANAGER') ||
      rolesUpper.includes('CONTROLEUR');

    let baseWhere: any = { deletedAt: null };

    let userFilter: any = {};
    if (!isAdminLike) {
      userFilter = {
        OR: [
          { reporterId: user.id },
          ...(user.siteId !== undefined && user.siteId !== null
            ? [{ incidentSites: { some: { siteId: user.siteId } } }]
            : []),
        ],
      };
    }

        const where = { ...baseWhere, ...userFilter };

    // ✅ Si un filtre dateFrom est fourni, on ne garde que les incidents créés après cette date
    if (user.dateFrom) {
      where.createdAt = { gte: user.dateFrom };
    }

    // Récupérer tous les incidents avec leurs relations
    const incidents = await prisma.incident.findMany({
      where,
      select: {
        status: true,
        category: { select: { name: true } },
        subCategory: { select: { name: true, category: { select: { name: true } } } },
        processDomain: { select: { name: true } },
        subProcess: { select: { name: true, process: { select: { name: true } } } },
      },
    });

    // Groupement par catégorie avec répartition par statut
    const catMap = new Map<string, { total: number; open: number; inProgress: number; closed: number; cancelled: number }>();
    const subCatMap = new Map<string, { name: string; categoryName: string; total: number }>();
    const procMap = new Map<string, number>();
    const subProcMap = new Map<string, { name: string; processName: string; total: number }>();

    for (const inc of incidents) {
      // Catégorie
      const catName = inc.category?.name ?? 'Non catégorisé';
      if (!catMap.has(catName)) {
        catMap.set(catName, { total: 0, open: 0, inProgress: 0, closed: 0, cancelled: 0 });
      }
      const catEntry = catMap.get(catName)!;
      catEntry.total++;

      const s = inc.status.toUpperCase();
      if (s === 'OPEN') catEntry.open++;
      else if (s === 'IN_PROGRESS') catEntry.inProgress++;
      else if (s === 'CLOSED') catEntry.closed++;
      else if (s === 'CANCELLED') catEntry.cancelled++;

      // Sous-catégorie
      if (inc.subCategory?.name) {
        const scKey = `${inc.subCategory.name}__${inc.subCategory.category?.name ?? catName}`;
        if (!subCatMap.has(scKey)) {
          subCatMap.set(scKey, {
            name: inc.subCategory.name,
            categoryName: inc.subCategory.category?.name ?? catName,
            total: 0,
          });
        }
        subCatMap.get(scKey)!.total++;
      }

      // Processus
      if (inc.processDomain?.name) {
        procMap.set(inc.processDomain.name, (procMap.get(inc.processDomain.name) ?? 0) + 1);
      }

      // Sous-processus
      if (inc.subProcess?.name) {
        const spKey = `${inc.subProcess.name}__${inc.subProcess.process?.name ?? ''}`;
        if (!subProcMap.has(spKey)) {
          subProcMap.set(spKey, {
            name: inc.subProcess.name,
            processName: inc.subProcess.process?.name ?? 'Non défini',
            total: 0,
          });
        }
        subProcMap.get(spKey)!.total++;
      }
    }

    const sortDesc = (a: any, b: any) => b.total - a.total;

        return {
      categories: Array.from(catMap.entries())
        .map(([name, v]) => ({ name, ...v }))
        .sort(sortDesc),
      subCategories: Array.from(subCatMap.values())
        .sort(sortDesc),
      processes: Array.from(procMap.entries())
        .map(([name, total]) => ({ name, total }))
        .sort(sortDesc),
      subProcesses: Array.from(subProcMap.values())
        .sort(sortDesc),
    };
  }
}