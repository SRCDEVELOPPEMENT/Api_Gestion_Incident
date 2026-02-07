export interface Role {
  id: number;
  name: string;
}

export type CreateRoleDTO = Pick<Role, 'name'>;

export type UpdateRoleDTO = Partial<CreateRoleDTO>;
