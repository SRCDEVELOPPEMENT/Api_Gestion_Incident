// =====================
// SITE
// =====================

export interface Site {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * DTO pour la création d'un Site
 * - name : vient du front
 * - userId : injecté par le backend (JWT)
 */
export interface CreateSiteDTO {
  name: string;
  userId: number; // ⬅ OBLIGATOIRE (clé étrangère User)
}

// =====================
// SITE TYPE
// =====================

export interface SiteType {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type CreateSiteTypeDTO = Pick<SiteType, 'name'>;
