export interface Permission {
  id: string;
  code: string; // "code" in the prompt, "action" in the DB schema
  description?: string | null;
}

export type CreatePermissionDTO = Pick<Permission, 'code' | 'description'>;
export type UpdatePermissionDTO = Partial<Pick<Permission, 'code' | 'description'>>;
