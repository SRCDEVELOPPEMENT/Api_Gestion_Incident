export interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  userId: number;
  subCategories?: SubCategory[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type CreateCategoryDTO = Pick<Category, 'name' | 'userId'>;