export interface RolePermission {
  roleId: number;
  permissionId: number;
}

export type CreateRolePermissionDTO = Pick<RolePermission, 'roleId' | 'permissionId'>;

export type UpdateRolePermissionDTO = Partial<CreateRolePermissionDTO>;
