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

    const [open, inProgress, closed, cancelled] = await Promise.all([
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
    ]);

    return {
      open,
      inProgress,
      closed,
      cancelled,
    };
  }
}