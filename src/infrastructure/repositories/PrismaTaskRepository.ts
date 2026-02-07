import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { Task, CreateTaskDTO } from '../../domain/entities/Task';
import { CreateAttachmentDTO } from '../../domain/entities/Attachment';
import prisma from '../database/prisma';

  type CreateTaskWithAttachments = CreateTaskDTO & {
    attachments?: {
      fileName: string;
      url: string;
    }[];
  }

export class PrismaTaskRepository implements ITaskRepository {


  // async create(data: CreateTaskWithAttachments): Promise<Task> {
  //   const { attachments, userId, incidentId, ...rest } = data;

  //   const task = await prisma.task.create({
  //     data: {
  //       ...rest,
  //       userId,
  //       incidentId,

  //       ...(attachments && attachments.length > 0 && {
  //         attachments: {
  //           create: attachments.map(att => ({
  //             fileName: att.fileName,
  //             url: att.url,
  //             uploadedAt: new Date()
  //           }))
  //         }
  //       })
  //     },
  //     include: {
  //       attachments: true
  //     }
  //   });

  //   return task as unknown as Task;
  // }
  async create(
    data: CreateTaskDTO,
    files?: Express.Multer.File[]
  ): Promise<Task> {

    const { userId, incidentId, ...rest } = data;

    const task = await prisma.task.create({
      data: {
        ...rest,

        // ✅ clés étrangères
        userId: Number(userId),
        incidentId: Number(incidentId),

        // ✅ pièces jointes (via multer)
        ...(files && files.length > 0 && {
          attachments: {
            create: files.map(file => ({
              fileName: file.originalname,
              url: `/uploads/tasks/${file.filename}`,
              uploadedAt: new Date()
            }))
          }
        })
      },
      include: {
        attachments: true
      }
    });

    return task as unknown as Task;
  }

  async findById(id: string): Promise<Task | null> {
    const task = await prisma.task.findFirst({ 
        where: { id: Number(id), deletedAt: null },
        include: { attachments: true }
    });
    return task as unknown as Task;
  }

  async findAll(skip: number = 0, take: number = 20): Promise<Task[]> {
    const tasks = await prisma.task.findMany({ 
        skip, 
        take,
        where: { deletedAt: null },
        include: { attachments: true }
    });
    return tasks as unknown as Task[];
  }

  async update(id: string, data: Omit<Partial<Task>, 'attachments'> & { attachments?: CreateAttachmentDTO[] }): Promise<Task> {
    const { attachments, ...rest } = data;

    const updateData: any = { ...rest };

    if (attachments) {
      updateData.attachments = {
        create: attachments.map((att: any) => ({
           fileName: att.fileName,
           url: att.url,
           uploadedAt: new Date()
        }))
      };
    }

    const task = await prisma.task.update({
      where: { id: Number(id) },
      data: updateData,
      include: { attachments: true }
    });
    return task as unknown as Task;
  }

  async delete(id: number): Promise<void> {
    await prisma.task.delete({
      where: { id }
    });
  }
  // async delete(id: number): Promise<void> {
  //   await prisma.task.update({ 
  //       where: { id: Number(id) },
  //       data: { deletedAt: new Date() }
  //   });
  // }

  // async findByIncident(incidentId: number) {
  //   return prisma.task.findMany({
  //     where: {
  //       incidentId: incidentId,
  //     },
  //     orderBy: {
  //       createdAt: 'desc',
  //     },
  //     include: {
  //       attachments: true,
  //     },
  //   });
  // }
  async findByIncident(incidentId: number) {
    return prisma.task.findMany({
      where: {
        incidentId,
        deletedAt: null,   // 🔴 OBLIGATOIRE
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        attachments: true,
      },
    });
  }

}