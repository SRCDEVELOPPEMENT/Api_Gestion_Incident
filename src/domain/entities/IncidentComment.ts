
export interface IncidentComment {
  id: number;
  incidentId: number;
  userId: number;
  content: string;
  createdAt: Date;
};

export type CreateIncidentCommentDTO = {
  incidentId: number;
  userId: number;
  content: string;
}