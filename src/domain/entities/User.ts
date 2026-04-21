export interface User {
  id: number;
  username: string;
  password?: string; // uniquement pour register/login
  matricule?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isActive: boolean;

  roles?: string[];

  // Appartenance métier
  siteId?: number | null;
  site?: {
    id: number;
    name: string;
  } | null;

  // Champs pour reset password
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;

  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * Auth
 */
export type RegisterUserDTO = {
  matricule: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};
export type LoginUserDTO = Pick<User, 'username' | 'password'>;

/**
 * Update
 * Champs strictement modifiables
 */
export type UpdateUserDTO = {
  username?: string;
  password?: string;
  matricule?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isActive?: boolean;
  roleIds?: number[];
  siteId?: number | null;
};

export type CreateUserDTO = {
  username: string;
  password: string;
  matricule?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isActive?: boolean;
  roleIds?: number[];
  siteId?: number | null;
};
