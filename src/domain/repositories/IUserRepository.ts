import { User, UpdateUserDTO, CreateUserDTO } from '../entities/User';
import { AuthUser } from '../entities/AuthUser';

export interface IUserRepository {
  findAll(skip: number, take: number): Promise<User[]>;
  findById(id: number): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;

  // 🔐 POUR L’AUTH UNIQUEMENT
  // findAuthUserByUsername(username: string): Promise<{
  //   id: number;
  //   username: string;
  //   passwordHash: string;
  //   isActive: boolean;
  // } | null>;
  findAuthUserByUsername(username: string): Promise<AuthUser | null>;
  create(data: CreateUserDTO): Promise<User>;
  update(id: number, data: UpdateUserDTO): Promise<User>;
  delete(id: number): Promise<void>;
}
