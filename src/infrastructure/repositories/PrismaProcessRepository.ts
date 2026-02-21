import { IProcessRepository } from '../../domain/repositories/IProcessRepository';
import { Process, CreateProcessDTO } from '../../domain/entities/Process';
import prisma from '../database/prisma';

export class PrismaProcessRepository implements IProcessRepository {
  async create(data: CreateProcessDTO): Promise<Process> {
    const process = await prisma.process.create({ 
      data: {
        name: data.name,
        user: { connect: { id: data.userId } }, // ✅ relation obligatoire satisfaite
      },
     });
    return process as unknown as Process;
  }

  async findById(id: number): Promise<Process | null> {
    const process = await prisma.process.findFirst({ 
        where: { id, deletedAt: null },
        include: { subProcesses: true } 
    });
    return process as unknown as Process;
  }

  // async findAll(skip: number = 0, take: number = 20): Promise<Process[]> {
  //   const processes = await prisma.process.findMany({ 
  //       skip, 
  //       take,
  //       where: { deletedAt: null },
  //       include: { subProcesses: true }
  //   });
  //   return processes as unknown as Process[];
  // }

  async findAll(): Promise<Process[]> {
    const processes = await prisma.process.findMany({
      where: { deletedAt: null },
      include: { subProcesses: true },
      orderBy: { createdAt: "desc" }, // optionnel mais recommandé
    });

    return processes as unknown as Process[];
  }

  async update(id: string, data: Partial<Process>): Promise<Process> {
    const process = await prisma.process.update({
      where: { id : Number(id) },
      data: { name: data.name }
    });
    return process as unknown as Process;
  }

  async delete(id: string): Promise<void> {
    await prisma.process.update({ 
        where: { id : Number(id) },
        data: { deletedAt: new Date() }
    });
  }
}