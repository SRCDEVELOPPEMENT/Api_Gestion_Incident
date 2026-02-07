import { Permission, CreatePermissionDTO, UpdatePermissionDTO } from '../entities/Permission';

export interface IPermissionRepository {
  create(data: CreatePermissionDTO): Promise<Permission>;
  findAll(): Promise<Permission[]>;
  findById(id: number): Promise<Permission | null>;
  update(id: number, data: UpdatePermissionDTO): Promise<Permission>;
  delete(id: number): Promise<void>;
  findByAction(code: string): Promise<Permission | null>;
}
