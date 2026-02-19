import prisma from '../infrastructure/database/prisma';

export class IncidentService {

async getStatusStats(user: {
  id: number;
  roles: string[];
  siteId?: number;
}) {

  // const isAdmin = user.roles?.includes('ADMIN');

  // let whereCondition: any = {};

  // if (!isAdmin) {

  //   const conditions: any[] = [
  //     { reporterId: user.id }
  //   ];

  //   if (user.siteId) {
  //     conditions.push({
  //       incidentSites: {
  //         some: {
  //           siteId: user.siteId
  //         }
  //       }
  //     });
  //   }

  //   whereCondition = {
  //     OR: conditions
  //   };
  // }

  // MISE A JOUR
  const isAdmin = Array.isArray(user.roles) && user.roles.includes('ADMIN');

  let whereCondition: any = {
    deletedAt: null
  };

  if (!isAdmin) {
    whereCondition = {
      deletedAt: null,
      OR: [
        { reporterId: user.id },
        ...(user.siteId !== undefined && user.siteId !== null
          ? [{
              incidentSites: {
                some: {
                  siteId: user.siteId
                }
              }
            }]
          : [])
      ]
    };
  }
  // MISE A JOUR
  
  const baseWhere = {
    ...whereCondition,
    deletedAt: null,
  };

  const [open, inProgress, resolved, cancelled] = await Promise.all([
    prisma.incident.count({
      where: {
        ...baseWhere,
        status: 'OPEN',
      },
    }),
    prisma.incident.count({
      where: {
        ...baseWhere,
        status: 'IN_PROGRESS',
      },
    }),
    prisma.incident.count({
      where: {
        ...baseWhere,
        status: 'CLOSED',
      },
    }),
    prisma.incident.count({
      where: {
        ...baseWhere,
        status: 'CANCELLED',
      },
    }),
  ]);
  // const [open, inProgress, resolved, cancelled] = await Promise.all([
  //   prisma.incident.count({ where: { deletedAt: null, ...whereCondition, status: 'OPEN' } }),
  //   prisma.incident.count({ where: { deletedAt: null, ...whereCondition, status: 'IN_PROGRESS' } }),
  //   prisma.incident.count({ where: { deletedAt: null, ...whereCondition, status: 'RESOLVED' } }),
  //   prisma.incident.count({ where: { deletedAt: null, ...whereCondition, status: 'CANCELLED' } }),
  // ]);

  return {
    open,
    inProgress,
    closed: resolved,
    cancelled
  };
}
}
