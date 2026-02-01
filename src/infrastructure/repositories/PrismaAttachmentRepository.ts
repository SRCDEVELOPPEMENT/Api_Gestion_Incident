import { PrismaClient } from '@prisma/client';
import { Attachment, CreateAttachmentDTO } from '../../domain/entities/Attachment';
import { IAttachmentRepository } from "../../domain/repositories/IAttachmentRepository";

const prisma = new PrismaClient();

export class PrismaAttachmentRepository implements IAttachmentRepository {

  async create(data: CreateAttachmentDTO): Promise<Attachment> {
    const attachment = await prisma.attachment.create({
      data: {
        fileName: data.fileName,
        url: data.url,
        incidentId: data.incidentId ? parseInt(data.incidentId) : undefined,
        taskId: data.taskId ? parseInt(data.taskId) : undefined,
        uploadedAt: new Date()
        // mimeType and size are not in schema, ignoring for now
      }
    });

    return this.mapToEntity(attachment, data.size, data.mimeType);
  }

  async findByIncidentId(incidentId: string): Promise<Attachment[]> {
    const attachments = await prisma.attachment.findMany({
      where: { incidentId: parseInt(incidentId) }
    });

    return attachments.map(a => this.mapToEntity(a));
  }

  async deleteById(id: string): Promise<void> {
    await prisma.attachment.delete({
      where: { id: parseInt(id) }
    });
  }

  private mapToEntity(prismaAttachment: any, size: number = 0, mimeType: string = 'application/octet-stream'): Attachment {
    return {
      id: prismaAttachment.id.toString(),
      fileName: prismaAttachment.fileName,
      url: prismaAttachment.url,
      size: size, // Not stored in DB
      mimeType: mimeType, // Not stored in DB
      incidentId: prismaAttachment.incidentId?.toString(),
      taskId: prismaAttachment.taskId?.toString(),
      uploadedAt: prismaAttachment.uploadedAt
    };
  }
}
