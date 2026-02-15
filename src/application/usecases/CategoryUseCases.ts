import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { Category, CreateCategoryDTO } from '../../domain/entities/Category';
import { PrismaCategoryRepository } from '../../infrastructure/repositories/PrismaCategoryRepository';
import { Site } from '../../domain/entities/Site';

export class CreateCategoryUseCase {
  constructor(private repo: ICategoryRepository) {}

  async execute(data: CreateCategoryDTO): Promise<Category> {
    return this.repo.create(data);
  }
}


export class GetAllCategoriesUseCase {
  constructor(private repo: ICategoryRepository) {}
  async execute(skip: number, take: number): Promise<Category[]> {
    return this.repo.findAll(skip, take);
  }
}

export class GetCategoryByIdUseCase {
  constructor(private repo: ICategoryRepository) {}
  async execute(id: number): Promise<Category | null> {
    return this.repo.findById(id);
  }
}

export class UpdateCategoryUseCase {
  constructor(private repo: ICategoryRepository) {}
  async execute(id: number, data: Partial<Category>): Promise<Category> {
    return this.repo.update(id, data);
  }
}

export class DeleteCategoryUseCase {
  constructor(private repo: ICategoryRepository) {}
  async execute(id: number): Promise<void> {
    return this.repo.delete(id);
  }
}