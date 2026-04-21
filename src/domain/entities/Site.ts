export interface Type {
  id: string;
  name: string;
}

export interface Site {
  id: string;
  name: string;

  // 🔹 Créateur du site
  createdByUserId: number;
  createdBy?: {
    id: number;
    username: string;
  };

  typeId?: number;        // 🔹 clé étrangère
  type?: Type;
  // 🔹 Utilisateurs appartenant au site
  users?: {
    id: number;
    username: string;
  }[];

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type CreateSiteDTO = {
  name: string;
  createdByUserId: number;
  typeId?: number;   // 🔹 obligatoire si relation 1-1
};