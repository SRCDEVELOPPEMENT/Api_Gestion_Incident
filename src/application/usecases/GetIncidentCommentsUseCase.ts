import { IIncidentCommentRepository } from "../../domain/repositories/IIncidentCommentRepository";

export class GetIncidentCommentsUseCase {

  constructor(private repository: IIncidentCommentRepository) {}

  async execute(incidentId: number) {
    return this.repository.findByIncident(incidentId);
  }
}