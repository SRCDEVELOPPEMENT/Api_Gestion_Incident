import prisma from '../../infrastructure/database/prisma';

export async function generateIncidentReference(): Promise<string> {
  const year = new Date().getFullYear();

  const lastIncident = await prisma.incident.findFirst({
    where: {
      reference: {
        startsWith: `INC-${year}-`,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      reference: true,
    },
  });

  let nextNumber = 1;

  if (lastIncident?.reference) {
    const parts = lastIncident.reference.split('-');
    const lastSeq = Number(parts[2]);
    nextNumber = lastSeq + 1;
  }

  const padded = String(nextNumber).padStart(3, '0');

  return `INC-${year}-${padded}`;
}
