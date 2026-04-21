export interface Type {
  id: number;
  name: string;

  createdByUserId: number;
  createdBy?: {
    id: number;
    username: string;
  };

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type CreateTypeDTO = {
  name: string;
  createdByUserId: number;
};