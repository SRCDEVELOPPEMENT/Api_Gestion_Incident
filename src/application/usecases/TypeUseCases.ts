import { ITypeRepository } from '../../domain/repositories/ITypeRepository';
import { Type, CreateTypeDTO } from '../../domain/entities/Type';

export class CreateTypeUseCase {
  constructor(private repo: ITypeRepository) { }
  async execute(data: CreateTypeDTO): Promise<Type> {
    return this.repo.create(data);
  }
}

export class GetAllTypesUseCase {
  constructor(private repo: ITypeRepository) { }
  async execute(params: { page: number; size: number }): Promise<Type[]> {
    const skip = (params.page - 1) * params.size;
    return this.repo.findAll(skip, params.size);
  }
}

export class GetTypeByIdUseCase {
  constructor(private repo: ITypeRepository) { }
  async execute(id: number): Promise<Type | null> {
    return this.repo.findById(id);
  }
}

export class UpdateTypeUseCase {
  constructor(private repo: ITypeRepository) { }

  async execute(id: number, data: Partial<Pick<Type, "name">>): Promise<Type> {
    return this.repo.update(id, data);
  }
}

export class DeleteTypeUseCase {
  constructor(private repo: ITypeRepository) { }
  async execute(id: number): Promise<void> {
    return this.repo.delete(id);
  }
}
