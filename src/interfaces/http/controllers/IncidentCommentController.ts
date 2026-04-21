import { Request, Response } from "express";
import { PrismaIncidentCommentRepository } from "../../../infrastructure/repositories/PrismaIncidentCommentRepository";
import { CreateIncidentCommentUseCase } from "../../../application/usecases/CreateIncidentCommentUseCase";
import { GetIncidentCommentsUseCase } from "../../../application/usecases/GetIncidentCommentsUseCase";
import { z } from "zod";

const createCommentSchema = z.object({
  incidentId: z.number(),
  content: z.string().min(1).max(1000),
});

export class IncidentCommentController {

  static async create(req: Request, res: Response) {
    try {
      const parsed = createCommentSchema.parse(req.body);

      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const repo = new PrismaIncidentCommentRepository();
      const useCase = new CreateIncidentCommentUseCase(repo);

      const result = await useCase.execute({
        ...parsed,
        userId,
      });

      return res.status(201).json(result);

    } catch (error: any) {
      console.error("CREATE COMMENT ERROR:", error);
      return res.status(400).json({ message: error.message });
    }
  }

  static async getByIncident(req: Request, res: Response) {
    try {
      const incidentId = Number(req.params.incidentId);

      const repo = new PrismaIncidentCommentRepository();
      const useCase = new GetIncidentCommentsUseCase(repo);

      const result = await useCase.execute(incidentId);

      return res.json(result);

    } catch (error: any) {
      console.error("GET COMMENTS ERROR:", error);
      return res.status(500).json({ message: error.message });
    }
  }
}