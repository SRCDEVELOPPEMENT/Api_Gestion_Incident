export interface SubProcess {
  id: string;
  name: string;
  description?: string | null;
  processId: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type CreateSubProcessDTO = Pick<SubProcess, 'name' | 'description' | 'processId' | 'userId'>;