import { ISubProcessRepository } from '../../domain/repositories/ISubProcessRepository';
import { SubProcess, CreateSubProcessDTO, UpdateSubProcessDTO } from '../../domain/entities/SubProcess';
import prisma from '../database/prisma';

export class PrismaSubProcessRepository implements ISubProcessRepository {
  async create(data: CreateSubProcessDTO): Promise<SubProcess> {
    const subProcess = await prisma.subProcess.create({ data });
    return subProcess as unknown as SubProcess;
  }

  async findById(id: number): Promise<SubProcess | null> {
    const subProcess = await prisma.subProcess.findFirst({ 
        where: { id, deletedAt: null }
    });
    return subProcess as unknown as SubProcess;
  }

  // async findAll(skip: number = 0, take: number = 20): Promise<SubProcess[]> {
  //   const subProcesses = await prisma.subProcess.findMany({ 
  //       skip, 
  //       take,
  //       where: { deletedAt: null }
  //   });
  //   return subProcesses as unknown as SubProcess[];
  // }

  async findAll(): Promise<SubProcess[]> {
    const subProcesses = await prisma.subProcess.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" } // recommandé
    });

    return subProcesses as unknown as SubProcess[];
  }

  // async update(id: string, data: Partial<SubProcess>): Promise<SubProcess> {
  //   const subProcess = await prisma.subProcess.update({
  //     where: { id : Number(id) },
  //     data
  //   });
  //   return subProcess as unknown as SubProcess;
  // }

  async update(id: number, data: UpdateSubProcessDTO): Promise<SubProcess> {
    const { processId, ...rest } = data;

    const subProcess = await prisma.subProcess.update({
      where: { id },
      data: {
        ...rest,
        ...(typeof processId === "number"
          ? { process: { connect: { id: processId } } }
          : {}),
      },
    });

    return subProcess as unknown as SubProcess;
  }
  
  async delete(id: string): Promise<void> {
    await prisma.subProcess.update({ 
        where: { id : Number(id) },
        data: { deletedAt: new Date() }
    });
  }
}