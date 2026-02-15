import { Category, CreateCategoryDTO } from '../entities/Category';

export interface ICategoryRepository {
  create(data: CreateCategoryDTO): Promise<Category>;
  findById(id: number): Promise<Category | null>;
  findAll(skip?: number, take?: number): Promise<Category[]>;
  update(id: number, data: Partial<Category>): Promise<Category>;
  delete(id: number): Promise<void>;
}