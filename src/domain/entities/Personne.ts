export interface Personne {
  id: number;
  fullname: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type CreatePersonneDTO = {
  fullname: string;
};

export type UpdatePersonneDTO = Partial<{
  fullname: string;
}>;
