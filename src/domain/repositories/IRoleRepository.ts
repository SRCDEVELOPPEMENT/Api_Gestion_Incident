import { Role, CreateRoleDTO, UpdateRoleDTO } from '../entities/Role';
import { Permission } from '../entities/Permission';

export interface IRoleRepository {
  create(data: CreateRoleDTO): Promise<Role>;
  findAll(): Promise<Role[]>;
  findById(id: number): Promise<Role | null>;
  update(id: number, data: UpdateRoleDTO): Promise<Role>;
  delete(id: number): Promise<void>;
  
  // Relations Role <-> Permission
  addPermission(roleId: number, permissionId: number): Promise<void>;
  removePermission(roleId: number, permissionId: number): Promise<void>;
  getPermissionsByRoleId(roleId: number): Promise<Permission[]>;
  getRolesByPermissionId(permissionId: number): Promise<Role[]>;
}
