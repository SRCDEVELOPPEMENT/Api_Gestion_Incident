// =====================
// CATEGORY
// =====================

export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

/**
 * DTO pour la création d'un Site
 * - name : vient du front
 * - userId : injecté par le backend (JWT)
 */
export interface CategoryDTO {
  name: string;
  description: string;
  userId: number; // ⬅ OBLIGATOIRE (clé étrangère User)
}


export type CreateCategoryDTO = Pick<Category, 'name'>;
