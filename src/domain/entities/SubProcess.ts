export interface SubProcess {
  id: number;
  name: string;
  description?: string | null;
  processId: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type CreateSubProcessDTO = Pick<SubProcess, 'name' | 'description' | 'processId' | 'userId'>;

export type UpdateSubProcessDTO = {
  name?: string;
  description?: string | null;
  processId?: number;
  // userId?: number; // à inclure seulement si tu autorises vraiment le changement d’auteur
  deletedAt?: Date | null;
};