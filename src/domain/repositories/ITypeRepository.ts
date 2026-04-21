import { Type, CreateTypeDTO } from '../entities/Type';

export interface ITypeRepository {
  create(data: CreateTypeDTO): Promise<Type>;
  findById(id: number): Promise<Type | null>;
  findAll(skip?: number, take?: number, where?: any): Promise<Type[]>;
  update(id: number, data: Partial<Pick<Type, "name">>): Promise<Type>;
  delete(id: number): Promise<void>;
}