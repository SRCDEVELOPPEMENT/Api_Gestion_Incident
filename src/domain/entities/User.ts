export interface User {
  id: number;
  username: string;
  password?: string; // uniquement pour register/login
  isActive: boolean;

  roles?: string[];

  // 🔐 Appartenance métier
  siteId?: number | null;
  site?: {
    id: number;
    name: string;
  } | null;

  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * Auth
 */
export type RegisterUserDTO = Pick<User, 'username' | 'password'>;
export type LoginUserDTO = Pick<User, 'username' | 'password'>;

/**
 * Update
 * Champs strictement modifiables
 */
export type UpdateUserDTO = {
  username?: string;
  password?: string;
  isActive?: boolean;

  /**
   * Rôles à affecter (remplacement complet)
   */
  roleIds?: number[];

  // 🔐 Permet de changer le site
  siteId?: number | null;
};

export type CreateUserDTO = {
  username: string;
  password: string; // obligatoire à la création
  isActive?: boolean;
  roleIds?: number[];

  // 🔐 Appartenance site
  siteId?: number | null;
};
