export interface SubCategory {
  id: number;
  name: string;
  description?: string | null;
  categoryId: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type CreateSubCategoryDTO = Pick<SubCategory, 'name' | 'description' | 'categoryId' | 'userId'>;

export type UpdateSubCategoryDTO = Partial<
  Pick<SubCategory, "name" | "description" | "categoryId" | "deletedAt">
>;