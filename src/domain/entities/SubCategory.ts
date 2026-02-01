export interface SubCategory {
  id: string;
  name: string;
  description?: string | null;
  categoryId: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type CreateSubCategoryDTO = Pick<SubCategory, 'name' | 'description' | 'categoryId' | 'userId'>;