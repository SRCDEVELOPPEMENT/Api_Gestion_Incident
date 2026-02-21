import { ISubCategoryRepository } from '../../domain/repositories/ISubCategoryRepository';
import { SubCategory, CreateSubCategoryDTO, UpdateSubCategoryDTO } from '../../domain/entities/SubCategory';

export class CreateSubCategoryUseCase {
  constructor(private repo: ISubCategoryRepository) {}
  async execute(data: CreateSubCategoryDTO): Promise<SubCategory> {
    return this.repo.create(data);
  }
}

export class GetAllSubCategoriesUseCase {
  constructor(private repo: ISubCategoryRepository) {}
  // async execute(skip: number, take: number): Promise<SubCategory[]> {
  //   return this.repo.findAll(skip, take);
  // }
  async execute(): Promise<SubCategory[]> {
    return this.repo.findAll();
  }
}

export class GetSubCategoryByIdUseCase {
  constructor(private repo: ISubCategoryRepository) {}
  async execute(id: number): Promise<SubCategory | null> {
    return this.repo.findById(id);
  }
}

export class UpdateSubCategoryUseCase {
  constructor(private repo: ISubCategoryRepository) {}

  async execute(id: string, data: UpdateSubCategoryDTO): Promise<SubCategory> {
    const subCategoryId = Number(id);
    if (Number.isNaN(subCategoryId)) throw new Error("ID invalide");
    return this.repo.update(subCategoryId, data);
  }
}

export class DeleteSubCategoryUseCase {
  constructor(private repo: ISubCategoryRepository) {}
  async execute(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}