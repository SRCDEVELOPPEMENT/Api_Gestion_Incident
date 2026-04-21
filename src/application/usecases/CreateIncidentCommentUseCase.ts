import { IIncidentCommentRepository } from "../../domain/repositories/IIncidentCommentRepository";
import { CreateIncidentCommentDTO } from "../../domain/entities/IncidentComment";

export class CreateIncidentCommentUseCase {

  constructor(private repository: IIncidentCommentRepository) {}

  async execute(data: CreateIncidentCommentDTO) {
    return this.repository.create(data);
  }
}