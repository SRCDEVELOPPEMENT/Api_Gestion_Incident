import prisma from '../database/prisma';
import { IncidentComment, CreateIncidentCommentDTO } from "../../domain/entities/IncidentComment";

export class PrismaIncidentCommentRepository {

  async create(data: CreateIncidentCommentDTO): Promise<IncidentComment> {
    return prisma.incidentComment.create({
      data: {
        incidentId: data.incidentId,
        userId: data.userId,
        content: data.content,
      },
    });
  }

  async findByIncident(incidentId: number): Promise<IncidentComment[]> {
    return prisma.incidentComment.findMany({
      where: { incidentId },
      orderBy: { createdAt: "asc" },
      include: {
        user: true,
      },
    });
  }
}