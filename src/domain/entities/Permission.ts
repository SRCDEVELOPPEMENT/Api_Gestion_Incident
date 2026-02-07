export interface Permission {
  id: number;
  code: string;
}

export type CreatePermissionDTO = Pick<Permission, 'code'>;

export type UpdatePermissionDTO = Partial<CreatePermissionDTO>;
