export interface Site {
  id: string;
  name: string;

  // 🔹 Créateur du site
  createdByUserId: number;
  createdBy?: {
    id: number;
    username: string;
  };

  // 🔹 Utilisateurs appartenant au site
  users?: {
    id: number;
    username: string;
  }[];

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

//export type CreateSiteDTO = Pick<Site, 'name' | 'userId'>;
export type CreateSiteDTO = {
  name: string;
  createdByUserId: number;
};

export interface SiteType {
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

export type CreateSiteTypeDTO = {
  name: string;
  createdByUserId: number;
};
