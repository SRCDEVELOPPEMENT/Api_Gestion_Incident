import { IncidentComment, CreateIncidentCommentDTO } from "../entities/IncidentComment";

export interface IIncidentCommentRepository {
  create(data: CreateIncidentCommentDTO): Promise<IncidentComment>;
  findByIncident(incidentId: number): Promise<IncidentComment[]>;
}