import { Role } from '../entities/Role';
import { User } from '../entities/User';

export interface IUserRoleRepository {
  assign(userId: number, roleId: number): Promise<void>;
  revoke(userId: number, roleId: number): Promise<void>;
  getUserRoles(userId: number): Promise<Role[]>;
  getRoleUsers(roleId: number): Promise<User[]>;
  exists(userId: number, roleId: number): Promise<boolean>;
}
