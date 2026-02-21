import { SubCategory, CreateSubCategoryDTO, UpdateSubCategoryDTO } from '../entities/SubCategory';

export interface ISubCategoryRepository {
  create(data: CreateSubCategoryDTO): Promise<SubCategory>;
  findById(id: number): Promise<SubCategory | null>;
  findAll(): Promise<SubCategory[]>;
  update(id: number, data: UpdateSubCategoryDTO): Promise<SubCategory>;
  delete(id: string): Promise<void>;
}